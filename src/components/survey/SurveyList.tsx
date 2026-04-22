import { useState, useMemo, useEffect } from 'react';
import { useApp } from '../../store/useApp';
import { useAuth } from '../../store/useAuth';
import { getStatusLabel } from '../../utils/helpers';
import { Search, MapPin, ChevronRight, Filter, ClipboardCheck, Clock, XCircle, Loader } from 'lucide-react';
import SurveyForm from './SurveyForm';
import { supabase, TABLES } from '../../lib/supabase';
import type { RespondentSample, Questionnaire } from '../../types';

export default function SurveyList() {
    const { user } = useAuth();
    const { addToast } = useApp();
    const [loading, setLoading] = useState(true);
    const [respondents, setRespondents] = useState<RespondentSample[]>([]);
    const [questionnaires, setQuestionnaires] = useState<Questionnaire[]>([]);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [activeSurvey, setActiveSurvey] = useState<{ respondentId: string; questionnaireId: string } | null>(null);

    useEffect(() => {
        if (user?.id) {
            fetchData();
        }
    }, [user?.id]);

    const fetchData = async () => {
        if (!supabase || !user?.id) return;
        setLoading(true);

        try {
            const [
                { data: respData },
                { data: questData }
            ] = await Promise.all([
                supabase.from(TABLES.respondentSamples).select('*').eq('assigned_surveyor', user.id),
                supabase.from(TABLES.questionnaires).select('*').eq('is_active', true).contains('assigned_surveyors', JSON.stringify([user.id]))
            ]);

            setRespondents((respData || []) as RespondentSample[]);
            setQuestionnaires((questData || []) as Questionnaire[]);
        } catch (error) {
            console.error('Error fetching survey data:', error);
            addToast('Gagal mengambil data survei', 'error');
        } finally {
            setLoading(false);
        }
    };

    const filtered = useMemo(() => {
        return respondents.filter(r => {
            const matchSearch = !search ||
                r.nama.toLowerCase().includes(search.toLowerCase()) ||
                r.desa.toLowerCase().includes(search.toLowerCase()) ||
                r.kecamatan.toLowerCase().includes(search.toLowerCase());
            const matchStatus = statusFilter === 'all' || r.status === statusFilter;
            return matchSearch && matchStatus;
        });
    }, [respondents, search, statusFilter]);

    const statusCounts = useMemo(() => ({
        all: respondents.length,
        pending: respondents.filter(r => r.status === 'pending').length,
        surveyed: respondents.filter(r => r.status === 'surveyed').length,
        rejected: respondents.filter(r => r.status === 'rejected').length,
    }), [respondents]);

    const handleStartSurvey = (respondentId: string) => {
        const activeQ = questionnaires[0]; // Take the first active one
        if (!activeQ) {
            addToast('Tidak ada kuesioner aktif', 'error');
            return;
        }
        setActiveSurvey({ respondentId, questionnaireId: activeQ.id });
    };

    const handleStartGeneralSurvey = (questionnaireId: string) => {
        // Find if any respondent matches the area or just show a selector?
        // For now, allow general survey with a "new" flag
        setActiveSurvey({ respondentId: 'new', questionnaireId });
    };

    if (activeSurvey) {
        return (
            <SurveyForm
                respondentId={activeSurvey.respondentId}
                questionnaireId={activeSurvey.questionnaireId}
                onBack={() => {
                    setActiveSurvey(null);
                    fetchData(); // Refresh list after returning
                }}
            />
        );
    }

    const getStatusBadge = (status: string) => {
        const cls = status === 'surveyed' ? 'badge-success' : status === 'rejected' ? 'badge-error' : 'badge-warning';
        return <span className={`badge ${cls}`}>{getStatusLabel(status)}</span>;
    };

    const getStatusIcon = (status: string) => {
        if (status === 'surveyed') return <ClipboardCheck size={18} />;
        if (status === 'rejected') return <XCircle size={18} />;
        return <Clock size={18} />;
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
                <h2 className="section-title">Kuesioner Aktif</h2>
                <span className="badge badge-info">{questionnaires.length} ditugaskan</span>
            </div>

            <div className="card-grid" style={{ marginBottom: 'var(--space-lg)', overflowX: 'auto', display: 'flex', gap: 'var(--space-md)', paddingBottom: 'var(--space-sm)' }}>
                {questionnaires.length === 0 ? (
                    <div className="card" style={{ minWidth: 200, textAlign: 'center', opacity: 0.6 }}>
                        <p style={{ fontSize: 'var(--font-size-xs)' }}>Belum ada kuesioner</p>
                    </div>
                ) : (
                    questionnaires.map(q => (
                        <div key={q.id} className="card" style={{ minWidth: 260, flexShrink: 0, borderLeft: '4px solid var(--color-primary)' }}>
                            <div style={{ fontWeight: 600, marginBottom: 4 }}>{q.title}</div>
                            <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', marginBottom: 12, height: 32, overflow: 'hidden' }}>
                                {q.description || 'Tidak ada deskripsi'}
                            </div>
                            <div style={{ fontSize: '10px', color: 'var(--color-primary)', fontWeight: 600, marginBottom: 8 }}>{q.questions.length} Pertanyaan</div>
                            <button className="btn btn-primary btn-sm" style={{ width: '100%', fontSize: '10px', padding: '4px 0' }} onClick={() => handleStartGeneralSurvey(q.id)}>
                                Mulai
                            </button>
                        </div>
                    ))
                )}
            </div>

            <div className="section-header">
                <h2 className="section-title">Daftar Responden</h2>
                <span className="badge badge-primary">{respondents.length} total</span>
            </div>

            <div className="search-bar">
                <Search size={16} className="search-icon" />
                <input
                    placeholder="Cari nama, desa, kecamatan..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            <div className="filter-pills">
                {[
                    { key: 'all', label: `Semua (${statusCounts.all})` },
                    { key: 'pending', label: `Menunggu (${statusCounts.pending})` },
                    { key: 'surveyed', label: `Selesai (${statusCounts.surveyed})` },
                    { key: 'rejected', label: `Ditolak (${statusCounts.rejected})` },
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

            {filtered.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-state-icon"><Filter size={32} /></div>
                    <h3>Tidak ada data</h3>
                    <p>Tidak ditemukan responden yang sesuai filter.</p>
                </div>
            ) : (
                filtered.map(r => (
                    <div
                        key={r.id}
                        className="list-item"
                        onClick={() => r.status === 'pending' ? handleStartSurvey(r.id) : undefined}
                        style={{ cursor: r.status === 'pending' ? 'pointer' : 'default' }}
                    >
                        <div className="list-item-avatar" style={{
                            background: r.status === 'surveyed'
                                ? 'var(--color-success-light)'
                                : r.status === 'rejected'
                                    ? 'var(--color-error-light)'
                                    : undefined,
                            color: r.status === 'surveyed'
                                ? 'var(--color-success)'
                                : r.status === 'rejected'
                                    ? 'var(--color-error)'
                                    : undefined,
                        }}>
                            {getStatusIcon(r.status)}
                        </div>
                        <div className="list-item-content">
                            <div className="list-item-title">{r.nama}</div>
                            <div className="list-item-subtitle">
                                <MapPin size={12} style={{ display: 'inline', verticalAlign: -2 }} /> {r.desa}, {r.kecamatan}
                            </div>
                        </div>
                        <div className="list-item-meta">
                            {getStatusBadge(r.status)}
                            {r.status === 'pending' && <ChevronRight size={16} style={{ color: 'var(--color-text-tertiary)' }} />}
                        </div>
                    </div>
                ))
            )}
        </div>
    );
}
