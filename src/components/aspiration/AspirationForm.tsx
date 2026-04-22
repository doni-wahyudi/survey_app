import { useState } from 'react';
import { useApp } from '../../store/useApp';
import { useAuth } from '../../store/useAuth';
import { useOfflineSync } from '../../store/useOfflineSync';
import { useActivityLog } from '../../store/useActivityLog';
import { capturePhoto } from '../../utils/camera';
import { ArrowLeft, Send, Camera, Loader } from 'lucide-react';
import { getKabupatenList, getKecamatanList, getDesaList } from '../../data/seedData';
import type { AspirationCategory, AspirationPriority } from '../../types';
import { submitAspiration, uploadFile, supabase } from '../../lib/supabase';

interface Props {
    onBack: () => void;
}

const CATEGORIES: { value: AspirationCategory; label: string }[] = [
    { value: 'infrastruktur', label: 'Infrastruktur' },
    { value: 'pendidikan', label: 'Pendidikan' },
    { value: 'kesehatan', label: 'Kesehatan' },
    { value: 'ekonomi', label: 'Ekonomi' },
    { value: 'sosial', label: 'Sosial' },
    { value: 'lainnya', label: 'Lainnya' },
];

const PRIORITIES: { value: AspirationPriority; label: string; color: string }[] = [
    { value: 'tinggi', label: 'Tinggi', color: 'var(--color-error)' },
    { value: 'sedang', label: 'Sedang', color: 'var(--color-warning)' },
    { value: 'rendah', label: 'Rendah', color: 'var(--color-success)' },
];

export default function AspirationForm({ onBack }: Props) {
    const { addToast } = useApp();
    const { user } = useAuth();
    const { isOnline, enqueue } = useOfflineSync();
    const { addLog } = useActivityLog();

    const [submitting, setSubmitting] = useState(false);
    const [form, setForm] = useState({
        respondent_name: '', kategori: '' as AspirationCategory, judul: '',
        deskripsi: '', lokasi: '', kabupaten: '', kecamatan: '', desa: '',
        prioritas: 'sedang' as AspirationPriority, photo_url: ''
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
        if (!form.judul || !form.kategori || !form.deskripsi) {
            addToast('Mohon lengkapi data yang diperlukan', 'error');
            return;
        }

        setSubmitting(true);
        let finalPhotoUrl = form.photo_url;

        try {
            if (form.photo_url && form.photo_url.startsWith('data:')) {
                const fileName = `aspiration/${user?.id}/${Date.now()}.jpg`;
                const uploadedUrl = await uploadFile('aspiration-photos', fileName, form.photo_url);
                if (uploadedUrl) {
                    finalPhotoUrl = uploadedUrl;
                }
            }

            const aspirationData = {
                ...form,
                photo_url: finalPhotoUrl,
                reported_by: user?.id,
                created_at: new Date().toISOString(),
                status: 'pending' as const,
            };

            if (isOnline) {
                await submitAspiration(aspirationData);
                addToast('Aspirasi berhasil dikirim!', 'success');
            } else {
                enqueue('aspiration', aspirationData);
                addToast('Data disimpan offline', 'warning');
            }

            if (user) {
                addLog(user.id, 'aspiration_added', `Aspirasi: ${form.judul}`);
            }
            onBack();
        } catch (error) {
            console.error('Error saving aspiration:', error);
            addToast('Gagal mengirim data. Masuk ke antrean offline.', 'warning');
            enqueue('aspiration', { ...form, photo_url: finalPhotoUrl, reported_by: user?.id, created_at: new Date().toISOString(), status: 'pending' as const });
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
                <h2 style={{ fontSize: 'var(--font-size-md)', fontWeight: 700 }}>Tambah Aspirasi/Aduan</h2>
            </div>

            <div className="form-group">
                <label className="form-label">Judul <span className="required">*</span></label>
                <input className="form-input" placeholder="Singkat dan jelas" value={form.judul} onChange={(e) => handleChange('judul', e.target.value)} />
            </div>

            <div className="form-group">
                <label className="form-label">Kategori <span className="required">*</span></label>
                <div className="filter-pills" style={{ flexWrap: 'wrap' }}>
                    {CATEGORIES.map(c => (
                        <button key={c.value} className={`filter-pill ${form.kategori === c.value ? 'active' : ''}`} onClick={() => handleChange('kategori', c.value)}>
                            {c.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="form-group">
                <label className="form-label">Deskripsi <span className="required">*</span></label>
                <textarea className="form-textarea" placeholder="Jelaskan detail aduan atau usulan..." value={form.deskripsi} onChange={(e) => handleChange('deskripsi', e.target.value)} rows={4} />
            </div>

            <div className="form-group">
                <label className="form-label">Nama Pelapor (Opsional)</label>
                <input className="form-input" placeholder="Boleh dikosongkan (anonim)" value={form.respondent_name} onChange={(e) => handleChange('respondent_name', e.target.value)} />
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
            
            <div className="form-group" style={{ marginTop: 'var(--space-md)' }}>
                <label className="form-label">Detail Lokasi</label>
                <input className="form-input" placeholder="Nama jalan, patokan, dll" value={form.lokasi} onChange={(e) => handleChange('lokasi', e.target.value)} />
            </div>

            <div className="form-group">
                <label className="form-label">Tingkat Prioritas</label>
                <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                    {PRIORITIES.map(p => (
                        <div
                            key={p.value}
                            className={`radio-option ${form.prioritas === p.value ? 'selected' : ''}`}
                            onClick={() => handleChange('prioritas', p.value)}
                            style={{ flex: 1, justifyContent: 'center', borderColor: form.prioritas === p.value ? p.color : undefined }}
                        >
                            <span>{p.label}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Photo */}
            <div className="card" style={{ textAlign: 'center', marginBottom: 'var(--space-lg)' }}>
                <p style={{ fontSize: 'var(--font-size-sm)', marginBottom: 'var(--space-sm)', color: 'var(--color-text-secondary)' }}>Foto Bukti (Opsional)</p>
                {form.photo_url && (
                    <img src={form.photo_url} alt="Bukti" style={{ width: '100%', borderRadius: 'var(--radius-md)', maxHeight: 180, objectFit: 'cover', marginBottom: 'var(--space-sm)' }} />
                )}
                <button className="btn btn-secondary btn-sm" onClick={handlePhoto}><Camera size={14} /> {form.photo_url ? 'Ganti' : 'Ambil'} Foto</button>
            </div>

            <button className="btn btn-primary btn-lg btn-block" onClick={handleSubmit} disabled={submitting} style={{ marginBottom: 'var(--space-xl)' }}>
                {submitting ? <Loader size={18} className="spin-animation" /> : <Send size={16} />}
                {submitting ? ' Mengirim...' : ' Kirim Aspirasi'}
            </button>
        </div>
    );
}
