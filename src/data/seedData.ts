import { type RespondentSample, type Questionnaire, type Profile } from '../types';

export const SAMPLE_PROFILES: Profile[] = [
    {
        id: 'srv-001', role: 'surveyor', email: 'surveyor1@example.com', full_name: 'Budi Santoso',
        nik: '3201011203850001', tempat_lahir: 'Jakarta', tanggal_lahir: '1985-03-12',
        jenis_kelamin: 'Laki-laki', alamat: 'Jl. Merdeka No. 1', rt_rw: '001/002',
        kelurahan_desa: 'Dago', desa: 'Dago', kecamatan: 'Coblong', kabupaten: 'Kota Bandung', provinsi: 'Jawa Barat',
        agama: 'Islam', status_perkawinan: 'Kawin', pekerjaan: 'Surveyor',
        ktp_photo_url: '', profile_photo_url: '', is_onboarded: true,
        assigned_region: { kabupaten: 'Kota Bandung', kecamatan: 'Coblong' },
        created_at: '2026-04-01T08:00:00Z'
    }
];

export const RESPONDENTS: RespondentSample[] = [
    {
        id: 'resp-001', custom_id: 'BDG-001', nama: 'Ahmad Hidayat', nik: '3273011205750001',
        no_kk: '3273011205750001', gender: 'Laki-laki', role_in_kk: 'Kepala Keluarga',
        alamat: 'Jl. Dago No. 100', kabupaten: 'Kota Bandung', kecamatan: 'Coblong',
        desa: 'Dago', rt_rw: '001/005', jenis_kelamin: 'Laki-laki', usia: 48,
        pekerjaan: 'Wiraswasta', no_telp: '081234567001', status: 'surveyed',
        provinsi: 'Jawa Barat', phone: '081234567001',
        assigned_surveyor: 'srv-001', created_at: '2026-04-15T10:00:00Z', created_by: 'adm-001'
    },
    {
        id: 'resp-002', custom_id: 'BDG-002', nama: 'Siti Aminah', nik: '3273014508820002',
        no_kk: '3273014508820002', gender: 'Perempuan', role_in_kk: 'Istri',
        alamat: 'Jl. Dago No. 101', kabupaten: 'Kota Bandung', kecamatan: 'Coblong',
        desa: 'Dago', rt_rw: '001/005', jenis_kelamin: 'Perempuan', usia: 41,
        pekerjaan: 'Ibu Rumah Tangga', no_telp: '081234567002', status: 'pending',
        provinsi: 'Jawa Barat', phone: '081234567002',
        assigned_surveyor: 'srv-001', created_at: '2026-04-15T10:05:00Z', created_by: 'adm-001'
    }
];

export const QUESTIONNAIRES: Questionnaire[] = [
    {
        id: 'q-001',
        title: 'Survei Kepuasan Pelayanan Publik',
        description: 'Survei untuk mengukur tingkat kepuasan masyarakat terhadap pelayanan publik di wilayah Jawa Barat.',
        is_active: true,
        assigned_surveyors: [],
        respondent_assignments: {},
        created_at: '2026-04-10T10:00:00Z',
        created_by: 'adm-001',
        questions: [
            { id: 'q1', text: 'Bagaimana penilaian Anda terhadap pelayanan publik di daerah Anda?', type: 'radio', options: ['Sangat Baik', 'Baik', 'Cukup', 'Kurang', 'Sangat Kurang'], required: true },
            { id: 'q12', text: 'Secara keseluruhan, apakah Anda puas dengan pelayanan publik saat ini?', type: 'radio', options: ['Sangat Puas', 'Puas', 'Netral', 'Tidak Puas', 'Sangat Tidak Puas'], required: true },
        ]
    }
];
