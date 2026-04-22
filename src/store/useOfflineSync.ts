/**
 * Offline Data Sync Queue
 * Queues form submissions when offline and syncs when connectivity returns.
 * Uses localStorage for persistence across app restarts.
 */

import { create } from 'zustand';
import { generateId } from '../utils/helpers';
import { supabase, TABLES } from '../lib/supabase';

export type OfflineItemType = 'survey' | 'media' | 'census' | 'aspiration' | 'activity_log';

export interface OfflineQueueItem {
    id: string;
    type: OfflineItemType;
    data: Record<string, unknown>;
    created_at: string;
    retries: number;
    status: 'pending' | 'syncing' | 'failed' | 'synced';
    error?: string;
}

interface OfflineSyncState {
    queue: OfflineQueueItem[];
    isOnline: boolean;
    isSyncing: boolean;

    // Queue management
    enqueue: (type: OfflineItemType, data: Record<string, unknown>) => string;
    removeItem: (id: string) => void;
    clearSynced: () => void;
    clearAll: () => void;

    // Sync
    syncAll: () => Promise<void>;
    setOnline: (online: boolean) => void;

    // Stats
    getPendingCount: () => number;
    getFailedCount: () => number;
}

const STORAGE_KEY = 'surveyku_offline_queue';

function loadQueue(): OfflineQueueItem[] {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    } catch {
        return [];
    }
}

function saveQueue(queue: OfflineQueueItem[]) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
    } catch {
        console.warn('Failed to save offline queue');
    }
}

export const useOfflineSync = create<OfflineSyncState>((set, get) => ({
    queue: loadQueue(),
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    isSyncing: false,

    enqueue: (type, data) => {
        const item: OfflineQueueItem = {
            id: generateId('offline'),
            type,
            data,
            created_at: new Date().toISOString(),
            retries: 0,
            status: 'pending',
        };
        set((state) => {
            const updated = [...state.queue, item];
            saveQueue(updated);
            return { queue: updated };
        });
        return item.id;
    },

    removeItem: (id) => {
        set((state) => {
            const updated = state.queue.filter(q => q.id !== id);
            saveQueue(updated);
            return { queue: updated };
        });
    },

    clearSynced: () => {
        set((state) => {
            const updated = state.queue.filter(q => q.status !== 'synced');
            saveQueue(updated);
            return { queue: updated };
        });
    },

    clearAll: () => {
        localStorage.removeItem(STORAGE_KEY);
        set({ queue: [] });
    },

    syncAll: async () => {
        const { queue, isOnline, isSyncing } = get();
        if (!isOnline || isSyncing || !supabase) return;

        const pending = queue.filter(q => q.status === 'pending' || q.status === 'failed');
        if (pending.length === 0) return;

        set({ isSyncing: true });

        for (const item of pending) {
            // Mark as syncing
            set((state) => ({
                queue: state.queue.map(q =>
                    q.id === item.id ? { ...q, status: 'syncing' as const } : q
                ),
            }));

            try {
                let tableName = '';
                switch (item.type) {
                    case 'survey': tableName = TABLES.surveyResponses; break;
                    case 'media': tableName = TABLES.mediaMonitoring; break;
                    case 'census': tableName = TABLES.censusData; break;
                    case 'aspiration': tableName = TABLES.aspirations; break;
                    case 'activity_log': tableName = TABLES.activityLogs; break;
                }

                if (tableName) {
                    const { error } = await supabase.from(tableName).insert(item.data);
                    
                    if (error) throw error;

                    set((state) => {
                        const updated = state.queue.map(q =>
                            q.id === item.id ? { ...q, status: 'synced' as const } : q
                        );
                        saveQueue(updated);
                        return { queue: updated };
                    });
                }
            } catch (err) {
                console.error(`Sync failed for ${item.id}:`, err);
                set((state) => {
                    const updated = state.queue.map(q =>
                        q.id === item.id
                            ? { ...q, status: 'failed' as const, retries: q.retries + 1, error: String(err) }
                            : q
                    );
                    saveQueue(updated);
                    return { queue: updated };
                });
            }
        }

        set({ isSyncing: false });

        // Auto-clean synced items
        get().clearSynced();
    },

    setOnline: (online) => {
        set({ isOnline: online });
        if (online) {
            // Auto-sync when coming back online
            get().syncAll();
        }
    },

    getPendingCount: () => {
        return get().queue.filter(q => q.status === 'pending' || q.status === 'failed').length;
    },

    getFailedCount: () => {
        return get().queue.filter(q => q.status === 'failed').length;
    },
}));

// ── Auto-detect connectivity changes ──
if (typeof window !== 'undefined') {
    (window as any).useOfflineSync = useOfflineSync;
    window.addEventListener('online', () => {
        useOfflineSync.getState().setOnline(true);
    });
    window.addEventListener('offline', () => {
        useOfflineSync.getState().setOnline(false);
    });
}
