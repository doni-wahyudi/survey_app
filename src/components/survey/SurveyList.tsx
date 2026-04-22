import { useState, useMemo, useEffect } from 'react';
import { useApp } from '../../store/useApp';
import { useAuth } from '../../store/useAuth';
import { getStatusLabel } from '../../utils/helpers';
import { Search, MapPin, ChevronRight, Filter, ClipboardCheck, Clock, XCircle, Loader, ArrowLeft, BookOpen, User, Users } from 'lucide-react';
import SurveyForm from './SurveyForm';
import { supabase, TABLES } from '../../lib/supabase';
import type { RespondentSample, Questionnaire } from '../../types';

export default function SurveyList() {
    const { user } = useAuth();
    const { addToast } = useApp();
    const [loading, setLoading] = useState(true);
    const [allRespondents, setAllRespondents] = useState<RespondentSample[]>([]);
    const [questionnaires, setQuestionnaires] = useState<Questionnaire[]>([]);
    const [selectedQuestionnaire, setSelectedQuestionnaire] = useState<Questionnaire | null>(null);
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
            const [respRes, questRes] = await Promise.all([
                supabase.from(TABLES.respondentSamples).select('*'),
                supabase.from(TABLES.questionnaires).select('*').eq('is_active', true).contains('assigned_surveyors', JSON.stringify([user.id]))
            ]);

            if (respRes.error) throw respRes.error;
            if (questRes.error) throw questRes.error;

            setAllRespondents((respRes.data || []) as RespondentSample[]);
            setQuestionnaires((questRes.data || []) as Questionnaire[]);
        } catch (error) {
            console.error('Error fetching survey data:', error);
            addToast('Gagal mengambil data survei', 'error');
        } finally {
            setLoading(false);
        }
    };

    const assignedRespondents = useMemo(() => {
        if (!selectedQuestionnaire || !user?.id) return [];
        const assignedIds = selectedQuestionnaire.respondent_assignments?.[user.id] || [];
        return allRespondents.filter(r => assignedIds.includes(r.id));
    }, [selectedQuestionnaire, allRespondents, user?.id]);

    const filtered = useMemo(() => {
        return assignedRespondents.filter(r => {
            const matchSearch = !search ||
                r.nama.toLowerCase().includes(search.toLowerCase()) ||
                r.desa.toLowerCase().includes(search.toLowerCase()) ||
                r.kecamatan.toLowerCase().includes(search.toLowerCase());
            const matchStatus = statusFilter === 'all' || r.status === statusFilter;
            return matchSearch && matchStatus;
        });
    }, [assignedRespondents, search, statusFilter]);

    const statusCounts = useMemo(() => ({
        all: assignedRespondents.length,
        pending: assignedRespondents.filter(r => r.status === 'pending').length,
        surveyed: assignedRespondents.filter(r => r.status === 'surveyed').length,
        rejected: assignedRespondents.filter(r => r.status === 'rejected').length,
    }), [assignedRespondents]);

    const handleStartSurvey = (respondentId: string) => {
        if (!selectedQuestionnaire) return;
        setActiveSurvey({ respondentId, questionnaireId: selectedQuestionnaire.id });
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

    if (loading) {
        return (
            <div className="flex items-center justify-center" style={{ minHeight: '60vh' }}>
                <Loader className="spin-animation" style={{ color: 'var(--color-primary)' }} />
            </div>
        );
    }

    // View 1: Questionnaire Selection
    if (!selectedQuestionnaire) {
        return (
            <div className="page-enter">
                <div className="section-header">
                    <h2 className="section-title">Tugas Kuesioner</h2>
                    <span className="badge badge-info">{questionnaires.length} Aktif</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                    {questionnaires.length === 0 ? (
                        <div className="empty-state">
                            <BookOpen size={48} style={{ opacity: 0.2, marginBottom: 16 }} />
                            <h3>Belum ada tugas</h3>
                            <p>Anda belum ditugaskan untuk kuesioner apapun.</p>
                        </div>
                    ) : (
                        questionnaires.map(q => {
                            const myTasks = (q.respondent_assignments?.[user?.id || ''] || []).length;
                            return (
                                <div key={q.id} className="card animate-scale-in" onClick={() => setSelectedQuestionnaire(q)} style={{ cursor: 'pointer', borderLeft: '4px solid var(--color-primary)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontWeight: 700, fontSize: 'var(--font-size-md)', marginBottom: 4 }}>{q.title}</div>
                                            <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', marginBottom: 12 }}>
                                                {q.description}
                                            </div>
                                            <div style={{ display: 'flex', gap: 12 }}>
                                                <div style={{ fontSize: '10px', color: 'var(--color-text-tertiary)', display: 'flex', alignItems: 'center', gap: 4 }}>
                                                    <Users size={12} /> {myTasks} Responden ditugaskan
                                                </div>
                                            </div>
                                        </div>
                                        <ChevronRight size={20} style={{ color: 'var(--color-text-tertiary)' }} />
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        );
    }

    // View 2: Respondent List for Selected Questionnaire
    return (
        <div className="page-enter">
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 'var(--space-lg)' }}>
                <button className="btn btn-icon btn-ghost" onClick={() => setSelectedQuestionnaire(null)}>
                    <ArrowLeft size={20} />
                </button>
                <div style={{ flex: 1 }}>
                    <h2 style={{ fontSize: 'var(--font-size-md)', fontWeight: 700 }}>{selectedQuestionnaire.title}</h2>
                    <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>Daftar Responden Tugas Anda</p>
                </div>
            </div>

            <div className="search-bar">
                <Search size={16} className="search-icon" />
                <input
                    placeholder="Cari nama atau wilayah..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            <div className="filter-pills">
                {[
                    { key: 'all', label: `Semua (${statusCounts.all})` },
                    { key: 'pending', label: `Belum (${statusCounts.pending})` },
                    { key: 'surveyed', label: `Selesai (${statusCounts.surveyed})` },
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
                    <div className="empty-state-icon"><User size={32} /></div>
                    <h3>Tidak ada responden</h3>
                    <p>Tidak ditemukan responden yang ditugaskan kepada Anda untuk kuesioner ini.</p>
                </div>
            ) : (
                filtered.map(r => (
                    <div
                        key={r.id}
                        className="list-item animate-slide-up"
                        onClick={() => r.status === 'pending' ? handleStartSurvey(r.id) : undefined}
                        style={{ cursor: r.status === 'pending' ? 'pointer' : 'default', borderLeft: r.status === 'surveyed' ? '4px solid var(--color-success)' : 'none' }}
                    >
                        <div className="list-item-avatar" style={{
                            background: r.status === 'surveyed' ? 'var(--color-success-light)' : undefined,
                            color: r.status === 'surveyed' ? 'var(--color-success)' : undefined,
                        }}>
                            {r.status === 'surveyed' ? <ClipboardCheck size={18} /> : <Clock size={18} />}
                        </div>
                        <div className="list-item-content">
                            <div className="list-item-title" style={{ fontWeight: 600 }}>{r.nama}</div>
                            <div className="list-item-subtitle" style={{ fontSize: '10px' }}>
                                <MapPin size={10} style={{ display: 'inline', verticalAlign: -1 }} /> {r.desa}, {r.kecamatan}
                            </div>
                        </div>
                        <div className="list-item-meta">
                            <span className={`badge ${r.status === 'surveyed' ? 'badge-success' : 'badge-warning'}`}>
                                {getStatusLabel(r.status)}
                            </span>
                            {r.status === 'pending' && <ChevronRight size={16} style={{ color: 'var(--color-text-tertiary)' }} />}
                        </div>
                    </div>
                ))
            )}

            <div style={{ marginTop: 'var(--space-xl)', textAlign: 'center' }}>
                <button className="btn btn-secondary btn-sm" style={{ width: '100%' }} onClick={() => setActiveSurvey({ respondentId: 'new', questionnaireId: selectedQuestionnaire.id })}>
                    + Responden Baru (Luar Daftar)
                </button>
            </div>
        </div>
    );
}
