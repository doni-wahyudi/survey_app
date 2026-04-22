import { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../../store/useAuth';
import { formatDate } from '../../utils/helpers';
import { Plus, Search, User, MapPin, Users, Loader, Download } from 'lucide-react';
import CensusForm from './CensusForm';
import { supabase, TABLES } from '../../lib/supabase';
import type { CensusData } from '../../types';
import { exportCensusData } from '../../utils/export';

export default function CensusList() {
    const { user } = useAuth();
    const isAdmin = user?.role === 'admin';
    const [loading, setLoading] = useState(true);
    const [censusData, setCensusData] = useState<CensusData[]>([]);
    const [showForm, setShowForm] = useState(false);
    const [search, setSearch] = useState('');

    useEffect(() => {
        if (user?.id) {
            fetchCensus();
        }
    }, [user?.id]);

    const fetchCensus = async () => {
        if (!supabase || !user?.id) return;
        setLoading(true);
        try {
            let query = supabase
                .from(TABLES.censusData)
                .select('*');

            if (!isAdmin) {
                query = query.eq('surveyor_id', user.id);
            }

            const { data, error } = await query;

            if (error) throw error;
            setCensusData((data || []) as CensusData[]);
        } catch (error) {
            console.error('Error fetching census:', error);
        } finally {
            setLoading(false);
        }
    };

    const filtered = useMemo(() => {
        return censusData.filter(c => {
            return !search ||
                c.respondent_name.toLowerCase().includes(search.toLowerCase()) ||
                c.nik.includes(search) ||
                c.desa.toLowerCase().includes(search.toLowerCase());
        });
    }, [censusData, search]);

    if (showForm) {
        return <CensusForm onBack={() => {
            setShowForm(false);
            fetchCensus();
        }} />;
    }

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
                <h2 className="section-title">Data Sensus</h2>
                <div style={{ display: 'flex', gap: 8 }}>
                    {isAdmin && (
                        <button className="btn btn-secondary btn-sm" onClick={() => exportCensusData(filtered)} disabled={filtered.length === 0}>
                            <Download size={14} /> Export
                        </button>
                    )}
                    <button className="btn btn-primary btn-sm" onClick={() => setShowForm(true)}>
                        <Plus size={14} /> Tambah
                    </button>
                </div>
            </div>

            <div className="search-bar">
                <Search size={16} className="search-icon" />
                <input placeholder="Cari nama, NIK, desa..." value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>

            <div className="card" style={{ padding: 'var(--space-md)', marginBottom: 'var(--space-md)', background: 'var(--color-info-light)', border: 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', fontSize: 'var(--font-size-sm)', color: 'var(--color-info)' }}>
                    <Users size={18} />
                    <span><strong>{censusData.length}</strong> data sensus tercatat</span>
                </div>
            </div>

            {filtered.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-state-icon"><Users size={32} /></div>
                    <h3>Belum ada data</h3>
                    <p>Mulai pencatatan sensus dengan menekan tombol Tambah.</p>
                </div>
            ) : (
                filtered.map(c => (
                    <div key={c.id} className="list-item">
                        <div className="list-item-avatar">
                            <User size={20} />
                        </div>
                        <div className="list-item-content">
                            <div className="list-item-title">{c.respondent_name}</div>
                            <div className="list-item-subtitle">
                                NIK: {c.nik}
                            </div>
                            <div className="list-item-subtitle">
                                <MapPin size={11} style={{ display: 'inline', verticalAlign: -1 }} /> {c.desa}, {c.kecamatan}
                            </div>
                        </div>
                        <div className="list-item-meta">
                            <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-tertiary)' }}>
                                {formatDate(c.collected_at)}
                            </span>
                            <span className="badge badge-info">{c.jenis_kelamin === 'Laki-laki' ? 'L' : 'P'}</span>
                        </div>
                    </div>
                ))
            )}
        </div>
    );
}
