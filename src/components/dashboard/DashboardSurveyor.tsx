import { useMemo, useState, useEffect } from 'react';
import { useAuth } from '../../store/useAuth';
import { formatTimeAgo } from '../../utils/helpers';
import { BarChart3, CheckCircle, Clock, XCircle, TrendingUp, Users, Newspaper, MessageSquare, Loader } from 'lucide-react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';
import { supabase, TABLES } from '../../lib/supabase';
import type { RespondentSample, SurveyResponse, MediaMonitoring, Aspiration, CensusData } from '../../types';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

export default function DashboardSurveyor() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<{
        respondents: RespondentSample[];
        responses: SurveyResponse[];
        media: MediaMonitoring[];
        aspirations: Aspiration[];
        census: CensusData[];
    }>({
        respondents: [],
        responses: [],
        media: [],
        aspirations: [],
        census: []
    });

    useEffect(() => {
        if (user?.id) {
            fetchSurveyorData();
        }
    }, [user?.id]);

    const fetchSurveyorData = async () => {
        if (!supabase || !user?.id) return;
        setLoading(true);

        try {
            const [
                { data: respondents },
                { data: responses },
                { data: media },
                { data: aspirations },
                { data: census }
            ] = await Promise.all([
                supabase.from(TABLES.respondentSamples).select('*').eq('assigned_surveyor', user.id),
                supabase.from(TABLES.surveyResponses).select('*').eq('surveyor_id', user.id),
                supabase.from(TABLES.mediaMonitoring).select('*').eq('reported_by', user.id),
                supabase.from(TABLES.aspirations).select('*').eq('reported_by', user.id),
                supabase.from(TABLES.censusData).select('*').eq('surveyor_id', user.id)
            ]);

            setData({
                respondents: (respondents || []) as RespondentSample[],
                responses: (responses || []) as SurveyResponse[],
                media: (media || []) as MediaMonitoring[],
                aspirations: (aspirations || []) as Aspiration[],
                census: (census || []) as CensusData[]
            });
        } catch (error) {
            console.error('Error fetching surveyor dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    const stats = useMemo(() => {
        const my = data.respondents;
        const pending = my.filter(r => r.status === 'pending').length;
        const surveyed = my.filter(r => r.status === 'surveyed').length;
        const rejected = my.filter(r => r.status === 'rejected').length;
        const total = my.length;
        const myResponses = data.responses.length;
        const myMedia = data.media.length;
        const myCensus = data.census.length;
        const myAspirations = data.aspirations.length;
        return { pending, surveyed, rejected, total, myResponses, myMedia, myCensus, myAspirations };
    }, [data]);

    const completionRate = stats.total > 0 ? Math.round((stats.surveyed / stats.total) * 100) : 0;

    // Doughnut chart data
    const doughnutData = {
        labels: ['Selesai', 'Menunggu', 'Ditolak'],
        datasets: [{
            data: [stats.surveyed, stats.pending, stats.rejected],
            backgroundColor: ['#6B8E5A', '#D4A04A', '#C75B4A'],
            borderWidth: 0,
            cutout: '70%',
        }]
    };

    // Activity data
    const barData = {
        labels: ['Survey', 'Media', 'Sensus', 'Aspirasi'],
        datasets: [{
            label: 'Total',
            data: [stats.myResponses, stats.myMedia, stats.myCensus, stats.myAspirations],
            backgroundColor: ['rgba(196,149,106,0.7)', 'rgba(107,143,173,0.7)', 'rgba(107,142,90,0.7)', 'rgba(212,132,90,0.7)'],
            borderRadius: 8,
            barThickness: 32,
        }]
    };

    const activities = useMemo(() => {
        const items = [
            ...data.responses.map(r => ({
                text: `Survei ke ${data.respondents.find(resp => resp.id === r.respondent_id)?.nama || 'responden'} selesai`,
                time: r.submitted_at || r.created_at,
            })),
            ...data.media.map(m => ({
                text: `Media monitoring: ${m.title}`,
                time: m.reported_at,
            })),
            ...data.aspirations.map(a => ({
                text: `Aspirasi: ${a.judul}`,
                time: a.created_at,
            })),
        ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 5);
        return items;
    }, [data]);

    if (loading) {
        return (
            <div className="flex items-center justify-center" style={{ minHeight: '60vh' }}>
                <Loader className="spin-animation" style={{ color: 'var(--color-primary)' }} />
            </div>
        );
    }

    return (
        <div className="page-enter">
            <div className="dashboard-greeting">
                <h2>Halo, {user?.full_name || 'Surveyor'} 👋</h2>
                <p>Berikut ringkasan aktivitas Anda</p>
            </div>

            {/* Progress Card */}
            <div className="card" style={{ marginBottom: 'var(--space-lg)', background: 'linear-gradient(135deg, var(--color-primary), var(--color-accent))', color: 'white', border: 'none' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)' }}>
                    <div>
                        <div style={{ fontSize: 'var(--font-size-sm)', opacity: 0.85 }}>Progress Survei</div>
                        <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 800 }}>{completionRate}%</div>
                    </div>
                    <TrendingUp size={32} style={{ opacity: 0.5 }} />
                </div>
                <div className="progress-bar" style={{ background: 'rgba(255,255,255,0.25)' }}>
                    <div className="progress-bar-fill" style={{ width: `${completionRate}%`, background: 'white' }} />
                </div>
                <div style={{ fontSize: 'var(--font-size-xs)', marginTop: 'var(--space-sm)', opacity: 0.8 }}>
                    {stats.surveyed} dari {stats.total} responden selesai
                </div>
            </div>

            {/* Stats Grid */}
            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'var(--color-warning-light)', color: 'var(--color-warning)' }}>
                        <Clock size={22} />
                    </div>
                    <div>
                        <div className="stat-value">{stats.pending}</div>
                        <div className="stat-label">Menunggu</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'var(--color-success-light)', color: 'var(--color-success)' }}>
                        <CheckCircle size={22} />
                    </div>
                    <div>
                        <div className="stat-value">{stats.surveyed}</div>
                        <div className="stat-label">Selesai</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'var(--color-error-light)', color: 'var(--color-error)' }}>
                        <XCircle size={22} />
                    </div>
                    <div>
                        <div className="stat-value">{stats.rejected}</div>
                        <div className="stat-label">Ditolak</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'var(--color-info-light)', color: 'var(--color-info)' }}>
                        <Users size={22} />
                    </div>
                    <div>
                        <div className="stat-value">{stats.total}</div>
                        <div className="stat-label">Total</div>
                    </div>
                </div>
            </div>

            {/* Charts */}
            <div className="card" style={{ marginBottom: 'var(--space-lg)' }}>
                <div className="card-header">
                    <span className="card-title">Status Survei</span>
                </div>
                <div style={{ maxWidth: 200, margin: '0 auto' }}>
                    {stats.total > 0 ? (
                        <Doughnut data={doughnutData} options={{ plugins: { legend: { position: 'bottom', labels: { padding: 16, usePointStyle: true, font: { family: 'Inter', size: 11 } } } }, maintainAspectRatio: true }} />
                    ) : (
                        <div style={{ textAlign: 'center', padding: 'var(--space-md)', color: 'var(--color-text-tertiary)', fontSize: 'var(--font-size-sm)' }}>
                            Belum ada penugasan
                        </div>
                    )}
                </div>
            </div>

            <div className="card" style={{ marginBottom: 'var(--space-lg)' }}>
                <div className="card-header">
                    <span className="card-title">Aktivitas per Fitur</span>
                </div>
                <div className="chart-container">
                    <Bar data={barData} options={{
                        responsive: true, maintainAspectRatio: false,
                        plugins: { legend: { display: false } },
                        scales: {
                            x: { grid: { display: false }, ticks: { font: { family: 'Inter', size: 11 } } },
                            y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.05)' }, ticks: { stepSize: 1, font: { family: 'Inter', size: 11 } } }
                        }
                    }} />
                </div>
            </div>

            {/* Activity Timeline */}
            <div className="card">
                <div className="card-header">
                    <span className="card-title">Aktivitas Terbaru</span>
                </div>
                {activities.length === 0 ? (
                    <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-tertiary)', textAlign: 'center', padding: 'var(--space-lg)' }}>
                        Belum ada aktivitas
                    </p>
                ) : (
                    <div className="activity-timeline">
                        {activities.map((a, i) => (
                            <div key={i} className="activity-item">
                                <div className="activity-time">{formatTimeAgo(a.time)}</div>
                                <div className="activity-text">{a.text}</div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
