// ==========================================
// SurveyKu — Seed Data (Jawa Barat)
// ==========================================
import type {
    RegionData, RespondentSample, Questionnaire,
    MediaMonitoring, CensusData, Aspiration
} from '../types';

// ── Region Master Data (Jawa Barat) ──
export const REGIONS: RegionData[] = [
    // Kota Bandung
    { id: 'r-001', kabupaten: 'Kota Bandung', kecamatan: 'Coblong', desa: 'Dago' },
    { id: 'r-002', kabupaten: 'Kota Bandung', kecamatan: 'Coblong', desa: 'Lebak Siliwangi' },
    { id: 'r-003', kabupaten: 'Kota Bandung', kecamatan: 'Coblong', desa: 'Cipaganti' },
    { id: 'r-004', kabupaten: 'Kota Bandung', kecamatan: 'Bandung Wetan', desa: 'Citarum' },
    { id: 'r-005', kabupaten: 'Kota Bandung', kecamatan: 'Bandung Wetan', desa: 'Tamansari' },
    { id: 'r-006', kabupaten: 'Kota Bandung', kecamatan: 'Sumur Bandung', desa: 'Braga' },
    { id: 'r-007', kabupaten: 'Kota Bandung', kecamatan: 'Sumur Bandung', desa: 'Babakan Ciamis' },
    { id: 'r-008', kabupaten: 'Kota Bandung', kecamatan: 'Cicendo', desa: 'Pajajaran' },
    { id: 'r-009', kabupaten: 'Kota Bandung', kecamatan: 'Cicendo', desa: 'Husein Sastranegara' },
    // Kabupaten Bandung
    { id: 'r-010', kabupaten: 'Kabupaten Bandung', kecamatan: 'Baleendah', desa: 'Baleendah' },
    { id: 'r-011', kabupaten: 'Kabupaten Bandung', kecamatan: 'Baleendah', desa: 'Andir' },
    { id: 'r-012', kabupaten: 'Kabupaten Bandung', kecamatan: 'Cileunyi', desa: 'Cileunyi Kulon' },
    { id: 'r-013', kabupaten: 'Kabupaten Bandung', kecamatan: 'Cileunyi', desa: 'Cileunyi Wetan' },
    { id: 'r-014', kabupaten: 'Kabupaten Bandung', kecamatan: 'Dayeuhkolot', desa: 'Dayeuhkolot' },
    { id: 'r-015', kabupaten: 'Kabupaten Bandung', kecamatan: 'Dayeuhkolot', desa: 'Citeureup' },
    // Kota Bogor
    { id: 'r-016', kabupaten: 'Kota Bogor', kecamatan: 'Bogor Tengah', desa: 'Babakan' },
    { id: 'r-017', kabupaten: 'Kota Bogor', kecamatan: 'Bogor Tengah', desa: 'Tegallega' },
    { id: 'r-018', kabupaten: 'Kota Bogor', kecamatan: 'Bogor Utara', desa: 'Cibuluh' },
    { id: 'r-019', kabupaten: 'Kota Bogor', kecamatan: 'Tanah Sareal', desa: 'Kedung Waringin' },
    { id: 'r-020', kabupaten: 'Kota Bogor', kecamatan: 'Tanah Sareal', desa: 'Sukaresmi' },
    // Kabupaten Garut
    { id: 'r-021', kabupaten: 'Kabupaten Garut', kecamatan: 'Garut Kota', desa: 'Kota Kulon' },
    { id: 'r-022', kabupaten: 'Kabupaten Garut', kecamatan: 'Garut Kota', desa: 'Kota Wetan' },
    { id: 'r-023', kabupaten: 'Kabupaten Garut', kecamatan: 'Tarogong Kidul', desa: 'Jayaraga' },
    { id: 'r-024', kabupaten: 'Kabupaten Garut', kecamatan: 'Tarogong Kidul', desa: 'Sukajaya' },
];

