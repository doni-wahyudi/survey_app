import { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../../store/useAuth';
import { useApp } from '../../store/useApp';
import { getPriorityLabel, getPriorityColor, getStatusLabel, getStatusColor, formatTimeAgo, formatDateTime } from '../../utils/helpers';
import { Plus, Search, MessageSquare, MapPin, ArrowUpCircle, CheckCircle, Clock, Loader, Download, X, MoreVertical, Edit3, Trash2, Map, Image as ImageIcon } from 'lucide-react';
import AspirationForm from './AspirationForm';
import { supabase, TABLES, updateAspirationStatus } from '../../lib/supabase';
import type { Aspiration, AspirationStatus } from '../../types';
import { exportAspirations } from '../../utils/export';

export default function AspirationList() {
    const { user } = useAuth();
    const { addToast } = useApp();
    const isAdmin = user?.role === 'admin';
    const [loading, setLoading] = useState(true);
    const [aspirations, setAspirations] = useState<Aspiration[]>([]);
    const [showForm, setShowForm] = useState(false);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [selectedAspiration, setSelectedAspiration] = useState<Aspiration | null>(null);
    const [updatingStatus, setUpdatingStatus] = useState(false);

    const fetchAspirations = async () => {
        if (!supabase || !user?.id) return;
        setLoading(true);
        try {
            let query = supabase
                .from(TABLES.aspirations)
                .select('*, profiles:reported_by(full_name)');

            if (!isAdmin) {
                query = query.eq('reported_by', user.id);
            }

            const { data, error } = await query.order('created_at', { ascending: false });

            if (error) throw error;
            setAspirations((data || []) as Aspiration[]);
        } catch (error) {
            console.error('Error fetching aspirations:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user?.id) {
            fetchAspirations();
        }
    }, [user?.id, isAdmin]);

    const handleUpdateStatus = async (id: string, newStatus: AspirationStatus) => {
        if (!isAdmin || !supabase) return;
        setUpdatingStatus(true);
        try {
            await updateAspirationStatus(id, newStatus);
            
            setAspirations(prev => prev.map(a => a.id === id ? { ...a, status: newStatus } : a));
            if (selectedAspiration?.id === id) {
                setSelectedAspiration(prev => prev ? { ...prev, status: newStatus } : null);
            }
            addToast(`Status diperbarui menjadi ${getStatusLabel(newStatus)}`, 'success');
        } catch (error) {
            console.error('Error updating status:', error);
            addToast('Gagal memperbarui status', 'error');
        } finally {
            setUpdatingStatus(false);
        }
    };

    const filtered = useMemo(() => {
        return aspirations.filter(a => {
            const searchLower = search.toLowerCase();
            const matchSearch = !search || 
                a.judul.toLowerCase().includes(searchLower) || 
                a.deskripsi.toLowerCase().includes(searchLower) ||
                a.desa.toLowerCase().includes(searchLower) ||
                a.kecamatan.toLowerCase().includes(searchLower);
            
            const matchStatus = statusFilter === 'all' || a.status === statusFilter;
            return matchSearch && matchStatus;
        });
    }, [aspirations, search, statusFilter]);

    // ── Detail Modal ──
    const DetailModal = ({ aspiration: a, onClose }: { aspiration: Aspiration, onClose: () => void }) => {
        const [showImageFull, setShowImageFull] = useState(false);

        return (
            <div className="modal-overlay" onClick={onClose}>
                <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px', height: 'auto', maxHeight: '90vh', overflowY: 'auto' }}>
                    <div className="modal-handle" />
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)' }}>
                        <div className={`badge`} style={{ 
                            background: getStatusColor(a.status) + '15', 
                            color: getStatusColor(a.status),
                            fontSize: '10px', fontWeight: 800, padding: '4px 8px', borderRadius: '4px'
                        }}>
                            {getStatusLabel(a.status).toUpperCase()}
                        </div>
                        <button className="btn btn-icon btn-ghost" onClick={onClose}><X size={20} /></button>
                    </div>

                    <h2 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 800, marginBottom: 'var(--space-xs)', color: 'var(--color-text-primary)' }}>{a.judul}</h2>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)', marginBottom: 'var(--space-md)' }}>
                        <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-tertiary)' }}>Dilaporkan {formatTimeAgo(a.created_at)}</span>
                        <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-tertiary)' }}>•</span>
                        <span style={{ fontSize: 'var(--font-size-xs)', fontWeight: 600, color: 'var(--color-primary)' }}>{a.kategori.toUpperCase()}</span>
                    </div>

                    <div className="card" style={{ padding: 'var(--space-md)', background: 'var(--color-background-alt)', marginBottom: 'var(--space-md)' }}>
                        <p style={{ fontSize: 'var(--font-size-sm)', lineHeight: 1.6, color: 'var(--color-text-secondary)', whiteSpace: 'pre-wrap' }}>
                            {a.deskripsi}
                        </p>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: 'var(--space-md)' }}>
                        <div className="info-item">
                            <div className="info-label"><MapPin size={12} /> WILAYAH</div>
                            <div className="info-value" style={{ fontSize: '11px' }}>{a.desa}, {a.kecamatan}</div>
                        </div>
                        <div className="info-item">
                            <div className="info-label"><ArrowUpCircle size={12} /> PRIORITAS</div>
                            <div className="info-value" style={{ color: getPriorityColor(a.prioritas), fontWeight: 700 }}>
                                {getPriorityLabel(a.prioritas).toUpperCase()}
                            </div>
                        </div>
                    </div>

                    {a.lokasi && (
                        <div style={{ marginBottom: 'var(--space-md)' }}>
                            <div className="info-label"><Map size={12} /> DETAIL LOKASI</div>
                            <div className="info-value" style={{ fontSize: '12px' }}>{a.lokasi}</div>
                        </div>
                    )}

                    {a.photo_url && (
                        <div style={{ marginBottom: 'var(--space-lg)' }}>
                            <div className="info-label"><ImageIcon size={12} /> BUKTI FOTO</div>
                            <div className="photo-container" style={{ borderRadius: 'var(--radius-md)', overflow: 'hidden', position: 'relative', height: '200px' }} onClick={() => setShowImageFull(true)}>
                                <img src={a.photo_url} alt="Proof" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                <div style={{ position: 'absolute', bottom: 8, right: 8, background: 'rgba(0,0,0,0.5)', color: 'white', padding: '4px 8px', borderRadius: '4px', fontSize: '10px' }}>Klik untuk perbesar</div>
                            </div>
                        </div>
                    )}

                    {isAdmin && (
                        <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-md)', marginTop: 'var(--space-md)' }}>
                            <h4 style={{ fontSize: 'var(--font-size-xs)', fontWeight: 800, color: 'var(--color-text-tertiary)', marginBottom: 'var(--space-sm)' }}>KELOLA STATUS</h4>
                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                {(['pending', 'in_progress', 'resolved', 'rejected'] as AspirationStatus[]).map(s => (
                                    <button 
                                        key={s} 
                                        className={`btn btn-sm ${a.status === s ? 'btn-primary' : 'btn-secondary'}`}
                                        disabled={updatingStatus || a.status === s}
                                        onClick={() => handleUpdateStatus(a.id, s)}
                                        style={{ fontSize: '10px', padding: '6px 10px' }}
                                    >
                                        {getStatusLabel(s)}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {showImageFull && (
                    <div className="modal-overlay" style={{ background: 'rgba(0,0,0,0.9)', zIndex: 1100 }} onClick={() => setShowImageFull(false)}>
                        <img src={a.photo_url} alt="Proof Full" style={{ maxWidth: '95vw', maxHeight: '95vh', objectFit: 'contain' }} />
                        <button className="btn btn-icon" style={{ position: 'absolute', top: 20, right: 20, color: 'white' }} onClick={() => setShowImageFull(false)}><X size={24} /></button>
                    </div>
                )}
            </div>
        );
    };

    if (showForm) return <AspirationForm onBack={() => {
        setShowForm(false);
        fetchAspirations();
    }} />;

    return (
        <div className="page-enter">
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-lg)' }}>
                <div>
                    <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 800 }}>Aspirasi & Aduan</h2>
                    <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-tertiary)' }}>
                        {isAdmin ? 'Pantau aspirasi masyarakat' : 'Sampaikan aspirasi warga'}
                    </p>
                </div>
                {!isAdmin && (
                    <button className="btn btn-primary btn-sm" onClick={() => setShowForm(true)}>
                        <Plus size={16} /> Tambah
                    </button>
                )}
                {isAdmin && filtered.length > 0 && (
                    <button className="btn btn-secondary btn-sm" onClick={() => exportAspirations(filtered)}>
                        <Download size={16} /> Export
                    </button>
                )}
            </header>

            <div className="search-bar" style={{ marginBottom: 'var(--space-md)' }}>
                <Search size={18} />
                <input 
                    type="text" 
                    placeholder="Cari judul, wilayah, atau deskripsi..." 
                    value={search} 
                    onChange={(e) => setSearch(e.target.value)} 
                />
            </div>

            <div className="filter-pills" style={{ marginBottom: 'var(--space-lg)', paddingBottom: '4px' }}>
                {[
                    { key: 'all', label: 'Semua' },
                    { key: 'pending', label: 'Menunggu' },
                    { key: 'in_progress', label: 'Diproses' },
                    { key: 'resolved', label: 'Selesai' },
                ].map(f => (
                    <button 
                        key={f.key} 
                        className={`filter-pill ${statusFilter === f.key ? 'active' : ''}`} 
                        onClick={() => setStatusFilter(f.key)}
                    >
                        {f.label}
                    </button>
                ))}
            </div>

            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-xl)' }}>
                    <Loader size={24} className="spin-animation" style={{ color: 'var(--color-primary)' }} />
                </div>
            ) : filtered.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: 'var(--space-xl)', background: 'var(--color-background-alt)' }}>
                    <div style={{ width: 64, height: 64, background: 'var(--color-surface)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto var(--space-md)', color: 'var(--color-text-tertiary)' }}>
                        <MessageSquare size={32} />
                    </div>
                    <h3 style={{ fontSize: 'var(--font-size-md)', fontWeight: 700, marginBottom: 8 }}>Belum ada aspirasi</h3>
                    <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-tertiary)' }}>
                        {search ? 'Tidak ada data yang cocok dengan pencarian' : 'Mulai sampaikan aspirasi warga melalui tombol Tambah'}
                    </p>
                </div>
            ) : (
                <div className="aspiration-grid">
                    {filtered.map(a => (
                        <div key={a.id} className="card aspiration-card" onClick={() => setSelectedAspiration(a)} style={{ cursor: 'pointer', padding: 'var(--space-md)', marginBottom: 'var(--space-md)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
                                <div className={`badge`} style={{ background: getStatusColor(a.status) + '20', color: getStatusColor(a.status), fontSize: '9px', fontWeight: 800 }}>
                                    {getStatusLabel(a.status).toUpperCase()}
                                </div>
                                <div style={{ fontSize: '10px', color: 'var(--color-text-tertiary)', fontWeight: 600 }}>
                                    {formatTimeAgo(a.created_at)}
                                </div>
                            </div>

                            <h4 style={{ fontSize: 'var(--font-size-md)', fontWeight: 700, marginBottom: '4px' }}>{a.judul}</h4>
                            <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', marginBottom: '12px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: 1.5 }}>
                                {a.deskripsi}
                            </p>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '10px', borderTop: '1px solid var(--color-border)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', fontWeight: 600, color: 'var(--color-text-tertiary)' }}>
                                    <MapPin size={10} /> {a.desa}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', fontWeight: 800, color: getPriorityColor(a.prioritas) }}>
                                    <ArrowUpCircle size={10} /> {getPriorityLabel(a.prioritas).toUpperCase()}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {selectedAspiration && <DetailModal aspiration={selectedAspiration} onClose={() => setSelectedAspiration(null)} />}
        </div>
    );
}
