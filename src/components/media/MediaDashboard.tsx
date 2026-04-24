import { useMemo, useState, useEffect } from 'react';
import { supabase, TABLES } from '../../lib/supabase';
import { 
    getSentimentLabel, 
    getSentimentColor, 
    formatTimeAgo 
} from '../../utils/helpers';
import { 
    Newspaper, 
    TrendingUp, 
    AlertTriangle, 
    Activity, 
    ChevronRight, 
    Search,
    BarChart3,
    Loader,
    Plus
} from 'lucide-react';
import { 
    Chart as ChartJS, 
    ArcElement, 
    Tooltip, 
    Legend, 
    CategoryScale, 
    LinearScale, 
    BarElement,
    LineElement,
    PointElement
} from 'chart.js';
import { Doughnut, Line } from 'react-chartjs-2';
import type { MediaMonitoring } from '../../types';

ChartJS.register(
    ArcElement, 
    Tooltip, 
    Legend, 
    CategoryScale, 
    LinearScale, 
    BarElement,
    LineElement,
    PointElement
);

interface Props {
    onAdd: () => void;
    onViewList: () => void;
    onManageKeywords: () => void;
    isAdmin: boolean;
    userId: string;
}

export default function MediaDashboard({ onAdd, onViewList, onManageKeywords, isAdmin, userId }: Props) {
    const [loading, setLoading] = useState(true);
    const [mediaItems, setMediaItems] = useState<MediaMonitoring[]>([]);

    useEffect(() => {
        fetchMedia();
    }, []);

    const fetchMedia = async () => {
        if (!supabase || !userId) return;
        setLoading(true);
        try {
            let query = supabase
                .from(TABLES.mediaMonitoring)
                .select('*');

            if (!isAdmin) {
                query = query.or(`reported_by.eq.${userId},category.eq.Automated`);
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

    const stats = useMemo(() => {
        const total = mediaItems.length;
        const positive = mediaItems.filter(m => m.sentiment === 'positive').length;
        const negative = mediaItems.filter(m => m.sentiment === 'negative').length;
        const crisis = mediaItems.filter(m => m.priority === 'crisis').length;

        return {
            total,
            posPercent: total > 0 ? Math.round((positive / total) * 100) : 0,
            negPercent: total > 0 ? Math.round((negative / total) * 100) : 0,
            crisis
        };
    }, [mediaItems]);

    const sentimentData = {
        labels: ['Positif', 'Netral', 'Negatif'],
        datasets: [{
            data: [
                mediaItems.filter(m => m.sentiment === 'positive').length,
                mediaItems.filter(m => m.sentiment === 'neutral').length,
                mediaItems.filter(m => m.sentiment === 'negative').length,
            ],
            backgroundColor: ['#6B8E5A', '#6B8FAD', '#C75B4A'],
            borderWidth: 0,
            cutout: '70%',
        }]
    };

    // Prepare trend data (last 7 days)
    const trendData = useMemo(() => {
        const days = Array.from({ length: 7 }, (_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - (6 - i));
            return d.toISOString().split('T')[0];
        });

        const posCounts = days.map(d => mediaItems.filter(m => m.sentiment === 'positive' && m.reported_at.startsWith(d)).length);
        const negCounts = days.map(d => mediaItems.filter(m => m.sentiment === 'negative' && m.reported_at.startsWith(d)).length);

        return {
            labels: days.map(d => new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })),
            datasets: [
                {
                    label: 'Positif',
                    data: posCounts,
                    borderColor: '#6B8E5A',
                    backgroundColor: 'rgba(107, 142, 90, 0.1)',
                    fill: true,
                    tension: 0.4,
                },
                {
                    label: 'Negatif',
                    data: negCounts,
                    borderColor: '#C75B4A',
                    backgroundColor: 'rgba(199, 91, 74, 0.1)',
                    fill: true,
                    tension: 0.4,
                }
            ]
        };
    }, [mediaItems]);

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
                <h2 className="section-title">Media Command Center</h2>
                <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                    {isAdmin && (
                        <button className="btn btn-secondary btn-sm" onClick={onManageKeywords}>
                            <Activity size={14} /> Keywords
                        </button>
                    )}
                    <button className="btn btn-primary btn-sm" onClick={onAdd}>
                        <Plus size={14} /> Tambah Data
                    </button>
                </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--space-sm)' }}>
                <div className="stat-card" style={{ padding: 'var(--space-sm)' }}>
                    <div className="stat-icon" style={{ background: 'var(--color-primary-light)', color: 'var(--color-primary-dark)', width: 32, height: 32 }}>
                        <Newspaper size={16} />
                    </div>
                    <div>
                        <div className="stat-value" style={{ fontSize: 'var(--font-size-md)' }}>{stats.total}</div>
                        <div className="stat-label" style={{ fontSize: 'var(--font-size-xs)' }}>Total Berita</div>
                    </div>
                </div>
                <div className="stat-card" style={{ padding: 'var(--space-sm)' }}>
                    <div className="stat-icon" style={{ background: 'var(--color-error-light)', color: 'var(--color-error)', width: 32, height: 32 }}>
                        <AlertTriangle size={16} />
                    </div>
                    <div>
                        <div className="stat-value" style={{ fontSize: 'var(--font-size-md)' }}>{stats.crisis}</div>
                        <div className="stat-label" style={{ fontSize: 'var(--font-size-xs)' }}>Krisis</div>
                    </div>
                </div>
                <div className="stat-card" style={{ padding: 'var(--space-sm)' }}>
                    <div className="stat-icon" style={{ background: 'var(--color-success-light)', color: 'var(--color-success)', width: 32, height: 32 }}>
                        <TrendingUp size={16} />
                    </div>
                    <div>
                        <div className="stat-value" style={{ fontSize: 'var(--font-size-md)' }}>{stats.posPercent}%</div>
                        <div className="stat-label" style={{ fontSize: 'var(--font-size-xs)' }}>Positif</div>
                    </div>
                </div>
                <div className="stat-card" style={{ padding: 'var(--space-sm)' }}>
                    <div className="stat-icon" style={{ background: 'var(--color-info-light)', color: 'var(--color-info)', width: 32, height: 32 }}>
                        <Activity size={16} />
                    </div>
                    <div>
                        <div className="stat-value" style={{ fontSize: 'var(--font-size-md)' }}>{stats.negPercent}%</div>
                        <div className="stat-label" style={{ fontSize: 'var(--font-size-xs)' }}>Negatif</div>
                    </div>
                </div>
            </div>

            {/* Sentiment Trend Chart */}
            <div className="card" style={{ marginBottom: 'var(--space-md)', padding: 'var(--space-md)' }}>
                <h3 className="card-title" style={{ fontSize: 'var(--font-size-sm)', marginBottom: 'var(--space-md)' }}>Tren Sentimen Media</h3>
                <div style={{ height: 180 }}>
                    <Line 
                        data={trendData} 
                        options={{ 
                            responsive: true, 
                            maintainAspectRatio: false,
                            plugins: { legend: { display: false } },
                            scales: { 
                                y: { beginAtZero: true, ticks: { font: { size: 10 } } },
                                x: { ticks: { font: { size: 10 } } }
                            }
                        }} 
                    />
                </div>
            </div>

            {/* Topic Clusters & Sentiment Distribution */}
            <div className="card" style={{ marginBottom: 'var(--space-md)', padding: 'var(--space-md)' }}>
                <div style={{ display: 'flex', gap: 'var(--space-md)', alignItems: 'center' }}>
                    <div style={{ width: 100, height: 100 }}>
                        <Doughnut data={sentimentData} options={{ plugins: { legend: { display: false } } }} />
                    </div>
                    <div style={{ flex: 1 }}>
                        <h4 style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600, marginBottom: 4 }}>Distribusi Sentimen</h4>
                        <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>
                            Mayoritas konten media minggu ini bersifat {stats.posPercent > stats.negPercent ? 'Positif' : 'Negatif'}.
                        </p>
                    </div>
                </div>
            </div>

            {/* Latest News Preview */}
            <div className="section-header" style={{ marginTop: 'var(--space-lg)' }}>
                <h3 className="card-title" style={{ fontSize: 'var(--font-size-sm)' }}>Berita Terbaru</h3>
                <button 
                    className="btn btn-ghost btn-sm" 
                    onClick={onViewList}
                    style={{ fontSize: 'var(--font-size-xs)', padding: 0 }}
                >
                    Lihat Semua <ChevronRight size={14} />
                </button>
            </div>

            <div className="latest-news-list">
                {mediaItems.slice(0, 3).map(m => (
                    <div key={m.id} className="list-item" style={{ padding: 'var(--space-sm)' }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: 600, fontSize: 'var(--font-size-xs)', marginBottom: 2 }}>{m.title}</div>
                            <div style={{ fontSize: '10px', color: 'var(--color-text-tertiary)' }}>
                                {m.media_name} • {formatTimeAgo(m.reported_at)}
                            </div>
                        </div>
                        <span className="badge" style={{ 
                            background: m.sentiment === 'positive' ? 'var(--color-success-light)' : 
                                       m.sentiment === 'negative' ? 'var(--color-error-light)' : 'var(--color-info-light)',
                            color: getSentimentColor(m.sentiment),
                            fontSize: '9px'
                        }}>
                            {getSentimentLabel(m.sentiment)}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}
