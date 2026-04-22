import { useState } from 'react';
import { useAuth } from '../../store/useAuth';
import { useApp } from '../../store/useApp';
import { Save, Loader } from 'lucide-react';

interface Props {
    onBack?: () => void;
}

export default function ProfileEditor({ onBack }: Props) {
    const { user, updateProfile } = useAuth();
    const { addToast } = useApp();
    const [submitting, setSubmitting] = useState(false);
    const [form, setForm] = useState({
        full_name: user?.full_name || '',
        pekerjaan: user?.pekerjaan || '',
        alamat: user?.alamat || '',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        setSubmitting(true);
        try {
            await updateProfile({
                full_name: form.full_name,
                pekerjaan: form.pekerjaan,
                alamat: form.alamat,
            });
            addToast('Profil berhasil diperbarui', 'success');
        } catch (error: any) {
            addToast(error.message || 'Gagal memperbarui profil', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="card" style={{ padding: 'var(--space-lg)' }}>
            <h3 style={{ marginBottom: 'var(--space-md)' }}>Edit Profil</h3>
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label className="form-label">Nama Lengkap</label>
                    <input 
                        className="form-input" 
                        value={form.full_name} 
                        onChange={e => setForm({...form, full_name: e.target.value})} 
                    />
                </div>
                <div className="form-group">
                    <label className="form-label">Pekerjaan</label>
                    <input 
                        className="form-input" 
                        value={form.pekerjaan} 
                        onChange={e => setForm({...form, pekerjaan: e.target.value})} 
                    />
                </div>
                <div className="form-group">
                    <label className="form-label">Alamat</label>
                    <textarea 
                        className="form-textarea" 
                        value={form.alamat} 
                        onChange={e => setForm({...form, alamat: e.target.value})} 
                        rows={3} 
                    />
                </div>
                <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                    {onBack && (
                        <button type="button" className="btn btn-secondary" onClick={onBack} disabled={submitting}>
                            Batal
                        </button>
                    )}
                    <button type="submit" className="btn btn-primary" disabled={submitting}>
                        {submitting ? <Loader size={16} className="spin-animation" /> : <Save size={16} />}
                        <span style={{ marginLeft: 8 }}>{submitting ? 'Menyimpan...' : 'Simpan Profil'}</span>
                    </button>
                </div>
            </form>
        </div>
    );
}
