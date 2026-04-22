import { create } from 'zustand';
import type { ActivityLog } from '../types';
import { generateId } from '../utils/helpers';

const STORAGE_KEY = 'surveyku_activity_logs';
const MAX_LOGS = 200;

export type ActionType =
    | 'login' | 'logout'
    | 'survey_started' | 'survey_submitted' | 'survey_saved_draft'
    | 'media_submitted' | 'census_submitted' | 'aspiration_submitted'
    | 'photo_captured' | 'gps_captured'
    | 'respondent_added' | 'respondent_edited'
    | 'data_exported' 
    | 'profile_updated' | 'onboarding_completed' | 'media_monitoring_added' | 'census_added' | 'aspiration_added'
    | 'project_created' | 'project_updated' | 'project_deleted' | 'asuransi_added';

interface ActivityLogState {
    logs: ActivityLog[];
    addLog: (userId: string, action: ActionType, details: string) => void;
    getLogs: (userId?: string) => ActivityLog[];
    getRecentLogs: (userId?: string, limit?: number) => ActivityLog[];
    clearLogs: () => void;
}

function loadLogs(): ActivityLog[] {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    } catch {
        return [];
    }
}

function saveLogs(logs: ActivityLog[]) {
    try {
        const trimmed = logs.slice(-MAX_LOGS);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
    } catch {
        console.warn('Failed to save activity logs');
    }
}

export const useActivityLog = create<ActivityLogState>((set, get) => ({
    logs: loadLogs(),

    addLog: (userId: string, action: ActionType, details: string) => {
        const log: ActivityLog = {
            id: generateId('log'),
            user_id: userId,
            action,
            details,
            timestamp: new Date().toISOString(),
        };
        
        set((state) => {
            const updated = [...state.logs, log];
            saveLogs(updated);
            return { logs: updated };
        });

        const { enqueue } = (window as any).useOfflineSync?.getState() || {};
        if (enqueue) {
            enqueue('activity_log', log);
        }
    },

    getLogs: (userId?: string) => {
        const { logs } = get();
        if (!userId) return logs;
        return logs.filter(l => l.user_id === userId);
    },

    getRecentLogs: (userId?: string, limit = 20) => {
        const { logs } = get();
        const filtered = userId ? logs.filter(l => l.user_id === userId) : logs;
        return filtered.slice(-limit).reverse();
    },

    clearLogs: () => {
        localStorage.removeItem(STORAGE_KEY);
        set({ logs: [] });
    },
}));

export function getActionLabel(action: string): string {
    const map: Record<string, string> = {
        login: 'Masuk ke aplikasi',
        logout: 'Keluar dari aplikasi',
        survey_started: 'Memulai survei',
        survey_submitted: 'Mengirim survei',
        survey_saved_draft: 'Menyimpan draf survei',
        media_submitted: 'Mengirim media monitoring',
        census_submitted: 'Menyimpan data sensus',
        aspiration_submitted: 'Mengirim aspirasi',
        photo_captured: 'Mengambil foto',
        gps_captured: 'Mengambil lokasi GPS',
        respondent_added: 'Menambah responden',
        respondent_edited: 'Mengubah data responden',
        data_exported: 'Mengekspor data',
        profile_updated: 'Memperbarui profil',
        onboarding_completed: 'Menyelesaikan onboarding',
        media_monitoring_added: 'Menambah media monitoring',
        census_added: 'Menambah data sensus',
        aspiration_added: 'Menambah aspirasi',
        project_created: 'Membuat project baru',
        project_updated: 'Memperbarui project',
        project_deleted: 'Menghapus project',
        asuransi_added: 'Menambah data asuransi'
    };
    return map[action] || action;
}

export function getActionStyle(action: string): { icon: string; color: string } {
    const map: Record<string, { icon: string; color: string }> = {
        login: { icon: '🔑', color: 'var(--color-info)' },
        logout: { icon: '🚪', color: 'var(--color-text-tertiary)' },
        survey_started: { icon: '📋', color: 'var(--color-warning)' },
        survey_submitted: { icon: '✅', color: 'var(--color-success)' },
        survey_saved_draft: { icon: '💾', color: 'var(--color-info)' },
        media_submitted: { icon: '📰', color: 'var(--color-primary)' },
        census_submitted: { icon: '👤', color: 'var(--color-success)' },
        aspiration_submitted: { icon: '💬', color: 'var(--color-warning)' },
        photo_captured: { icon: '📷', color: 'var(--color-accent)' },
        gps_captured: { icon: '📍', color: 'var(--color-error)' },
        respondent_added: { icon: '➕', color: 'var(--color-success)' },
        respondent_edited: { icon: '✏️', color: 'var(--color-info)' },
        data_exported: { icon: '📊', color: 'var(--color-primary)' },
        profile_updated: { icon: '👤', color: 'var(--color-info)' },
        onboarding_completed: { icon: '🎉', color: 'var(--color-success)' },
        media_monitoring_added: { icon: '📰', color: 'var(--color-primary)' },
        census_added: { icon: '👤', color: 'var(--color-success)' },
        aspiration_added: { icon: '💬', color: 'var(--color-warning)' },
        project_created: { icon: '📂', color: 'var(--color-primary)' },
        project_updated: { icon: '📝', color: 'var(--color-info)' },
        project_deleted: { icon: '🗑️', color: 'var(--color-error)' },
        asuransi_added: { icon: '🛡️', color: 'var(--color-warning)' },
    };
    return map[action] || { icon: '📌', color: 'var(--color-text-secondary)' };
}
