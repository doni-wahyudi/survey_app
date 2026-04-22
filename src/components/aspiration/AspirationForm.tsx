import { useState, useEffect } from 'react';
import { useApp } from '../../store/useApp';
import { useAuth } from '../../store/useAuth';
import { useOfflineSync } from '../../store/useOfflineSync';
import { useActivityLog } from '../../store/useActivityLog';
import { capturePhoto } from '../../utils/camera';
import { ArrowLeft, Send, Camera, Loader } from 'lucide-react';
import { fetchProvinsi, fetchKabupaten, fetchKecamatan, fetchDesa, type Region } from '../../data/indonesiaData';
import type { AspirationCategory, AspirationPriority } from '../../types';
import { submitAspiration, uploadFile } from '../../lib/supabase';

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
        deskripsi: '', lokasi: '', provinsi: user?.provinsi || '', kabupaten: '', kecamatan: '', desa: '',
        prioritas: 'sedang' as AspirationPriority, photo_url: ''
    });

    // Region lists
    const [provList, setProvList] = useState<Region[]>([]);
    const [kabList, setKabList] = useState<Region[]>([]);
    const [kecList, setKecList] = useState<Region[]>([]);
    const [desaList, setDesaList] = useState<Region[]>([]);

    useEffect(() => {
        loadInitialRegions();
    }, []);

    const loadInitialRegions = async () => {
        const provs = await fetchProvinsi();
        setProvList(provs);
    };

    // Region Effects
    useEffect(() => {
        if (form.provinsi) {
            const pId = provList.find(p => p.name === form.provinsi)?.id;
            if (pId) fetchKabupaten(pId).then(setKabList);
        } else {
            setKabList([]);
        }
    }, [form.provinsi, provList]);

    useEffect(() => {
        if (form.kabupaten) {
            const kId = kabList.find(k => k.name === form.kabupaten)?.id;
            if (kId) fetchKecamatan(kId).then(setKecList);
        } else {
            setKecList([]);
        }
    }, [form.kabupaten, kabList]);

    useEffect(() => {
        if (form.kecamatan) {
            const kId = kecList.find(k => k.name === form.kecamatan)?.id;
            if (kId) fetchDesa(kId).then(setDesaList);
        } else {
            setDesaList([]);
        }
    }, [form.kecamatan, kecList]);

    const handleChange = (field: string, value: string) => {
        setForm(prev => {
            const update: any = { [field]: value };
            if (field === 'provinsi') { update.kabupaten = ''; update.kecamatan = ''; update.desa = ''; }
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
                if (uploadedUrl) finalPhotoUrl = uploadedUrl;
            }

            const aspirationData = {
                ...form,
                photo_url: finalPhotoUrl,
                reported_by: user?.id || '',
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
            onBack();
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="page-enter">
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 'var(--space-lg)' }}>
                <button className="btn btn-icon btn-ghost" onClick={onBack}><ArrowLeft size={20} /></button>
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
                        <button key={c.value} className={`filter-pill ${form.kategori === c.value ? 'active' : ''}`} onClick={() => handleChange('kategori', c.value)}>{c.label}</button>
                    ))}
                </div>
            </div>

            <div className="form-group">
                <label className="form-label">Deskripsi <span className="required">*</span></label>
                <textarea className="form-textarea" placeholder="Jelaskan detail aduan atau usulan..." value={form.deskripsi} onChange={(e) => handleChange('deskripsi', e.target.value)} rows={4} />
            </div>

            <div className="card" style={{ padding: '12px', background: 'var(--color-background-alt)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-md)' }}>
                <div style={{ fontSize: '10px', fontWeight: 800, color: 'var(--color-primary)', marginBottom: 8 }}>WILAYAH ADUAN</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <select className="form-select form-select-sm" value={form.provinsi} onChange={(e) => handleChange('provinsi', e.target.value)}>
                        <option value="">Provinsi</option>
                        {provList.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                    </select>
                    <select className="form-select form-select-sm" value={form.kabupaten} onChange={(e) => handleChange('kabupaten', e.target.value)} disabled={!form.provinsi}>
                        <option value="">Kabupaten</option>
                        {kabList.map((k: Region) => <option key={k.id} value={k.name}>{k.name}</option>)}
                    </select>
                    <select className="form-select form-select-sm" value={form.kecamatan} onChange={(e) => handleChange('kecamatan', e.target.value)} disabled={!form.kabupaten}>
                        <option value="">Kecamatan</option>
                        {kecList.map((k: Region) => <option key={k.id} value={k.name}>{k.name}</option>)}
                    </select>
                    <select className="form-select form-select-sm" value={form.desa} onChange={(e) => handleChange('desa', e.target.value)} disabled={!form.kecamatan}>
                        <option value="">Desa</option>
                        {desaList.map((d: Region) => <option key={d.id} value={d.name}>{d.name}</option>)}
                    </select>
                </div>
            </div>

            <div className="form-group">
                <label className="form-label">Detail Lokasi</label>
                <input className="form-input" placeholder="Nama jalan, patokan, dll" value={form.lokasi} onChange={(e) => handleChange('lokasi', e.target.value)} />
            </div>

            <div className="form-group">
                <label className="form-label">Tingkat Prioritas</label>
                <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                    {PRIORITIES.map(p => (
                        <div key={p.value} className={`radio-option ${form.prioritas === p.value ? 'selected' : ''}`} onClick={() => handleChange('prioritas', p.value)} style={{ flex: 1, justifyContent: 'center', borderColor: form.prioritas === p.value ? p.color : undefined }}>
                            <span>{p.label}</span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="card" style={{ textAlign: 'center', marginBottom: 'var(--space-lg)' }}>
                <p style={{ fontSize: 'var(--font-size-sm)', marginBottom: 'var(--space-sm)', color: 'var(--color-text-secondary)' }}>Foto Bukti (Opsional)</p>
                {form.photo_url && <img src={form.photo_url} alt="Bukti" style={{ width: '100%', borderRadius: 'var(--radius-md)', maxHeight: 180, objectFit: 'cover', marginBottom: 'var(--space-sm)' }} />}
                <button className="btn btn-secondary btn-sm" onClick={handlePhoto}><Camera size={14} /> {form.photo_url ? 'Ganti' : 'Ambil'} Foto</button>
            </div>

            <button className="btn btn-primary btn-lg btn-block" onClick={handleSubmit} disabled={submitting} style={{ marginBottom: 'var(--space-xl)' }}>
                {submitting ? <Loader size={18} className="spin-animation" /> : <Send size={16} />}
                {submitting ? ' Mengirim...' : ' Kirim Aspirasi'}
            </button>
        </div>
    );
}
