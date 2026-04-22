import { useState, useEffect } from 'react';
import { useApp } from '../../store/useApp';
import { useAuth } from '../../store/useAuth';
import { useActivityLog } from '../../store/useActivityLog';
import { useOfflineSync } from '../../store/useOfflineSync';
import { ArrowLeft, Send, Save, Check, MapPin, Camera, Navigation, Loader } from 'lucide-react';
import { capturePhoto, addWatermarkToImage } from '../../utils/camera';
import { getCurrentLocation, formatCoordinate, formatAccuracy } from '../../utils/geolocation';
import { submitSurveyResponse, uploadFile, supabase, TABLES } from '../../lib/supabase';
import type { GeoLocation } from '../../utils/geolocation';
import type { RespondentSample, Questionnaire, BranchCondition } from '../../types';

interface Props {
    respondentId: string;
    questionnaireId: string;
    onBack: () => void;
}

export default function SurveyForm({ respondentId, questionnaireId, onBack }: Props) {
    const { addToast } = useApp();
    const { user } = useAuth();
    const { addLog } = useActivityLog();
    const { enqueue, isOnline } = useOfflineSync();

    const [loading, setLoading] = useState(true);
    const [respondent, setRespondent] = useState<RespondentSample | null>(null);
    const [questionnaire, setQuestionnaire] = useState<Questionnaire | null>(null);
    const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
    const [photo, setPhoto] = useState<string>('');
    const [submitting, setSubmitting] = useState(false);
    const [gpsLocation, setGpsLocation] = useState<GeoLocation | null>(null);
    const [gpsLoading, setGpsLoading] = useState(false);

    // New Respondent State (used if respondentId === 'new')
    const [newRespondent, setNewRespondent] = useState({
        nama: '',
        alamat: '',
        kabupaten: user?.kabupaten || '',
        kecamatan: user?.kecamatan || '',
        desa: user?.kelurahan_desa || ''
    });

    useEffect(() => {
        fetchFormData();
        fetchGPS();
        if (user) {
            addLog(user.id, 'survey_started', `Survei dimulai untuk ${respondentId}`);
        }
    }, [respondentId, questionnaireId]);

    const fetchFormData = async () => {
        if (!supabase) return;
        setLoading(true);
        try {
            if (respondentId === 'new') {
                const { data: quest } = await supabase.from(TABLES.questionnaires).select('*').eq('id', questionnaireId).single();
                setQuestionnaire(quest as Questionnaire);
            } else {
                const [
                    { data: resp },
                    { data: quest }
                ] = await Promise.all([
                    supabase.from(TABLES.respondentSamples).select('*').eq('id', respondentId).single(),
                    supabase.from(TABLES.questionnaires).select('*').eq('id', questionnaireId).single()
                ]);

                setRespondent(resp as RespondentSample);
                setQuestionnaire(quest as Questionnaire);
            }
        } catch (error) {
            console.error('Error fetching form data:', error);
            addToast('Gagal memuat form', 'error');
        } finally {
            setLoading(false);
        }
    };

    const fetchGPS = async () => {
        setGpsLoading(true);
        const loc = await getCurrentLocation();
        setGpsLocation(loc);
        setGpsLoading(false);
        if (loc && user) {
            addLog(user.id, 'gps_captured', `GPS: ${formatCoordinate(loc)}`);
        }
    };

    const setAnswer = (qId: string, value: string | string[]) => {
        setAnswers(prev => ({ ...prev, [qId]: value }));
    };

    const toggleCheckbox = (qId: string, option: string) => {
        const current = (answers[qId] as string[]) || [];
        const updated = current.includes(option)
            ? current.filter(v => v !== option)
            : [...current, option];
        setAnswer(qId, updated);
    };

    // Evaluate a single branch condition against current answers
    const evalCondition = (cond: BranchCondition): boolean => {
        const val = answers[cond.questionId];
        const strVal = Array.isArray(val) ? val.join(',') : (val || '');
        switch (cond.operator) {
            case 'answered':   return !!strVal;
            case 'equals':     return strVal === cond.value;
            case 'not_equals': return strVal !== cond.value;
            case 'contains':   return strVal.includes(cond.value);
            default:           return true;
        }
    };

    // A question is visible when it has no conditions OR all conditions pass
    const isVisible = (conditions?: BranchCondition[]): boolean => {
        if (!conditions || conditions.length === 0) return true;
        return conditions.every(evalCondition);
    };

    const handlePhoto = async () => {
        const p = await capturePhoto();
        if (p && respondent) {
            setSubmitting(true);
            try {
                // Get current location for watermark
                const loc = await getCurrentLocation();
                const coords = formatCoordinate(loc);
                const timestamp = new Date().toLocaleString('id-ID');
                
                // Apply watermark
                const watermarked = await addWatermarkToImage(p, {
                    coords,
                    timestamp,
                    respondentNo: respondent.id.slice(0, 8),
                    location: `${respondent.desa}, ${respondent.kecamatan}`,
                    surveyor: user?.full_name || user?.email
                });

                setPhoto(watermarked);
                addToast('Foto berhasil diambil dengan watermark', 'success');
                if (user) addLog(user.id, 'photo_captured', `Foto dokumentasi survei dengan watermark`);
            } catch (err) {
                console.error('Error applying watermark:', err);
                setPhoto(p); // Fallback to original
                addToast('Foto diambil (watermark gagal)', 'warning');
            } finally {
                setSubmitting(false);
            }
        }
    };

    const handleSubmit = async () => {
        if (!respondent || !questionnaire || !supabase) return;

        // Validate required questions (only visible ones)
        const unanswered = questionnaire.questions.filter(q => {
            if (!isVisible(q.conditions)) return false; // skip hidden
            if (!q.required) return false;
            const a = answers[q.id];
            if (!a) return true;
            if (Array.isArray(a) && a.length === 0) return true;
            if (typeof a === 'string' && !a.trim()) return true;
            return false;
        });

        if (unanswered.length > 0) {
            addToast(`${unanswered.length} pertanyaan wajib belum dijawab`, 'error');
            return;
        }

        // Only submit answers from visible questions
        const visibleAnswers: Record<string, string | string[]> = {};
        questionnaire.questions.forEach(q => {
            if (isVisible(q.conditions) && answers[q.id] !== undefined) {
                visibleAnswers[q.id] = answers[q.id];
            }
        });

        setSubmitting(true);

        try {
            let finalRespondentId = respondentId;

            // If it's a new respondent, create the record first
            if (respondentId === 'new') {
                const { data: newResp, error: respError } = await supabase.from(TABLES.respondentSamples).insert({
                    ...newRespondent,
                    status: 'surveyed',
                    assigned_surveyor: user?.id,
                }).select().single();

                if (respError) throw respError;
                finalRespondentId = newResp.id;
            }

            const surveyData = {
                questionnaire_id: questionnaireId,
                respondent_id: finalRespondentId,
                surveyor_id: user?.id || '',
                answers: visibleAnswers,
                location: gpsLocation ? { lat: gpsLocation.lat, lng: gpsLocation.lng } : null,
                photo_url: photo,
                status: 'submitted' as const,
                submitted_at: new Date().toISOString(),
                created_at: new Date().toISOString(),
            };

            if (photo && photo.startsWith('data:')) {
                const fileName = `survey/${user?.id}/${Date.now()}.jpg`;
                const uploadedUrl = await uploadFile('survey-photos', fileName, photo);
                if (uploadedUrl) {
                    surveyData.photo_url = uploadedUrl;
                }
            }

            if (isOnline && supabase) {
                await submitSurveyResponse(surveyData);
                
                // Update respondent status (only if it wasn't just created)
                if (respondentId !== 'new') {
                    await supabase
                        .from(TABLES.respondentSamples)
                        .update({ status: 'surveyed' })
                        .eq('id', respondentId);
                }

                addToast('Survei berhasil dikirim!', 'success');
            } else {
                enqueue('survey', surveyData);
                addToast('Survei disimpan offline — akan disinkronkan saat online', 'warning');
            }

            if (user) {
                const respName = respondentId === 'new' ? newRespondent.nama : respondent?.nama;
                addLog(user.id, 'survey_submitted', `Survei "${questionnaire.title}" untuk ${respName}${gpsLocation ? ` (GPS: ${formatCoordinate(gpsLocation)})` : ''}`);
            }

            onBack();
        } catch (error) {
            console.error('Error submitting survey:', error);
            addToast('Gagal mengirim survei. Menyimpan ke antrean offline...', 'warning');
            onBack();
        } finally {
            setSubmitting(false);
        }
    };

    const handleSaveDraft = () => {
        const draftData = {
            questionnaire_id: questionnaireId,
            respondent_id: respondentId,
            surveyor_id: user?.id,
            answers,
            location: gpsLocation ? { lat: gpsLocation.lat, lng: gpsLocation.lng } : null,
            photo_url: photo ? 'captured' : '',
            status: 'draft',
            created_at: new Date().toISOString(),
        };
        enqueue('survey', draftData);
        if (user) addLog(user.id, 'survey_saved_draft', `Draf survei disimpan`);
        addToast('Draf tersimpan', 'info');
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center" style={{ minHeight: '60vh' }}>
                <Loader className="spin-animation" style={{ color: 'var(--color-primary)' }} />
            </div>
        );
    }

    if ((respondentId !== 'new' && !respondent) || !questionnaire) {
        return <div className="empty-state"><h3>Data tidak ditemukan</h3></div>;
    }

    return (
        <div className="page-enter">
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 'var(--space-lg)' }}>
                <button className="btn btn-icon btn-ghost" onClick={onBack}>
                    <ArrowLeft size={20} />
                </button>
                <div style={{ flex: 1 }}>
                    <h2 style={{ fontSize: 'var(--font-size-md)', fontWeight: 700 }}>{questionnaire.title}</h2>
                    <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>
                        {respondentId === 'new' ? 'Responden Baru' : `Responden: ${respondent?.nama}`}
                    </p>
                </div>
            </div>

            {/* Respondent Info Card */}
            <div className="card" style={{ marginBottom: 'var(--space-md)', borderLeft: '4px solid var(--color-primary)' }}>
                {respondentId === 'new' ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                        <div style={{ fontSize: 'var(--font-size-xs)', fontWeight: 600, color: 'var(--color-primary)' }}>INPUT DATA RESPONDEN</div>
                        <input className="form-input" placeholder="Nama Lengkap" value={newRespondent.nama} onChange={e => setNewRespondent({...newRespondent, nama: e.target.value})} />
                        <input className="form-input" placeholder="Alamat / Desa" value={newRespondent.alamat} onChange={e => setNewRespondent({...newRespondent, alamat: e.target.value})} />
                    </div>
                ) : (
                    <>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 'var(--space-sm)' }}>
                            <MapPin size={14} style={{ color: 'var(--color-primary)' }} />
                            <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
                                {respondent?.desa}, {respondent?.kecamatan}, {respondent?.kabupaten}
                            </span>
                        </div>
                        <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-tertiary)' }}>
                            NIK: {respondent?.nik} • {respondent?.jenis_kelamin} • {respondent?.usia} tahun
                        </div>
                    </>
                )}
            </div>

            {/* GPS Location Card */}
            <div className="card" style={{
                marginBottom: 'var(--space-lg)',
                padding: 'var(--space-md)',
                background: gpsLocation ? 'var(--color-success-light)' : 'var(--color-warning-light)',
                border: 'none',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                        <Navigation size={16} style={{ color: gpsLocation ? 'var(--color-success)' : 'var(--color-warning)' }} />
                        <div>
                            <div style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600 }}>
                                {gpsLoading ? 'Mengambil lokasi...' :
                                 gpsLocation ? 'Lokasi GPS Terdeteksi' : 'GPS Tidak Tersedia'}
                            </div>
                            {gpsLocation && (
                                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', marginTop: 2 }}>
                                    📍 {formatCoordinate(gpsLocation)} ({formatAccuracy(gpsLocation)})
                                </div>
                            )}
                        </div>
                    </div>
                    <button
                        className="btn btn-secondary btn-sm"
                        onClick={fetchGPS}
                        disabled={gpsLoading}
                        style={{ fontSize: 'var(--font-size-xs)' }}
                    >
                        {gpsLoading ? <Loader size={12} className="spin-animation" /> : <Navigation size={12} />}
                        {gpsLoading ? '' : 'Refresh'}
                    </button>
                </div>
            </div>

            {/* Progress indicator */}
            {(() => {
                const visibleQs = questionnaire.questions.filter(q => isVisible(q.conditions));
                const answeredCount = visibleQs.filter(q => {
                    const a = answers[q.id];
                    return a && (Array.isArray(a) ? a.length > 0 : a.toString().trim() !== '');
                }).length;
                const pct = visibleQs.length > 0 ? Math.round((answeredCount / visibleQs.length) * 100) : 0;
                return (
                    <div style={{ marginBottom: 'var(--space-md)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', marginBottom: 4 }}>
                            <span>{answeredCount} / {visibleQs.length} pertanyaan dijawab</span>
                            <span>{pct}%</span>
                        </div>
                        <div style={{ height: 4, background: 'var(--color-border)', borderRadius: 2, overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${pct}%`, background: 'var(--color-primary)', borderRadius: 2, transition: 'width 0.3s ease' }} />
                        </div>
                    </div>
                );
            })()}

            {/* Questions */}
            {questionnaire.questions.map((q, idx) => {
                if (!isVisible(q.conditions)) return null;
                // Display number among visible questions only
                const visibleIdx = questionnaire.questions
                    .filter(qq => isVisible(qq.conditions))
                    .findIndex(qq => qq.id === q.id);

                return (
                <div key={q.id} className="survey-question" style={{ animation: 'fadeIn 0.2s ease' }}>
                    <div className="question-number">
                        {q.conditions && q.conditions.length > 0 && (
                            <span style={{ fontSize: '0.6rem', background: 'var(--color-info-light)', color: 'var(--color-info)', padding: '1px 5px', borderRadius: 4, marginRight: 6 }}>CABANG</span>
                        )}
                        Pertanyaan {visibleIdx + 1} {q.required && <span style={{ color: 'var(--color-error)' }}>*</span>}
                    </div>
                    <div className="question-text">{q.text}</div>
                    {q.description && <div className="question-description">{q.description}</div>}

                    {q.type === 'text' && (
                        <input className="form-input" placeholder="Ketik jawaban..."
                            value={(answers[q.id] as string) || ''}
                            onChange={(e) => setAnswer(q.id, e.target.value)} />
                    )}
                    {q.type === 'number' && (
                        <input className="form-input" type="number" placeholder="Masukkan angka"
                            value={(answers[q.id] as string) || ''}
                            onChange={(e) => setAnswer(q.id, e.target.value)} inputMode="numeric" />
                    )}
                    {q.type === 'textarea' && (
                        <textarea className="form-textarea" placeholder="Ketik jawaban..."
                            value={(answers[q.id] as string) || ''}
                            onChange={(e) => setAnswer(q.id, e.target.value)} rows={3} />
                    )}
                    {q.type === 'date' && (
                        <input className="form-input" type="date"
                            value={(answers[q.id] as string) || ''}
                            onChange={(e) => setAnswer(q.id, e.target.value)} />
                    )}
                    {q.type === 'select' && (
                        <select className="form-select"
                            value={(answers[q.id] as string) || ''}
                            onChange={(e) => setAnswer(q.id, e.target.value)}>
                            <option value="">Pilih jawaban</option>
                            {q.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                    )}
                    {q.type === 'radio' && (
                        <div className="radio-group">
                            {q.options?.map(opt => (
                                <div key={opt}
                                    className={`radio-option ${answers[q.id] === opt ? 'selected' : ''}`}
                                    onClick={() => setAnswer(q.id, opt)}>
                                    <div className="radio-dot" /><span>{opt}</span>
                                </div>
                            ))}
                        </div>
                    )}
                    {q.type === 'checkbox' && (
                        <div className="checkbox-group">
                            {q.options?.map(opt => {
                                const checked = ((answers[q.id] as string[]) || []).includes(opt);
                                return (
                                    <div key={opt}
                                        className={`checkbox-option ${checked ? 'selected' : ''}`}
                                        onClick={() => toggleCheckbox(q.id, opt)}>
                                        <div className="checkbox-box">{checked && <Check size={12} />}</div>
                                        <span>{opt}</span>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                    {q.type === 'matrix' && (
                        <div style={{ overflowX: 'auto', marginTop: 'var(--space-sm)' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--font-size-xs)' }}>
                                <thead>
                                    <tr>
                                        <th style={{ textAlign: 'left', padding: '4px 8px', borderBottom: '1px solid var(--color-border)' }}>Item</th>
                                        {q.options?.map(opt => (
                                            <th key={opt} style={{ padding: '4px 8px', borderBottom: '1px solid var(--color-border)', textAlign: 'center', whiteSpace: 'nowrap' }}>{opt}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {q.matrixRows?.map(row => {
                                        const rowKey = `${q.id}__${row}`;
                                        return (
                                            <tr key={row}>
                                                <td style={{ padding: '4px 8px', borderBottom: '1px solid var(--color-border-light)' }}>{row}</td>
                                                {q.options?.map(opt => (
                                                    <td key={opt} style={{ textAlign: 'center', padding: '4px 8px', borderBottom: '1px solid var(--color-border-light)' }}>
                                                        <input type="radio"
                                                            name={rowKey}
                                                            checked={(answers[rowKey] as string) === opt}
                                                            onChange={() => setAnswer(rowKey, opt)} />
                                                    </td>
                                                ))}
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
                );
            })}

            {/* Photo Evidence */}
            <div className="card" style={{ marginBottom: 'var(--space-lg)', textAlign: 'center' }}>
                <p style={{ fontSize: 'var(--font-size-sm)', marginBottom: 'var(--space-sm)', color: 'var(--color-text-secondary)' }}>
                    Foto Dokumentasi (opsional)
                </p>
                {photo ? (
                    <div style={{ marginBottom: 'var(--space-sm)' }}>
                        <img src={photo} alt="Evidence" style={{ width: '100%', borderRadius: 'var(--radius-md)', maxHeight: 200, objectFit: 'cover' }} />
                    </div>
                ) : null}
                <button className="btn btn-secondary btn-sm" onClick={handlePhoto}>
                    <Camera size={14} /> {photo ? 'Ganti Foto' : 'Ambil Foto'}
                </button>
            </div>

            {/* Offline Notice */}
            {!isOnline && (
                <div className="card" style={{
                    marginBottom: 'var(--space-md)',
                    padding: 'var(--space-sm) var(--space-md)',
                    background: 'var(--color-warning-light)',
                    border: 'none',
                    fontSize: 'var(--font-size-xs)',
                    color: 'var(--color-warning)',
                    textAlign: 'center',
                }}>
                    📡 Mode Offline — data akan disimpan lokal dan dikirim saat online
                </div>
            )}

            {/* Actions */}
            <div style={{ display: 'flex', gap: 'var(--space-md)', marginBottom: 'var(--space-xl)' }}>
                <button className="btn btn-secondary" onClick={handleSaveDraft} style={{ flex: 1 }}>
                    <Save size={16} /> Simpan Draf
                </button>
                <button className="btn btn-primary" onClick={handleSubmit} disabled={submitting} style={{ flex: 2 }}>
                    {submitting ? (
                        <div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />
                    ) : (
                        <><Send size={16} /> Kirim Survei</>
                    )}
                </button>
            </div>
        </div>
    );
}
