import { useState, useEffect } from 'react';
import { useApp } from '../../store/useApp';
import { useAuth } from '../../store/useAuth';
import { useActivityLog } from '../../store/useActivityLog';
import { useOfflineSync } from '../../store/useOfflineSync';
import { ArrowLeft, Send, Save, Check, MapPin, Camera, Navigation, Loader, User } from 'lucide-react';
import { capturePhoto, addWatermarkToImage } from '../../utils/camera';
import { getCurrentLocation, formatCoordinate, formatAccuracy } from '../../utils/geolocation';
import { submitSurveyResponse, uploadFile, supabase, TABLES } from '../../lib/supabase';
import { fetchProvinsi, fetchKabupaten, fetchKecamatan, fetchDesa, type Region } from '../../data/indonesiaData';
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

    // Region Data
    const [provList, setProvList] = useState<Region[]>([]);
    const [kabList, setKabList] = useState<Region[]>([]);
    const [kecList, setKecList] = useState<Region[]>([]);
    const [desaList, setDesaList] = useState<Region[]>([]);

    // New Respondent State
    const [newRespondent, setNewRespondent] = useState({
        nama: '', nik: '', no_kk: '', gender: 'Laki-laki', role_in_kk: 'Kepala Keluarga',
        phone: '', alamat: '', provinsi: '', kabupaten: '', kecamatan: '', desa: '',
        status_perkawinan: 'Kawin', pekerjaan: ''
    });

    const [biodata, setBiodata] = useState({
        nama: '', nik: '', no_kk: '', gender: 'Laki-laki', role_in_kk: 'Kepala Keluarga',
        phone: '', alamat: '', provinsi: '', kabupaten: '', kecamatan: '', desa: '',
        status_perkawinan: 'Kawin', pekerjaan: ''
    });
    
    const [ktpPhoto, setKtpPhoto] = useState('');
    const [respPhoto, setRespPhoto] = useState('');

    useEffect(() => {
        fetchFormData();
        fetchGPS();
        loadInitialRegions();
        if (user) {
            addLog(user.id, 'survey_started', `Survei dimulai untuk ${respondentId}`);
        }
    }, [respondentId, questionnaireId]);

    const loadInitialRegions = async () => {
        const provs = await fetchProvinsi();
        setProvList(provs);
    };

    const fetchFormData = async () => {
        if (!supabase) return;
        setLoading(true);
        try {
            let questData: Questionnaire | null = null;
            let respData: RespondentSample | null = null;

            if (respondentId === 'new') {
                const { data } = await supabase.from(TABLES.questionnaires).select('*').eq('id', questionnaireId).single();
                questData = data as Questionnaire;
            } else {
                const [
                    { data: resp },
                    { data: quest }
                ] = await Promise.all([
                    supabase.from(TABLES.respondentSamples).select('*').eq('id', respondentId).single(),
                    supabase.from(TABLES.questionnaires).select('*').eq('id', questionnaireId).single()
                ]);
                respData = resp as RespondentSample;
                questData = quest as Questionnaire;
            }

            setRespondent(respData);
            setQuestionnaire(questData);

            if (respData) {
                setBiodata({
                    nama: respData.nama || '',
                    nik: respData.nik || '',
                    no_kk: respData.no_kk || '',
                    gender: respData.gender || 'Laki-laki',
                    role_in_kk: respData.role_in_kk || 'Kepala Keluarga',
                    phone: respData.phone || '',
                    alamat: respData.alamat || '',
                    provinsi: respData.provinsi || '',
                    kabupaten: respData.kabupaten || '',
                    kecamatan: respData.kecamatan || '',
                    desa: respData.desa || '',
                    status_perkawinan: respData.status_perkawinan || 'Kawin',
                    pekerjaan: respData.pekerjaan || ''
                });
            } else {
                setNewRespondent(prev => ({
                    ...prev,
                    provinsi: user?.provinsi || '',
                    kabupaten: user?.kabupaten || '',
                    kecamatan: user?.kecamatan || '',
                    desa: user?.desa || ''
                }));
            }
        } catch (error) {
            console.error('Error fetching form data:', error);
            addToast('Gagal memuat kuesioner', 'error');
        } finally {
            setLoading(false);
        }
    };

    // Region Effect Chains for Biodata
    useEffect(() => {
        if (biodata.provinsi) {
            const pId = provList.find(p => p.name === biodata.provinsi)?.id;
            if (pId) fetchKabupaten(pId).then(setKabList);
        }
    }, [biodata.provinsi, provList]);

    useEffect(() => {
        if (biodata.kabupaten) {
            const kId = kabList.find(k => k.name === biodata.kabupaten)?.id;
            if (kId) fetchKecamatan(kId).then(setKecList);
        }
    }, [biodata.kabupaten, kabList]);

    useEffect(() => {
        if (biodata.kecamatan) {
            const kId = kecList.find(k => k.name === biodata.kecamatan)?.id;
            if (kId) fetchDesa(kId).then(setDesaList);
        }
    }, [biodata.kecamatan, kecList]);

    const fetchGPS = async () => {
        setGpsLoading(true);
        const loc = await getCurrentLocation();
        setGpsLocation(loc);
        setGpsLoading(false);
    };

    const handlePhoto = async (type: 'ktp' | 'respondent' | 'survey') => {
        try {
            const base64 = await capturePhoto();
            if (base64) {
                const watermarked = await addWatermarkToImage(base64, {
                    location: type.toUpperCase(),
                    coords: gpsLocation ? formatCoordinate(gpsLocation) : undefined
                });
                if (type === 'ktp') setKtpPhoto(watermarked);
                else if (type === 'respondent') setRespPhoto(watermarked);
                else setPhoto(watermarked);
            }
        } catch (error) {
            console.error('Photo error:', error);
            addToast('Gagal mengambil foto', 'error');
        }
    };

    const isVisible = (conditions?: BranchCondition[]) => {
        if (!conditions || conditions.length === 0) return true;
        return conditions.every(c => {
            const val = answers[c.questionId];
            if (Array.isArray(val)) return val.includes(c.value);
            return val === c.value;
        });
    };

    const handleSubmit = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!questionnaire) return;

        // Validation
        const requiredQuestions = questionnaire.questions.filter(q => q.required && isVisible(q.conditions));
        const missing = requiredQuestions.find(q => !answers[q.id]);
        if (missing) {
            addToast(`Pertanyaan "${missing.text}" wajib diisi`, 'error');
            return;
        }

        const visibleAnswers: Record<string, string | string[]> = {};
        questionnaire.questions.forEach(q => {
            if (isVisible(q.conditions) && answers[q.id] !== undefined) {
                visibleAnswers[q.id] = answers[q.id];
            }
        });

        setSubmitting(true);
        try {
            let finalRespondentId = respondentId;

            if (respondentId === 'new') {
                const { data: newResp, error: respError } = await supabase!.from(TABLES.respondentSamples).insert({
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
                if (uploadedUrl) surveyData.photo_url = uploadedUrl;
            }

            if (isOnline && supabase) {
                await submitSurveyResponse(surveyData);
                
                const updatePayload: any = { 
                    status: 'surveyed',
                    updated_at: new Date().toISOString()
                };

                if (ktpPhoto && ktpPhoto.startsWith('data:')) {
                    const url = await uploadFile('ktp-photos', `ktp_${finalRespondentId}_${Date.now()}.jpg`, ktpPhoto);
                    if (url) updatePayload.ktp_photo_url = url;
                }
                if (respPhoto && respPhoto.startsWith('data:')) {
                    const url = await uploadFile('profile-photos', `resp_${finalRespondentId}_${Date.now()}.jpg`, respPhoto);
                    if (url) updatePayload.respondent_photo_url = url;
                }

                if (respondentId !== 'new') {
                    updatePayload.nama = biodata.nama;
                    updatePayload.nik = biodata.nik;
                    updatePayload.no_kk = biodata.no_kk;
                    updatePayload.gender = biodata.gender;
                    updatePayload.role_in_kk = biodata.role_in_kk;
                    updatePayload.phone = biodata.phone;
                    updatePayload.alamat = biodata.alamat;
                    updatePayload.provinsi = biodata.provinsi;
                    updatePayload.kabupaten = biodata.kabupaten;
                    updatePayload.kecamatan = biodata.kecamatan;
                    updatePayload.desa = biodata.desa;
                    updatePayload.status_perkawinan = biodata.status_perkawinan;
                    updatePayload.pekerjaan = biodata.pekerjaan;
                }

                const { error: patchError } = await supabase.from(TABLES.respondentSamples).update(updatePayload).eq('id', finalRespondentId);
                if (patchError) throw patchError;

                addToast('Survei berhasil dikirim!', 'success');
            } else {
                enqueue('survey', surveyData);
                addToast('Survei disimpan offline', 'warning');
            }

            onBack();
        } catch (error: any) {
            console.error('Error submitting survey:', error);
            addToast(`Gagal mengirim survei: ${error.message}`, 'error');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return <div className="flex items-center justify-center h-full"><Loader className="spin-animation" /></div>;
    }

    if (!questionnaire) return null;

    return (
        <div className="page-enter">
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 'var(--space-lg)' }}>
                <button className="btn btn-icon btn-ghost" onClick={onBack}><ArrowLeft size={20} /></button>
                <div style={{ flex: 1 }}>
                    <h2 style={{ fontSize: 'var(--font-size-md)', fontWeight: 700 }}>{questionnaire.title}</h2>
                    <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>
                        {respondentId === 'new' ? 'Responden Baru' : `Responden: ${respondent?.nama}`}
                    </p>
                </div>
            </div>

            {/* Biodata Section */}
            <div className="card" style={{ marginBottom: 'var(--space-md)', borderLeft: '4px solid var(--color-primary)' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                    <div style={{ fontSize: '10px', fontWeight: 800, color: 'var(--color-primary)', letterSpacing: '0.5px' }}>VERIFIKASI BIODATA</div>
                    
                    <div className="form-group">
                        <label className="form-label" style={{ fontSize: '10px' }}>Nama Lengkap</label>
                        <input className="form-input form-input-sm" value={biodata.nama} onChange={e => setBiodata({...biodata, nama: e.target.value})} />
                    </div>

                    <div className="survey-biodata-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                        <div className="form-group">
                            <label className="form-label" style={{ fontSize: '10px' }}>NIK</label>
                            <input className="form-input form-input-sm" value={biodata.nik} onChange={e => setBiodata({...biodata, nik: e.target.value})} />
                        </div>
                        <div className="form-group">
                            <label className="form-label" style={{ fontSize: '10px' }}>No. KK</label>
                            <input className="form-input form-input-sm" value={biodata.no_kk} onChange={e => setBiodata({...biodata, no_kk: e.target.value})} />
                        </div>
                    </div>

                    <div style={{ padding: '12px', background: 'var(--color-background-alt)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                        <div style={{ fontSize: '9px', fontWeight: 800, color: 'var(--color-text-tertiary)', marginBottom: 8 }}>WILAYAH TUGAS</div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                            <select className="form-select form-select-sm" value={biodata.provinsi} onChange={e => setBiodata({...biodata, provinsi: e.target.value, kabupaten: '', kecamatan: '', desa: ''})} style={{ fontSize: '11px' }}>
                                <option value="">Provinsi</option>
                                {provList.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                            </select>
                            <select className="form-select form-select-sm" value={biodata.kabupaten} onChange={e => setBiodata({...biodata, kabupaten: e.target.value, kecamatan: '', desa: ''})} disabled={!biodata.provinsi} style={{ fontSize: '11px' }}>
                                <option value="">Kabupaten</option>
                                {kabList.map(k => <option key={k.id} value={k.name}>{k.name}</option>)}
                            </select>
                            <select className="form-select form-select-sm" value={biodata.kecamatan} onChange={e => setBiodata({...biodata, kecamatan: e.target.value, desa: ''})} disabled={!biodata.kabupaten} style={{ fontSize: '11px' }}>
                                <option value="">Kecamatan</option>
                                {kecList.map(k => <option key={k.id} value={k.name}>{k.name}</option>)}
                            </select>
                            <select className="form-select form-select-sm" value={biodata.desa} onChange={e => setBiodata({...biodata, desa: e.target.value})} disabled={!biodata.kecamatan} style={{ fontSize: '11px' }}>
                                <option value="">Desa</option>
                                {desaList.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            {/* Questions Section */}
            <form onSubmit={handleSubmit}>
                {questionnaire.questions.map((q, idx) => {
                    if (!isVisible(q.conditions)) return null;
                    return (
                        <div key={q.id} className="card" style={{ marginBottom: 'var(--space-md)', padding: 'var(--space-md)' }}>
                            <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', marginBottom: 4 }}>PERTANYAAN {idx + 1}</div>
                            <div style={{ fontWeight: 700, marginBottom: 'var(--space-md)', fontSize: 'var(--font-size-sm)' }}>{q.text} {q.required && <span style={{ color: 'var(--color-error)' }}>*</span>}</div>
                            
                            {q.type === 'text' && <input className="form-input" value={answers[q.id] || ''} onChange={e => setAnswers({...answers, [q.id]: e.target.value})} placeholder="Ketik jawaban..." />}
                            
                            {q.type === 'select' && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                    {q.options?.map(opt => (
                                        <button key={opt} type="button" className={`btn btn-block ${answers[q.id] === opt ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setAnswers({...answers, [q.id]: opt})} style={{ textAlign: 'left', justifyContent: 'flex-start', padding: '12px' }}>
                                            {opt}
                                        </button>
                                    ))}
                                </div>
                            )}

                            {q.type === 'multi_select' && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                    {q.options?.map(opt => {
                                        const current = (answers[q.id] as string[]) || [];
                                        const isSel = current.includes(opt);
                                        return (
                                            <button key={opt} type="button" className={`btn btn-block ${isSel ? 'btn-primary' : 'btn-secondary'}`} onClick={() => {
                                                const next = isSel ? current.filter(x => x !== opt) : [...current, opt];
                                                setAnswers({...answers, [q.id]: next});
                                            }} style={{ textAlign: 'left', justifyContent: 'flex-start', padding: '12px' }}>
                                                {opt}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    );
                })}

                <div className="card" style={{ marginBottom: 'var(--space-lg)', padding: 'var(--space-md)' }}>
                    <div style={{ fontWeight: 700, marginBottom: 'var(--space-sm)' }}>FOTO VALIDITAS</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                        <div className="photo-slot">
                            <div className="photo-preview">{ktpPhoto ? <img src={ktpPhoto} alt="KTP" /> : <div className="photo-placeholder">KTP</div>}</div>
                            <button type="button" className="btn btn-secondary btn-sm btn-block" onClick={() => handlePhoto('ktp')}><Camera size={12} /> KTP</button>
                        </div>
                        <div className="photo-slot">
                            <div className="photo-preview">{respPhoto ? <img src={respPhoto} alt="Responden" /> : <div className="photo-placeholder">Responden</div>}</div>
                            <button type="button" className="btn btn-secondary btn-sm btn-block" onClick={() => handlePhoto('respondent')}><Camera size={12} /> Responden</button>
                        </div>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)', marginBottom: 'var(--space-xl)' }}>
                    <button type="button" className="btn btn-secondary" onClick={onBack} disabled={submitting}>Batal</button>
                    <button type="submit" className="btn btn-primary" disabled={submitting}>
                        {submitting ? <Loader className="spin-animation" /> : <Send size={18} />}
                        {submitting ? ' Mengirim...' : ' Kirim Survei'}
                    </button>
                </div>
            </form>
        </div>
    );
}
