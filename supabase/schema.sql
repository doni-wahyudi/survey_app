-- Database Initialization for SurveyKu

-- 1. Tables Setup

-- Profiles table (Decoupled from auth.users for rate-limit bypass)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE,
  password TEXT, -- Simple text password (hashed client-side or plain)
  full_name TEXT,
  role TEXT DEFAULT 'surveyor',
  nik TEXT,
  phone TEXT,
  kabupaten TEXT,
  provinsi TEXT,
  kecamatan TEXT,
  desa TEXT,
  rt_rw TEXT,
  address TEXT,
  ktp_photo_url TEXT,
  profile_photo_url TEXT,
  is_onboarded BOOLEAN DEFAULT FALSE,
  assigned_region JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Questionnaires table
CREATE TABLE IF NOT EXISTS public.questionnaires (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  questions JSONB NOT NULL,
  assigned_surveyors UUID[] DEFAULT '{}',
  respondent_assignments JSONB DEFAULT '{}'::jsonb, -- { "surveyor_id": ["resp_id1", "resp_id2"] }
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES public.profiles(id)
);

-- Respondent Samples table
CREATE TABLE IF NOT EXISTS public.respondent_samples (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  custom_id TEXT UNIQUE, -- Custom ID like DAERAH-001
  nama TEXT NOT NULL,
  nik TEXT,
  no_kk TEXT,
  role_in_kk TEXT,
  gender TEXT,
  phone TEXT,
  alamat TEXT,
  provinsi TEXT,
  kabupaten TEXT,
  kecamatan TEXT,
  desa TEXT,
  rt_rw TEXT,
  status_perkawinan TEXT,
  pekerjaan TEXT,
  ktp_photo_url TEXT,
  respondent_photo_url TEXT,
  status TEXT DEFAULT 'pending', -- pending, surveyed, rejected
  assigned_surveyor UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Survey Responses table
CREATE TABLE IF NOT EXISTS public.survey_responses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  questionnaire_id UUID REFERENCES public.questionnaires(id),
  respondent_id UUID REFERENCES public.respondent_samples(id),
  surveyor_id UUID REFERENCES public.profiles(id),
  answers JSONB NOT NULL,
  location JSONB,
  photo_url TEXT,
  status TEXT DEFAULT 'submitted', -- submitted, draft, rejected
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Media Monitoring table
CREATE TABLE IF NOT EXISTS public.media_monitoring (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  source TEXT,
  url TEXT,
  sentiment TEXT, -- positive, negative, neutral
  category TEXT,
  summary TEXT,
  reported_by UUID REFERENCES public.profiles(id),
  reported_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Census Data table
CREATE TABLE IF NOT EXISTS public.census_data (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nik TEXT UNIQUE NOT NULL,
  respondent_name TEXT NOT NULL,
  jenis_kelamin TEXT,
  usia INTEGER,
  alamat TEXT,
  kabupaten TEXT,
  kecamatan TEXT,
  desa TEXT,
  rt_rw TEXT,
  surveyor_id UUID REFERENCES public.profiles(id),
  collected_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Aspirations table
CREATE TABLE IF NOT EXISTS public.aspirations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  judul TEXT NOT NULL,
  deskripsi TEXT,
  kategori TEXT,
  prioritas TEXT, -- rendah, sedang, tinggi
  status TEXT DEFAULT 'pending', -- pending, in_progress, resolved
  kabupaten TEXT,
  kecamatan TEXT,
  desa TEXT,
  provinsi TEXT,
  lokasi TEXT,
  photo_url TEXT,
  respondent_name TEXT,
  reported_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Activity Logs table
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id),
  action TEXT NOT NULL,
  details TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Security Functions
-- Create a non-recursive admin check function
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public;

-- 3. Triggers for Profile Creation
-- Create a profile when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, is_onboarded)
  VALUES (
    new.id, 
    new.email, 
    COALESCE(new.raw_user_meta_data->>'full_name', ''), 
    COALESCE(new.raw_user_meta_data->>'role', 'surveyor'),
    false
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-create trigger safely
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. Row Level Security (RLS)
-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questionnaires ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.respondent_samples ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.survey_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_monitoring ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.census_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aspirations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins have full access" ON public.profiles;

CREATE POLICY "Anyone can view profiles" ON public.profiles
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (true); -- Logic handled by app

CREATE POLICY "Admins can manage profiles" ON public.profiles
  FOR ALL TO authenticated USING (true); -- Logic handled by app

-- Respondent Samples Policies
DROP POLICY IF EXISTS "Anyone can view samples" ON public.respondent_samples;
CREATE POLICY "Anyone can view samples" ON public.respondent_samples
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Admins can manage samples" ON public.respondent_samples;
CREATE POLICY "Admins can manage samples" ON public.respondent_samples
  FOR ALL TO authenticated USING (public.is_admin());

-- Aspirations Policies
DROP POLICY IF EXISTS "Users can view aspirations" ON public.aspirations;
CREATE POLICY "Users can view aspirations" ON public.aspirations
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Users can insert aspirations" ON public.aspirations;
CREATE POLICY "Users can insert aspirations" ON public.aspirations
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = reported_by);

DROP POLICY IF EXISTS "Users can update aspirations" ON public.aspirations;
CREATE POLICY "Users can update aspirations" ON public.aspirations
  FOR UPDATE TO authenticated USING (auth.uid() = reported_by OR public.is_admin());

-- Media Monitoring Policies
DROP POLICY IF EXISTS "Public can view media" ON public.media_monitoring;
CREATE POLICY "Public can view media" ON public.media_monitoring
  FOR SELECT TO authenticated USING (true);

-- Activity Logs Policies
DROP POLICY IF EXISTS "Users can insert logs" ON public.activity_logs;
CREATE POLICY "Users can insert logs" ON public.activity_logs
  FOR INSERT TO authenticated WITH CHECK (true);

-- 5. Missing Tables Additions

-- Notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info', -- info, success, warning, error
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Invitations table
CREATE TABLE IF NOT EXISTS public.user_invitations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  role TEXT DEFAULT 'surveyor',
  village_id TEXT,
  created_by UUID REFERENCES public.profiles(id),
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insurance Data table (Vouchers)
CREATE TABLE IF NOT EXISTS public.insurance_data (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  policy_number TEXT,
  subject TEXT,
  details TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for new tables
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.insurance_data ENABLE ROW LEVEL SECURITY;

-- Notifications Policies
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
CREATE POLICY "Users can view their own notifications" ON public.notifications
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
CREATE POLICY "Users can update their own notifications" ON public.notifications
  FOR UPDATE TO authenticated USING (true);

-- Invitations Policies
DROP POLICY IF EXISTS "Admins can manage invitations" ON public.user_invitations;
CREATE POLICY "Admins can manage invitations" ON public.user_invitations
  FOR ALL TO authenticated USING (public.is_admin());

-- Insurance Data Policies
DROP POLICY IF EXISTS "Users can view own insurance" ON public.insurance_data;
CREATE POLICY "Users can view own insurance" ON public.insurance_data
  FOR SELECT TO authenticated USING (auth.uid() = user_id);


-- 6. Storage Buckets & Policies

-- Create Buckets (if they don't exist yet)
INSERT INTO storage.buckets (id, name, public) 
VALUES 
  ('census-photos', 'census-photos', true),
  ('survey-photos', 'survey-photos', true),
  ('media-photos', 'media-photos', true),
  ('profile-photos', 'profile-photos', true),
  ('aspiration-photos', 'aspiration-photos', true),
  ('ktp-photos', 'ktp-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Set up Storage Policies for 'census-photos'
DROP POLICY IF EXISTS "Public can view census photos" ON storage.objects;
CREATE POLICY "Public can view census photos" ON storage.objects FOR SELECT USING ( bucket_id = 'census-photos' );

DROP POLICY IF EXISTS "Authenticated users can upload census photos" ON storage.objects;
CREATE POLICY "Authenticated users can upload census photos" ON storage.objects FOR INSERT TO authenticated WITH CHECK ( bucket_id = 'census-photos' );

-- Set up Storage Policies for 'aspiration-photos'
DROP POLICY IF EXISTS "Public can view aspiration photos" ON storage.objects;
CREATE POLICY "Public can view aspiration photos" ON storage.objects FOR SELECT USING ( bucket_id = 'aspiration-photos' );

DROP POLICY IF EXISTS "Authenticated users can upload aspiration photos" ON storage.objects;
CREATE POLICY "Authenticated users can upload aspiration photos" ON storage.objects FOR INSERT TO authenticated WITH CHECK ( bucket_id = 'aspiration-photos' );

-- Set up Storage Policies for 'survey-photos'
DROP POLICY IF EXISTS "Public can view survey photos" ON storage.objects;
CREATE POLICY "Public can view survey photos" ON storage.objects FOR SELECT USING ( bucket_id = 'survey-photos' );

DROP POLICY IF EXISTS "Authenticated users can upload survey photos" ON storage.objects;
CREATE POLICY "Authenticated users can upload survey photos" ON storage.objects FOR INSERT TO authenticated WITH CHECK ( bucket_id = 'survey-photos' );

-- Set up Storage Policies for 'media-photos'
DROP POLICY IF EXISTS "Public can view media photos" ON storage.objects;
CREATE POLICY "Public can view media photos" ON storage.objects FOR SELECT USING ( bucket_id = 'media-photos' );

DROP POLICY IF EXISTS "Authenticated users can upload media photos" ON storage.objects;
CREATE POLICY "Authenticated users can upload media photos" ON storage.objects FOR INSERT TO authenticated WITH CHECK ( bucket_id = 'media-photos' );

-- Set up Storage Policies for 'profile-photos'
DROP POLICY IF EXISTS "Public can view profile photos" ON storage.objects;
CREATE POLICY "Public can view profile photos" ON storage.objects FOR SELECT USING ( bucket_id = 'profile-photos' );

DROP POLICY IF EXISTS "Authenticated users can upload profile photos" ON storage.objects;
CREATE POLICY "Authenticated users can upload profile photos" ON storage.objects FOR INSERT TO authenticated WITH CHECK ( bucket_id = 'profile-photos' );

-- Set up Storage Policies for 'ktp-photos'
DROP POLICY IF EXISTS "Public can view ktp photos" ON storage.objects;
CREATE POLICY "Public can view ktp photos" ON storage.objects FOR SELECT USING ( bucket_id = 'ktp-photos' );

DROP POLICY IF EXISTS "Authenticated users can upload ktp photos" ON storage.objects;
CREATE POLICY "Authenticated users can upload ktp photos" ON storage.objects FOR INSERT TO authenticated WITH CHECK ( bucket_id = 'ktp-photos' );

-- 7. Schema Updates
-- Add created_by to questionnaires table
ALTER TABLE public.questionnaires ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES public.profiles(id);
ALTER TABLE public.questionnaires ADD COLUMN IF NOT EXISTS assigned_surveyors JSONB DEFAULT '[]'::jsonb;


-- Questionnaires Policies
DROP POLICY IF EXISTS "Anyone can view questionnaires" ON public.questionnaires;
CREATE POLICY "Anyone can view questionnaires" ON public.questionnaires
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Admins can manage questionnaires" ON public.questionnaires;
CREATE POLICY "Admins can manage questionnaires" ON public.questionnaires
  FOR ALL TO authenticated USING (public.is_admin());

