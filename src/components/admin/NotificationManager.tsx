import { useState, useEffect } from 'react';
import { useAuth } from '../../store/useAuth';
import { useApp } from '../../store/useApp';
import { Send, Bell, Info, AlertTriangle, CheckCircle, Loader, Users, MessageSquare } from 'lucide-react';
import { supabase, TABLES } from '../../lib/supabase';
import type { Profile } from '../../types';

export default function NotificationManager() {
    const { user } = useAuth();
    const { addToast } = useApp();
    const [submitting, setSubmitting] = useState(false);
    const [surveyors, setSurveyors] = useState<Profile[]>([]);
    
    const [form, setForm] = useState({
        title: '',
        message: '',
        type: 'info' as 'info' | 'success' | 'warning' | 'error' | 'task' | 'alert',
        recipient: 'all' as 'all' | string
    });

    useEffect(() => {
        fetchSurveyors();
    }, []);

    const fetchSurveyors = async () => {
        if (!supabase) return;
        const { data } = await supabase
            .from(TABLES.profiles)
            .select('*')
            .eq('role', 'surveyor')
            .order('full_name');
        setSurveyors(data || []);
    };

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.title || !form.message || !supabase || !user) return;

        setSubmitting(true);
        try {
            let recipients: string[] = [];
            
            if (form.recipient === 'all') {
                recipients = surveyors.map(s => s.id);
            } else {
                recipients = [form.recipient];
            }

            if (recipients.length === 0) {
                addToast('Tidak ada penerima yang ditemukan', 'warning');
                return;
            }

            const notifications = recipients.map(id => ({
                user_id: id,
                title: form.title,
                message: form.message,
                type: form.type,
                is_read: false
            }));

            const { error } = await supabase
                .from(TABLES.notifications)
                .insert(notifications);

            if (error) throw error;

            addToast(`Notifikasi berhasil dikirim ke ${recipients.length} orang`, 'success');
            setForm({ ...form, title: '', message: '' });
        } catch (error) {
            console.error('Error sending notifications:', error);
            addToast('Gagal mengirim notifikasi', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="page-enter">
            <div className="section-header">
                <h2 className="section-title">Broadcast Notifikasi</h2>
            </div>

            <div className="card" style={{ padding: 'var(--space-lg)' }}>
                <form onSubmit={handleSend}>
                    <div className="form-group">
                        <label className="form-label">Judul Notifikasi</label>
                        <input
                            type="text"
                            className="form-input"
                            placeholder="Contoh: Info Update Target"
                            value={form.title}
                            onChange={e => setForm({...form, title: e.target.value})}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Pesan</label>
                        <textarea
                            className="form-textarea"
                            placeholder="Tulis pesan lengkap di sini..."
                            value={form.message}
                            onChange={e => setForm({...form, message: e.target.value})}
                            required
                            rows={3}
                        />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
                        <div className="form-group">
                            <label className="form-label">Tipe</label>
                            <select 
                                className="form-select"
                                value={form.type}
                                onChange={e => setForm({...form, type: e.target.value as any})}
                            >
                                <option value="info">ℹ️ Informasi</option>
                                <option value="alert">🚨 Penting / Alert</option>
                                <option value="task">✅ Tugas Baru</option>
                                <option value="success">🎉 Apresiasi</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Penerima</label>
                            <select 
                                className="form-select"
                                value={form.recipient}
                                onChange={e => setForm({...form, recipient: e.target.value})}
                            >
                                <option value="all">📢 Semua Surveyor</option>
                                <optgroup label="Spesifik Surveyor">
                                    {surveyors.map(s => (
                                        <option key={s.id} value={s.id}>{s.full_name}</option>
                                    ))}
                                </optgroup>
                            </select>
                        </div>
                    </div>

                    <div style={{ marginTop: 'var(--space-lg)' }}>
                        <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
                            {submitting ? <Loader size={18} className="spin-animation" /> : <Send size={18} />}
                            {submitting ? ' Mengirim...' : ' Kirim Notifikasi'}
                        </button>
                    </div>
                </form>
            </div>

            {/* Preview Section */}
            <div style={{ marginTop: 'var(--space-xl)' }}>
                <h3 style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600, marginBottom: 'var(--space-md)' }}>Pratinjau</h3>
                <div className="card unread" style={{ 
                    borderLeft: `4px solid var(--color-${form.type === 'info' ? 'primary' : (form.type === 'alert' ? 'error' : (form.type === 'task' ? 'warning' : 'success'))})`,
                    padding: 'var(--space-md)'
                }}>
                    <div style={{ display: 'flex', gap: 'var(--space-md)' }}>
                        <div style={{ marginTop: 2 }}>
                            {form.type === 'alert' ? <AlertTriangle color="var(--color-error)" /> : <Bell color="var(--color-primary)" />}
                        </div>
                        <div>
                            <h4 style={{ margin: 0, fontSize: 'var(--font-size-sm)' }}>{form.title || 'Judul Notifikasi'}</h4>
                            <p style={{ margin: '4px 0 0', fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>
                                {form.message || 'Pesan notifikasi akan muncul di sini...'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
