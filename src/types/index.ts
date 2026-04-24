export type UserRole = 'surveyor' | 'admin';

export type SurveyStatus = 'pending' | 'surveyed' | 'rejected';
export type SubmissionStatus = 'draft' | 'submitted';
export type AspirationStatus = 'pending' | 'in_progress' | 'resolved' | 'rejected' | 'baru' | 'diproses' | 'selesai' | 'ditolak';
export type AspirationPriority = 'rendah' | 'sedang' | 'tinggi';
export type AspirationCategory = 'infrastruktur' | 'pendidikan' | 'kesehatan' | 'ekonomi' | 'sosial' | 'lainnya';
export type MediaSource = 'online' | 'print' | 'tv' | 'radio' | 'social_media';
export type Sentiment = 'positive' | 'negative' | 'neutral';
export type QuestionType = 'text' | 'number' | 'select' | 'radio' | 'checkbox' | 'textarea' | 'date' | 'matrix' | 'multi_select';

export interface BranchCondition {
    questionId: string;       // ID of the source question
    operator: 'equals' | 'not_equals' | 'contains' | 'answered';
    value: string;            // The value to compare against
}

export interface Profile {
    id: string;
    role: UserRole;
    email: string;
    full_name: string;
    nik: string;
    tempat_lahir: string;
    tanggal_lahir: string;
    jenis_kelamin: string;
    alamat: string;
    rt_rw: string;
    kelurahan_desa: string;
    desa: string;             // Made required
    kecamatan: string;
    kabupaten: string;
    provinsi: string;
    agama: string;
    status_perkawinan: string;
    pekerjaan: string;
    ktp_photo_url: string;
    profile_photo_url: string;
    is_onboarded: boolean;
    assigned_region: Region | null;
    created_at: string;
}

export interface Region {
    kabupaten: string;
    kecamatan?: string;
    desa?: string;
}

export interface RegionData {
    id: string;
    kabupaten: string;
    kecamatan: string;
    desa: string;
}

export interface RespondentSample {
    id: string;
    custom_id: string;        // Made required
    nama: string;
    nik: string;
    no_kk: string;           // Made required
    gender: string;          // Made required
    role_in_kk: string;      // Made required
    alamat: string;
    kabupaten: string;
    provinsi: string;         // Made required
    kecamatan: string;
    desa: string;
    rt_rw: string;
    jenis_kelamin: string;
    usia: number;
    pekerjaan: string;
    phone?: string;           // Added
    no_telp: string;
    status: SurveyStatus;
    status_perkawinan?: string; // Added
    assigned_surveyor: string | null;
    created_at: string;
    created_by: string;
}

export interface Question {
    id: string;
    text: string;
    description?: string;     // Instructions or explanation for the surveyor
    type: QuestionType;
    options?: string[];
    matrixRows?: string[];     // Row labels for matrix/table type questions
    required: boolean;
    conditions?: BranchCondition[]; // ALL conditions must pass to show this question
}

export interface Questionnaire {
    id: string;
    title: string;
    description: string;
    questions: Question[];
    is_active: boolean;
    assigned_surveyors: string[];
    respondent_assignments: Record<string, string[]>; // { [surveyorId: string]: respondentId[] }
    created_at: string;
    created_by: string;
}

export interface SurveyResponse {
    id: string;
    questionnaire_id: string;
    respondent_id: string;
    surveyor_id: string;
    answers: Record<string, string | string[]>;
    location: { lat: number; lng: number } | null;
    photo_url: string;
    status: SubmissionStatus;
    submitted_at: string | null;
    created_at: string;
}

export interface MediaMonitoring {
    id: string;
    title: string;
    source: MediaSource;
    media_name: string;
    url: string;
    content: string;
    summary?: string;
    sentiment: Sentiment;
    priority: 'low' | 'medium' | 'high' | 'crisis';
    impact_score: 'local' | 'regional' | 'national';
    category: string;
    photo_url: string;
    reported_by: string;
    reported_at: string;
}

export interface CensusData {
    id: string;
    respondent_name: string;
    nik: string;
    tempat_lahir: string;
    tanggal_lahir: string;
    jenis_kelamin: string;
    alamat: string;
    kabupaten: string;
    kecamatan: string;
    desa: string;
    rt_rw: string;
    agama: string;
    status_perkawinan: string;
    pendidikan_terakhir: string;
    pekerjaan: string;
    catatan: string;
    photo_url: string;
    surveyor_id: string;
    collected_at: string;
}

export interface Aspiration {
    id: string;
    respondent_name: string;
    kategori: AspirationCategory;
    judul: string;
    deskripsi: string;
    lokasi: string;
    kabupaten: string;
    kecamatan: string;
    desa: string;
    prioritas: AspirationPriority;
    status: AspirationStatus;
    photo_url: string;
    reported_by: string;
    created_at: string;
}

export interface ActivityLog {
    id: string;
    user_id: string;
    action: string;
    details: string;
    timestamp: string;
}

export interface InsuranceData {
    id: string;
    user_id: string;
    policy_number: string;
    subject: string;
    details: string;
    status: string;
    created_at: string;
}

export type SurveyorTab = 'home' | 'survey' | 'media' | 'sensus' | 'aspirasi';
export type AdminTab = 'dashboard' | 'respondent' | 'results' | 'media' | 'aspirasi' | 'users' | 'settings';

export interface AppNotification {
    id: string;
    user_id: string;
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
    is_read: boolean;
    created_at: string;
}
