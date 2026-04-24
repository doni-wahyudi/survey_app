import React, { useState, useEffect } from 'react';
import { X, Save, Plus, Trash2, ChevronUp, ChevronDown, Loader, Check, GitBranch, Users, Search, MapPin, ChevronRight } from 'lucide-react';
import { supabase, TABLES, createNotification } from '../../lib/supabase';
import type { Questionnaire, Question, Profile, BranchCondition, RespondentSample } from '../../types';
import { useApp } from '../../store/useApp';
import { useAuth } from '../../store/useAuth';

interface Props {
    questionnaire: Questionnaire | null;
    onClose: () => void;
    onSave: (q: Questionnaire) => void;
}

export default function QuestionnaireBuilderModal({ questionnaire, onClose, onSave }: Props) {
    const { user } = useAuth();
    const { addToast } = useApp();
    const [activeTab, setActiveTab] = useState<'builder' | 'assignment'>('builder');
    const [submitting, setSubmitting] = useState(false);

    // Form State
    const [title, setTitle] = useState(questionnaire?.title || '');
    const [description, setDescription] = useState(questionnaire?.description || '');
    const [questions, setQuestions] = useState<Question[]>(questionnaire?.questions || []);
    
    // Assignment State
    const [assignedSurveyors, setAssignedSurveyors] = useState<string[]>(questionnaire?.assigned_surveyors || []);
    const [respondentAssignments, setRespondentAssignments] = useState<Record<string, string[]>>(questionnaire?.respondent_assignments || {});
    const [surveyors, setSurveyors] = useState<Profile[]>([]);
    const [respondents, setRespondents] = useState<RespondentSample[]>([]);
    const [loadingSurveyors, setLoadingSurveyors] = useState(false);
    
    // UI state for respondent selection
    const [selectingRespondentsFor, setSelectingRespondentsFor] = useState<string | null>(null);
    const [respondentSearch, setRespondentSearch] = useState('');

    // Filters
    const [filterKabupaten, setFilterKabupaten] = useState('');
    const [filterKecamatan, setFilterKecamatan] = useState('');

    useEffect(() => {
        if (activeTab === 'assignment' && surveyors.length === 0) {
            fetchData();
        }
    }, [activeTab]);

    const fetchData = async () => {
        if (!supabase) return;
        setLoadingSurveyors(true);
        try {
            const [surRes, respRes] = await Promise.all([
                supabase.from(TABLES.profiles).select('*').eq('role', 'surveyor'),
                supabase.from(TABLES.respondentSamples).select('*').order('nama')
            ]);
            
            if (surRes.error) throw surRes.error;
            if (respRes.error) throw respRes.error;
            
            setSurveyors((surRes.data || []) as Profile[]);
            setRespondents((respRes.data || []) as RespondentSample[]);
        } catch (error) {
            console.error('Error fetching data:', error);
            addToast('Gagal memuat data penugasan', 'error');
        } finally {
            setLoadingSurveyors(false);
        }
    };

    const addQuestion = (type: Question['type']) => {
        const newQ: Question = {
            id: `q_${Date.now()}`,
            text: '',
            type,
            required: true,
            options: ['select', 'radio', 'checkbox'].includes(type) ? ['Option 1'] : []
        };
        setQuestions([...questions, newQ]);
    };

    const updateQuestion = (id: string, updates: Partial<Question>) => {
        setQuestions(questions.map(q => q.id === id ? { ...q, ...updates } : q));
    };

    const removeQuestion = (id: string) => {
        setQuestions(questions.filter(q => q.id !== id));
    };

    const moveQuestion = (index: number, direction: 'up' | 'down') => {
        if (direction === 'up' && index === 0) return;
        if (direction === 'down' && index === questions.length - 1) return;
        const newQuestions = [...questions];
        const swapIndex = direction === 'up' ? index - 1 : index + 1;
        [newQuestions[index], newQuestions[swapIndex]] = [newQuestions[swapIndex], newQuestions[index]];
        setQuestions(newQuestions);
    };

    const addOption = (qId: string) => {
        setQuestions(questions.map(q => {
            if (q.id === qId) {
                return { ...q, options: [...(q.options || []), `Opsi ${(q.options?.length || 0) + 1}`] };
            }
            return q;
        }));
    };

    const addCondition = (qId: string) => {
        setQuestions(questions.map(q => {
            if (q.id === qId) {
                const newCond: BranchCondition = { questionId: '', operator: 'equals', value: '' };
                return { ...q, conditions: [...(q.conditions || []), newCond] };
            }
            return q;
        }));
    };

    const updateCondition = (qId: string, cIdx: number, updates: Partial<BranchCondition>) => {
        setQuestions(questions.map(q => {
            if (q.id === qId && q.conditions) {
                const newConds = [...q.conditions];
                newConds[cIdx] = { ...newConds[cIdx], ...updates };
                return { ...q, conditions: newConds };
            }
            return q;
        }));
    };

    const removeCondition = (qId: string, cIdx: number) => {
        setQuestions(questions.map(q => {
            if (q.id === qId && q.conditions) {
                return { ...q, conditions: q.conditions.filter((_, i) => i !== cIdx) };
            }
            return q;
        }));
    };

    const updateOption = (qId: string, optIndex: number, val: string) => {
        setQuestions(questions.map(q => {
            if (q.id === qId && q.options) {
                const newOpts = [...q.options];
                newOpts[optIndex] = val;
                return { ...q, options: newOpts };
            }
            return q;
        }));
    };

    const removeOption = (qId: string, optIndex: number) => {
        setQuestions(questions.map(q => {
            if (q.id === qId && q.options) {
                return { ...q, options: q.options.filter((_, i) => i !== optIndex) };
            }
            return q;
        }));
    };

    // Assignment Logic
    const filteredSurveyors = surveyors.filter(s => {
        if (filterKabupaten && s.kabupaten !== filterKabupaten) return false;
        if (filterKecamatan && s.kecamatan !== filterKecamatan) return false;
        return true;
    });

    const uniqueKabupaten = Array.from(new Set(surveyors.map(s => s.kabupaten).filter(Boolean)));
    const uniqueKecamatan = Array.from(new Set(surveyors.filter(s => !filterKabupaten || s.kabupaten === filterKabupaten).map(s => s.kecamatan).filter(Boolean)));

    const handleSelectAllFiltered = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            const newIds = new Set(assignedSurveyors);
            filteredSurveyors.forEach(s => newIds.add(s.id));
            setAssignedSurveyors(Array.from(newIds));
        } else {
            const filteredIds = new Set(filteredSurveyors.map(s => s.id));
            setAssignedSurveyors(assignedSurveyors.filter(id => !filteredIds.has(id)));
        }
    };

    const toggleSurveyor = (id: string) => {
        if (assignedSurveyors.includes(id)) {
            setAssignedSurveyors(assignedSurveyors.filter(sId => sId !== id));
            // Also clear their respondent assignments
            const newAssignments = { ...respondentAssignments };
            delete newAssignments[id];
            setRespondentAssignments(newAssignments);
        } else {
            setAssignedSurveyors([...assignedSurveyors, id]);
        }
    };

    const toggleRespondentForSurveyor = (surveyorId: string, respondentId: string) => {
        const current = respondentAssignments[surveyorId] || [];
        const next = current.includes(respondentId)
            ? current.filter(id => id !== respondentId)
            : [...current, respondentId];
        
        setRespondentAssignments({
            ...respondentAssignments,
            [surveyorId]: next
        });
    };

    const allFilteredSelected = filteredSurveyors.length > 0 && filteredSurveyors.every(s => assignedSurveyors.includes(s.id));

    const handleSave = async () => {
        if (!supabase) return;
        if (!title.trim()) {
            addToast('Judul kuesioner wajib diisi', 'error');
            return;
        }
        if (questions.length === 0) {
            addToast('Tambahkan minimal 1 pertanyaan', 'error');
            return;
        }

        setSubmitting(true);
        try {
            const payload = {
                title,
                description,
                questions,
                assigned_surveyors: assignedSurveyors,
                respondent_assignments: respondentAssignments,
                is_active: questionnaire ? questionnaire.is_active : true,
            };

            let data;
            if (questionnaire) {
                const res = await supabase.from(TABLES.questionnaires).update(payload).eq('id', questionnaire.id).select().single();
                if (res.error) throw res.error;
                data = res.data;
            } else {
                const res = await supabase.from(TABLES.questionnaires).insert({
                    ...payload,
                    created_by: user?.id
                }).select().single();
                if (res.error) throw res.error;
                data = res.data;
            }

            // Trigger notifications for newly assigned surveyors
            const previousAssignments = questionnaire?.assigned_surveyors || [];
            const newlyAssigned = assignedSurveyors.filter(id => !previousAssignments.includes(id));
            
            if (newlyAssigned.length > 0) {
                await Promise.all(newlyAssigned.map(id => 
                    createNotification(
                        id, 
                        'Penugasan Kuesioner Baru', 
                        `Anda telah ditugaskan untuk mengisi kuesioner: ${title}`, 
                        'info'
                    )
                ));
            }

            // Sync with respondent_samples table
            const assignmentPromises = Object.entries(respondentAssignments).map(([surveyorId, respondentIds]) => {
                if (respondentIds.length === 0 || !supabase) return Promise.resolve();
                return supabase.from(TABLES.respondentSamples)
                    .update({ assigned_surveyor: surveyorId })
                    .in('id', respondentIds);
            });
            await Promise.all(assignmentPromises);

            addToast('Kuesioner berhasil disimpan', 'success');
            onSave(data as Questionnaire);
            onClose();
        } catch (error: any) {
            console.error('Error saving questionnaire:', error);
            addToast(`Gagal menyimpan: ${error.message}`, 'error');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={() => !submitting && onClose()} style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.6)', zIndex: 1000,
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-md)'
        }}>
            <div className="modal-content card" onClick={e => e.stopPropagation()} style={{
                width: '100%', maxWidth: 800, padding: 0, maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--space-md)', borderBottom: '1px solid var(--color-border)' }}>
                    <h3 style={{ margin: 0 }}>{questionnaire ? 'Edit Kuesioner' : 'Buat Kuesioner Baru'}</h3>
                    <button className="btn-icon btn-ghost" onClick={onClose} disabled={submitting}>
                        <X size={20} />
                    </button>
                </div>

                <div style={{ display: 'flex', borderBottom: '1px solid var(--color-border)', background: 'var(--color-background-alt)' }}>
                    <button 
                        className={`btn-ghost ${activeTab === 'builder' ? 'active' : ''}`}
                        style={{ flex: 1, borderRadius: 0, borderBottom: activeTab === 'builder' ? '2px solid var(--color-primary)' : 'none', fontWeight: activeTab === 'builder' ? 600 : 400 }}
                        onClick={() => setActiveTab('builder')}
                    >
                        Builder Kuesioner
                    </button>
                    <button 
                        className={`btn-ghost ${activeTab === 'assignment' ? 'active' : ''}`}
                        style={{ flex: 1, borderRadius: 0, borderBottom: activeTab === 'assignment' ? '2px solid var(--color-primary)' : 'none', fontWeight: activeTab === 'assignment' ? 600 : 400 }}
                        onClick={() => setActiveTab('assignment')}
                    >
                        Penugasan Surveyor ({assignedSurveyors.length})
                    </button>
                </div>

                <div style={{ flex: 1, overflowY: 'auto', padding: 'var(--space-md)' }}>
                    {activeTab === 'builder' && (
                        <div className="animate-fade-in">
                            <div className="form-group">
                                <label className="form-label">Judul Kuesioner</label>
                                <input className="form-input" value={title} onChange={e => setTitle(e.target.value)} placeholder="Contoh: Survei Kepuasan" />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Deskripsi</label>
                                <textarea className="form-textarea" value={description} onChange={e => setDescription(e.target.value)} rows={2} placeholder="Tujuan survei..." />
                            </div>

                            <div style={{ marginTop: 'var(--space-lg)', marginBottom: 'var(--space-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h4 style={{ margin: 0 }}>Daftar Pertanyaan</h4>
                                <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                                    <button className="btn btn-secondary btn-sm" onClick={() => addQuestion('text')}><Plus size={14} /> Teks</button>
                                    <button className="btn btn-secondary btn-sm" onClick={() => addQuestion('select')}><Plus size={14} /> Pilihan</button>
                                </div>
                            </div>

                            {questions.length === 0 ? (
                                <div className="empty-state" style={{ padding: 'var(--space-xl)' }}>
                                    <p>Belum ada pertanyaan.</p>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                                    {questions.map((q, idx) => (
                                        <div key={q.id} className="card" style={{ padding: 'var(--space-md)', background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
                                            <div style={{ display: 'flex', gap: 'var(--space-sm)', marginBottom: 'var(--space-sm)' }}>
                                                <span style={{ fontWeight: 600, color: 'var(--color-primary)' }}>{idx + 1}.</span>
                                                <input 
                                                    className="form-input" 
                                                    style={{ flex: 1 }} 
                                                    value={q.text} 
                                                    onChange={e => updateQuestion(q.id, { text: e.target.value })}
                                                    placeholder="Teks Pertanyaan"
                                                />
                                                <select className="form-select" style={{ width: 140 }} value={q.type} onChange={e => updateQuestion(q.id, { type: e.target.value as Question['type'] })}>
                                                    <option value="text">Teks Pendek</option>
                                                    <option value="textarea">Teks Panjang</option>
                                                    <option value="select">Dropdown</option>
                                                    <option value="radio">Pilihan Ganda</option>
                                                    <option value="checkbox">Kotak Centang</option>
                                                    <option value="number">Angka</option>
                                                     <option value="matrix">Matriks/Tabel</option>
                                                </select>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                                    <button className="btn-icon btn-ghost" style={{ padding: 2, height: 'auto' }} onClick={() => moveQuestion(idx, 'up')} disabled={idx === 0}><ChevronUp size={16} /></button>
                                                    <button className="btn-icon btn-ghost" style={{ padding: 2, height: 'auto' }} onClick={() => moveQuestion(idx, 'down')} disabled={idx === questions.length - 1}><ChevronDown size={16} /></button>
                                                </div>
                                                <button className="btn-icon btn-ghost" style={{ color: 'var(--color-error)' }} onClick={() => removeQuestion(q.id)}>
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>

                                            <div style={{ paddingLeft: 24, marginBottom: 'var(--space-sm)' }}>
                                                <textarea 
                                                    className="form-textarea" 
                                                    style={{ fontSize: 'var(--font-size-xs)', minHeight: 40, padding: '4px 8px' }}
                                                    value={q.description || ''} 
                                                    onChange={e => updateQuestion(q.id, { description: e.target.value })}
                                                    placeholder="Instruksi/Penjelasan untuk surveyor (opsional)..."
                                                />
                                            </div>
                                            
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', paddingLeft: 24 }}>
                                                <div style={{ flex: 1 }}>
                                                    {['select', 'radio', 'checkbox'].includes(q.type) && (
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)', marginBottom: 'var(--space-sm)' }}>
                                                            {q.options?.map((opt, oIdx) => (
                                                                <div key={oIdx} style={{ display: 'flex', gap: 'var(--space-xs)', alignItems: 'center' }}>
                                                                    <div style={{ width: 16, height: 16, borderRadius: q.type === 'radio' ? '50%' : 2, border: '1px solid var(--color-border)', background: 'var(--color-background-alt)' }} />
                                                                    <input 
                                                                        className="form-input" 
                                                                        style={{ padding: '4px 8px', fontSize: 'var(--font-size-sm)' }} 
                                                                        value={opt}
                                                                        onChange={e => updateOption(q.id, oIdx, e.target.value)}
                                                                    />
                                                                    <button className="btn-icon btn-ghost" style={{ color: 'var(--color-error)', width: 24, height: 24 }} onClick={() => removeOption(q.id, oIdx)}>
                                                                        <X size={14} />
                                                                    </button>
                                                                </div>
                                                            ))}
                                                            <button className="btn-ghost" style={{ fontSize: 'var(--font-size-xs)', alignSelf: 'flex-start', padding: '4px 8px' }} onClick={() => addOption(q.id)}>
                                                                + Tambah Opsi
                                                            </button>
                                                        </div>
                                                    )}

                                                    {q.type === 'matrix' && (
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)', marginBottom: 'var(--space-sm)' }}>
                                                            <span style={{ fontSize: 'var(--font-size-xs)', fontWeight: 600 }}>Baris Matriks:</span>
                                                            {(q.matrixRows || []).map((row, rIdx) => (
                                                                <div key={rIdx} style={{ display: 'flex', gap: 'var(--space-xs)', alignItems: 'center' }}>
                                                                    <input 
                                                                        className="form-input" 
                                                                        style={{ padding: '4px 8px', fontSize: 'var(--font-size-sm)' }} 
                                                                        value={row}
                                                                        onChange={e => {
                                                                            const newRows = [...(q.matrixRows || [])];
                                                                            newRows[rIdx] = e.target.value;
                                                                            updateQuestion(q.id, { matrixRows: newRows });
                                                                        }}
                                                                    />
                                                                    <button className="btn-icon btn-ghost" style={{ color: 'var(--color-error)', width: 24, height: 24 }} onClick={() => {
                                                                        updateQuestion(q.id, { matrixRows: (q.matrixRows || []).filter((_, i) => i !== rIdx) });
                                                                    }}>
                                                                        <X size={14} />
                                                                    </button>
                                                                </div>
                                                            ))}
                                                            <button className="btn-ghost" style={{ fontSize: 'var(--font-size-xs)', alignSelf: 'flex-start', padding: '4px 8px' }} onClick={() => {
                                                                updateQuestion(q.id, { matrixRows: [...(q.matrixRows || []), `Baris ${(q.matrixRows?.length || 0) + 1}`] });
                                                            }}>
                                                                + Tambah Baris
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 'var(--font-size-xs)', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                                                    <input type="checkbox" checked={q.required} onChange={e => updateQuestion(q.id, { required: e.target.checked })} />
                                                    Wajib Diisi
                                                </label>
                                            </div>

                                            {/* Branching Conditions */}
                                            <div style={{ marginTop: 'var(--space-sm)', paddingTop: 'var(--space-sm)', borderTop: '1px dashed var(--color-border)' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                                                    <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: 4 }}>
                                                        <GitBranch size={12} /> Tampilkan hanya jika...
                                                    </span>
                                                    <button className="btn-ghost" style={{ fontSize: 'var(--font-size-xs)', padding: '2px 6px' }} onClick={() => addCondition(q.id)}>
                                                        + Tambah Kondisi
                                                    </button>
                                                </div>
                                                {(q.conditions || []).map((cond, cIdx) => (
                                                    <div key={cIdx} style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 4 }}>
                                                        <select className="form-select" style={{ flex: 2, fontSize: 'var(--font-size-xs)', padding: '4px 6px' }}
                                                            value={cond.questionId}
                                                            onChange={e => updateCondition(q.id, cIdx, { questionId: e.target.value })}>
                                                            <option value="">Pilih pertanyaan...</option>
                                                            {questions.filter(qq => qq.id !== q.id).map((qq, qIdx) => (
                                                                <option key={qq.id} value={qq.id}>Q{qIdx + 1}: {qq.text.slice(0, 40)}</option>
                                                            ))}
                                                        </select>
                                                        <select className="form-select" style={{ flex: 1, fontSize: 'var(--font-size-xs)', padding: '4px 6px' }}
                                                            value={cond.operator}
                                                            onChange={e => updateCondition(q.id, cIdx, { operator: e.target.value as BranchCondition['operator'] })}>
                                                            <option value="answered">dijawab</option>
                                                            <option value="equals">= (sama dengan)</option>
                                                            <option value="not_equals">≠ (tidak sama)</option>
                                                            <option value="contains">mengandung</option>
                                                        </select>
                                                        {cond.operator !== 'answered' && (
                                                            <input className="form-input" style={{ flex: 2, fontSize: 'var(--font-size-xs)', padding: '4px 8px' }}
                                                                placeholder="Nilai..."
                                                                value={cond.value}
                                                                onChange={e => updateCondition(q.id, cIdx, { value: e.target.value })} />
                                                        )}
                                                        <button className="btn-icon btn-ghost" style={{ color: 'var(--color-error)', width: 24, height: 24, flexShrink: 0 }}
                                                            onClick={() => removeCondition(q.id, cIdx)}><X size={12} /></button>
                                                    </div>
                                                ))}
                                                {(!q.conditions || q.conditions.length === 0) && (
                                                    <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-tertiary)', fontStyle: 'italic' }}>Selalu ditampilkan</span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'assignment' && (
                        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                            <div className="alert alert-info" style={{ marginBottom: 'var(--space-md)' }}>
                                Pilih surveyor yang diwajibkan untuk mengisi kuesioner ini. Jika tidak ada yang dipilih, kuesioner tidak akan muncul di aplikasi surveyor manapun.
                            </div>
                            
                            <div style={{ display: 'flex', gap: 'var(--space-md)', marginBottom: 'var(--space-md)' }}>
                                <select className="form-select" value={filterKabupaten} onChange={e => { setFilterKabupaten(e.target.value); setFilterKecamatan(''); }}>
                                    <option value="">Semua Kabupaten</option>
                                    {uniqueKabupaten.map(k => <option key={k} value={k}>{k}</option>)}
                                </select>
                                <select className="form-select" value={filterKecamatan} onChange={e => setFilterKecamatan(e.target.value)}>
                                    <option value="">Semua Kecamatan</option>
                                    {uniqueKecamatan.map(k => <option key={k} value={k}>{k}</option>)}
                                </select>
                            </div>

                            <div className="table-container" style={{ flex: 1, border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', overflow: 'hidden', position: 'relative' }}>
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th style={{ width: 40, textAlign: 'center' }}>
                                                <input 
                                                    type="checkbox" 
                                                    checked={allFilteredSelected} 
                                                    onChange={handleSelectAllFiltered}
                                                    disabled={filteredSurveyors.length === 0}
                                                />
                                            </th>
                                            <th>Surveyor</th>
                                            <th>Target Responden</th>
                                            <th style={{ textAlign: 'center' }}>Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {loadingSurveyors ? (
                                            <tr><td colSpan={4} style={{ textAlign: 'center', padding: 'var(--space-xl)' }}><Loader className="spin-animation" /></td></tr>
                                        ) : filteredSurveyors.length === 0 ? (
                                            <tr><td colSpan={4} style={{ textAlign: 'center', padding: 'var(--space-lg)' }}>Tidak ada surveyor yang cocok dengan filter</td></tr>
                                        ) : (
                                            filteredSurveyors.map(s => (
                                                <tr key={s.id}>
                                                    <td style={{ textAlign: 'center' }}>
                                                        <input type="checkbox" checked={assignedSurveyors.includes(s.id)} onChange={() => toggleSurveyor(s.id)} />
                                                    </td>
                                                    <td style={{ fontWeight: 500 }}>
                                                        <div>{s.full_name}</div>
                                                        <div style={{ fontSize: '10px', color: 'var(--color-text-tertiary)' }}>{s.email}</div>
                                                    </td>
                                                    <td>
                                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                                                            {(respondentAssignments[s.id] || []).length > 0 ? (
                                                                <span className="badge badge-info" style={{ fontSize: '10px' }}>
                                                                    {(respondentAssignments[s.id] || []).length} Responden
                                                                </span>
                                                            ) : (
                                                                <span style={{ fontSize: '10px', color: 'var(--color-text-tertiary)' }}>Belum ada target</span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td style={{ textAlign: 'center' }}>
                                                        <button 
                                                            className="btn btn-ghost btn-sm" 
                                                            disabled={!assignedSurveyors.includes(s.id)}
                                                            onClick={() => setSelectingRespondentsFor(s.id)}
                                                        >
                                                            Pilih Responden <ChevronRight size={14} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>

                                {/* Respondent Selection Pop-up Modal */}
                                {selectingRespondentsFor && (
                                    <div style={{
                                        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                                        background: 'rgba(0,0,0,0.6)', zIndex: 9999,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        padding: 'var(--space-md)'
                                    }}>
                                        <div className="animate-scale-in" style={{
                                            background: 'var(--color-surface)',
                                            width: '100%', maxWidth: 500, height: '80vh',
                                            display: 'flex', flexDirection: 'column',
                                            borderRadius: 'var(--radius-lg)',
                                            boxShadow: 'var(--shadow-lg)',
                                            border: '1px solid var(--color-border)',
                                            overflow: 'hidden'
                                        }}>
                                            <div style={{ padding: 'var(--space-md)', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--color-background-alt)' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                                    <div style={{ background: 'var(--color-primary-light)', padding: 8, borderRadius: '50%', color: 'var(--color-primary)' }}>
                                                        <Users size={20} />
                                                    </div>
                                                    <div>
                                                        <div style={{ fontWeight: 800, fontSize: 'var(--font-size-md)', color: 'var(--color-text-primary)' }}>Pilih Responden</div>
                                                        <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>Petugas: {surveyors.find(s => s.id === selectingRespondentsFor)?.full_name}</div>
                                                    </div>
                                                </div>
                                                <button className="btn-icon btn-ghost" onClick={() => setSelectingRespondentsFor(null)}>
                                                    <X size={20} style={{ color: 'var(--color-text-primary)' }} />
                                                </button>
                                            </div>
                                            
                                            <div style={{ padding: 'var(--space-md)', borderBottom: '1px solid var(--color-border)', background: 'var(--color-surface)' }}>
                                                <div className="search-bar" style={{ marginBottom: 0, border: '1px solid var(--color-border)' }}>
                                                    <Search size={16} className="search-icon" style={{ color: 'var(--color-text-tertiary)' }} />
                                                    <input 
                                                        placeholder="Cari nama atau wilayah..." 
                                                        value={respondentSearch} 
                                                        onChange={e => setRespondentSearch(e.target.value)} 
                                                        style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-primary)' }}
                                                    />
                                                </div>
                                            </div>

                                            <div style={{ flex: 1, overflowY: 'auto', padding: 'var(--space-sm)', background: 'var(--color-background-alt)' }}>
                                                {respondents
                                                    .filter(r => !respondentSearch || 
                                                        r.nama.toLowerCase().includes(respondentSearch.toLowerCase()) || 
                                                        (r.desa && r.desa.toLowerCase().includes(respondentSearch.toLowerCase())) ||
                                                        (r.kecamatan && r.kecamatan.toLowerCase().includes(respondentSearch.toLowerCase()))
                                                    )
                                                    .map(r => {
                                                        const isSelected = (respondentAssignments[selectingRespondentsFor] || []).includes(r.id);
                                                        return (
                                                            <div key={r.id} 
                                                                style={{ 
                                                                    padding: 'var(--space-md)', 
                                                                    marginBottom: 8, 
                                                                    display: 'flex', 
                                                                    alignItems: 'center', 
                                                                    gap: 'var(--space-md)',
                                                                    cursor: 'pointer',
                                                                    borderRadius: 'var(--radius-md)',
                                                                    background: isSelected ? 'var(--color-primary-light)' : 'var(--color-surface)',
                                                                    border: isSelected ? '1px solid var(--color-primary)' : '1px solid var(--color-border)',
                                                                    boxShadow: 'var(--shadow-sm)',
                                                                    transition: 'all 0.2s ease'
                                                                }}
                                                                onClick={() => toggleRespondentForSurveyor(selectingRespondentsFor, r.id)}
                                                            >
                                                                <div style={{ 
                                                                    width: 22, height: 22, 
                                                                    borderRadius: 6, 
                                                                    border: isSelected ? 'none' : '2px solid var(--color-border)', 
                                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                                    background: isSelected ? 'var(--color-primary)' : 'white'
                                                                }}>
                                                                    {isSelected && <Check size={14} style={{ color: 'white' }} />}
                                                                </div>
                                                                <div style={{ flex: 1 }}>
                                                                    <div style={{ fontSize: 'var(--font-size-sm)', fontWeight: 700, color: 'var(--color-text-primary)' }}>{r.nama || 'Tanpa Nama'}</div>
                                                                    <div style={{ fontSize: '10px', color: 'var(--color-text-tertiary)', display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                                                                        <MapPin size={10} /> {r.desa || '-'}, {r.kecamatan || '-'}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                            </div>

                                            <div style={{ padding: 'var(--space-md)', borderTop: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--color-surface)' }}>
                                                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', fontWeight: 600 }}>
                                                    {(respondentAssignments[selectingRespondentsFor] || []).length} Responden dipilih
                                                </div>
                                                <div style={{ display: 'flex', gap: 8 }}>
                                                    <button className="btn btn-secondary btn-sm" onClick={() => setSelectingRespondentsFor(null)}>Batal</button>
                                                    <button className="btn btn-primary btn-sm" onClick={() => setSelectingRespondentsFor(null)}>Terapkan</button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                <div style={{ padding: 'var(--space-md)', borderTop: '1px solid var(--color-border)', display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-sm)', background: 'var(--color-background)' }}>
                    <button className="btn btn-secondary" onClick={onClose} disabled={submitting}>Batal</button>
                    <button className="btn btn-primary" onClick={handleSave} disabled={submitting}>
                        {submitting ? <Loader size={16} className="spin-animation" /> : <Save size={16} />}
                        <span style={{ marginLeft: 8 }}>{submitting ? 'Menyimpan...' : 'Simpan Kuesioner'}</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
