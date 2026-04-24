-- ==========================================
-- DUMMY DATA FOR MEDIA MONITORING (CIK UJANG)
-- Focus: Sumatera Selatan, Lahat
-- Sentiment: Positive and Neutral Only
-- ==========================================

-- Insert 3 Online News
INSERT INTO public.media_monitoring (title, source, media_name, url, content, sentiment, priority, category, reported_at)
VALUES 
('Cik Ujang Tinjau Pembangunan Infrastruktur Jalan di Lahat', 'online', 'Sumeks.co', 'https://sumeks.co/news1', 'Bupati Lahat Cik Ujang melakukan peninjauan langsung ke lokasi pembangunan jalan lintas kabupaten untuk memastikan kualitas pengerjaan.', 'positive', 'medium', 'Automated', NOW() - INTERVAL '1 hour'),
('Program Sekolah Gratis Cik Ujang Tuai Apresiasi Warga Sumsel', 'online', 'Tribun Sumsel', 'https://tribun.id/news2', 'Warga Sumatera Selatan memberikan apresiasi tinggi terhadap komitmen Cik Ujang dalam mempertahankan program pendidikan gratis.', 'positive', 'high', 'Automated', NOW() - INTERVAL '3 hours'),
('Cik Ujang Hadiri Rapat Koordinasi Wilayah di Palembang', 'online', 'Detik Sumsel', 'https://detik.com/news3', 'Cik Ujang terlihat hadir dalam rapat koordinasi rutin bersama jajaran pimpinan daerah Sumatera Selatan lainnya.', 'neutral', 'medium', 'Automated', NOW() - INTERVAL '5 hours');

-- Insert 3 Print (Cetak) News
INSERT INTO public.media_monitoring (title, source, media_name, url, content, sentiment, priority, category, reported_at)
VALUES 
('Cik Ujang: Fokus Kami Adalah Kesejahteraan Petani Kopi', 'print', 'Sriwijaya Post', 'https://sripo.com/news4', 'Dalam wawancara eksklusif, Cik Ujang menegaskan prioritas anggaran untuk bantuan bibit dan pupuk bagi petani di Sumsel.', 'positive', 'medium', 'Automated', NOW() - INTERVAL '1 day'),
('Agenda Kerja Bupati Cik Ujang Pekan Depan', 'print', 'Palembang Pos', 'https://palpos.id/news5', 'Daftar rencana kunjungan kerja Bupati Cik Ujang ke beberapa kecamatan di wilayah perbatasan.', 'neutral', 'low', 'Automated', NOW() - INTERVAL '1 day'),
('Cik Ujang Raih Penghargaan Pembangunan Daerah Terbaik', 'print', 'Rakyat Merdeka', 'https://rm.id/news6', 'Prestasi gemilang diraih Cik Ujang atas keberhasilannya mengelola dana desa dengan transparansi tinggi.', 'positive', 'high', 'Automated', NOW() - INTERVAL '2 days');

-- Insert 3 TV News
INSERT INTO public.media_monitoring (title, source, media_name, url, content, sentiment, priority, category, reported_at)
VALUES 
('[LIVE] Peresmian Jembatan Baru oleh Bupati Cik Ujang', 'tv', 'TVRI Sumsel', 'https://tvri.go.id/news7', 'Liputan langsung peresmian jembatan penghubung desa yang telah dinantikan warga selama 10 tahun.', 'positive', 'high', 'Automated', NOW() - INTERVAL '6 hours'),
('Profil Pemimpin: Dedikasi Cik Ujang Membangun Desa', 'tv', 'PALTV', 'https://paltv.co.id/news8', 'Feature khusus mengenai perjalanan karir dan kontribusi Cik Ujang untuk kemajuan Sumatera Selatan.', 'positive', 'medium', 'Automated', NOW() - INTERVAL '12 hours'),
('Laporan Cuaca: Cik Ujang Himbau Warga Waspada Banjir', 'tv', 'iNews Sumsel', 'https://inews.id/news9', 'Bupati memberikan pernyataan resmi mengenai kesiapsiagaan bencana di wilayah rawan longsor.', 'neutral', 'medium', 'Automated', NOW() - INTERVAL '18 hours');

-- Insert 3 Radio News
INSERT INTO public.media_monitoring (title, source, media_name, url, content, sentiment, priority, category, reported_at)
VALUES 
('Wawancara Udara: Strategi Ekonomi Kreatif Ala Cik Ujang', 'radio', 'RRI Palembang', 'https://rri.co.id/news10', 'Cik Ujang menjelaskan pentingnya digitalisasi bagi UMKM di Sumatera Selatan dalam talkshow pagi.', 'positive', 'medium', 'Automated', NOW() - INTERVAL '2 hours'),
('Info Lalin: Pengawalan Rombongan Bupati Cik Ujang', 'radio', 'Sonora FM', 'https://sonora.id/news11', 'Informasi terkini mengenai arus lalu lintas saat rombongan bupati menuju lokasi peninjauan pasar.', 'neutral', 'low', 'Automated', NOW() - INTERVAL '4 hours'),
('Cik Ujang Salurkan Bantuan Alat Pertanian di Lahat', 'radio', 'Elshinta', 'https://elshinta.com/news12', 'Penyaluran traktor dan alat mesin pertanian secara simbolis oleh Cik Ujang kepada kelompok tani.', 'positive', 'medium', 'Automated', NOW() - INTERVAL '7 hours');

-- Insert 3 Social Media News
INSERT INTO public.media_monitoring (title, source, media_name, url, content, sentiment, priority, category, reported_at)
VALUES 
('Viral: Momen Akrab Cik Ujang Makan Siang Bersama Petani', 'social_media', 'Instagram', 'https://instagr.am/p/news13', 'Video singkat yang memperlihatkan kesederhanaan Cik Ujang saat berdialog santai dengan warga di pematang sawah.', 'positive', 'medium', 'Automated', NOW() - INTERVAL '30 minutes'),
('Trending: Netizen Puji Respon Cik Ujang Soal Jalan Rusak', 'social_media', 'Facebook', 'https://fb.com/news14', 'Postingan warga mengenai perbaikan jalan yang langsung dikerjakan setelah dilaporkan lewat media sosial bupati.', 'positive', 'high', 'Automated', NOW() - INTERVAL '2 hours'),
('Update: Cik Ujang Menghadiri Acara Pernikahan Warga', 'social_media', 'X', 'https://x.com/news15', 'Foto-foto kehadiran Cik Ujang di acara hajatan salah satu tokoh masyarakat di Sumatera Selatan.', 'neutral', 'low', 'Automated', NOW() - INTERVAL '4 hours');
