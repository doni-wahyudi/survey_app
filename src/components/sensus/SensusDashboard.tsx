import { useMemo } from 'react';
import { Users, UserCheck, Map as MapIcon, TrendingUp, PieChart as PieIcon, BarChart3 } from 'lucide-react';
import type { CensusData } from '../../types';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

interface Props {
    data: CensusData[];
    onAdd: () => void;
    onViewList: () => void;
}

export default function SensusDashboard({ data, onAdd, onViewList }: Props) {
    const stats = useMemo(() => {
        const total = data.length;
        const male = data.filter(c => c.jenis_kelamin === 'Laki-laki').length;
        const female = data.filter(c => c.jenis_kelamin === 'Perempuan').length;
        
        // Group by jobs (top 5)
        const jobCounts: Record<string, number> = {};
        data.forEach(c => {
            const job = c.pekerjaan || 'Lainnya';
            jobCounts[job] = (jobCounts[job] || 0) + 1;
        });
        const topJobs = Object.entries(jobCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5);

        // Group by region (Kecamatan)
        const regionCounts: Record<string, number> = {};
        data.forEach(c => {
            if (c.kecamatan) {
                regionCounts[c.kecamatan] = (regionCounts[c.kecamatan] || 0) + 1;
            }
        });

        return { total, male, female, topJobs, regionCounts };
    }, [data]);

    const genderData = {
        labels: ['Laki-laki', 'Perempuan'],
        datasets: [
            {
                data: [stats.male, stats.female],
                backgroundColor: ['#3b82f6', '#ec4899'],
                borderWidth: 0,
            },
        ],
    };

    const regionData = {
        labels: Object.keys(stats.regionCounts).slice(0, 5),
        datasets: [
            {
                label: 'Jumlah Warga',
                data: Object.values(stats.regionCounts).slice(0, 5),
                backgroundColor: 'rgba(59, 130, 246, 0.6)',
                borderRadius: 4,
            },
        ],
    };

    return (
        <div className="page-enter">
            <div className="section-header">
                <h2 className="section-title">Dashboard Sensus</h2>
                <button className="btn btn-primary btn-sm" onClick={onAdd}>
                    <UserCheck size={14} /> Sensus Baru
                </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)', marginBottom: 'var(--space-lg)' }}>
                <div className="card" style={{ padding: 'var(--space-md)', borderLeft: '4px solid var(--color-primary)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', color: 'var(--color-text-tertiary)', fontSize: 'var(--font-size-xs)', marginBottom: 4 }}>
                        <Users size={14} /> TOTAL WARGA
                    </div>
                    <div style={{ fontSize: 'var(--font-size-xl)', fontWeight: 800 }}>{stats.total}</div>
                </div>
                <div className="card" style={{ padding: 'var(--space-md)', borderLeft: '4px solid var(--color-success)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', color: 'var(--color-text-tertiary)', fontSize: 'var(--font-size-xs)', marginBottom: 4 }}>
                        <MapIcon size={14} /> WILAYAH
                    </div>
                    <div style={{ fontSize: 'var(--font-size-xl)', fontWeight: 800 }}>{Object.keys(stats.regionCounts).length}</div>
                </div>
            </div>

            <div className="card" style={{ marginBottom: 'var(--space-lg)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 'var(--space-md)' }}>
                    <PieIcon size={18} style={{ color: 'var(--color-primary)' }} />
                    <h3 style={{ fontSize: 'var(--font-size-sm)', fontWeight: 700 }}>Distribusi Gender</h3>
                </div>
                <div style={{ height: 180, display: 'flex', justifyContent: 'center' }}>
                    <Pie data={genderData} options={{ maintainAspectRatio: false, plugins: { legend: { position: 'right' } } }} />
                </div>
            </div>

            <div className="card" style={{ marginBottom: 'var(--space-lg)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 'var(--space-md)' }}>
                    <BarChart3 size={18} style={{ color: 'var(--color-primary)' }} />
                    <h3 style={{ fontSize: 'var(--font-size-sm)', fontWeight: 700 }}>Top 5 Wilayah (Kecamatan)</h3>
                </div>
                <div style={{ height: 200 }}>
                    <Bar 
                        data={regionData} 
                        options={{ 
                            maintainAspectRatio: false, 
                            plugins: { legend: { display: false } },
                            scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
                        }} 
                    />
                </div>
            </div>

            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ padding: 'var(--space-md)', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ fontSize: 'var(--font-size-sm)', fontWeight: 700 }}>Pekerjaan Terbanyak</h3>
                    <button className="btn btn-ghost btn-xs" onClick={onViewList} style={{ fontSize: 10 }}>LIHAT SEMUA</button>
                </div>
                <div>
                    {stats.topJobs.length === 0 ? (
                        <div style={{ padding: 'var(--space-lg)', textAlign: 'center', color: 'var(--color-text-tertiary)', fontSize: 'var(--font-size-sm)' }}>
                            Belum ada data pekerjaan
                        </div>
                    ) : (
                        stats.topJobs.map(([job, count], index) => (
                            <div key={job} style={{ 
                                padding: 'var(--space-sm) var(--space-md)', 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: 'var(--space-md)',
                                background: index % 2 === 0 ? 'transparent' : 'var(--color-background-alt)'
                            }}>
                                <div style={{ 
                                    width: 24, height: 24, borderRadius: 'var(--radius-sm)', 
                                    background: 'var(--color-primary-light)', color: 'var(--color-primary)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: 10, fontWeight: 800
                                }}>
                                    {index + 1}
                                </div>
                                <div style={{ flex: 1, fontSize: 'var(--font-size-sm)', fontWeight: 500 }}>{job}</div>
                                <div style={{ fontSize: 'var(--font-size-sm)', fontWeight: 700, color: 'var(--color-primary)' }}>{count}</div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            <div style={{ padding: 'var(--space-xl) 0', textAlign: 'center' }}>
                <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-tertiary)' }}>
                    Data sensus diperbarui secara real-time dari laporan surveyor di lapangan.
                </p>
            </div>
        </div>
    );
}
