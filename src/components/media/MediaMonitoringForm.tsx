import { useState } from 'react';
import { useApp } from '../../store/useApp';
import { useAuth } from '../../store/useAuth';
import { useOfflineSync } from '../../store/useOfflineSync';
import { useActivityLog } from '../../store/useActivityLog';
import { capturePhoto } from '../../utils/camera';
import { ArrowLeft, Send, Camera, Loader } from 'lucide-react';
import type { MediaSource, Sentiment } from '../../types';
import { supabase, TABLES } from '../../lib/supabase';

interface Props {
    onBack: () => void;
}

const SOURCES: { value: MediaSource; label: string }[] = [
    { value: 'online', label: 'Online' },
    { value: 'print', label: 'Cetak' },
    { value: 'tv', label: 'TV' },
    { value: 'radio', label: 'Radio' },
    { value: 'social_media', label: 'Media Sosial' },
];

const SENTIMENTS: { value: Sentiment; label: string; color: string }[] = [
    { value: 'positive', label: 'Positif', color: 'var(--color-success)' },
    { value: 'neutral', label: 'Netral', color: 'var(--color-info)' },
    { value: 'negative', label: 'Negatif', color: 'var(--color-error)' },
];

export default function MediaMonitoringForm({ onBack }: Props) {
    const { addToast } = useApp();
    const { user } = useAuth();
    const { isOnline, enqueue } = useOfflineSync();
    const { addLog } = useActivityLog();

    const [submitting, setSubmitting] = useState(false);
    const [form, setForm] = useState({
        title: '', source: '' as MediaSource, media_name: '',
        url: '', content: '', sentiment: '' as Sentiment, category: '', photo_url: ''
    });

    const handleChange = (field: string, value: string) => {
        setForm(prev => ({ ...prev, [field]: value }));
    };

    const handlePhoto = async () => {
        const p = await capturePhoto();
        if (p) {
            setForm(prev => ({ ...prev, photo_url: p }));
            addToast('Screenshot berhasil diambil', 'success');
        }
    };

    const handleSubmit = async () => {
        if (!form.title || !form.source || !form.content || !form.sentiment) {
            addToast('Mohon lengkapi data yang diperlukan', 'error');
            return;
        }

        setSubmitting(true);
        const mediaData = {
            ...form,
            reported_by: user?.id,
            reported_at: new Date().toISOString(),
            photo_url: form.photo_url ? 'captured' : '', // Handle base64 storage strategy
        };

        try {
            if (isOnline && supabase) {
                const { error } = await supabase.from(TABLES.mediaMonitoring).insert(mediaData);
                if (error) throw error;
                addToast('Media monitoring berhasil dikirim!', 'success');
            } else {
                enqueue('media', mediaData);
                addToast('Data disimpan offline', 'warning');
            }

            if (user) {
                addLog(user.id, 'media_monitoring_added', `Media: ${form.title}`);
            }
            onBack();
        } catch (error) {
            console.error('Error saving media monitoring:', error);
            addToast('Gagal mengirim data. Masuk ke antrean offline.', 'warning');
            enqueue('media', mediaData);
            onBack();
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="page-enter">
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 'var(--space-lg)' }}>
                <button className="btn btn-icon btn-ghost" onClick={onBack}>
                    <ArrowLeft size={20} />
                </button>
                <h2 style={{ fontSize: 'var(--font-size-md)', fontWeight: 700 }}>Tambah Media Monitoring</h2>
            </div>

            <div className="form-group">
                <label className="form-label">Judul Berita <span className="required">*</span></label>
                <input className="form-input" placeholder="Judul berita atau konten" value={form.title} onChange={(e) => handleChange('title', e.target.value)} />
            </div>

            <div className="form-group">
                <label className="form-label">Sumber Media <span className="required">*</span></label>
                <div className="filter-pills" style={{ flexWrap: 'wrap' }}>
                    {SOURCES.map(s => (
                        <button key={s.value} className={`filter-pill ${form.source === s.value ? 'active' : ''}`} onClick={() => handleChange('source', s.value)}>
                            {s.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="form-group">
                <label className="form-label">Nama Media</label>
                <input className="form-input" placeholder="Misal: Kompas, CNN Indonesia" value={form.media_name} onChange={(e) => handleChange('media_name', e.target.value)} />
            </div>

            <div className="form-group">
                <label className="form-label">URL</label>
                <input className="form-input" placeholder="https://..." value={form.url} onChange={(e) => handleChange('url', e.target.value)} type="url" />
            </div>

            <div className="form-group">
                <label className="form-label">Isi/Ringkasan Berita <span className="required">*</span></label>
                <textarea className="form-textarea" placeholder="Tulis ringkasan berita..." value={form.content} onChange={(e) => handleChange('content', e.target.value)} rows={4} />
            </div>

            <div className="form-group">
                <label className="form-label">Sentimen <span className="required">*</span></label>
                <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                    {SENTIMENTS.map(s => (
                        <div
                            key={s.value}
                            className={`radio-option ${form.sentiment === s.value ? 'selected' : ''}`}
                            onClick={() => handleChange('sentiment', s.value)}
                            style={{ flex: 1, justifyContent: 'center', borderColor: form.sentiment === s.value ? s.color : undefined }}
                        >
                            <span>{s.label}</span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="form-group">
                <label className="form-label">Kategori</label>
                <select className="form-select" value={form.category} onChange={(e) => handleChange('category', e.target.value)}>
                    <option value="">Pilih Kategori</option>
                    {['Politik', 'Ekonomi', 'Sosial', 'Infrastruktur', 'Kesehatan', 'Pendidikan', 'Lingkungan', 'Keamanan', 'Lainnya'].map(c => (
                        <option key={c} value={c}>{c}</option>
                    ))}
                </select>
            </div>

            {/* Photo */}
            <div className="card" style={{ textAlign: 'center', marginBottom: 'var(--space-lg)' }}>
                <p style={{ fontSize: 'var(--font-size-sm)', marginBottom: 'var(--space-sm)', color: 'var(--color-text-secondary)' }}>Screenshot/Foto</p>
                {form.photo_url && (
                    <img src={form.photo_url} alt="Media" style={{ width: '100%', borderRadius: 'var(--radius-md)', maxHeight: 180, objectFit: 'cover', marginBottom: 'var(--space-sm)' }} />
                )}
                <button className="btn btn-secondary btn-sm" onClick={handlePhoto}><Camera size={14} /> {form.photo_url ? 'Ganti' : 'Ambil'} Foto</button>
            </div>

            <button className="btn btn-primary btn-lg btn-block" onClick={handleSubmit} disabled={submitting} style={{ marginBottom: 'var(--space-xl)' }}>
                {submitting ? <Loader size={18} className="spin-animation" /> : <Send size={16} />}
                {submitting ? ' Mengirim...' : ' Kirim'}
            </button>
        </div>
    );
}