// ── Respondent Samples ──
export const RESPONDENTS: RespondentSample[] = [
    {
        id: 'resp-001', nama: 'Ahmad Sudirman', nik: '3273011201850001',
        alamat: 'Jl. Ir. H. Juanda No. 45', kabupaten: 'Kota Bandung', kecamatan: 'Coblong',
        desa: 'Dago', rt_rw: '003/005', jenis_kelamin: 'Laki-laki', usia: 41,
        pekerjaan: 'Wiraswasta', no_telp: '081234567001', status: 'pending',
        assigned_surveyor: 'srv-001', created_at: '2026-04-15T08:00:00Z', created_by: 'adm-001'
    },
    {
        id: 'resp-002', nama: 'Siti Nurhaliza', nik: '3273015502900002',
        alamat: 'Jl. Dipatiukur No. 12', kabupaten: 'Kota Bandung', kecamatan: 'Coblong',
        desa: 'Lebak Siliwangi', rt_rw: '001/002', jenis_kelamin: 'Perempuan', usia: 36,
        pekerjaan: 'Guru', no_telp: '081234567002', status: 'pending',
        assigned_surveyor: 'srv-001', created_at: '2026-04-15T08:05:00Z', created_by: 'adm-001'
    },
    {
        id: 'resp-003', nama: 'Budi Hartono', nik: '3273012003780003',
        alamat: 'Jl. Cisitu No. 88', kabupaten: 'Kota Bandung', kecamatan: 'Coblong',
        desa: 'Cipaganti', rt_rw: '005/010', jenis_kelamin: 'Laki-laki', usia: 48,
        pekerjaan: 'PNS', no_telp: '081234567003', status: 'surveyed',
        assigned_surveyor: 'srv-001', created_at: '2026-04-15T08:10:00Z', created_by: 'adm-001'
    },
    {
        id: 'resp-004', nama: 'Dewi Lestari', nik: '3273014407950004',
        alamat: 'Jl. Tamansari No. 5', kabupaten: 'Kota Bandung', kecamatan: 'Bandung Wetan',
        desa: 'Tamansari', rt_rw: '002/003', jenis_kelamin: 'Perempuan', usia: 31,
        pekerjaan: 'Karyawan Swasta', no_telp: '081234567004', status: 'pending',
        assigned_surveyor: 'srv-002', created_at: '2026-04-15T08:15:00Z', created_by: 'adm-001'
    },
    {
        id: 'resp-005', nama: 'Eko Prasetyo', nik: '3273011506880005',
        alamat: 'Jl. Citarum No. 23', kabupaten: 'Kota Bandung', kecamatan: 'Bandung Wetan',
        desa: 'Citarum', rt_rw: '004/006', jenis_kelamin: 'Laki-laki', usia: 38,
        pekerjaan: 'Pedagang', no_telp: '081234567005', status: 'pending',
        assigned_surveyor: 'srv-002', created_at: '2026-04-15T08:20:00Z', created_by: 'adm-001'
    },
    {
        id: 'resp-006', nama: 'Fitriani Hakim', nik: '3273013008920006',
        alamat: 'Jl. Braga No. 77', kabupaten: 'Kota Bandung', kecamatan: 'Sumur Bandung',
        desa: 'Braga', rt_rw: '001/001', jenis_kelamin: 'Perempuan', usia: 34,
        pekerjaan: 'Dokter', no_telp: '081234567006', status: 'pending',
        assigned_surveyor: 'srv-001', created_at: '2026-04-15T08:25:00Z', created_by: 'adm-001'
    },
    {
        id: 'resp-007', nama: 'Gunawan Wibowo', nik: '3273010205750007',
        alamat: 'Jl. Pajajaran No. 100', kabupaten: 'Kota Bandung', kecamatan: 'Cicendo',
        desa: 'Pajajaran', rt_rw: '006/008', jenis_kelamin: 'Laki-laki', usia: 51,
        pekerjaan: 'Pensiunan', no_telp: '081234567007', status: 'surveyed',
        assigned_surveyor: 'srv-001', created_at: '2026-04-15T08:30:00Z', created_by: 'adm-001'
    },
    {
        id: 'resp-008', nama: 'Hesti Rahmawati', nik: '3204016509870008',
        alamat: 'Jl. Raya Baleendah No. 15', kabupaten: 'Kabupaten Bandung', kecamatan: 'Baleendah',
        desa: 'Baleendah', rt_rw: '003/004', jenis_kelamin: 'Perempuan', usia: 39,
        pekerjaan: 'Ibu Rumah Tangga', no_telp: '081234567008', status: 'pending',
        assigned_surveyor: 'srv-001', created_at: '2026-04-15T08:35:00Z', created_by: 'adm-001'
    },
    {
        id: 'resp-009', nama: 'Irwan Setiawan', nik: '3204012308800009',
        alamat: 'Jl. Cileunyi No. 33', kabupaten: 'Kabupaten Bandung', kecamatan: 'Cileunyi',
        desa: 'Cileunyi Kulon', rt_rw: '002/007', jenis_kelamin: 'Laki-laki', usia: 46,
        pekerjaan: 'Petani', no_telp: '081234567009', status: 'pending',
        assigned_surveyor: 'srv-002', created_at: '2026-04-15T08:40:00Z', created_by: 'adm-001'
    },
    {
        id: 'resp-010', nama: 'Jamilah Putri', nik: '3204014112910010',
        alamat: 'Jl. Dayeuhkolot No. 8', kabupaten: 'Kabupaten Bandung', kecamatan: 'Dayeuhkolot',
        desa: 'Dayeuhkolot', rt_rw: '001/003', jenis_kelamin: 'Perempuan', usia: 35,
        pekerjaan: 'Pedagang', no_telp: '081234567010', status: 'pending',
        assigned_surveyor: 'srv-002', created_at: '2026-04-15T08:45:00Z', created_by: 'adm-001'
    },
    {
        id: 'resp-011', nama: 'Kurniawan Hidayat', nik: '3271010703830011',
        alamat: 'Jl. Pajajaran No. 50', kabupaten: 'Kota Bogor', kecamatan: 'Bogor Tengah',
        desa: 'Babakan', rt_rw: '004/005', jenis_kelamin: 'Laki-laki', usia: 43,
        pekerjaan: 'Wiraswasta', no_telp: '081234567011', status: 'pending',
        assigned_surveyor: null, created_at: '2026-04-15T08:50:00Z', created_by: 'adm-001'
    },
    {
        id: 'resp-012', nama: 'Lina Marlina', nik: '3271015208960012',
        alamat: 'Jl. Sudirman No. 25', kabupaten: 'Kota Bogor', kecamatan: 'Bogor Tengah',
        desa: 'Tegallega', rt_rw: '002/001', jenis_kelamin: 'Perempuan', usia: 30,
        pekerjaan: 'Karyawan Swasta', no_telp: '081234567012', status: 'pending',
        assigned_surveyor: null, created_at: '2026-04-15T08:55:00Z', created_by: 'adm-001'
    },
    {
        id: 'resp-013', nama: 'Muhammad Rizki', nik: '3205011108970013',
        alamat: 'Jl. Kota Kulon No. 18', kabupaten: 'Kabupaten Garut', kecamatan: 'Garut Kota',
        desa: 'Kota Kulon', rt_rw: '003/002', jenis_kelamin: 'Laki-laki', usia: 29,
        pekerjaan: 'Mahasiswa', no_telp: '081234567013', status: 'pending',
        assigned_surveyor: null, created_at: '2026-04-15T09:00:00Z', created_by: 'adm-001'
    },
    {
        id: 'resp-014', nama: 'Nina Agustina', nik: '3205014505880014',
        alamat: 'Jl. Jayaraga No. 7', kabupaten: 'Kabupaten Garut', kecamatan: 'Tarogong Kidul',
        desa: 'Jayaraga', rt_rw: '005/003', jenis_kelamin: 'Perempuan', usia: 38,
        pekerjaan: 'Guru', no_telp: '081234567014', status: 'pending',
        assigned_surveyor: null, created_at: '2026-04-15T09:05:00Z', created_by: 'adm-001'
    },
    {
        id: 'resp-015', nama: 'Oscar Ramadhan', nik: '3273012712940015',
        alamat: 'Jl. Cihampelas No. 55', kabupaten: 'Kota Bandung', kecamatan: 'Coblong',
        desa: 'Cipaganti', rt_rw: '007/009', jenis_kelamin: 'Laki-laki', usia: 32,
        pekerjaan: 'Programmer', no_telp: '081234567015', status: 'pending',
        assigned_surveyor: 'srv-001', created_at: '2026-04-15T09:10:00Z', created_by: 'adm-001'
    },
    {
        id: 'resp-016', nama: 'Putri Handayani', nik: '3273013003890016',
        alamat: 'Jl. Setiabudi No. 10', kabupaten: 'Kota Bandung', kecamatan: 'Coblong',
        desa: 'Dago', rt_rw: '002/004', jenis_kelamin: 'Perempuan', usia: 37,
        pekerjaan: 'Apoteker', no_telp: '081234567016', status: 'rejected',
        assigned_surveyor: 'srv-001', created_at: '2026-04-15T09:15:00Z', created_by: 'adm-001'
    },
    {
        id: 'resp-017', nama: 'Rudi Hermawan', nik: '3204011507820017',
        alamat: 'Jl. Raya Andir No. 22', kabupaten: 'Kabupaten Bandung', kecamatan: 'Baleendah',
        desa: 'Andir', rt_rw: '006/011', jenis_kelamin: 'Laki-laki', usia: 44,
        pekerjaan: 'Supir', no_telp: '081234567017', status: 'pending',
        assigned_surveyor: 'srv-002', created_at: '2026-04-15T09:20:00Z', created_by: 'adm-001'
    },
    {
        id: 'resp-018', nama: 'Sari Indah', nik: '3204013101930018',
        alamat: 'Jl. Cileunyi Wetan No. 4', kabupaten: 'Kabupaten Bandung', kecamatan: 'Cileunyi',
        desa: 'Cileunyi Wetan', rt_rw: '001/006', jenis_kelamin: 'Perempuan', usia: 33,
        pekerjaan: 'Perawat', no_telp: '081234567018', status: 'pending',
        assigned_surveyor: 'srv-002', created_at: '2026-04-15T09:25:00Z', created_by: 'adm-001'
    },
    {
        id: 'resp-019', nama: 'Tono Supriatna', nik: '3271011804850019',
        alamat: 'Jl. Cibuluh No. 60', kabupaten: 'Kota Bogor', kecamatan: 'Bogor Utara',
        desa: 'Cibuluh', rt_rw: '003/008', jenis_kelamin: 'Laki-laki', usia: 41,
        pekerjaan: 'Montir', no_telp: '081234567019', status: 'pending',
        assigned_surveyor: null, created_at: '2026-04-15T09:30:00Z', created_by: 'adm-001'
    },
    {
        id: 'resp-020', nama: 'Umi Kalsum', nik: '3271016609910020',
        alamat: 'Jl. Kedung Waringin No. 3', kabupaten: 'Kota Bogor', kecamatan: 'Tanah Sareal',
        desa: 'Kedung Waringin', rt_rw: '002/005', jenis_kelamin: 'Perempuan', usia: 35,
        pekerjaan: 'Pedagang', no_telp: '081234567020', status: 'pending',
        assigned_surveyor: null, created_at: '2026-04-15T09:35:00Z', created_by: 'adm-001'
    },
];

