-- ==========================================
-- DUMMY DATA FOR SENSUS (CENSUS)
-- Focus: Lahat, Sumatera Selatan
-- ==========================================

INSERT INTO public.census_data (
    respondent_name, nik, tempat_lahir, tanggal_lahir, jenis_kelamin, 
    alamat, provinsi, kabupaten, kecamatan, desa, rt_rw, 
    agama, status_perkawinan, pendidikan_terakhir, pekerjaan, 
    family_head_name, voter_potential, collected_at
)
VALUES 
('Ahmad Junaidi', '1604011205850001', 'Lahat', '1985-05-12', 'Laki-laki', 'Jl. Merdeka No. 12', 'Sumatera Selatan', 'Lahat', 'Lahat', 'Pasar Baru', '001/002', 'Islam', 'Menikah', 'SMA/SMK', 'Petani', 'Ahmad Junaidi', 'loyal', NOW() - INTERVAL '2 days'),
('Siti Aminah', '1604014408920002', 'Lahat', '1992-08-04', 'Perempuan', 'Dusun III RT 05', 'Sumatera Selatan', 'Lahat', 'Kikim Timur', 'Bungamas', '005/003', 'Islam', 'Menikah', 'SMP', 'Ibu Rumah Tangga', 'Bambang Irawan', 'swing', NOW() - INTERVAL '3 days'),
('Budi Santoso', '1604011501700003', 'Palembang', '1970-01-15', 'Laki-laki', 'Jl. Melati Blok C', 'Sumatera Selatan', 'Lahat', 'Lahat', 'Bandar Jaya', '012/004', 'Islam', 'Menikah', 'S1', 'PNS', 'Budi Santoso', 'loyal', NOW() - INTERVAL '1 day'),
('Hendra Wijaya', '1604012209980004', 'Lahat', '1998-09-22', 'Laki-laki', 'Simpang Tiga Lahat', 'Sumatera Selatan', 'Lahat', 'Merapi Barat', 'Lebuay Bandung', '002/001', 'Islam', 'Belum Menikah', 'SMA/SMK', 'Wiraswasta', 'Supardi', 'swing', NOW() - INTERVAL '4 days'),
('Lestari Putri', '1604016111880005', 'Muaradua', '1988-11-21', 'Perempuan', 'Jl. Veteran No. 45', 'Sumatera Selatan', 'Lahat', 'Lahat', 'Kota Jaya', '003/003', 'Islam', 'Cerai Hidup', 'D1/D2/D3', 'Pedagang', 'Lestari Putri', 'opposition', NOW() - INTERVAL '5 days'),
('Rizky Pratama', '1604010503950006', 'Lahat', '1995-03-05', 'Laki-laki', 'Dusun II', 'Sumatera Selatan', 'Lahat', 'Kikim Barat', 'Suka Merindu', '002/002', 'Islam', 'Menikah', 'SMA/SMK', 'Buruh', 'Rizky Pratama', 'loyal', NOW() - INTERVAL '12 hours'),
('Dewi Sartika', '1604015512820007', 'Palembang', '1982-12-15', 'Perempuan', 'Jl. Sudirman Gg. Damai', 'Sumatera Selatan', 'Lahat', 'Lahat', 'Pasar Lama', '008/001', 'Islam', 'Menikah', 'S1', 'Guru', 'Mulyadi', 'loyal', NOW() - INTERVAL '1 day'),
('Fajar Ramadhan', '1604011210010008', 'Lahat', '2001-10-12', 'Laki-laki', 'Kecamatan Jarai', 'Sumatera Selatan', 'Lahat', 'Jarai', 'Jarai', '001/001', 'Islam', 'Belum Menikah', 'S1', 'Mahasiswa', 'Zulkifli', 'swing', NOW() - INTERVAL '2 days'),
('Nurhaliza', '1604016506750009', 'Lahat', '1975-06-25', 'Perempuan', 'Jl. Pahlawan', 'Sumatera Selatan', 'Lahat', 'Lahat', 'Sukaratu', '004/002', 'Islam', 'Cerai Mati', 'SD', 'Buruh Tani', 'Nurhaliza', 'loyal', NOW() - INTERVAL '6 hours'),
('Agus Setiawan', '1604011802900010', 'Lahat', '1990-02-18', 'Laki-laki', 'Jl. Kolonel Berlian', 'Sumatera Selatan', 'Lahat', 'Lahat', 'Pasar Baru', '002/002', 'Islam', 'Menikah', 'SMA/SMK', 'Sopir', 'Agus Setiawan', 'swing', NOW() - INTERVAL '3 hours');
