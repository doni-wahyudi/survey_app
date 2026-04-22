import { create } from 'zustand';
import type { Profile } from '../types';
import { supabase } from '../lib/supabase';

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
        if (!supabase) {
            set({ isLoading: false });
            return;
        }

        try {
            const { data: { session } } = await supabase.auth.getSession();
            
            if (session?.user) {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', session.user.id)
                    .single();

                if (profile) {
                    set({ user: profile as Profile, isAuthenticated: true });
                }
            }
        } catch (error) {
            console.error('Initialization error:', error);
        } finally {
            set({ isLoading: false });
        }

        // Listen for auth changes
        supabase.auth.onAuthStateChange(async (event, session) => {
            if (!supabase) return;
            if (event === 'SIGNED_IN' && session?.user) {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', session.user.id)
                    .single();
                set({ user: profile as Profile, isAuthenticated: true });
            } else if (event === 'SIGNED_OUT') {
                set({ user: null, isAuthenticated: false });
            }
        });
    },

    login: async (email: string, password: string) => {
        if (!supabase) return false;
        
        set({ isLoading: true, error: null });

        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password
            });

            if (error) {
                set({ error: error.message, isLoading: false });
                return false;
            }

            if (data.user) {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', data.user.id)
                    .single();

                if (profile) {
                    set({ user: profile as Profile, isAuthenticated: true, isLoading: false });
                    return true;
                }
            }
        } catch (error: any) {
            set({ error: error.message || 'Login failed', isLoading: false });
        }

        set({ isLoading: false });
        return false;
    },

    signUp: async (email: string, password: string, fullName: string) => {
        if (!supabase) return false;
        
        set({ isLoading: true, error: null });

        try {
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: fullName,
                    }
                }
            });

            if (error) {
                set({ error: error.message, isLoading: false });
                return false;
            }

            // Supabase signup might require email confirmation, 
            // but if auto-confirm is on, it will log them in.
            return true;
        } catch (error: any) {
            set({ error: error.message || 'Sign up failed', isLoading: false });
        }

        set({ isLoading: false });
        return false;
    },

    logout: async () => {
        if (!supabase) return;
        await supabase.auth.signOut();
        set({ user: null, isAuthenticated: false });
    },

    updateProfile: async (updates: Partial<Profile>) => {
        if (!supabase) return;
        
        const { user } = get();
        if (user) {
            try {
                const { data, error } = await supabase
                    .from('profiles')
                    .update(updates)
                    .eq('id', user.id)
                    .select()
                    .single();

                if (!error && data) {
                    set({ user: data as Profile });
                } else if (error) {
                    console.error('Update profile error:', error);
                }
            } catch (error) {
                console.error('Update profile error:', error);
            }
        }
    },

    setOnboarded: async () => {
        const { updateProfile } = get();
        await updateProfile({ is_onboarded: true });
    },

    clearError: () => set({ error: null }),
}));