// ── Sample Questionnaire ──
export const QUESTIONNAIRES: Questionnaire[] = [
    {
        id: 'q-001',
        title: 'Survei Kepuasan Pelayanan Publik',
        description: 'Survei untuk mengukur tingkat kepuasan masyarakat terhadap pelayanan publik di wilayah Jawa Barat.',
        is_active: true,
        assigned_surveyors: [],
        created_at: '2026-04-10T10:00:00Z',
        created_by: 'adm-001',
        questions: [
            { id: 'q1', text: 'Bagaimana penilaian Anda terhadap pelayanan publik di daerah Anda?', type: 'radio', options: ['Sangat Baik', 'Baik', 'Cukup', 'Kurang', 'Sangat Kurang'], required: true },
            { id: 'q2', text: 'Layanan publik apa yang paling sering Anda gunakan?', type: 'checkbox', options: ['Kesehatan (Puskesmas/RS)', 'Pendidikan (Sekolah)', 'Administrasi Kependudukan', 'Keamanan (Polsek)', 'Transportasi Umum', 'Kebersihan/Sampah'], required: true },
            { id: 'q3', text: 'Berapa kali Anda menggunakan layanan publik dalam sebulan terakhir?', type: 'number', required: true },
            { id: 'q4', text: 'Apakah Anda pernah mengalami kesulitan dalam mengakses layanan publik?', type: 'radio', options: ['Ya', 'Tidak'], required: true },
            { id: 'q5', text: 'Jika ya, jelaskan kesulitan yang Anda alami:', type: 'textarea', required: false },
            { id: 'q6', text: 'Bagaimana penilaian Anda terhadap kebersihan fasilitas publik?', type: 'select', options: ['Sangat Bersih', 'Bersih', 'Cukup', 'Kotor', 'Sangat Kotor'], required: true },
            { id: 'q7', text: 'Bagaimana penilaian Anda terhadap keramahan petugas pelayanan?', type: 'radio', options: ['Sangat Ramah', 'Ramah', 'Biasa Saja', 'Kurang Ramah', 'Tidak Ramah'], required: true },
            { id: 'q8', text: 'Berapa lama rata-rata waktu tunggu pelayanan?', type: 'select', options: ['Kurang dari 15 menit', '15-30 menit', '30-60 menit', '1-2 jam', 'Lebih dari 2 jam'], required: true },
            { id: 'q9', text: 'Apakah ada infrastruktur yang menurut Anda perlu diperbaiki?', type: 'text', required: false },
            { id: 'q10', text: 'Tanggal kunjungan terakhir ke fasilitas publik:', type: 'date', required: false },
            { id: 'q11', text: 'Saran dan masukan untuk peningkatan pelayanan publik:', type: 'textarea', required: false },
            { id: 'q12', text: 'Secara keseluruhan, apakah Anda puas dengan pelayanan publik saat ini?', type: 'radio', options: ['Sangat Puas', 'Puas', 'Netral', 'Tidak Puas', 'Sangat Tidak Puas'], required: true },
        ]
    },
    {
        id: 'q-002',
        title: 'Survei Kondisi Ekonomi Rumah Tangga',
        description: 'Survei untuk memetakan kondisi ekonomi rumah tangga di wilayah survei.',
        is_active: true,
        assigned_surveyors: [],
        created_at: new Date().toISOString(),
        created_by: 'adm-001',
        questions: [
            { id: 'e1', text: 'Berapa pendapatan rata-rata keluarga per bulan?', type: 'select', options: ['Kurang dari Rp 1.000.000', 'Rp 1.000.000 - Rp 3.000.000', 'Rp 3.000.000 - Rp 5.000.000', 'Rp 5.000.000 - Rp 10.000.000', 'Lebih dari Rp 10.000.000'], required: true },
            { id: 'e2', text: 'Sumber pendapatan utama keluarga:', type: 'radio', options: ['Gaji/Upah', 'Usaha Sendiri', 'Pertanian', 'Perdagangan', 'Jasa', 'Lainnya'], required: true },
            { id: 'e3', text: 'Berapa jumlah anggota keluarga yang bekerja?', type: 'number', required: true },
            { id: 'e4', text: 'Apakah keluarga Anda menerima bantuan sosial dari pemerintah?', type: 'radio', options: ['Ya', 'Tidak'], required: true },
            { id: 'e5', text: 'Jika ya, jenis bantuan apa yang diterima?', type: 'checkbox', options: ['PKH', 'BPNT/Sembako', 'BLT', 'KIS/BPJS', 'PIP', 'Lainnya'], required: false },
            { id: 'e6', text: 'Status kepemilikan tempat tinggal:', type: 'radio', options: ['Milik Sendiri', 'Kontrak/Sewa', 'Menumpang', 'Lainnya'], required: true },
            { id: 'e7', text: 'Apakah keluarga Anda memiliki tabungan?', type: 'radio', options: ['Ya', 'Tidak'], required: true },
            { id: 'e8', text: 'Pengeluaran terbesar keluarga untuk:', type: 'radio', options: ['Makanan', 'Pendidikan', 'Kesehatan', 'Transportasi', 'Cicilan/Hutang', 'Lainnya'], required: true },
        ]
    }
];

