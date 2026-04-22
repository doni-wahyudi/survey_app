import { useState, useEffect } from 'react';
import { useApp } from '../../store/useApp';
import { Plus, Edit2, ToggleLeft, ToggleRight, MessageCircle, Loader, Users, Trash2 } from 'lucide-react';
import { supabase, TABLES } from '../../lib/supabase';
import type { Questionnaire } from '../../types';
import QuestionnaireBuilderModal from './QuestionnaireBuilderModal';

export default function QuestionnaireManager() {
    const { addToast } = useApp();
    const [loading, setLoading] = useState(true);
    const [questionnaires, setQuestionnaires] = useState<Questionnaire[]>([]);
    
    const [showModal, setShowModal] = useState(false);
    const [editingQuestionnaire, setEditingQuestionnaire] = useState<Questionnaire | null>(null);

    useEffect(() => {
        fetchQuestionnaires();
    }, []);

    const fetchQuestionnaires = async () => {
        if (!supabase) return;
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from(TABLES.questionnaires)
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setQuestionnaires((data || []) as Questionnaire[]);
        } catch (error) {
            console.error('Error fetching questionnaires:', error);
            addToast('Gagal mengambil data kuesioner', 'error');
        } finally {
            setLoading(false);
        }
    };

    const toggleStatus = async (id: string, currentStatus: boolean) => {
        if (!supabase) return;
        try {
            const { error } = await supabase
                .from(TABLES.questionnaires)
                .update({ is_active: !currentStatus })
                .eq('id', id);

            if (error) throw error;
            
            setQuestionnaires(prev => prev.map(q => 
                q.id === id ? { ...q, is_active: !currentStatus } : q
            ));
            addToast(`Kuesioner ${!currentStatus ? 'diaktifkan' : 'dinonaktifkan'}`, 'success');
        } catch (error: any) {
            addToast(error.message || 'Gagal mengubah status', 'error');
        }
    };

    const handleDelete = async (id: string, title: string) => {
        if (!supabase) return;
        if (!window.confirm(`Hapus kuesioner "${title}"? Tindakan ini tidak dapat dibatalkan.`)) return;

        try {
            const { error } = await supabase
                .from(TABLES.questionnaires)
                .delete()
                .eq('id', id);

            if (error) throw error;

            setQuestionnaires(prev => prev.filter(q => q.id !== id));
            addToast('Kuesioner berhasil dihapus', 'success');
        } catch (error: any) {
            addToast(error.message || 'Gagal menghapus kuesioner', 'error');
        }
    };

    const handleSaveQuestionnaire = (savedData: Questionnaire) => {
        setQuestionnaires(prev => {
            const exists = prev.find(q => q.id === savedData.id);
            if (exists) {
                return prev.map(q => q.id === savedData.id ? savedData : q);
            }
            return [savedData, ...prev];
        });
    };

    const handleEdit = (q: Questionnaire) => {
        setEditingQuestionnaire(q);
        setShowModal(true);
    };

    const handleCreateNew = () => {
        setEditingQuestionnaire(null);
        setShowModal(true);
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
                <h2 className="section-title">Kelola Kuesioner</h2>
                <button className="btn btn-primary btn-sm" onClick={handleCreateNew}>
                    <Plus size={14} /> Buat Baru
                </button>
            </div>

            {questionnaires.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-state-icon"><MessageCircle size={32} /></div>
                    <h3>Belum ada kuesioner</h3>
                    <p>Mulai dengan membuat kuesioner baru.</p>
                </div>
            ) : (
                questionnaires.map(q => (
                    <div key={q.id} className="card" style={{ marginBottom: 'var(--space-md)', padding: 'var(--space-md)' }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                            <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 4 }}>
                                    <span style={{ fontWeight: 700, fontSize: 'var(--font-size-sm)' }}>{q.title}</span>
                                    <span className={`badge ${q.is_active ? 'badge-success' : 'badge-error'}`}>
                                        {q.is_active ? 'Aktif' : 'Nonaktif'}
                                    </span>
                                </div>
                                <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', marginBottom: 8 }}>
                                    {q.description}
                                </p>
                                <div style={{ display: 'flex', gap: 'var(--space-md)', fontSize: 'var(--font-size-xs)', color: 'var(--color-text-tertiary)' }}>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                        <MessageCircle size={12} /> {q.questions?.length || 0} pertanyaan
                                    </span>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                        <Users size={12} /> {q.assigned_surveyors?.length || 0} surveyor ditugaskan
                                    </span>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                                <button className="btn btn-icon btn-ghost btn-sm" onClick={() => handleEdit(q)} style={{ width: 32, height: 32 }}>
                                    <Edit2 size={14} />
                                </button>
                                <button
                                    className="btn btn-icon btn-ghost btn-sm"
                                    onClick={() => handleDelete(q.id, q.title)}
                                    style={{ width: 32, height: 32, color: 'var(--color-error)' }}
                                >
                                    <Trash2 size={14} />
                                </button>
                                <button
                                    className="btn-ghost"
                                    onClick={() => toggleStatus(q.id, q.is_active)}
                                    style={{ color: q.is_active ? 'var(--color-success)' : 'var(--color-text-tertiary)' }}
                                >
                                    {q.is_active ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
                                </button>
                            </div>
                        </div>

                        {/* Question Preview */}
                        <div style={{ marginTop: 'var(--space-md)', paddingTop: 'var(--space-sm)', borderTop: '1px solid var(--color-border-light)' }}>
                            {q.questions?.slice(0, 3).map((qq: any, idx: number) => (
                                <div key={qq.id} style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', marginBottom: 3, display: 'flex', gap: 4 }}>
                                    <span style={{ color: 'var(--color-primary)', fontWeight: 600 }}>{idx + 1}.</span>
                                    <span>{qq.text}</span>
                                    <span className="badge" style={{ fontSize: '0.6rem', padding: '1px 6px', background: 'var(--color-surface)', marginLeft: 'auto' }}>
                                        {qq.type}
                                    </span>
                                </div>
                            ))}
                            {q.questions?.length > 3 && (
                                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-primary)', fontWeight: 500, marginTop: 4 }}>
                                    +{q.questions.length - 3} pertanyaan lagi
                                </div>
                            )}
                        </div>
                    </div>
                ))
            )}

            {/* Builder & Assignment Modal */}
            {showModal && (
                <QuestionnaireBuilderModal 
                    questionnaire={editingQuestionnaire}
                    onClose={() => setShowModal(false)}
                    onSave={handleSaveQuestionnaire}
                />
            )}
        </div>
    );
}
