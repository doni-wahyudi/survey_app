import { useState, useEffect } from 'react';
import { useApp } from '../../store/useApp';
import { useAuth } from '../../store/useAuth';
import { useOfflineSync } from '../../store/useOfflineSync';
import { useActivityLog } from '../../store/useActivityLog';
import { capturePhoto } from '../../utils/camera';
import { ArrowLeft, Send, Camera, Loader } from 'lucide-react';
import { fetchProvinsi, fetchKabupaten, fetchKecamatan, fetchDesa, type Region } from '../../data/indonesiaData';
import { submitCensus, uploadFile, notifyAdmins } from '../../lib/supabase';

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
        jenis_kelamin: '', alamat: '', provinsi: user?.provinsi || '', kabupaten: '', kecamatan: '', desa: '',
        rt_rw: '', agama: '', status_perkawinan: '', pendidikan_terakhir: '',
        pekerjaan: '', family_head_name: '', voter_potential: 'swing', catatan: '', photo_url: '',
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
        if (!form.respondent_name || !form.nik || !form.jenis_kelamin) {
            addToast('Mohon lengkapi data wajib', 'error');
            return;
        }

        setSubmitting(true);
        let finalPhotoUrl = form.photo_url;

        try {
            if (form.photo_url && form.photo_url.startsWith('data:')) {
                const fileName = `census/${user?.id}/${Date.now()}.jpg`;
                const uploadedUrl = await uploadFile('census-photos', fileName, form.photo_url);
                if (uploadedUrl) finalPhotoUrl = uploadedUrl;
            }

            const censusData = {
                ...form,
                photo_url: finalPhotoUrl,
                surveyor_id: user?.id || '',
                collected_at: new Date().toISOString(),
            };

            if (isOnline) {
                await submitCensus(censusData);
                await notifyAdmins(
                    'Data Sensus Baru 👥',
                    `${user?.full_name || 'Surveyor'} telah menambahkan data sensus baru: ${form.respondent_name}`,
                    'info'
                );
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
            onBack();
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="page-enter">
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 'var(--space-lg)' }}>
                <button className="btn btn-icon btn-ghost" onClick={onBack}><ArrowLeft size={20} /></button>
                <h2 style={{ fontSize: 'var(--font-size-md)', fontWeight: 700 }}>Input Data Sensus</h2>
            </div>

            <div className="profile-photo-capture" onClick={handlePhoto} style={{ marginBottom: 'var(--space-lg)' }}>
                {form.photo_url ? <img src={form.photo_url} alt="Foto Warga" /> : (
                    <div style={{ textAlign: 'center', color: 'var(--color-text-tertiary)' }}>
                        <Camera size={24} /><div style={{ fontSize: 'var(--font-size-xs)', marginTop: 4 }}>Foto</div>
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

            <div className="card" style={{ padding: '12px', background: 'var(--color-background-alt)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-md)' }}>
                <div style={{ fontSize: '10px', fontWeight: 800, color: 'var(--color-primary)', marginBottom: 8 }}>WILAYAH TINGGAL</div>
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
                <div className="form-group" style={{ marginTop: 8 }}>
                    <label className="form-label" style={{ fontSize: '10px' }}>RT/RW</label>
                    <input className="form-input form-input-sm" placeholder="001/001" value={form.rt_rw} onChange={(e) => handleChange('rt_rw', e.target.value)} />
                </div>
            </div>

            <div className="form-row">
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
                <label className="form-label">Nama Kepala Keluarga</label>
                <input className="form-input" placeholder="Nama ayah/kepala keluarga" value={form.family_head_name} onChange={(e) => handleChange('family_head_name', e.target.value)} />
            </div>

            <div className="form-group">
                <label className="form-label">Potensi Pemilih</label>
                <div style={{ display: 'flex', gap: 'var(--space-xs)' }}>
                    {[
                        { id: 'loyal', label: 'Loyal', color: 'var(--color-success)' },
                        { id: 'swing', label: 'Swing', color: 'var(--color-warning)' },
                        { id: 'opposition', label: 'Lawan', color: 'var(--color-error)' }
                    ].map(opt => (
                        <button 
                            key={opt.id}
                            className={`filter-pill ${form.voter_potential === opt.id ? 'active' : ''}`}
                            onClick={() => handleChange('voter_potential', opt.id)}
                            style={{ 
                                flex: 1, 
                                borderColor: form.voter_potential === opt.id ? opt.color : 'var(--color-border)',
                                background: form.voter_potential === opt.id ? opt.color : 'transparent',
                                color: form.voter_potential === opt.id ? '#fff' : 'var(--color-text-secondary)'
                            }}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="form-group">
                <label className="form-label">Catatan</label>
                <textarea className="form-textarea" placeholder="Catatan tambahan..." value={form.catatan} onChange={(e) => handleChange('catatan', e.target.value)} rows={2} />
            </div>

            <button className="btn btn-primary btn-lg btn-block" onClick={handleSubmit} disabled={submitting} style={{ marginBottom: 'var(--space-xl)' }}>
                {submitting ? <Loader size={18} className="spin-animation" /> : <Send size={16} />}
                {submitting ? ' Menyimpan...' : ' Simpan Data'}
            </button>
        </div>
    );
}
