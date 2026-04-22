import { createClient } from '@supabase/supabase-js';
import type { Aspiration, CensusData, MediaMonitoring, InsuranceData, RespondentSample, SurveyResponse, AppNotification } from '../types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = SUPABASE_URL && SUPABASE_ANON_KEY
    ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    : null;

export const isSupabaseConfigured = (): boolean => {
    return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
};

export const TABLES = {
    profiles: 'profiles',
    respondentSamples: 'respondent_samples',
    questionnaires: 'questionnaires',
    surveyResponses: 'survey_responses',
    mediaMonitoring: 'media_monitoring',
    censusData: 'census_data',
    aspirations: 'aspirations',
    regions: 'regions',
    activityLogs: 'activity_logs',
    notifications: 'notifications'
};

// Admin helper to create user without logging out the current admin session
// Note: Email confirmation must be DISABLED in Supabase Dashboard -> Auth -> Settings
export const createNewUser = async (email: string, password: string, fullName: string, role: 'admin' | 'surveyor') => {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) throw new Error('Supabase not configured');
    
    // Create a temporary client that doesn't persist session
    const tempClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: {
            persistSession: false,
            autoRefreshToken: false,
            detectSessionInUrl: false
        }
    });

    const { data, error } = await tempClient.auth.signUp({
        email,
        password,
        options: {
            data: {
                full_name: fullName,
                role: role
            }
        }
    });

    if (error) throw error;
    return data;
};

export const changePassword = async (newPassword: string) => {
    if (!supabase) throw new Error('Supabase client not initialized');
    const { data, error } = await supabase.auth.updateUser({
        password: newPassword
    });
    if (error) throw error;
    return data;
};



export async function uploadFile(bucket: string, path: string, base64Data: string) {
    if (!supabase) return null;
    
    try {
        const base64Content = base64Data.split(';base64,').pop() || '';
        const byteCharacters = atob(base64Content);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'image/jpeg' });

        const { data, error } = await supabase.storage.from(bucket).upload(path, blob, {
            contentType: 'image/jpeg',
            upsert: true
        });

        if (error) throw error;

        const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(data.path);
        return publicUrl;
    } catch (err) {
        console.error('File upload error:', err);
        return null;
    }
}

export const fetchNotifications = async (userId: string) => {
    if (!supabase) return [];
    const { data, error } = await supabase
        .from(TABLES.notifications)
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
    
    if (error) {
        console.error('Error fetching notifications:', error);
        return [];
    }
    return data;
};

export const markNotificationAsRead = async (id: string) => {
    if (!supabase) return;
    const { error } = await supabase
        .from(TABLES.notifications)
        .update({ is_read: true })
        .eq('id', id);
    
    if (error) {
        console.error('Error marking notification as read:', error);
    }
};

export const createNotification = async (userId: string, title: string, message: string, type: AppNotification['type'] = 'info') => {
    if (!supabase) return null;
    const { data, error } = await supabase
        .from(TABLES.notifications)
        .insert({
            user_id: userId,
            title,
            message,
            type,
            is_read: false
        })
        .select()
        .single();
    
    if (error) {
        console.error('Error creating notification:', error);
        return null;
    }
    return data;
};

export const fetchProfile = async (userId: string) => {
    if (!supabase) return null;
    const { data, error } = await supabase
        .from(TABLES.profiles)
        .select('*')
        .eq('id', userId)
        .single();
    
    if (error) {
        console.error('Error fetching profile:', error);
        return null;
    }
    return data;
};

export const updateProfile = async (userId: string, updates: any) => {
    if (!supabase) return null;
    const { data, error } = await supabase
        .from(TABLES.profiles)
        .update(updates)
        .eq('id', userId)
        .select()
        .single();
    
    if (error) {
        console.error('Error updating profile:', error);
        throw error;
    }
    return data;
};

export const fetchUserLogs = async (userId: string) => {
    if (!supabase) return [];
    const { data, error } = await supabase
        .from(TABLES.activityLogs)
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);
    
    if (error) {
        console.error('Error fetching logs:', error);
        return [];
    }
    return data;
};

export const fetchAllLogs = async () => {
    if (!supabase) return [];
    const { data, error } = await supabase
        .from(TABLES.activityLogs)
        .select('*, profiles(full_name)')
        .order('created_at', { ascending: false })
        .limit(100);
    
    if (error) {
        console.error('Error fetching all logs:', error);
        return [];
    }
    return data;
};

export const fetchAllProfiles = async () => {
    if (!supabase) return [];
    const { data, error } = await supabase
        .from(TABLES.profiles)
        .select('*')
        .order('full_name', { ascending: true });
    
    if (error) {
        console.error('Error fetching all profiles:', error);
        return [];
    }
    return data;
};

export const fetchAllRespondents = async () => {
    if (!supabase) return [];
    const { data, error } = await supabase
        .from(TABLES.respondentSamples)
        .select('*, profiles:assigned_surveyor(full_name)')
        .order('created_at', { ascending: false });
    
    if (error) {
        console.error('Error fetching all respondents:', error);
        return [];
    }
    return data;
};

export const updateRespondent = async (id: string, updates: any) => {
    if (!supabase) return null;
    const { data, error } = await supabase
        .from(TABLES.respondentSamples)
        .update(updates)
        .eq('id', id)
        .select()
        .single();
    
    if (error) {
        console.error('Error updating respondent:', error);
        throw error;
    }
    return data;
};