// ── Sample Survey Responses ──
export const SURVEY_RESPONSES = [
    {
        id: 'sr-001',
        questionnaire_id: 'q-001',
        respondent_id: 'resp-003',
        surveyor_id: 'srv-001',
        answers: {
            q1: 'Baik', q2: ['Kesehatan (Puskesmas/RS)', 'Administrasi Kependudukan'],
            q3: '3', q4: 'Tidak', q5: '', q6: 'Bersih', q7: 'Ramah', q8: '15-30 menit',
            q9: 'Jalan di depan puskesmas perlu diperbaiki', q10: '2026-04-10', q11: 'Sudah cukup baik', q12: 'Puas'
        },
        location: { lat: -6.8845, lng: 107.6133 },
        photo_url: '',
        status: 'submitted' as const,
        submitted_at: '2026-04-16T14:30:00Z',
        created_at: '2026-04-16T14:00:00Z'
    },
    {
        id: 'sr-002',
        questionnaire_id: 'q-001',
        respondent_id: 'resp-007',
        surveyor_id: 'srv-001',
        answers: {
            q1: 'Cukup', q2: ['Kesehatan (Puskesmas/RS)', 'Transportasi Umum'],
            q3: '5', q4: 'Ya', q5: 'Antrian terlalu panjang di puskesmas', q6: 'Cukup',
            q7: 'Biasa Saja', q8: '1-2 jam', q9: 'Halte bus perlu renovasi', q10: '2026-04-08',
            q11: 'Perlu tambah loket pelayanan', q12: 'Netral'
        },
        location: { lat: -6.9025, lng: 107.5964 },
        photo_url: '',
        status: 'submitted' as const,
        submitted_at: '2026-04-17T10:00:00Z',
        created_at: '2026-04-17T09:30:00Z'
    }
];

