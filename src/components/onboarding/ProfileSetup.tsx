import { useState } from 'react';
import { useAuth } from '../../store/useAuth';
import { useApp } from '../../store/useApp';
import { capturePhoto } from '../../utils/camera';
import { Camera, UserCircle, Check, Loader } from 'lucide-react';
import { uploadFile } from '../../lib/supabase';

export default function ProfileSetup() {
    const { user, updateProfile, setOnboarded } = useAuth();
    const { addToast } = useApp();

    const [form, setForm] = useState({
        full_name: user?.full_name || '',
        nik: user?.nik || '',
        tempat_lahir: user?.tempat_lahir || '',
        tanggal_lahir: user?.tanggal_lahir || '',
        jenis_kelamin: user?.jenis_kelamin || '',
        alamat: user?.alamat || '',
        rt_rw: user?.rt_rw || '',
        kelurahan_desa: user?.kelurahan_desa || '',
        kecamatan: user?.kecamatan || '',
        kabupaten: user?.kabupaten || '',
        agama: user?.agama || '',
        status_perkawinan: user?.status_perkawinan || '',
        pekerjaan: user?.pekerjaan || '',
    });

    const [profilePhoto, setProfilePhoto] = useState<string>(user?.profile_photo_url || '');
    const [uploading, setUploading] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const handleChange = (field: string, value: string) => {
        setForm(prev => ({ ...prev, [field]: value }));
        if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
    };

    const handleProfilePhoto = async () => {
        const photo = await capturePhoto();
        if (photo) {
            setProfilePhoto(photo);
            addToast('Foto profil berhasil diambil', 'success');
        }
    };

    const validate = (): boolean => {
        const newErrors: Record<string, string> = {};
        if (!form.full_name.trim()) newErrors.full_name = 'Nama lengkap wajib diisi';
        if (!form.nik.trim()) newErrors.nik = 'NIK wajib diisi';
        else if (form.nik.length !== 16) newErrors.nik = 'NIK harus 16 digit';
        if (!form.jenis_kelamin) newErrors.jenis_kelamin = 'Jenis kelamin wajib dipilih';
        setErrors(newErrors);
        if (!profilePhoto) {
            addToast('Foto profil disarankan untuk diambil', 'warning');
        }
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validate()) {
            addToast('Mohon lengkapi data yang diperlukan', 'error');
            return;
        }

        setUploading(true);
        let finalPhotoUrl = profilePhoto;

        try {
            if (profilePhoto && profilePhoto.startsWith('data:')) {
                const fileName = `profile/${user?.id || Date.now()}/${Date.now()}.jpg`;
                const uploadedUrl = await uploadFile('profile-photos', fileName, profilePhoto);
                if (uploadedUrl) {
                    finalPhotoUrl = uploadedUrl;
                } else {
                    addToast('Gagal mengunggah foto profil', 'error');
                    setUploading(false);
                    return;
                }
            }

            await updateProfile({
                ...form,
                profile_photo_url: finalPhotoUrl,
            });
            await setOnboarded();
            addToast('Profil berhasil disimpan!', 'success');
        } catch (error) {
            console.error('Error saving profile:', error);
            addToast('Terjadi kesalahan saat menyimpan profil', 'error');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="onboarding-page">
            <div className="onboarding-progress">
                <div className="step completed" />
                <div className="step active" />
            </div>

            <div className="onboarding-header">
                <h2>Data Diri</h2>
                <p>Lengkapi data diri Anda. Data dengan tanda <span style={{ color: 'var(--color-error)' }}>*</span> wajib diisi.</p>
            </div>

            <div className="onboarding-content">
                {/* Profile Photo */}
                <div
                    className={`profile-photo-capture ${profilePhoto ? 'has-image' : ''}`}
                    onClick={handleProfilePhoto}
                >
                    {profilePhoto ? (
                        <img src={profilePhoto} alt="Profile" />
                    ) : (
                        <div style={{ textAlign: 'center', color: 'var(--color-text-tertiary)' }}>
                            <Camera size={28} style={{ marginBottom: 4 }} />
                            <div style={{ fontSize: 'var(--font-size-xs)' }}>Foto Profil</div>
                        </div>
                    )}
                </div>
                {errors.profile_photo && (
                    <p className="form-error" style={{ textAlign: 'center', marginTop: -8, marginBottom: 16 }}>
                        {errors.profile_photo}
                    </p>
                )}

                {/* Form Fields */}
                <div className="form-group">
                    <label className="form-label">Nama Lengkap <span className="required">*</span></label>
                    <input
                        className="form-input"
                        placeholder="Nama sesuai KTP"
                        value={form.full_name}
                        onChange={(e) => handleChange('full_name', e.target.value)}
                    />
                    {errors.full_name && <p className="form-error">{errors.full_name}</p>}
                </div>

                <div className="form-group">
                    <label className="form-label">NIK <span className="required">*</span></label>
                    <input
                        className="form-input"
                        placeholder="16 digit NIK"
                        value={form.nik}
                        onChange={(e) => handleChange('nik', e.target.value.replace(/\D/g, '').slice(0, 16))}
                        inputMode="numeric"
                    />
                    {errors.nik && <p className="form-error">{errors.nik}</p>}
                </div>

                <div className="form-row">
                    <div className="form-group">
                        <label className="form-label">Tempat Lahir</label>
                        <input
                            className="form-input"
                            placeholder="Kota/Kabupaten"
                            value={form.tempat_lahir}
                            onChange={(e) => handleChange('tempat_lahir', e.target.value)}
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Tanggal Lahir</label>
                        <input
                            type="date"
                            className="form-input"
                            value={form.tanggal_lahir}
                            onChange={(e) => handleChange('tanggal_lahir', e.target.value)}
                        />
                    </div>
                </div>

                <div className="form-group">
                    <label className="form-label">Jenis Kelamin <span className="required">*</span></label>
                    <div className="radio-group" style={{ flexDirection: 'row' }}>
                        {['Laki-laki', 'Perempuan'].map(opt => (
                            <div
                                key={opt}
                                className={`radio-option ${form.jenis_kelamin === opt ? 'selected' : ''}`}
                                onClick={() => handleChange('jenis_kelamin', opt)}
                                style={{ flex: 1 }}
                            >
                                <div className="radio-dot" />
                                <span>{opt}</span>
                            </div>
                        ))}
                    </div>
                    {errors.jenis_kelamin && <p className="form-error">{errors.jenis_kelamin}</p>}
                </div>

                <div className="form-group">
                    <label className="form-label">Alamat</label>
                    <textarea
                        className="form-textarea"
                        placeholder="Alamat lengkap"
                        value={form.alamat}
                        onChange={(e) => handleChange('alamat', e.target.value)}
                        rows={2}
                    />
                </div>

                <div className="form-row">
                    <div className="form-group">
                        <label className="form-label">RT/RW</label>
                        <input
                            className="form-input"
                            placeholder="001/001"
                            value={form.rt_rw}
                            onChange={(e) => handleChange('rt_rw', e.target.value)}
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Kelurahan/Desa</label>
                        <input
                            className="form-input"
                            placeholder="Kelurahan/Desa"
                            value={form.kelurahan_desa}
                            onChange={(e) => handleChange('kelurahan_desa', e.target.value)}
                        />
                    </div>
                </div>

                <div className="form-row">
                    <div className="form-group">
                        <label className="form-label">Kecamatan</label>
                        <input
                            className="form-input"
                            placeholder="Kecamatan"
                            value={form.kecamatan}
                            onChange={(e) => handleChange('kecamatan', e.target.value)}
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Kabupaten/Kota</label>
                        <input
                            className="form-input"
                            placeholder="Kabupaten/Kota"
                            value={form.kabupaten}
                            onChange={(e) => handleChange('kabupaten', e.target.value)}
                        />
                    </div>
                </div>

                <div className="form-row">
                    <div className="form-group">
                        <label className="form-label">Agama</label>
                        <select className="form-select" value={form.agama} onChange={(e) => handleChange('agama', e.target.value)}>
                            <option value="">Pilih Agama</option>
                            {['Islam', 'Kristen', 'Katolik', 'Hindu', 'Budha', 'Konghucu'].map(a => (
                                <option key={a} value={a}>{a}</option>
                            ))}
                        </select>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Status</label>
                        <select className="form-select" value={form.status_perkawinan} onChange={(e) => handleChange('status_perkawinan', e.target.value)}>
                            <option value="">Pilih Status</option>
                            {['Belum Menikah', 'Menikah', 'Cerai Hidup', 'Cerai Mati'].map(s => (
                                <option key={s} value={s}>{s}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="form-group">
                    <label className="form-label">Pekerjaan</label>
                    <input
                        className="form-input"
                        placeholder="Pekerjaan Anda"
                        value={form.pekerjaan}
                        onChange={(e) => handleChange('pekerjaan', e.target.value)}
                    />
                </div>
            </div>

            <div className="onboarding-actions">
                <button
                    className="btn btn-primary btn-lg btn-block"
                    onClick={handleSubmit}
                    disabled={uploading}
                >
                    {uploading ? <Loader size={18} className="spin-animation" /> : <Check size={18} />}
                    {uploading ? ' Menyimpan...' : ' Simpan & Mulai'}
                </button>
            </div>
        </div>
    );
}