export const createRespondent = async (data: any) => {
    if (!supabase) return null;
    const { data: result, error } = await supabase
        .from(TABLES.respondentSamples)
        .insert(data)
        .select()
        .single();
    
    if (error) {
        console.error('Error creating respondent:', error);
        throw error;
    }
    return result;
};

export const deleteRespondent = async (id: string) => {
    if (!supabase) return;
    const { error } = await supabase
        .from(TABLES.respondentSamples)
        .delete()
        .eq('id', id);
    
    if (error) {
        console.error('Error deleting respondent:', error);
        throw error;
    }
};

export const fetchAllQuestionnaires = async () => {
    if (!supabase) return [];
    const { data, error } = await supabase
        .from(TABLES.questionnaires)
        .select('*')
        .order('created_at', { ascending: false });
    
    if (error) {
        console.error('Error fetching all questionnaires:', error);
        return [];
    }
    return data;
};

export const updateQuestionnaire = async (id: string, updates: any) => {
    if (!supabase) return null;
    const { data, error } = await supabase
        .from(TABLES.questionnaires)
        .update(updates)
        .eq('id', id)
        .select()
        .single();
    
    if (error) {
        console.error('Error updating questionnaire:', error);
        throw error;
    }
    return data;
};

export const createQuestionnaire = async (data: any) => {
    if (!supabase) return null;
    const { data: result, error } = await supabase
        .from(TABLES.questionnaires)
        .insert(data)
        .select()
        .single();
    
    if (error) {
        console.error('Error creating questionnaire:', error);
        throw error;
    }
    return result;
};

export const toggleQuestionnaireActive = async (id: string, isActive: boolean) => {
    return updateQuestionnaire(id, { is_active: isActive });
};

export const deleteQuestionnaire = async (id: string) => {
    if (!supabase) return;
    const { error } = await supabase
        .from(TABLES.questionnaires)
        .delete()
        .eq('id', id);
    
    if (error) {
        console.error('Error deleting questionnaire:', error);
        throw error;
    }
};

export const fetchSurveyResults = async () => {
    if (!supabase) return [];
    const { data, error } = await supabase
        .from(TABLES.surveyResponses)
        .select('*, profiles:surveyor_id(full_name), respondent:respondent_id(nama), questionnaire:questionnaire_id(title)')
        .order('submitted_at', { ascending: false });
    
    if (error) {
        console.error('Error fetching survey results:', error);
        return [];
    }
    return data;
};

export const deleteSurveyResponse = async (id: string) => {
    if (!supabase) return;
    const { error } = await supabase
        .from(TABLES.surveyResponses)
        .delete()
        .eq('id', id);
    
    if (error) {
        console.error('Error deleting survey response:', error);
        throw error;
    }
};

export const fetchAspirations = async (): Promise<Aspiration[]> => {
    if (!supabase) return [];
    const { data, error } = await supabase.from(TABLES.aspirations).select('*, profiles:reported_by(full_name)').order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
};

export const submitAspiration = async (data: any) => {
    if (!supabase) return null;
    const { data: result, error } = await supabase.from(TABLES.aspirations).insert(data).select().single();
    if (error) throw error;
    return result;
};

export const fetchCensus = async (): Promise<CensusData[]> => {
    if (!supabase) return [];
    const { data, error } = await supabase.from(TABLES.censusData).select('*, profiles:surveyor_id(full_name)').order('collected_at', { ascending: false });
    if (error) throw error;
    return data || [];
};

export const submitCensus = async (data: any) => {
    if (!supabase) return null;
    const { data: result, error } = await supabase.from(TABLES.censusData).insert(data).select().single();
    if (error) throw error;
    return result;
};

export const fetchMediaMonitoring = async (): Promise<MediaMonitoring[]> => {
    if (!supabase) return [];
    const { data, error } = await supabase.from(TABLES.mediaMonitoring).select('*, profiles:reported_by(full_name)').order('reported_at', { ascending: false });
    if (error) throw error;
    return data || [];
};

export const submitMediaMonitoring = async (data: any) => {
    if (!supabase) return null;
    const { data: result, error } = await supabase.from(TABLES.mediaMonitoring).insert(data).select().single();
    if (error) throw error;
    return result;
};

export const submitSurveyResponse = async (data: Omit<SurveyResponse, 'id'>) => {
    if (!supabase) throw new Error('Supabase client not initialized');
    const { error } = await supabase.from(TABLES.surveyResponses).insert(data);
    if (error) throw error;
};

// Invitation
export const createInvitation = async (email: string, role: string, villageId?: string) => {
    if (!supabase) throw new Error('Supabase client not initialized');
    const { error } = await supabase.from('user_invitations').insert({
        email,
        role,
        village_id: villageId || null,
        created_by: (await supabase.auth.getUser()).data.user?.id
    });
    if (error) throw error;
};

export const fetchVouchers = async (): Promise<InsuranceData[]> => {
    if (!supabase) return [];
    const { data, error } = await supabase.from('insurance_data').select('*, profiles:user_id(full_name)').order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
};

export const fetchRespondents = async (): Promise<RespondentSample[]> => {
    if (!supabase) return [];
    const { data, error } = await supabase.from(TABLES.respondentSamples).select('*, profiles:assigned_surveyor(full_name)').order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
};
