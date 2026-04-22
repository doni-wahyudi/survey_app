import { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../../store/useAuth';
import { getSentimentLabel, getSentimentColor, formatTimeAgo, truncate } from '../../utils/helpers';
import { Plus, Search, Newspaper, Tv, Radio, Globe, MessageCircle, Loader, Download } from 'lucide-react';
import { supabase, TABLES } from '../../lib/supabase';
import type { MediaMonitoring } from '../../types';
import MediaMonitoringForm from './MediaMonitoringForm';
import { exportMediaMonitoring } from '../../utils/export';

// Fix lucide-react import
import { Globe as GlobeIcon, Newspaper as NewspaperIcon, Tv as TvIcon, Radio as RadioIcon, MessageCircle as MessageCircleIcon } from 'lucide-react';

const SOURCE_ICONS: Record<string, any> = {
    online: GlobeIcon, print: NewspaperIcon, tv: TvIcon, radio: RadioIcon, social_media: MessageCircleIcon,
};

const SOURCE_LABELS: Record<string, string> = {
    online: 'Online', print: 'Cetak', tv: 'TV', radio: 'Radio', social_media: 'Sosmed',
};

export default function MediaMonitoringList() {
    const { user } = useAuth();
    const isAdmin = user?.role === 'admin';
    const [loading, setLoading] = useState(true);
    const [mediaItems, setMediaItems] = useState<MediaMonitoring[]>([]);
    const [showForm, setShowForm] = useState(false);
    const [search, setSearch] = useState('');
    const [sentimentFilter, setSentimentFilter] = useState('all');

    useEffect(() => {
        if (user?.id) {
            fetchMedia();
        }
    }, [user?.id, isAdmin]);

    const fetchMedia = async () => {
        if (!supabase || !user?.id) return;
        setLoading(true);
        try {
            let query = supabase
                .from(TABLES.mediaMonitoring)
                .select('*');
            
            if (!isAdmin) {
                query = query.eq('reported_by', user.id);
            }

            const { data, error } = await query.order('reported_at', { ascending: false });

            if (error) throw error;
            setMediaItems((data || []) as MediaMonitoring[]);
        } catch (error) {
            console.error('Error fetching media monitoring:', error);
        } finally {
            setLoading(false);
        }
    };

    const filtered = useMemo(() => {
        return mediaItems.filter(m => {
            const matchSearch = !search || m.title.toLowerCase().includes(search.toLowerCase()) || m.content.toLowerCase().includes(search.toLowerCase());
            const matchSentiment = sentimentFilter === 'all' || m.sentiment === sentimentFilter;
            return matchSearch && matchSentiment;
        });
    }, [mediaItems, search, sentimentFilter]);

    const handleExport = () => {
        exportMediaMonitoring(filtered);
    };

    if (showForm) return <MediaMonitoringForm onBack={() => {
        setShowForm(false);
        fetchMedia();
    }} />;

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
                <h2 className="section-title">Media Monitoring</h2>
                <div style={{ display: 'flex', gap: 8 }}>
                    {isAdmin && (
                        <button className="btn btn-secondary btn-sm" onClick={handleExport} disabled={filtered.length === 0}>
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
                <input placeholder="Cari berita..." value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>

            <div className="filter-pills">
                {[
                    { key: 'all', label: 'Semua' },
                    { key: 'positive', label: '😊 Positif' },
                    { key: 'neutral', label: 'Netral' },
                    { key: 'negative', label: '😟 Negatif' },
                ].map(f => (
                    <button key={f.key} className={`filter-pill ${sentimentFilter === f.key ? 'active' : ''}`} onClick={() => setSentimentFilter(f.key)}>
                        {f.label}
                    </button>
                ))}
            </div>

            {filtered.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-state-icon"><NewspaperIcon size={32} /></div>
                    <h3>Belum ada data</h3>
                    <p>Tambahkan media monitoring pertama Anda.</p>
                </div>
            ) : (
                filtered.map(m => {
                    const SourceIcon = SOURCE_ICONS[m.source] || GlobeIcon;
                    return (
                        <div key={m.id} className="card" style={{ marginBottom: 'var(--space-sm)', padding: 'var(--space-md)' }}>
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-sm)', marginBottom: 'var(--space-sm)' }}>
                                <div style={{
                                    width: 36, height: 36, borderRadius: 'var(--radius-sm)',
                                    background: 'var(--color-primary-light)', display: 'flex',
                                    alignItems: 'center', justifyContent: 'center',
                                    color: 'var(--color-primary-dark)', flexShrink: 0
                                }}>
                                    <SourceIcon size={18} />
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontWeight: 600, fontSize: 'var(--font-size-sm)', marginBottom: 2 }}>{m.title}</div>
                                    <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-tertiary)' }}>
                                        {SOURCE_LABELS[m.source]} • {m.media_name} • {formatTimeAgo(m.reported_at)}
                                    </div>
                                </div>
                                <span className="badge" style={{
                                    background: m.sentiment === 'positive' ? 'var(--color-success-light)' :
                                        m.sentiment === 'negative' ? 'var(--color-error-light)' : 'var(--color-info-light)',
                                    color: getSentimentColor(m.sentiment),
                                    flexShrink: 0
                                }}>
                                    {getSentimentLabel(m.sentiment)}
                                </span>
                            </div>
                            <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
                                {truncate(m.content, 120)}
                            </p>
                            {m.category && (
                                <span className="badge badge-primary" style={{ marginTop: 8 }}>{m.category}</span>
                            )}
                        </div>
                    );
                })
            )}
        </div>
    );
}