// ── Sample Media Monitoring ──
export const MEDIA_MONITORING_DATA: MediaMonitoring[] = [
    {
        id: 'mm-001', title: 'Pembangunan Jalan Tol Bandung-Garut Dimulai',
        source: 'online', media_name: 'Kompas.com', url: 'https://kompas.com/example',
        content: 'Pemerintah Provinsi Jawa Barat resmi memulai pembangunan jalan tol Bandung-Garut yang diharapkan meningkatkan konektivitas antar kabupaten.',
        sentiment: 'positive', category: 'Infrastruktur', photo_url: '',
        reported_by: 'srv-001', reported_at: '2026-04-16T08:00:00Z'
    },
    {
        id: 'mm-002', title: 'Kritik Warga Terhadap Pengelolaan Sampah',
        source: 'social_media', media_name: 'Twitter/X', url: 'https://x.com/example',
        content: 'Warga Kota Bandung mengeluhkan penumpukan sampah di beberapa titik utama kota yang sudah berlangsung selama seminggu.',
        sentiment: 'negative', category: 'Lingkungan', photo_url: '',
        reported_by: 'srv-001', reported_at: '2026-04-17T10:30:00Z'
    },
    {
        id: 'mm-003', title: 'Program Vaksinasi Gratis Sukses Digelar',
        source: 'tv', media_name: 'TV One', url: '',
        content: 'Program vaksinasi gratis yang diselenggarakan Puskesmas Coblong berhasil menjangkau lebih dari 500 warga dalam satu hari.',
        sentiment: 'positive', category: 'Kesehatan', photo_url: '',
        reported_by: 'srv-002', reported_at: '2026-04-18T07:00:00Z'
    },
    {
        id: 'mm-004', title: 'Keluhan Pedagang Pasar Tradisional Soal Retribusi',
        source: 'print', media_name: 'Pikiran Rakyat', url: '',
        content: 'Pedagang pasar tradisional di Kabupaten Bandung mengeluhkan kenaikan retribusi yang dianggap memberatkan.',
        sentiment: 'negative', category: 'Ekonomi', photo_url: '',
        reported_by: 'srv-002', reported_at: '2026-04-18T09:15:00Z'
    },
];

