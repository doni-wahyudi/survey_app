import { useState } from 'react';
import { useAuth } from '../../store/useAuth';
import { useApp } from '../../store/useApp';
import { Save, Loader, Lock, Key } from 'lucide-react';
import { changePassword } from '../../lib/supabase';

interface Props {
    onBack?: () => void;
}

export default function ProfileEditor({ onBack }: Props) {
    const { user, updateProfile } = useAuth();
    const { addToast } = useApp();
    const [submitting, setSubmitting] = useState(false);
    const [pwdSubmitting, setPwdSubmitting] = useState(false);
    const [form, setForm] = useState({
        full_name: user?.full_name || '',
        pekerjaan: user?.pekerjaan || '',
        alamat: user?.alamat || '',
    });
    const [pwdForm, setPwdForm] = useState({
        newPassword: '',
        confirmPassword: ''
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

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        if (pwdForm.newPassword !== pwdForm.confirmPassword) {
            addToast('Konfirmasi password tidak cocok', 'error');
            return;
        }
        if (pwdForm.newPassword.length < 6) {
            addToast('Password minimal 6 karakter', 'error');
            return;
        }

        setPwdSubmitting(true);
        try {
            if (user) await changePassword(user.id, pwdForm.newPassword);
            addToast('Password berhasil diperbarui', 'success');
            setPwdForm({ newPassword: '', confirmPassword: '' });
        } catch (error: any) {
            addToast(error.message || 'Gagal memperbarui password', 'error');
        } finally {
            setPwdSubmitting(false);
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
            <div className="card" style={{ padding: 'var(--space-lg)' }}>
                <h3 style={{ marginBottom: 'var(--space-md)', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Save size={18} /> Edit Profil
                </h3>
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
                                Kembali
                            </button>
                        )}
                        <button type="submit" className="btn btn-primary" disabled={submitting}>
                            {submitting ? <Loader size={16} className="spin-animation" /> : <Save size={16} />}
                            <span style={{ marginLeft: 8 }}>{submitting ? 'Menyimpan...' : 'Simpan Profil'}</span>
                        </button>
                    </div>
                </form>
            </div>

            <div className="card" style={{ padding: 'var(--space-lg)', borderTop: '4px solid var(--color-warning)' }}>
                <h3 style={{ marginBottom: 'var(--space-md)', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Lock size={18} /> Ganti Kata Sandi
                </h3>
                <form onSubmit={handlePasswordChange}>
                    <div className="form-group">
                        <label className="form-label">Password Baru</label>
                        <input 
                            type="password"
                            className="form-input" 
                            value={pwdForm.newPassword} 
                            onChange={e => setPwdForm({...pwdForm, newPassword: e.target.value})}
                            placeholder="Min. 6 karakter"
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Konfirmasi Password Baru</label>
                        <input 
                            type="password"
                            className="form-input" 
                            value={pwdForm.confirmPassword} 
                            onChange={e => setPwdForm({...pwdForm, confirmPassword: e.target.value})}
                            placeholder="Ulangi password baru"
                            required
                        />
                    </div>
                    <button type="submit" className="btn btn-warning" disabled={pwdSubmitting}>
                        {pwdSubmitting ? <Loader size={16} className="spin-animation" /> : <Key size={16} />}
                        <span style={{ marginLeft: 8 }}>{pwdSubmitting ? 'Memproses...' : 'Perbarui Password'}</span>
                    </button>
                </form>
            </div>
        </div>
    );
}
