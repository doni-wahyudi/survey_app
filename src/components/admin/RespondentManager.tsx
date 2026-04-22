import { useState, useMemo, useEffect } from 'react';
import { getKabupatenList, getKecamatanList, getDesaList } from '../../data/seedData';
import { getStatusLabel } from '../../utils/helpers';
import { Search, MapPin, Phone, Edit2, UserPlus, Loader, Filter, Download, X, Save } from 'lucide-react';
import { exportRespondents } from '../../utils/export';
import { useApp } from '../../store/useApp';
import { supabase, TABLES } from '../../lib/supabase';
import type { RespondentSample } from '../../types';

export default function RespondentManager() {
    const { addToast } = useApp();
    const [loading, setLoading] = useState(true);
    const [respondents, setRespondents] = useState<RespondentSample[]>([]);
    const [search, setSearch] = useState('');
    const [kabFilter, setKabFilter] = useState('');
    const [kecFilter, setKecFilter] = useState('');
    const [desFilter, setDesFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    // Modal state
    const [showModal, setShowModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState({
        nama: '', nik: '', alamat: '', kabupaten: '', kecamatan: '', desa: '',
        rt_rw: '', jenis_kelamin: 'Laki-laki', usia: 0, pekerjaan: '', no_telp: ''
    });

    useEffect(() => {
        fetchRespondents();
    }, []);

    const fetchRespondents = async () => {
        if (!supabase) return;
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from(TABLES.respondentSamples)
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setRespondents((data || []) as RespondentSample[]);
        } catch (error) {
            console.error('Error fetching respondents:', error);
            addToast('Gagal mengambil data responden', 'error');
        } finally {
            setLoading(false);
        }
    };

    const kabupatenList = getKabupatenList();
    const kecamatanList = kabFilter ? getKecamatanList(kabFilter) : [];
    const desaList = kabFilter && kecFilter ? getDesaList(kabFilter, kecFilter) : [];
    
    // For Form
    const formKecamatanList = form.kabupaten ? getKecamatanList(form.kabupaten) : [];
    const formDesaList = form.kabupaten && form.kecamatan ? getDesaList(form.kabupaten, form.kecamatan) : [];

    const filtered = useMemo(() => {
        return respondents.filter(r => {
            const matchSearch = !search ||
                r.nama.toLowerCase().includes(search.toLowerCase()) ||
                r.nik.includes(search);
            const matchKab = !kabFilter || r.kabupaten === kabFilter;
            const matchKec = !kecFilter || r.kecamatan === kecFilter;
            const matchDes = !desFilter || r.desa === desFilter;
            const matchStatus = statusFilter === 'all' || r.status === statusFilter;
            return matchSearch && matchKab && matchKec && matchDes && matchStatus;
        });
    }, [respondents, search, kabFilter, kecFilter, desFilter, statusFilter]);

    const handleOpenModal = (r?: RespondentSample) => {
        if (r) {
            setEditingId(r.id);
            setForm({
                nama: r.nama, nik: r.nik, alamat: r.alamat, kabupaten: r.kabupaten,
                kecamatan: r.kecamatan, desa: r.desa, rt_rw: r.rt_rw,
                jenis_kelamin: r.jenis_kelamin, usia: r.usia, pekerjaan: r.pekerjaan, no_telp: r.no_telp
            });
        } else {
            setEditingId(null);
            setForm({
                nama: '', nik: '', alamat: '', kabupaten: '', kecamatan: '', desa: '',
                rt_rw: '', jenis_kelamin: 'Laki-laki', usia: 0, pekerjaan: '', no_telp: ''
            });
        }
        setShowModal(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!supabase) return;

        setSubmitting(true);
        try {
            const userId = (await supabase.auth.getUser()).data.user?.id;
            const payload = {
                ...form,
                usia: Number(form.usia),
                status: editingId ? undefined : 'pending',
                ...(editingId ? {} : { created_by: userId })
            };

            if (editingId) {
                const { error } = await supabase.from(TABLES.respondentSamples).update(payload).eq('id', editingId);
                if (error) throw error;
                addToast('Responden berhasil diperbarui', 'success');
            } else {
                const { error } = await supabase.from(TABLES.respondentSamples).insert(payload);
                if (error) throw error;
                addToast('Responden berhasil ditambahkan', 'success');
            }

            setShowModal(false);
            fetchRespondents();
        } catch (error: any) {
            console.error('Error saving respondent:', error);
            addToast(`Gagal menyimpan responden: ${error.message}`, 'error');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center" style={{ minHeight: '60vh' }}>
                <Loader className="spin-animation" style={{ color: 'var(--color-primary)' }} />
            </div>
        );
    }

    return (
        <div className="page-enter">
            <div className="section-header">
                <h2 className="section-title">Kelola Responden</h2>
                <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn-secondary btn-sm" onClick={() => exportRespondents(respondents)} disabled={respondents.length === 0}>
                        <Download size={14} /> Export
                    </button>
                    <button className="btn btn-primary btn-sm" onClick={() => handleOpenModal()}>
                        <UserPlus size={14} /> Tambah
                    </button>
                </div>
            </div>

            <div className="search-bar">
                <Search size={16} className="search-icon" />
                <input placeholder="Cari nama atau NIK..." value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>

            {/* Region Filters */}
            <div className="cascading-selects" style={{ marginBottom: 'var(--space-md)' }}>
                <div className="form-row" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
                    <select className="form-select" value={kabFilter} onChange={(e) => { setKabFilter(e.target.value); setKecFilter(''); setDesFilter(''); }} style={{ fontSize: 'var(--font-size-xs)' }}>
                        <option value="">Semua Kabupaten</option>
                        {kabupatenList.map(k => <option key={k} value={k}>{k}</option>)}
                    </select>
                    <select className="form-select" value={kecFilter} onChange={(e) => { setKecFilter(e.target.value); setDesFilter(''); }} disabled={!kabFilter} style={{ fontSize: 'var(--font-size-xs)' }}>
                        <option value="">Semua Kecamatan</option>
                        {kecamatanList.map(k => <option key={k} value={k}>{k}</option>)}
                    </select>
                    <select className="form-select" value={desFilter} onChange={(e) => setDesFilter(e.target.value)} disabled={!kecFilter} style={{ fontSize: 'var(--font-size-xs)' }}>
                        <option value="">Semua Desa</option>
                        {desaList.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                </div>
            </div>

            {/* Status Filter */}
            <div className="filter-pills">
                {['all', 'pending', 'surveyed', 'rejected'].map(s => (
                    <button key={s} className={`filter-pill ${statusFilter === s ? 'active' : ''}`} onClick={() => setStatusFilter(s)}>
                        {s === 'all' ? 'Semua' : getStatusLabel(s)} ({s === 'all' ? respondents.length : respondents.filter(r => r.status === s).length})
                    </button>
                ))}
            </div>

            {/* Count */}
            <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-tertiary)', marginBottom: 'var(--space-md)' }}>
                Menampilkan {filtered.length} dari {respondents.length} responden
            </div>

            {filtered.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-state-icon"><Filter size={32} /></div>
                    <h3>Tidak ada data</h3>
                    <p>Tidak ditemukan responden yang sesuai filter.</p>
                </div>
            ) : (
                filtered.map(r => (
                    <div key={r.id} className="card" style={{ marginBottom: 'var(--space-sm)', padding: 'var(--space-md)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                                    <span style={{ fontWeight: 700, fontSize: 'var(--font-size-sm)' }}>{r.nama}</span>
                                    <span className={`badge ${r.status === 'surveyed' ? 'badge-success' : r.status === 'rejected' ? 'badge-error' : 'badge-warning'}`}>
                                        {getStatusLabel(r.status)}
                                    </span>
                                </div>
                                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', marginTop: 4 }}>
                                    NIK: {r.nik}
                                </div>
                                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-tertiary)', marginTop: 2 }}>
                                    <MapPin size={10} style={{ display: 'inline', verticalAlign: -1 }} /> {r.desa}, {r.kecamatan}, {r.kabupaten}
                                </div>
                                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-tertiary)', marginTop: 2 }}>
                                    <Phone size={10} style={{ display: 'inline', verticalAlign: -1 }} /> {r.no_telp} • {r.jenis_kelamin}, {r.usia} thn
                                </div>
                                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-tertiary)', marginTop: 2 }}>
                                    Surveyor: {r.assigned_surveyor ? `ID: ${r.assigned_surveyor.slice(0, 8)}...` : <span style={{ color: 'var(--color-warning)' }}>Belum ditugaskan</span>}
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: 4 }}>
                                <button className="btn btn-icon btn-ghost btn-sm" onClick={() => handleOpenModal(r)} style={{ width: 32, height: 32 }}>
                                    <Edit2 size={14} />
                                </button>
                            </div>
                        </div>
                    </div>
                ))
            )}

            {/* Add/Edit Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => !submitting && setShowModal(false)} style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.5)', zIndex: 1000,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-md)'
                }}>
                    <div className="modal-content card" onClick={e => e.stopPropagation()} style={{
                        width: '100%', maxWidth: 500, padding: 'var(--space-lg)', maxHeight: '90vh', overflowY: 'auto'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)' }}>
                            <h3 style={{ margin: 0 }}>{editingId ? 'Edit Responden' : 'Tambah Responden'}</h3>
                            <button className="btn-icon btn-ghost" onClick={() => setShowModal(false)} disabled={submitting}>
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSave}>
                            <div className="form-group">
                                <label className="form-label">Nama Lengkap</label>
                                <input className="form-input" value={form.nama} onChange={e => setForm({ ...form, nama: e.target.value })} required disabled={submitting} />
                            </div>

                            <div className="form-group">
                                <label className="form-label">NIK</label>
                                <input className="form-input" value={form.nik} onChange={e => setForm({ ...form, nik: e.target.value.replace(/\D/g, '').slice(0, 16) })} required disabled={submitting} />
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">Jenis Kelamin</label>
                                    <select className="form-select" value={form.jenis_kelamin} onChange={e => setForm({ ...form, jenis_kelamin: e.target.value })} disabled={submitting}>
                                        <option value="Laki-laki">Laki-laki</option>
                                        <option value="Perempuan">Perempuan</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Usia</label>
                                    <input type="number" className="form-input" value={form.usia || ''} onChange={e => setForm({ ...form, usia: parseInt(e.target.value) || 0 })} disabled={submitting} />
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">No. Telepon</label>
                                <input className="form-input" value={form.no_telp} onChange={e => setForm({ ...form, no_telp: e.target.value })} disabled={submitting} />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Pekerjaan</label>
                                <input className="form-input" value={form.pekerjaan} onChange={e => setForm({ ...form, pekerjaan: e.target.value })} disabled={submitting} />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Alamat Lengkap</label>
                                <textarea className="form-textarea" value={form.alamat} onChange={e => setForm({ ...form, alamat: e.target.value })} rows={2} disabled={submitting} />
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">Kabupaten</label>
                                    <select className="form-select" value={form.kabupaten} onChange={(e) => setForm({ ...form, kabupaten: e.target.value, kecamatan: '', desa: '' })} disabled={submitting}>
                                        <option value="">Pilih</option>
                                        {kabupatenList.map(k => <option key={k} value={k}>{k}</option>)}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Kecamatan</label>
                                    <select className="form-select" value={form.kecamatan} onChange={(e) => setForm({ ...form, kecamatan: e.target.value, desa: '' })} disabled={!form.kabupaten || submitting}>
                                        <option value="">Pilih</option>
                                        {formKecamatanList.map(k => <option key={k} value={k}>{k}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">Desa/Kelurahan</label>
                                    <select className="form-select" value={form.desa} onChange={(e) => setForm({ ...form, desa: e.target.value })} disabled={!form.kecamatan || submitting}>
                                        <option value="">Pilih</option>
                                        {formDesaList.map(d => <option key={d} value={d}>{d}</option>)}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">RT/RW</label>
                                    <input className="form-input" value={form.rt_rw} onChange={e => setForm({ ...form, rt_rw: e.target.value })} disabled={submitting} />
                                </div>
                            </div>

                            <div style={{ marginTop: 'var(--space-lg)' }}>
                                <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
                                    {submitting ? <Loader size={16} className="spin-animation" /> : <Save size={16} />}
                                    {submitting ? ' Menyimpan...' : ' Simpan'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
