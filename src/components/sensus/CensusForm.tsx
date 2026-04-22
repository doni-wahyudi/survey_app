import { useState } from 'react';
import { useApp } from '../../store/useApp';
import { useAuth } from '../../store/useAuth';
import { useOfflineSync } from '../../store/useOfflineSync';
import { useActivityLog } from '../../store/useActivityLog';
import { capturePhoto } from '../../utils/camera';
import { ArrowLeft, Send, Camera, Loader } from 'lucide-react';
import { getKabupatenList, getKecamatanList, getDesaList } from '../../data/seedData';
import { submitCensus, uploadFile } from '../../lib/supabase';

interface Props {
    onBack: () => void;
}

export default function CensusForm({ onBack }: Props) {
    const { addToast } = useApp();
    const { user } = useAuth();
    const { isOnline, enqueue } = useOfflineSync();
    const { addLog } = useActivityLog();
    
    const [submitting, setSubmitting] = useState(false);
    const [form, setForm] = useState({
        respondent_name: '', nik: '', tempat_lahir: '', tanggal_lahir: '',
        jenis_kelamin: '', alamat: '', kabupaten: '', kecamatan: '', desa: '',
        rt_rw: '', agama: '', status_perkawinan: '', pendidikan_terakhir: '',
        pekerjaan: '', catatan: '', photo_url: '',
    });

    const kabupatenList = getKabupatenList();
    const kecamatanList = form.kabupaten ? getKecamatanList(form.kabupaten) : [];
    const desaList = form.kabupaten && form.kecamatan ? getDesaList(form.kabupaten, form.kecamatan) : [];

    const handleChange = (field: string, value: string) => {
        setForm(prev => {
            const update: Record<string, string> = { [field]: value };
            if (field === 'kabupaten') { update.kecamatan = ''; update.desa = ''; }
            if (field === 'kecamatan') { update.desa = ''; }
            return { ...prev, ...update };
        });
    };

    const handlePhoto = async () => {
        const p = await capturePhoto();
        if (p) {
            setForm(prev => ({ ...prev, photo_url: p }));
            addToast('Foto berhasil diambil', 'success');
        }
    };

    const handleSubmit = async () => {
        if (!form.respondent_name || !form.nik || !form.jenis_kelamin) {
            addToast('Mohon lengkapi data wajib', 'error');
            return;
        }

        setSubmitting(true);
        let finalPhotoUrl = form.photo_url;

        try {
            // Upload photo if it's a local base64 string
            if (form.photo_url && form.photo_url.startsWith('data:')) {
                const fileName = `census/${user?.id}/${Date.now()}.jpg`;
                const uploadedUrl = await uploadFile('census-photos', fileName, form.photo_url);
                if (uploadedUrl) {
                    finalPhotoUrl = uploadedUrl;
                }
            }

            const censusData = {
                ...form,
                photo_url: finalPhotoUrl,
                surveyor_id: user?.id,
                collected_at: new Date().toISOString(),
            };

            if (isOnline) {
                await submitCensus(censusData);
                addToast('Data sensus berhasil disimpan!', 'success');
            } else {
                enqueue('census', censusData);
                addToast('Data disimpan offline', 'warning');
            }

            if (user) {
                addLog(user.id, 'census_added', `Sensus warga: ${form.respondent_name}`);
            }
            onBack();
        } catch (error) {
            console.error('Error saving census:', error);
            addToast('Gagal menyimpan data. Masuk ke antrean offline.', 'warning');
            enqueue('census', { ...form, surveyor_id: user?.id, collected_at: new Date().toISOString() });
            onBack();
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="page-enter">
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 'var(--space-lg)' }}>
                <button className="btn btn-icon btn-ghost" onClick={onBack}>
                    <ArrowLeft size={20} />
                </button>
                <h2 style={{ fontSize: 'var(--font-size-md)', fontWeight: 700 }}>Input Data Sensus</h2>
            </div>

            {/* Photo */}
            <div className="profile-photo-capture" onClick={handlePhoto} style={{ marginBottom: 'var(--space-lg)' }}>
                {form.photo_url ? (
                    <img src={form.photo_url} alt="Foto Warga" />
                ) : (
                    <div style={{ textAlign: 'center', color: 'var(--color-text-tertiary)' }}>
                        <Camera size={24} />
                        <div style={{ fontSize: 'var(--font-size-xs)', marginTop: 4 }}>Foto</div>
                    </div>
                )}
            </div>

            <div className="form-group">
                <label className="form-label">Nama Lengkap <span className="required">*</span></label>
                <input className="form-input" placeholder="Nama sesuai KTP" value={form.respondent_name} onChange={(e) => handleChange('respondent_name', e.target.value)} />
            </div>

            <div className="form-group">
                <label className="form-label">NIK <span className="required">*</span></label>
                <input className="form-input" placeholder="16 digit NIK" value={form.nik} onChange={(e) => handleChange('nik', e.target.value.replace(/\D/g, '').slice(0, 16))} inputMode="numeric" />
            </div>

            <div className="form-row">
                <div className="form-group">
                    <label className="form-label">Tempat Lahir</label>
                    <input className="form-input" placeholder="Kota" value={form.tempat_lahir} onChange={(e) => handleChange('tempat_lahir', e.target.value)} />
                </div>
                <div className="form-group">
                    <label className="form-label">Tanggal Lahir</label>
                    <input type="date" className="form-input" value={form.tanggal_lahir} onChange={(e) => handleChange('tanggal_lahir', e.target.value)} />
                </div>
            </div>

            <div className="form-group">
                <label className="form-label">Jenis Kelamin <span className="required">*</span></label>
                <div className="radio-group" style={{ flexDirection: 'row' }}>
                    {['Laki-laki', 'Perempuan'].map(opt => (
                        <div key={opt} className={`radio-option ${form.jenis_kelamin === opt ? 'selected' : ''}`} onClick={() => handleChange('jenis_kelamin', opt)} style={{ flex: 1 }}>
                            <div className="radio-dot" /><span>{opt}</span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="form-group">
                <label className="form-label">Alamat</label>
                <textarea className="form-textarea" placeholder="Alamat lengkap" value={form.alamat} onChange={(e) => handleChange('alamat', e.target.value)} rows={2} />
            </div>

            <div className="form-group">
                <label className="form-label">RT/RW</label>
                <input className="form-input" placeholder="001/001" value={form.rt_rw} onChange={(e) => handleChange('rt_rw', e.target.value)} />
            </div>

            {/* Cascading Region */}
            <div className="cascading-selects">
                <div className="form-group">
                    <label className="form-label">Kabupaten/Kota</label>
                    <select className="form-select" value={form.kabupaten} onChange={(e) => handleChange('kabupaten', e.target.value)}>
                        <option value="">Pilih Kabupaten</option>
                        {kabupatenList.map(k => <option key={k} value={k}>{k}</option>)}
                    </select>
                </div>
                <div className="form-group">
                    <label className="form-label">Kecamatan</label>
                    <select className="form-select" value={form.kecamatan} onChange={(e) => handleChange('kecamatan', e.target.value)} disabled={!form.kabupaten}>
                        <option value="">Pilih Kecamatan</option>
                        {kecamatanList.map(k => <option key={k} value={k}>{k}</option>)}
                    </select>
                </div>
                <div className="form-group">
                    <label className="form-label">Desa/Kelurahan</label>
                    <select className="form-select" value={form.desa} onChange={(e) => handleChange('desa', e.target.value)} disabled={!form.kecamatan}>
                        <option value="">Pilih Desa</option>
                        {desaList.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                </div>
            </div>

            <div className="form-row" style={{ marginTop: 'var(--space-md)' }}>
                <div className="form-group">
                    <label className="form-label">Agama</label>
                    <select className="form-select" value={form.agama} onChange={(e) => handleChange('agama', e.target.value)}>
                        <option value="">Pilih</option>
                        {['Islam', 'Kristen', 'Katolik', 'Hindu', 'Budha', 'Konghucu'].map(a => <option key={a} value={a}>{a}</option>)}
                    </select>
                </div>
                <div className="form-group">
                    <label className="form-label">Status</label>
                    <select className="form-select" value={form.status_perkawinan} onChange={(e) => handleChange('status_perkawinan', e.target.value)}>
                        <option value="">Pilih</option>
                        {['Belum Menikah', 'Menikah', 'Cerai Hidup', 'Cerai Mati'].map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>
            </div>

            <div className="form-row">
                <div className="form-group">
                    <label className="form-label">Pendidikan</label>
                    <select className="form-select" value={form.pendidikan_terakhir} onChange={(e) => handleChange('pendidikan_terakhir', e.target.value)}>
                        <option value="">Pilih</option>
                        {['Tidak Sekolah', 'SD', 'SMP', 'SMA/SMK', 'D1/D2/D3', 'S1', 'S2', 'S3'].map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                </div>
                <div className="form-group">
                    <label className="form-label">Pekerjaan</label>
                    <input className="form-input" placeholder="Pekerjaan" value={form.pekerjaan} onChange={(e) => handleChange('pekerjaan', e.target.value)} />
                </div>
            </div>

            <div className="form-group">
                <label className="form-label">Catatan</label>
                <textarea className="form-textarea" placeholder="Catatan tambahan..." value={form.catatan} onChange={(e) => handleChange('catatan', e.target.value)} rows={2} />
            </div>

            <button className="btn btn-primary btn-lg btn-block" onClick={handleSubmit} disabled={submitting} style={{ marginTop: 'var(--space-md)', marginBottom: 'var(--space-xl)' }}>
                {submitting ? <Loader size={18} className="spin-animation" /> : <Send size={16} />}
                {submitting ? ' Menyimpan...' : ' Simpan Data'}
            </button>
        </div>
    );
}