// ── Sample Census Data ──
export const CENSUS_DATA: CensusData[] = [
    {
        id: 'cen-001', respondent_name: 'Agus Wahyudi', nik: '3273011501700001',
        tempat_lahir: 'Bandung', tanggal_lahir: '1970-01-15', jenis_kelamin: 'Laki-laki',
        alamat: 'Jl. Dago No. 100', kabupaten: 'Kota Bandung', kecamatan: 'Coblong',
        desa: 'Dago', rt_rw: '003/005', agama: 'Islam', status_perkawinan: 'Menikah',
        pendidikan_terakhir: 'S1', pekerjaan: 'PNS',
        catatan: 'Warga aktif dalam kegiatan RT', photo_url: '',
        surveyor_id: 'srv-001', collected_at: '2026-04-16T09:00:00Z'
    },
    {
        id: 'cen-002', respondent_name: 'Ratna Dewi', nik: '3273015512850002',
        tempat_lahir: 'Garut', tanggal_lahir: '1985-12-05', jenis_kelamin: 'Perempuan',
        alamat: 'Jl. Dago No. 102', kabupaten: 'Kota Bandung', kecamatan: 'Coblong',
        desa: 'Dago', rt_rw: '003/005', agama: 'Islam', status_perkawinan: 'Menikah',
        pendidikan_terakhir: 'D3', pekerjaan: 'Bidan',
        catatan: '', photo_url: '',
        surveyor_id: 'srv-001', collected_at: '2026-04-16T09:30:00Z'
    },
];

