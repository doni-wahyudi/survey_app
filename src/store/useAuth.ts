import { create } from 'zustand';
import type { Profile } from '../types';
import { supabase, TABLES } from '../lib/supabase';

interface AuthState {
    user: Profile | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;
    login: (email: string, password: string) => Promise<boolean>;
    signUp: (email: string, password: string, fullName: string) => Promise<boolean>;
    logout: () => Promise<void>;
    updateProfile: (profile: Partial<Profile>) => Promise<void>;
    setOnboarded: () => Promise<void>;
    clearError: () => void;
    initialize: () => Promise<void>;
}

export const useAuth = create<AuthState>((set, get) => ({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,

    initialize: async () => {
        set({ isLoading: true });
        try {
            // Check manual session in localStorage
            const savedUser = localStorage.getItem('survey_app_user');
            if (savedUser) {
                const parsedUser = JSON.parse(savedUser);
                // Verify user still exists and get fresh data
                const { data: profile, error } = await supabase!
                    .from(TABLES.profiles)
                    .select('*')
                    .eq('id', parsedUser.id)
                    .single();
                
                if (profile && !error) {
                    set({ user: profile as Profile, isAuthenticated: true });
                    localStorage.setItem('survey_app_user', JSON.stringify(profile));
                } else {
                    localStorage.removeItem('survey_app_user');
                }
            }
        } catch (error) {
            console.error('Auth initialization error:', error);
        } finally {
            set({ isLoading: false });
        }
    },

    login: async (email: string, password: string) => {
        if (!supabase) return false;
        set({ isLoading: true, error: null });

        try {
            // Direct table query for login
            const { data: profile, error } = await supabase
                .from(TABLES.profiles)
                .select('*')
                .eq('email', email)
                .eq('password', password) // In a real app, you'd use hashing
                .single();

            if (error || !profile) {
                set({ error: 'Email atau password salah', isLoading: false });
                return false;
            }

            set({ user: profile as Profile, isAuthenticated: true, isLoading: false });
            localStorage.setItem('survey_app_user', JSON.stringify(profile));
            return true;
        } catch (error: any) {
            set({ error: error.message || 'Login gagal', isLoading: false });
            return false;
        }
    },

    signUp: async (email: string, password: string, fullName: string) => {
        if (!supabase) return false;
        set({ isLoading: true, error: null });

        try {
            const { data: profile, error } = await supabase
                .from(TABLES.profiles)
                .insert({
                    email,
                    password,
                    full_name: fullName,
                    role: 'surveyor',
                    is_onboarded: false
                })
                .select()
                .single();

            if (error) {
                set({ error: error.message, isLoading: false });
                return false;
            }

            set({ user: profile as Profile, isAuthenticated: true, isLoading: false });
            localStorage.setItem('survey_app_user', JSON.stringify(profile));
            return true;
        } catch (error: any) {
            set({ error: error.message || 'Pendaftaran gagal', isLoading: false });
            return false;
        }
    },

    logout: async () => {
        localStorage.removeItem('survey_app_user');
        set({ user: null, isAuthenticated: false });
    },

    updateProfile: async (updates: Partial<Profile>) => {
        if (!supabase) return;
        const { user } = get();
        if (!user) return;

        try {
            const { data, error } = await supabase
                .from(TABLES.profiles)
                .update(updates)
                .eq('id', user.id)
                .select()
                .single();

            if (!error && data) {
                const updatedUser = { ...user, ...data };
                set({ user: updatedUser as Profile });
                localStorage.setItem('survey_app_user', JSON.stringify(updatedUser));
            }
        } catch (error) {
            console.error('Update profile error:', error);
        }
    },

    setOnboarded: async () => {
        await get().updateProfile({ is_onboarded: true });
    },

    clearError: () => set({ error: null }),
}));
