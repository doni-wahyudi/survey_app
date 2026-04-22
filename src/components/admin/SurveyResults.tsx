import { useMemo, useState, useEffect } from 'react';
import { formatDateTime, getStatusLabel } from '../../utils/helpers';
import { ClipboardCheck, Search, Download, MapPin, FileSpreadsheet, Loader } from 'lucide-react';
import { useApp } from '../../store/useApp';
import { useAuth } from '../../store/useAuth';
import { useActivityLog } from '../../store/useActivityLog';
import { exportSurveyResults, exportRespondents } from '../../utils/export';
import { supabase, TABLES } from '../../lib/supabase';
import type { SurveyResponse, RespondentSample, Questionnaire } from '../../types';

export default function SurveyResults() {
    const { addToast } = useApp();
    const { user } = useAuth();
    const { addLog } = useActivityLog();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<{
        responses: SurveyResponse[];
        respondents: RespondentSample[];
        questionnaires: Questionnaire[];
    }>({
        responses: [],
        respondents: [],
        questionnaires: []
    });
    const [search, setSearch] = useState('');
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [showExportMenu, setShowExportMenu] = useState(false);

    useEffect(() => {
        fetchResults();
    }, []);

    const fetchResults = async () => {
        if (!supabase) return;
        setLoading(true);
        try {
            const [
                { data: responses },
                { data: respondents },
                { data: questionnaires }
            ] = await Promise.all([
                supabase.from(TABLES.surveyResponses).select('*'),
                supabase.from(TABLES.respondentSamples).select('*'),
                supabase.from(TABLES.questionnaires).select('*')
            ]);

            setData({
                responses: (responses || []) as SurveyResponse[],
                respondents: (respondents || []) as RespondentSample[],
                questionnaires: (questionnaires || []) as Questionnaire[]
            });
        } catch (error) {
            console.error('Error fetching survey results:', error);
            addToast('Gagal mengambil hasil survei', 'error');
        } finally {
            setLoading(false);
        }
    };

    const results = useMemo(() => {
        return data.responses.map(r => {
            const respondent = data.respondents.find(resp => resp.id === r.respondent_id);
            const questionnaire = data.questionnaires.find(q => q.id === r.questionnaire_id);
            return { ...r, respondent, questionnaire };
        }).filter(r => {
            if (!search) return true;
            return r.respondent?.nama.toLowerCase().includes(search.toLowerCase()) ||
                r.questionnaire?.title.toLowerCase().includes(search.toLowerCase());
        });
    }, [data, search]);

    const handleExport = (type: 'survey' | 'respondent') => {
        if (type === 'survey') {
            exportSurveyResults(data.responses, data.respondents as any, data.questionnaires);
        } else if (type === 'respondent') {
            exportRespondents(data.respondents as any);
        }
        
        if (user) addLog(user.id, 'data_exported', `Export ${type === 'survey' ? 'hasil survei' : 'responden'}`);
        addToast(`File CSV berhasil diunduh!`, 'success');
        setShowExportMenu(false);
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
                <h2 className="section-title">Hasil Survei</h2>
                <div style={{ position: 'relative' }}>
                    <button className="btn btn-secondary btn-sm" onClick={() => setShowExportMenu(!showExportMenu)}>
                        <Download size={14} /> Export
                    </button>
                    {showExportMenu && (
                        <div style={{
                            position: 'absolute', top: '100%', right: 0, marginTop: 4,
                            background: 'white', borderRadius: 'var(--radius-md)',
                            boxShadow: 'var(--shadow-lg)', padding: 4, zIndex: 50,
                            minWidth: 180,
                        }}>
                            <button className="btn btn-ghost btn-sm btn-block" style={{ justifyContent: 'flex-start', padding: '8px 12px' }}
                                onClick={() => handleExport('survey')}>
                                <FileSpreadsheet size={14} /> Hasil Survei (CSV)
                            </button>
                            <button className="btn btn-ghost btn-sm btn-block" style={{ justifyContent: 'flex-start', padding: '8px 12px' }}
                                onClick={() => handleExport('respondent')}>
                                <FileSpreadsheet size={14} /> Responden (CSV)
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <div className="search-bar">
                <Search size={16} className="search-icon" />
                <input placeholder="Cari responden atau kuesioner..." value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>

            <div className="card" style={{ padding: 'var(--space-md)', marginBottom: 'var(--space-md)', background: 'var(--color-success-light)', border: 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', fontSize: 'var(--font-size-sm)', color: 'var(--color-success)' }}>
                    <ClipboardCheck size={18} />
                    <span><strong>{data.responses.length}</strong> survei telah dikumpulkan</span>
                </div>
            </div>

            {results.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-state-icon"><ClipboardCheck size={32} /></div>
                    <h3>Belum ada hasil</h3>
                    <p>Hasil survei akan muncul setelah surveyor mengirim jawaban.</p>
                </div>
            ) : (
                results.map(r => (
                    <div
                        key={r.id}
                        className="card"
                        style={{ marginBottom: 'var(--space-sm)', padding: 'var(--space-md)', cursor: 'pointer' }}
                        onClick={() => setExpandedId(expandedId === r.id ? null : r.id)}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                                <div style={{ fontWeight: 700, fontSize: 'var(--font-size-sm)' }}>
                                    {r.respondent?.nama || 'Unknown'}
                                </div>
                                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', marginTop: 2 }}>
                                    {r.questionnaire?.title}
                                </div>
                                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-tertiary)', marginTop: 2 }}>
                                    <MapPin size={10} style={{ display: 'inline', verticalAlign: -1 }} /> {r.respondent?.desa}, {r.respondent?.kecamatan}
                                </div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <span className="badge badge-success">{getStatusLabel(r.status)}</span>
                                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-tertiary)', marginTop: 4 }}>
                                    {formatDateTime(r.submitted_at || r.created_at)}
                                </div>
                            </div>
                        </div>

                        {/* Expanded answers */}
                        {expandedId === r.id && r.questionnaire && (
                            <div style={{ marginTop: 'var(--space-md)', paddingTop: 'var(--space-md)', borderTop: '1px solid var(--color-border-light)' }}>
                                {r.questionnaire.questions.map((q, idx) => (
                                    <div key={q.id} style={{ marginBottom: 'var(--space-sm)' }}>
                                        <div style={{ fontSize: 'var(--font-size-xs)', fontWeight: 600, color: 'var(--color-text-secondary)' }}>
                                            {idx + 1}. {q.text}
                                        </div>
                                        <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-primary)', marginTop: 2, paddingLeft: 'var(--space-md)' }}>
                                            {(() => {
                                                const ans = (r.answers as Record<string, string | string[]>)[q.id];
                                                return Array.isArray(ans) ? ans.join(', ') : (ans as string) || '-';
                                            })()}
                                        </div>
                                    </div>
                                ))}
                                {r.location && (
                                    <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-tertiary)', marginTop: 'var(--space-sm)' }}>
                                        📍 GPS: {r.location.lat.toFixed(4)}, {r.location.lng.toFixed(4)}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                ))
            )}
        </div>
    );
}