// ── Sample Aspirations ──
export const ASPIRATIONS: Aspiration[] = [
    {
        id: 'asp-001', respondent_name: 'Warga RT 003/005 Dago',
        kategori: 'infrastruktur', judul: 'Perbaikan Jalan Gang Mawar',
        deskripsi: 'Jalan Gang Mawar di RT 003 sudah rusak parah dan berlubang, menyulitkan akses kendaraan dan pejalan kaki terutama saat musim hujan.',
        lokasi: 'Gang Mawar RT 003/005, Dago', kabupaten: 'Kota Bandung',
        kecamatan: 'Coblong', desa: 'Dago', prioritas: 'tinggi',
        status: 'baru', photo_url: '',
        reported_by: 'srv-001', created_at: '2026-04-16T11:00:00Z'
    },
    {
        id: 'asp-002', respondent_name: 'Ibu-ibu PKK Lebak Siliwangi',
        kategori: 'kesehatan', judul: 'Penambahan Jadwal Posyandu',
        deskripsi: 'Warga meminta penambahan jadwal Posyandu dari 1x menjadi 2x per bulan karena jumlah balita yang meningkat.',
        lokasi: 'Posyandu Melati, Lebak Siliwangi', kabupaten: 'Kota Bandung',
        kecamatan: 'Coblong', desa: 'Lebak Siliwangi', prioritas: 'sedang',
        status: 'diproses', photo_url: '',
        reported_by: 'srv-001', created_at: '2026-04-17T08:00:00Z'
    },
    {
        id: 'asp-003', respondent_name: 'Pemuda Karang Taruna Citarum',
        kategori: 'pendidikan', judul: 'Taman Baca Masyarakat',
        deskripsi: 'Pemuda Karang Taruna mengusulkan pembangunan taman baca masyarakat untuk meningkatkan minat baca warga.',
        lokasi: 'Balai RW 004, Citarum', kabupaten: 'Kota Bandung',
        kecamatan: 'Bandung Wetan', desa: 'Citarum', prioritas: 'sedang',
        status: 'baru', photo_url: '',
        reported_by: 'srv-002', created_at: '2026-04-17T14:00:00Z'
    },
    {
        id: 'asp-004', respondent_name: 'Kelompok Tani Dayeuhkolot',
        kategori: 'ekonomi', judul: 'Bantuan Bibit dan Pupuk',
        deskripsi: 'Kelompok tani membutuhkan bantuan bibit padi unggul dan pupuk subsidi untuk musim tanam mendatang.',
        lokasi: 'Sawah Dayeuhkolot', kabupaten: 'Kabupaten Bandung',
        kecamatan: 'Dayeuhkolot', desa: 'Citeureup', prioritas: 'tinggi',
        status: 'baru', photo_url: '',
        reported_by: 'srv-002', created_at: '2026-04-18T10:00:00Z'
    },
];

// ── Helper functions ──
export function getKabupatenList(): string[] {
    return [...new Set(REGIONS.map(r => r.kabupaten))];
}

export function getKecamatanList(kabupaten: string): string[] {
    return [...new Set(REGIONS.filter(r => r.kabupaten === kabupaten).map(r => r.kecamatan))];
}

export function getDesaList(kabupaten: string, kecamatan: string): string[] {
    return [...new Set(REGIONS.filter(r => r.kabupaten === kabupaten && r.kecamatan === kecamatan).map(r => r.desa))];
}
