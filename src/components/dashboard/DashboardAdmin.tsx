import { useMemo, useState, useEffect } from 'react';
import { formatDate } from '../../utils/helpers';
import { Users, ClipboardCheck, Newspaper, MessageSquare, TrendingUp, MapPin, BarChart3, Loader } from 'lucide-react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';
import { supabase, TABLES } from '../../lib/supabase';
import type { RespondentSample, SurveyResponse, MediaMonitoring, Aspiration, CensusData } from '../../types';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

export default function DashboardAdmin() {
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
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        if (!supabase) return;
        setLoading(true);

        try {
            const [
                { data: respondents },
                { data: responses },
                { data: media },
                { data: aspirations },
                { data: census }
            ] = await Promise.all([
                supabase.from(TABLES.respondentSamples).select('*'),
                supabase.from(TABLES.surveyResponses).select('*'),
                supabase.from(TABLES.mediaMonitoring).select('*'),
                supabase.from(TABLES.aspirations).select('*'),
                supabase.from(TABLES.censusData).select('*')
            ]);

            setData({
                respondents: (respondents || []) as RespondentSample[],
                responses: (responses || []) as SurveyResponse[],
                media: (media || []) as MediaMonitoring[],
                aspirations: (aspirations || []) as Aspiration[],
                census: (census || []) as CensusData[]
            });
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    const stats = useMemo(() => {
        const totalRespondents = data.respondents.length;
        const surveyed = data.respondents.filter(r => r.status === 'surveyed').length;
        const pending = data.respondents.filter(r => r.status === 'pending').length;
        const rejected = data.respondents.filter(r => r.status === 'rejected').length;
        const totalResponses = data.responses.length;
        const totalMedia = data.media.length;
        const totalCensus = data.census.length;
        const totalAspirations = data.aspirations.length;
        const assigned = data.respondents.filter(r => r.assigned_surveyor).length;
        const unassigned = data.respondents.filter(r => !r.assigned_surveyor).length;
        return { totalRespondents, surveyed, pending, rejected, totalResponses, totalMedia, totalCensus, totalAspirations, assigned, unassigned };
    }, [data]);

    // Region distribution
    const regionChartData = useMemo(() => {
        const counts: Record<string, number> = {};
        data.respondents.forEach(r => {
            const label = r.kabupaten || 'Lainnya';
            counts[label] = (counts[label] || 0) + 1;
        });
        return {
            labels: Object.keys(counts),
            datasets: [{
                label: 'Responden',
                data: Object.values(counts),
                backgroundColor: ['rgba(196,149,106,0.7)', 'rgba(212,132,90,0.7)', 'rgba(107,143,173,0.7)', 'rgba(107,142,90,0.7)'],
                borderRadius: 8,
                barThickness: 28,
            }]
        };
    }, [data.respondents]);

    // Surveyor performance
    const surveyorPerformance = useMemo(() => {
        const perf: Record<string, { total: number; done: number }> = {};
        data.respondents.forEach(r => {
            if (r.assigned_surveyor) {
                if (!perf[r.assigned_surveyor]) perf[r.assigned_surveyor] = { total: 0, done: 0 };
                perf[r.assigned_surveyor].total++;
                if (r.status === 'surveyed') perf[r.assigned_surveyor].done++;
            }
        });
        return perf;
    }, [data.respondents]);

    // Status doughnut
    const statusChartData = {
        labels: ['Selesai', 'Menunggu', 'Ditolak', 'Belum Ditugaskan'],
        datasets: [{
            data: [stats.surveyed, stats.pending, stats.rejected, stats.unassigned],
            backgroundColor: ['#6B8E5A', '#D4A04A', '#C75B4A', '#A89580'],
            borderWidth: 0,
            cutout: '70%',
        }]
    };

    const completionRate = stats.totalRespondents > 0 ? Math.round((stats.surveyed / stats.totalRespondents) * 100) : 0;

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
                <h2>Dashboard Admin</h2>
                <p>Ringkasan seluruh aktivitas survei</p>
            </div>

            {/* Summary */}
            <div className="card" style={{ marginBottom: 'var(--space-lg)', background: 'linear-gradient(135deg, var(--color-primary-dark), var(--color-primary))', color: 'white', border: 'none' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <div style={{ fontSize: 'var(--font-size-sm)', opacity: 0.85 }}>Total Penyelesaian</div>
                        <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 800 }}>{completionRate}%</div>
                        <div style={{ fontSize: 'var(--font-size-xs)', opacity: 0.7, marginTop: 4 }}>
                            {stats.surveyed}/{stats.totalRespondents} responden selesai
                        </div>
                    </div>
                    <BarChart3 size={36} style={{ opacity: 0.4 }} />
                </div>
                <div className="progress-bar" style={{ background: 'rgba(255,255,255,0.25)', marginTop: 'var(--space-md)' }}>
                    <div className="progress-bar-fill" style={{ width: `${completionRate}%`, background: 'white' }} />
                </div>
            </div>

            {/* Stats Grid */}
            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'rgba(196,149,106,0.15)', color: 'var(--color-primary-dark)' }}>
                        <Users size={22} />
                    </div>
                    <div>
                        <div className="stat-value">{stats.totalRespondents}</div>
                        <div className="stat-label">Responden</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'var(--color-success-light)', color: 'var(--color-success)' }}>
                        <ClipboardCheck size={22} />
                    </div>
                    <div>
                        <div className="stat-value">{stats.totalResponses}</div>
                        <div className="stat-label">Survei Masuk</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'var(--color-info-light)', color: 'var(--color-info)' }}>
                        <Newspaper size={22} />
                    </div>
                    <div>
                        <div className="stat-value">{stats.totalMedia}</div>
                        <div className="stat-label">Media</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'var(--color-warning-light)', color: 'var(--color-warning)' }}>
                        <MessageSquare size={22} />
                    </div>
                    <div>
                        <div className="stat-value">{stats.totalAspirations}</div>
                        <div className="stat-label">Aspirasi</div>
                    </div>
                </div>
            </div>

            {/* Status Chart */}
            <div className="card" style={{ marginBottom: 'var(--space-lg)' }}>
                <div className="card-header">
                    <span className="card-title">Status Responden</span>
                </div>
                <div style={{ maxWidth: 220, margin: '0 auto' }}>
                    {stats.totalRespondents > 0 ? (
                        <Doughnut data={statusChartData} options={{ plugins: { legend: { position: 'bottom', labels: { padding: 14, usePointStyle: true, font: { family: 'Inter', size: 11 } } } }, maintainAspectRatio: true }} />
                    ) : (
                        <div style={{ textAlign: 'center', padding: 'var(--space-md)', color: 'var(--color-text-tertiary)', fontSize: 'var(--font-size-sm)' }}>
                            Belum ada data
                        </div>
                    )}
                </div>
            </div>

            {/* Region Distribution */}
            <div className="card" style={{ marginBottom: 'var(--space-lg)' }}>
                <div className="card-header">
                    <span className="card-title">Distribusi per Wilayah</span>
                </div>
                <div className="chart-container">
                    {stats.totalRespondents > 0 ? (
                        <Bar data={regionChartData} options={{
                            responsive: true, maintainAspectRatio: false,
                            indexAxis: 'y',
                            plugins: { legend: { display: false } },
                            scales: {
                                x: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.05)' }, ticks: { stepSize: 2, font: { family: 'Inter', size: 10 } } },
                                y: { grid: { display: false }, ticks: { font: { family: 'Inter', size: 10 } } }
                            }
                        }} />
                    ) : (
                        <div style={{ textAlign: 'center', padding: 'var(--space-md)', color: 'var(--color-text-tertiary)', fontSize: 'var(--font-size-sm)' }}>
                            Belum ada data wilayah
                        </div>
                    )}
                </div>
            </div>

            {/* Surveyor Performance */}
            <div className="card">
                <div className="card-header">
                    <span className="card-title">Performa Surveyor</span>
                </div>
                {Object.keys(surveyorPerformance).length > 0 ? (
                    Object.entries(surveyorPerformance).map(([id, p]) => {
                        const rate = p.total > 0 ? Math.round((p.done / p.total) * 100) : 0;
                        return (
                            <div key={id} style={{ marginBottom: 'var(--space-md)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-size-sm)' }}>
                                    <span style={{ fontWeight: 600 }}>ID Surveyor: {id.slice(0, 8)}...</span>
                                    <span style={{ color: 'var(--color-text-secondary)' }}>{p.done}/{p.total} ({rate}%)</span>
                                </div>
                                <div className="progress-bar" style={{ marginTop: 4 }}>
                                    <div className="progress-bar-fill" style={{ width: `${rate}%` }} />
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <div style={{ textAlign: 'center', padding: 'var(--space-md)', color: 'var(--color-text-tertiary)', fontSize: 'var(--font-size-sm)' }}>
                        Belum ada penugasan surveyor
                    </div>
                )}
            </div>
        </div>
    );
}
