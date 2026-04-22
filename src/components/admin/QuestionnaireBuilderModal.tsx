import React, { useState, useEffect } from 'react';
import { X, Save, Plus, Trash2, ChevronUp, ChevronDown, Loader, Check, GitBranch } from 'lucide-react';
import { supabase, TABLES, createNotification } from '../../lib/supabase';
import type { Questionnaire, Question, Profile, BranchCondition } from '../../types';
import { useApp } from '../../store/useApp';

interface Props {
    questionnaire: Questionnaire | null;
    onClose: () => void;
    onSave: (q: Questionnaire) => void;
}

export default function QuestionnaireBuilderModal({ questionnaire, onClose, onSave }: Props) {
    const { addToast } = useApp();
    const [activeTab, setActiveTab] = useState<'builder' | 'assignment'>('builder');
    const [submitting, setSubmitting] = useState(false);

    // Form State
    const [title, setTitle] = useState(questionnaire?.title || '');
    const [description, setDescription] = useState(questionnaire?.description || '');
    const [questions, setQuestions] = useState<Question[]>(questionnaire?.questions || []);
    
    // Assignment State
    const [assignedSurveyors, setAssignedSurveyors] = useState<string[]>(questionnaire?.assigned_surveyors || []);
    const [surveyors, setSurveyors] = useState<Profile[]>([]);
    const [loadingSurveyors, setLoadingSurveyors] = useState(false);
    
    // Filters
    const [filterKabupaten, setFilterKabupaten] = useState('');
    const [filterKecamatan, setFilterKecamatan] = useState('');

    useEffect(() => {
        if (activeTab === 'assignment' && surveyors.length === 0) {
            fetchSurveyors();
        }
    }, [activeTab]);

    const fetchSurveyors = async () => {
        if (!supabase) return;
        setLoadingSurveyors(true);
        try {
            const { data, error } = await supabase
                .from(TABLES.profiles)
                .select('*')
                .eq('role', 'surveyor');
            if (error) throw error;
            setSurveyors((data || []) as Profile[]);
        } catch (error) {
            console.error('Error fetching surveyors:', error);
            addToast('Gagal memuat daftar surveyor', 'error');
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
        } else {
            setAssignedSurveyors([...assignedSurveyors, id]);
        }
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
                    created_by: (await supabase.auth.getUser()).data.user?.id
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

                            <div className="table-container" style={{ flex: 1, border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
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
                                            <th>Nama Surveyor</th>
                                            <th>Wilayah Tugas</th>
                                            <th style={{ textAlign: 'center' }}>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {loadingSurveyors ? (
                                            <tr><td colSpan={4} style={{ textAlign: 'center', padding: 'var(--space-xl)' }}><Loader className="spin-animation" /></td></tr>
                                        ) : filteredSurveyors.length === 0 ? (
                                            <tr><td colSpan={4} style={{ textAlign: 'center', padding: 'var(--space-lg)' }}>Tidak ada surveyor yang cocok dengan filter</td></tr>
                                        ) : (
                                            filteredSurveyors.map(s => (
                                                <tr key={s.id} onClick={() => toggleSurveyor(s.id)} style={{ cursor: 'pointer' }}>
                                                    <td style={{ textAlign: 'center' }} onClick={e => e.stopPropagation()}>
                                                        <input type="checkbox" checked={assignedSurveyors.includes(s.id)} onChange={() => toggleSurveyor(s.id)} />
                                                    </td>
                                                    <td style={{ fontWeight: 500 }}>{s.full_name}</td>
                                                    <td style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
                                                        {[s.kelurahan_desa, s.kecamatan, s.kabupaten].filter(Boolean).join(', ')}
                                                    </td>
                                                    <td style={{ textAlign: 'center' }}>
                                                        {assignedSurveyors.includes(s.id) ? (
                                                            <span className="badge badge-success"><Check size={12} style={{ marginRight: 4 }} /> Ditugaskan</span>
                                                        ) : (
                                                            <span className="badge" style={{ background: 'var(--color-background-alt)' }}>Belum</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
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
