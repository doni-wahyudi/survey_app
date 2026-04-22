import { useState, useMemo, useEffect } from 'react';
import { fetchProvinsi, fetchKabupaten, fetchKecamatan, fetchDesa, type Region } from '../../data/indonesiaData';
import { getStatusLabel } from '../../utils/helpers';
import { Search, MapPin, Edit2, UserPlus, Loader, Filter, Download, X, Save } from 'lucide-react';
import { exportRespondents } from '../../utils/export';
import { useApp } from '../../store/useApp';
import { supabase, TABLES } from '../../lib/supabase';
import type { RespondentSample } from '../../types';

export default function RespondentManager() {
    const { addToast } = useApp();
    const [loading, setLoading] = useState(true);
    const [respondents, setRespondents] = useState<RespondentSample[]>([]);
    const [search, setSearch] = useState('');
    
    // Region lists
    const [provList, setProvList] = useState<Region[]>([]);
    const [kabList, setKabList] = useState<Region[]>([]);
    const [kecList, setKecList] = useState<Region[]>([]);
    const [desaList, setDesaList] = useState<Region[]>([]);

    // Filter state
    const [provFilter, setProvFilter] = useState(''); // Stores Name
    const [kabFilter, setKabFilter] = useState('');   // Stores Name
    const [kecFilter, setKecFilter] = useState('');   // Stores Name
    const [desFilter, setDesFilter] = useState('');   // Stores Name
    const [statusFilter, setStatusFilter] = useState('all');

    // Modal state
    const [showModal, setShowModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    
    // Form state (stores Names for DB compatibility)
    const [form, setForm] = useState({
        custom_id: '',
        nama: '', 
        provinsi: '', kabupaten: '', kecamatan: '', desa: '', rt_rw: ''
    });

    // Form Region lists
    const [formKabList, setFormKabList] = useState<Region[]>([]);
    const [formKecList, setFormKecList] = useState<Region[]>([]);
    const [formDesaList, setFormDesaList] = useState<Region[]>([]);

    useEffect(() => {
        fetchData();
        loadInitialRegions();
    }, []);

    const loadInitialRegions = async () => {
        const provs = await fetchProvinsi();
        setProvList(provs);
    };

    const fetchData = async () => {
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
            console.error('Error fetching data:', error);
            addToast('Gagal mengambil data', 'error');
        } finally {
            setLoading(false);
        }
    };

    // Filter effect chain
    useEffect(() => {
        if (provFilter) {
            const pId = provList.find(p => p.name === provFilter)?.id;
            if (pId) fetchKabupaten(pId).then(setKabList);
        } else {
            setKabList([]);
        }
        setKabFilter('');
    }, [provFilter, provList]);

    useEffect(() => {
        if (kabFilter) {
            const kId = kabList.find(k => k.name === kabFilter)?.id;
            if (kId) fetchKecamatan(kId).then(setKecList);
        } else {
            setKecList([]);
        }
        setKecFilter('');
    }, [kabFilter, kabList]);

    useEffect(() => {
        if (kecFilter) {
            const kId = kecList.find(k => k.name === kecFilter)?.id;
            if (kId) fetchDesa(kId).then(setDesaList);
        } else {
            setDesaList([]);
        }
        setDesFilter('');
    }, [kecFilter, kecList]);

    // Form effect chain
    useEffect(() => {
        if (form.provinsi) {
            const pId = provList.find(p => p.name === form.provinsi)?.id;
            if (pId) fetchKabupaten(pId).then(setFormKabList);
        } else {
            setFormKabList([]);
        }
    }, [form.provinsi, provList]);

    useEffect(() => {
        if (form.kabupaten) {
            const kId = formKabList.find(k => k.name === form.kabupaten)?.id;
            if (kId) fetchKecamatan(kId).then(setFormKecList);
        } else {
            setFormKecList([]);
        }
    }, [form.kabupaten, formKabList]);

    useEffect(() => {
        if (form.kecamatan) {
            const kId = formKecList.find(k => k.name === form.kecamatan)?.id;
            if (kId) fetchDesa(kId).then(setFormDesaList);
        } else {
            setFormDesaList([]);
        }
    }, [form.kecamatan, formKecList]);

    const filtered = useMemo(() => {
        return respondents.filter(r => {
            const matchSearch = !search ||
                r.nama.toLowerCase().includes(search.toLowerCase()) ||
                (r.custom_id && r.custom_id.toLowerCase().includes(search.toLowerCase()));
            const matchProv = !provFilter || r.provinsi === provFilter;
            const matchKab = !kabFilter || r.kabupaten === kabFilter;
            const matchKec = !kecFilter || r.kecamatan === kecFilter;
            const matchDes = !desFilter || r.desa === desFilter;
            const matchStatus = statusFilter === 'all' || r.status === statusFilter;
            return matchSearch && matchProv && matchKab && matchKec && matchDes && matchStatus;
        });
    }, [respondents, search, provFilter, kabFilter, kecFilter, desFilter, statusFilter]);

    const handleOpenModal = (r?: any) => {
        if (r) {
            setEditingId(r.id);
            setForm({
                custom_id: r.custom_id || '',
                nama: r.nama, 
                provinsi: r.provinsi || '',
                kabupaten: r.kabupaten || '',
                kecamatan: r.kecamatan || '', desa: r.desa || '', 
                rt_rw: r.rt_rw || ''
            });
        } else {
            setEditingId(null);
            setForm({
                custom_id: '',
                nama: '', 
                provinsi: '', kabupaten: '', kecamatan: '', desa: '', rt_rw: ''
            });
        }
        setShowModal(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!supabase) return;

        setSubmitting(true);
        try {
            const payload = {
                ...form,
                status: editingId ? undefined : 'pending'
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
            fetchData();
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
                <h2 className="section-title">Data Master Responden</h2>
                <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn-secondary btn-sm" onClick={() => exportRespondents(respondents)} disabled={respondents.length === 0}>
                        <Download size={14} /> Export
                    </button>
                    <button className="btn btn-primary btn-sm" onClick={() => handleOpenModal()}>
                        <UserPlus size={14} /> Tambah Responden
                    </button>
                </div>
            </div>

            <div className="search-bar">
                <Search size={16} className="search-icon" />
                <input placeholder="Cari nama atau ID..." value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>

            {/* Region Filters */}
            <div className="card" style={{ padding: 'var(--space-md)', marginBottom: 'var(--space-md)', background: 'var(--color-background-alt)' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, marginBottom: 8, color: 'var(--color-text-secondary)' }}>FILTER WILAYAH NASIONAL</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    <select className="form-select" value={provFilter} onChange={(e) => setProvFilter(e.target.value)} style={{ fontSize: '11px' }}>
                        <option value="">Semua Provinsi</option>
                        {provList.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                    </select>
                    <select className="form-select" value={kabFilter} onChange={(e) => setKabFilter(e.target.value)} disabled={!provFilter} style={{ fontSize: '11px' }}>
                        <option value="">Semua Kabupaten/Kota</option>
                        {kabList.map(k => <option key={k.id} value={k.name}>{k.name}</option>)}
                    </select>
                    <select className="form-select" value={kecFilter} onChange={(e) => setKecFilter(e.target.value)} disabled={!kabFilter} style={{ fontSize: '11px' }}>
                        <option value="">Semua Kecamatan</option>
                        {kecList.map(k => <option key={k.id} value={k.name}>{k.name}</option>)}
                    </select>
                    <select className="form-select" value={desFilter} onChange={(e) => setDesFilter(e.target.value)} disabled={!kecFilter} style={{ fontSize: '11px' }}>
                        <option value="">Semua Kelurahan/Desa</option>
                        {desaList.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
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
                                    <span style={{ color: 'var(--color-primary)', fontWeight: 700, fontSize: 'var(--font-size-xs)' }}>[{r.custom_id || 'NO-ID'}]</span>
                                    <span style={{ fontWeight: 700, fontSize: 'var(--font-size-sm)' }}>{r.nama}</span>
                                    <span className={`badge ${r.status === 'surveyed' ? 'badge-success' : r.status === 'rejected' ? 'badge-error' : 'badge-warning'}`}>
                                        {getStatusLabel(r.status)}
                                    </span>
                                </div>
                                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-tertiary)', marginTop: 4 }}>
                                    <MapPin size={10} style={{ display: 'inline', verticalAlign: -1 }} /> {r.desa}, {r.kecamatan}, {r.kabupaten}, {r.provinsi}
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
                                <input className="form-input" value={form.nama} onChange={e => setForm({ ...form, nama: e.target.value })} required placeholder="Input Nama Sesuai KTP" disabled={submitting} />
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">Provinsi</label>
                                    <select className="form-select" value={form.provinsi} onChange={(e) => setForm({ ...form, provinsi: e.target.value, kabupaten: '', kecamatan: '', desa: '' })} required disabled={submitting}>
                                        <option value="">Pilih</option>
                                        {provList.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Kabupaten/Kota</label>
                                    <select className="form-select" value={form.kabupaten} onChange={(e) => setForm({ ...form, kabupaten: e.target.value, kecamatan: '', desa: '' })} required disabled={!form.provinsi || submitting}>
                                        <option value="">Pilih</option>
                                        {formKabList.map(k => <option key={k.id} value={k.name}>{k.name}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">Kecamatan</label>
                                    <select className="form-select" value={form.kecamatan} onChange={(e) => setForm({ ...form, kecamatan: e.target.value, desa: '' })} required disabled={!form.kabupaten || submitting}>
                                        <option value="">Pilih</option>
                                        {formKecList.map(k => <option key={k.id} value={k.name}>{k.name}</option>)}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Desa/Kelurahan</label>
                                    <select className="form-select" value={form.desa} onChange={(e) => setForm({ ...form, desa: e.target.value })} required disabled={!form.kecamatan || submitting}>
                                        <option value="">Pilih</option>
                                        {formDesaList.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div style={{ marginTop: 'var(--space-lg)' }}>
                                <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
                                    {submitting ? <Loader size={16} className="spin-animation" /> : <Save size={16} />}
                                    {submitting ? ' Menyimpan...' : ' Simpan Responden'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
