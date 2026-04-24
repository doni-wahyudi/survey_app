import { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../../store/useAuth';
import { formatDate } from '../../utils/helpers';
import { Plus, Search, User, MapPin, Users, Loader, Download, Filter, LayoutDashboard, List as ListIcon, ChevronRight } from 'lucide-react';
import CensusForm from './CensusForm';
import SensusDashboard from './SensusDashboard';
import { supabase, TABLES } from '../../lib/supabase';
import type { CensusData } from '../../types';
import { exportCensusData } from '../../utils/export';

export default function CensusList() {
    const { user } = useAuth();
    const isAdmin = user?.role === 'admin';
    const [loading, setLoading] = useState(true);
    const [censusData, setCensusData] = useState<CensusData[]>([]);
    const [view, setView] = useState<'dashboard' | 'list' | 'form'>('dashboard');
    const [search, setSearch] = useState('');
    const [selectedKecamatan, setSelectedKecamatan] = useState('all');

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

            const { data, error } = await query.order('collected_at', { ascending: false });

            if (error) throw error;
            setCensusData((data || []) as CensusData[]);
        } catch (error) {
            console.error('Error fetching census:', error);
        } finally {
            setLoading(false);
        }
    };

    const kecamatans = useMemo(() => {
        const list = Array.from(new Set(censusData.map(c => c.kecamatan))).filter(Boolean);
        return ['all', ...list];
    }, [censusData]);

    const filtered = useMemo(() => {
        return censusData.filter(c => {
            const matchSearch = !search ||
                c.respondent_name.toLowerCase().includes(search.toLowerCase()) ||
                c.nik.includes(search) ||
                c.desa.toLowerCase().includes(search.toLowerCase());
            
            const matchKecamatan = selectedKecamatan === 'all' || c.kecamatan === selectedKecamatan;
            
            return matchSearch && matchKecamatan;
        });
    }, [censusData, search, selectedKecamatan]);

    if (view === 'form') {
        return <CensusForm onBack={() => {
            setView('dashboard');
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

    if (view === 'dashboard') {
        return (
            <SensusDashboard 
                data={censusData} 
                onAdd={() => setView('form')} 
                onViewList={() => setView('list')} 
            />
        );
    }

    return (
        <div className="page-enter">
            <div className="section-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                    <button className="btn btn-icon btn-ghost" onClick={() => setView('dashboard')}>
                        <LayoutDashboard size={20} />
                    </button>
                    <h2 className="section-title">Daftar Warga</h2>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                    {isAdmin && (
                        <button className="btn btn-secondary btn-sm" onClick={() => exportCensusData(filtered)} disabled={filtered.length === 0}>
                            <Download size={14} />
                        </button>
                    )}
                    <button className="btn btn-primary btn-sm" onClick={() => setView('form')}>
                        <Plus size={14} />
                    </button>
                </div>
            </div>

            <div className="search-bar">
                <Search size={16} className="search-icon" />
                <input placeholder="Cari nama, NIK, desa..." value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>

            <div style={{ marginBottom: 'var(--space-md)', overflowX: 'auto', display: 'flex', gap: 'var(--space-xs)', paddingBottom: 4 }}>
                {kecamatans.map(kec => (
                    <button 
                        key={kec}
                        className={`filter-pill ${selectedKecamatan === kec ? 'active' : ''}`}
                        onClick={() => setSelectedKecamatan(kec)}
                    >
                        {kec === 'all' ? 'Semua Kecamatan' : kec}
                    </button>
                ))}
            </div>

            {filtered.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-state-icon"><Users size={32} /></div>
                    <h3>Tidak ditemukan</h3>
                    <p>Coba gunakan kata kunci atau filter lain.</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                    {filtered.map(c => (
                        <div key={c.id} className="list-item" style={{ background: 'var(--color-surface-elevated)' }}>
                            <div className="list-item-avatar" style={{ background: c.jenis_kelamin === 'Laki-laki' ? 'var(--color-primary-light)' : 'var(--color-secondary-light)', color: c.jenis_kelamin === 'Laki-laki' ? 'var(--color-primary)' : 'var(--color-secondary)' }}>
                                <User size={20} />
                            </div>
                            <div className="list-item-content">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div className="list-item-title" style={{ fontSize: 'var(--font-size-sm)', fontWeight: 700 }}>{c.respondent_name}</div>
                                    <div style={{ fontSize: '10px', color: 'var(--color-text-tertiary)', fontWeight: 600 }}>{formatDate(c.collected_at)}</div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)', marginTop: 2 }}>
                                    <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>NIK: {c.nik}</span>
                                    <span style={{ color: 'var(--color-border)' }}>•</span>
                                    <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-primary)', fontWeight: 600 }}>{c.pekerjaan || 'Pekerjaan Umum'}</span>
                                </div>
                                <div className="list-item-subtitle" style={{ marginTop: 4 }}>
                                    <MapPin size={11} style={{ display: 'inline', verticalAlign: -1, color: 'var(--color-error)' }} /> {c.desa}, {c.kecamatan}
                                </div>
                            </div>
                            <div style={{ paddingLeft: 'var(--space-sm)', color: 'var(--color-text-tertiary)' }}>
                                <ChevronRight size={18} />
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <div style={{ height: 80 }} />
        </div>
    );
}
