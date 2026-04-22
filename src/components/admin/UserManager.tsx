import { useState, useEffect } from 'react';
import { useApp } from '../../store/useApp';
import { User, Shield, MapPin, Mail, Loader, UserPlus, X } from 'lucide-react';
import { supabase, TABLES, createInvitation } from '../../lib/supabase';
import type { Profile } from '../../types';

export default function UserManager() {
    const { addToast } = useApp();
    const [loading, setLoading] = useState(true);
    const [users, setUsers] = useState<Profile[]>([]);
    
    // Invitation Modal State
    const [showModal, setShowModal] = useState(false);
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteRole, setInviteRole] = useState<'surveyor' | 'admin'>('surveyor');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        if (!supabase) return;
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from(TABLES.profiles)
                .select('*')
                .order('role', { ascending: true })
                .order('full_name', { ascending: true });

            if (error) throw error;
            setUsers((data || []) as Profile[]);
        } catch (error) {
            console.error('Error fetching users:', error);
            addToast('Gagal mengambil data pengguna', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inviteEmail) return;

        setSubmitting(true);
        try {
            await createInvitation(inviteEmail, inviteRole);
            addToast('Undangan berhasil dibuat. Pengguna dapat mendaftar dengan email ini.', 'success');
            setShowModal(false);
            setInviteEmail('');
            setInviteRole('surveyor');
        } catch (error: any) {
            console.error('Error creating invitation:', error);
            addToast(`Gagal membuat undangan: ${error.message}`, 'error');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center" style={{ minHeight: '60vh' }}>
                <Loader className="spin-animation" style={{ color: 'var(--color-primary)' }} />
            </div>
        );
    }

    const admins = users.filter(u => u.role === 'admin');
    const surveyors = users.filter(u => u.role === 'surveyor');

    return (
        <div className="page-enter">
            <div className="section-header">
                <h2 className="section-title">Kelola Pengguna</h2>
                <button className="btn btn-primary btn-sm" onClick={() => setShowModal(true)}>
                    <UserPlus size={14} /> Undang
                </button>
            </div>

            {/* Admins Section */}
            {admins.length > 0 && (
                <div style={{ marginBottom: 'var(--space-lg)' }}>
                    <h3 style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 'var(--space-sm)' }}>Administrator</h3>
                    {admins.map(s => (
                        <div key={s.id} className="card" style={{ marginBottom: 'var(--space-sm)', padding: 'var(--space-md)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
                                <div className="list-item-avatar" style={{ background: 'var(--color-warning-light)', color: 'var(--color-warning)' }}>
                                    <Shield size={20} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 700, fontSize: 'var(--font-size-sm)' }}>{s.full_name || 'Tanpa Nama'}</div>
                                    <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                                        <Mail size={10} /> {s.email}
                                    </div>
                                </div>
                                <span className="badge badge-warning">Admin</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Surveyors Section */}
            <div>
                <h3 style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 'var(--space-sm)' }}>Surveyor / Enumerator</h3>
                {surveyors.length === 0 ? (
                    <div className="empty-state">
                        <p>Belum ada surveyor terdaftar.</p>
                    </div>
                ) : (
                    surveyors.map(s => (
                        <div key={s.id} className="card" style={{ marginBottom: 'var(--space-sm)', padding: 'var(--space-md)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
                                <div className="list-item-avatar">
                                    <User size={20} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 700, fontSize: 'var(--font-size-sm)' }}>{s.full_name || 'Tanpa Nama'}</div>
                                    <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                                        <Mail size={10} /> {s.email}
                                    </div>
                                    <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-tertiary)', display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                                        <MapPin size={10} /> {s.kabupaten || '-'}, {s.provinsi || '-'}
                                    </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                                    <span className="badge badge-primary">Surveyor</span>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Invite Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => !submitting && setShowModal(false)} style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.5)', zIndex: 1000,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-md)'
                }}>
                    <div className="modal-content card" onClick={e => e.stopPropagation()} style={{
                        width: '100%', maxWidth: 400, padding: 'var(--space-lg)'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)' }}>
                            <h3 style={{ margin: 0 }}>Undang Pengguna</h3>
                            <button className="btn-icon btn-ghost" onClick={() => setShowModal(false)} disabled={submitting}>
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleInvite}>
                            <div className="form-group">
                                <label className="form-label">Email</label>
                                <input
                                    type="email"
                                    className="form-input"
                                    placeholder="email@contoh.com"
                                    value={inviteEmail}
                                    onChange={e => setInviteEmail(e.target.value)}
                                    required
                                    disabled={submitting}
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Peran</label>
                                <select 
                                    className="form-select"
                                    value={inviteRole}
                                    onChange={e => setInviteRole(e.target.value as 'surveyor' | 'admin')}
                                    disabled={submitting}
                                >
                                    <option value="surveyor">Surveyor</option>
                                    <option value="admin">Administrator</option>
                                </select>
                            </div>

                            <div style={{ marginTop: 'var(--space-lg)' }}>
                                <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
                                    {submitting ? <Loader size={16} className="spin-animation" /> : <UserPlus size={16} />}
                                    {submitting ? ' Mengundang...' : ' Kirim Undangan'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
