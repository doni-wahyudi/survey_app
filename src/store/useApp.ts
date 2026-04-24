import { create } from 'zustand';
import type { SurveyorTab, AdminTab } from '../types';

interface ToastItem {
    id: string;
    message: string;
    type: 'success' | 'error' | 'info' | 'warning';
}

interface AppState {
    // Navigation
    surveyorTab: SurveyorTab;
    adminTab: AdminTab;
    setSurveyorTab: (tab: SurveyorTab) => void;
    setAdminTab: (tab: AdminTab) => void;

    // Toast
    toasts: ToastItem[];
    addToast: (message: string, type?: ToastItem['type']) => void;
    removeToast: (id: string) => void;

    // Modals
    activeModal: string | null;
    modalData: unknown;
    openModal: (modal: string, data?: unknown) => void;
    closeModal: () => void;

    // Sidebar (admin desktop)
    sidebarOpen: boolean;
    toggleSidebar: () => void;

    // Theme
    theme: 'light' | 'dark';
    toggleTheme: () => void;
}

export const useApp = create<AppState>((set) => ({
    surveyorTab: 'home',
    adminTab: 'dashboard',
    setSurveyorTab: (tab) => set({ surveyorTab: tab }),
    setAdminTab: (tab) => set({ adminTab: tab }),

    toasts: [],
    addToast: (message, type = 'info') => {
        const id = Date.now().toString() + Math.random().toString(36).substring(2);
        set((s) => ({ toasts: [...s.toasts, { id, message, type }] }));
        setTimeout(() => {
            set((s) => ({ toasts: s.toasts.filter(t => t.id !== id) }));
        }, 3500);
    },
    removeToast: (id) => set((s) => ({ toasts: s.toasts.filter(t => t.id !== id) })),

    activeModal: null,
    modalData: null,
    openModal: (modal, data = null) => set({ activeModal: modal, modalData: data }),
    closeModal: () => set({ activeModal: null, modalData: null }),

    sidebarOpen: false,
    toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),

    theme: (localStorage.getItem('theme') as 'light' | 'dark') || 'light',
    toggleTheme: () => set((s) => {
        const next = s.theme === 'light' ? 'dark' : 'light';
        localStorage.setItem('theme', next);
        document.documentElement.setAttribute('data-theme', next);
        return { theme: next };
    }),
}));
