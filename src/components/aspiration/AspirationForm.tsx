import { useState, useEffect } from 'react';
import { useApp } from '../../store/useApp';
import { useAuth } from '../../store/useAuth';
import { useOfflineSync } from '../../store/useOfflineSync';
import { useActivityLog } from '../../store/useActivityLog';
import { capturePhoto } from '../../utils/camera';
import { ArrowLeft, Send, Camera, Loader, MapPin, X } from 'lucide-react';
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
    { value: 'rendah', label: 'Rendah', color: 'var(--color-info)' },
];

export default function AspirationForm({ onBack }: Props) {
    const { addToast } = useApp();
    const { user } = useAuth();
    const { isOnline, enqueue } = useOfflineSync();
    const { addLog } = useActivityLog();

    const [submitting, setSubmitting] = useState(false);
    const [form, setForm] = useState({
        respondent_name: '', kategori: '' as AspirationCategory, judul: '',
        deskripsi: '', lokasi: '', provinsi: user?.provinsi || '', kabupaten: user?.kabupaten || '', kecamatan: user?.kecamatan || '', desa: user?.desa || '',
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
        try {
            const provs = await fetchProvinsi();
            setProvList(provs);
            
            // If user has a province, load kabupaten
            if (user?.provinsi) {
                const pId = provs.find(p => p.name === user.provinsi)?.id;
                if (pId) {
                    const kabs = await fetchKabupaten(pId);
                    setKabList(kabs);
                    
                    // If user has kabupaten, load kecamatan
                    if (user?.kabupaten) {
                        const kId = kabs.find(k => k.name === user.kabupaten)?.id;
                        if (kId) {
                            const kecs = await fetchKecamatan(kId);
                            setKecList(kecs);
                            
                            // If user has kecamatan, load desa
                            if (user?.kecamatan) {
                                const kcId = kecs.find(k => k.name === user.kecamatan)?.id;
                                if (kcId) {
                                    const desas = await fetchDesa(kcId);
                                    setDesaList(desas);
                                }
                            }
                        }
                    }
                }
            }
        } catch (err) {
            console.error('Error loading regions:', err);
        }
    };

    // Manual Region Change Handlers
    const handleProvinsiChange = async (val: string) => {
        handleChange('provinsi', val);
        const pId = provList.find(p => p.name === val)?.id;
        if (pId) {
            const kabs = await fetchKabupaten(pId);
            setKabList(kabs);
        } else {
            setKabList([]);
        }
        setKecList([]);
        setDesaList([]);
    };

    const handleKabupatenChange = async (val: string) => {
        handleChange('kabupaten', val);
        const kId = kabList.find(k => k.name === val)?.id;
        if (kId) {
            const kecs = await fetchKecamatan(kId);
            setKecList(kecs);
        } else {
            setKecList([]);
        }
        setDesaList([]);
    };

    const handleKecamatanChange = async (val: string) => {
        handleChange('kecamatan', val);
        const kId = kecList.find(k => k.name === val)?.id;
        if (kId) {
            const desas = await fetchDesa(kId);
            setDesaList(desas);
        } else {
            setDesaList([]);
        }
    };

    const handleChange = (field: string, value: string) => {
        setForm(prev => ({ ...prev, [field]: value }));
    };

    const handlePhoto = async () => {
        try {
            const p = await capturePhoto();
            if (p) {
                setForm(prev => ({ ...prev, photo_url: p }));
                addToast('Foto berhasil diambil', 'success');
            }
        } catch (err) {
            console.error('Camera error:', err);
            addToast('Gagal mengakses kamera', 'error');
        }
    };

    const validate = () => {
        if (!form.judul.trim()) return 'Judul harus diisi';
        if (!form.kategori) return 'Pilih kategori';
        if (!form.deskripsi.trim()) return 'Deskripsi harus diisi';
        if (!form.provinsi || !form.kabupaten || !form.kecamatan || !form.desa) return 'Wilayah harus lengkap';
        return null;
    };

    const handleSubmit = async () => {
        const errorMsg = validate();
        if (errorMsg) {
            addToast(errorMsg, 'error');
            return;
        }

        setSubmitting(true);
        let finalPhotoUrl = form.photo_url;

        try {
            // Upload photo if exists
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
                respondent_name: form.respondent_name || 'Warga'
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
            <header style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 'var(--space-lg)' }}>
                <button className="btn btn-icon btn-ghost" onClick={onBack}><ArrowLeft size={20} /></button>
                <h2 style={{ fontSize: 'var(--font-size-md)', fontWeight: 800 }}>Tambah Aspirasi</h2>
            </header>

            <div className="form-group">
                <label className="form-label">Nama Pelapor (Opsional)</label>
                <input className="form-input" placeholder="Nama warga / anonim" value={form.respondent_name} onChange={(e) => handleChange('respondent_name', e.target.value)} />
            </div>

            <div className="form-group">
                <label className="form-label">Judul Aspirasi <span className="required">*</span></label>
                <input className="form-input" placeholder="Contoh: Perbaikan Jembatan Rusak" value={form.judul} onChange={(e) => handleChange('judul', e.target.value)} />
            </div>

            <div className="form-group">
                <label className="form-label">Kategori <span className="required">*</span></label>
                <div className="filter-pills" style={{ flexWrap: 'wrap', gap: '8px' }}>
                    {CATEGORIES.map(c => (
                        <button key={c.value} className={`filter-pill ${form.kategori === c.value ? 'active' : ''}`} onClick={() => handleChange('kategori', c.value)} style={{ fontSize: '11px', padding: '6px 12px' }}>{c.label}</button>
                    ))}
                </div>
            </div>

            <div className="form-group">
                <label className="form-label">Deskripsi Lengkap <span className="required">*</span></label>
                <textarea className="form-textarea" placeholder="Jelaskan detail aspirasi, keluhan, atau usulan masyarakat secara lengkap..." value={form.deskripsi} onChange={(e) => handleChange('deskripsi', e.target.value)} rows={5} />
            </div>

            <div className="card" style={{ padding: '16px', background: 'var(--color-background-alt)', borderRadius: 'var(--radius-lg)', marginBottom: 'var(--space-lg)', border: '1px solid var(--color-border)' }}>
                <div style={{ fontSize: '10px', fontWeight: 900, color: 'var(--color-primary)', marginBottom: 12, letterSpacing: '0.05em' }}>WILAYAH ADUAN</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <select className="form-select" value={form.provinsi} onChange={(e) => handleProvinsiChange(e.target.value)} style={{ fontSize: '12px', height: '40px' }}>
                            <option value="">Provinsi</option>
                            {provList.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                        </select>
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <select className="form-select" value={form.kabupaten} onChange={(e) => handleKabupatenChange(e.target.value)} disabled={!form.provinsi} style={{ fontSize: '12px', height: '40px' }}>
                            <option value="">Kabupaten</option>
                            {kabList.map((k: Region) => <option key={k.id} value={k.name}>{k.name}</option>)}
                        </select>
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <select className="form-select" value={form.kecamatan} onChange={(e) => handleKecamatanChange(e.target.value)} disabled={!form.kabupaten} style={{ fontSize: '12px', height: '40px' }}>
                            <option value="">Kecamatan</option>
                            {kecList.map((k: Region) => <option key={k.id} value={k.name}>{k.name}</option>)}
                        </select>
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <select className="form-select" value={form.desa} onChange={(e) => handleChange('desa', e.target.value)} disabled={!form.kecamatan} style={{ fontSize: '12px', height: '40px' }}>
                            <option value="">Desa</option>
                            {desaList.map((d: Region) => <option key={d.id} value={d.name}>{d.name}</option>)}
                        </select>
                    </div>
                </div>
            </div>

            <div className="form-group">
                <label className="form-label">Detail Lokasi / Patokan</label>
                <div style={{ position: 'relative' }}>
                    <MapPin size={16} style={{ position: 'absolute', left: 12, top: 12, color: 'var(--color-text-tertiary)' }} />
                    <input className="form-input" style={{ paddingLeft: '36px' }} placeholder="Contoh: Depan Masjid Al-Ikhlas" value={form.lokasi} onChange={(e) => handleChange('lokasi', e.target.value)} />
                </div>
            </div>

            <div className="form-group">
                <label className="form-label">Tingkat Prioritas</label>
                <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                    {PRIORITIES.map(p => (
                        <div key={p.value} className={`radio-option ${form.prioritas === p.value ? 'selected' : ''}`} onClick={() => handleChange('prioritas', p.value)} style={{ flex: 1, justifyContent: 'center', borderColor: form.prioritas === p.value ? p.color : undefined, padding: '10px' }}>
                            <span style={{ fontSize: '12px', fontWeight: 700 }}>{p.label}</span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="card" style={{ textAlign: 'center', marginBottom: 'var(--space-xl)', border: '1px dashed var(--color-border)', background: 'var(--color-background-alt)' }}>
                {form.photo_url ? (
                    <div style={{ position: 'relative' }}>
                        <img src={form.photo_url} alt="Bukti" style={{ width: '100%', borderRadius: 'var(--radius-md)', maxHeight: 200, objectFit: 'cover' }} />
                        <button className="btn btn-icon" onClick={() => handleChange('photo_url', '')} style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(255,255,255,0.8)', color: 'var(--color-error)' }}><X size={18} /></button>
                    </div>
                ) : (
                    <div style={{ padding: 'var(--space-lg)' }} onClick={handlePhoto}>
                        <Camera size={32} style={{ color: 'var(--color-text-tertiary)', marginBottom: 8 }} />
                        <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>Ambil Foto Bukti</p>
                        <p style={{ fontSize: '10px', color: 'var(--color-text-tertiary)' }}>(Opsional)</p>
                    </div>
                )}
                {form.photo_url && (
                    <button className="btn btn-secondary btn-sm" onClick={handlePhoto} style={{ margin: '12px auto' }}><Camera size={14} /> Ganti Foto</button>
                )}
            </div>

            <button className="btn btn-primary btn-lg btn-block" onClick={handleSubmit} disabled={submitting} style={{ marginBottom: 'var(--space-xl)', height: '52px', boxShadow: '0 4px 12px rgba(196,149,106,0.2)' }}>
                {submitting ? <Loader size={20} className="spin-animation" /> : <Send size={18} />}
                <span style={{ fontWeight: 800 }}>{submitting ? ' MENGIRIM...' : ' KIRIM ASPIRASI'}</span>
            </button>
        </div>
    );
}
