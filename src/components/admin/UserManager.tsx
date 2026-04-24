import { useState, useEffect } from 'react';
import { useApp } from '../../store/useApp';
import { User, Shield, MapPin, Mail, Loader, UserPlus, X, Lock, Check, Settings2 } from 'lucide-react';
import { supabase, TABLES, createNewUser } from '../../lib/supabase';
import type { Profile } from '../../types';

export default function UserManager() {
    const { addToast } = useApp();
    const [loading, setLoading] = useState(true);
    const [users, setUsers] = useState<Profile[]>([]);
    
    // Create User Modal State
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState({
        email: '',
        password: '',
        fullName: '',
        role: 'surveyor' as 'surveyor' | 'admin'
    });
    
    // Permission Modal State
    const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
    const [permissions, setPermissions] = useState<string[]>([]);
    
    const [submitting, setSubmitting] = useState(false);

    const availablePermissions = [
        { id: 'survey', label: 'Survey', icon: '📋' },
        { id: 'media', label: 'Media Monitoring', icon: '📰' },
        { id: 'sensus', label: 'Sensus Penduduk', icon: '👥' },
        { id: 'aspirasi', label: 'Aspirasi Warga', icon: '💬' }
    ];

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

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.email || !form.password || !form.fullName) return;

        setSubmitting(true);
        try {
            await createNewUser(form.email, form.password, form.fullName, form.role);
            addToast('Pengguna berhasil dibuat.', 'success');
            setShowModal(false);
            setForm({ email: '', password: '', fullName: '', role: 'surveyor' });
            fetchUsers();
        } catch (error: any) {
            console.error('Error creating user:', error);
            addToast(`Gagal membuat pengguna: ${error.message}`, 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const handleEditPermissions = (user: Profile) => {
        setSelectedUser(user);
        setPermissions(user.permissions || ['survey', 'media', 'sensus', 'aspirasi']);
    };

    const togglePermission = (id: string) => {
        setPermissions(prev => 
            prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
        );
    };

    const savePermissions = async () => {
        if (!selectedUser || !supabase) return;
        setSubmitting(true);
        try {
            const { error } = await supabase
                .from(TABLES.profiles)
                .update({ permissions })
                .eq('id', selectedUser.id);

            if (error) throw error;
            addToast('Izin akses berhasil diperbarui', 'success');
            setSelectedUser(null);
            fetchUsers();
        } catch (error: any) {
            console.error('Error updating permissions:', error);
            addToast('Gagal memperbarui izin', 'error');
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
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
                                        {s.permissions?.map(p => (
                                            <span key={p} className="badge" style={{ fontSize: 9, padding: '2px 6px', background: 'var(--color-background-alt)', color: 'var(--color-text-tertiary)' }}>
                                                {p.toUpperCase()}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                                <button className="btn btn-icon btn-ghost" onClick={() => handleEditPermissions(s)}>
                                    <Settings2 size={18} />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Permission Modal */}
            {selectedUser && (
                <div className="modal-overlay" onClick={() => setSelectedUser(null)}>
                    <div className="modal-content card" onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 400 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)' }}>
                            <h3 style={{ margin: 0 }}>Atur Izin Akses</h3>
                            <button className="btn-icon btn-ghost" onClick={() => setSelectedUser(null)}><X size={20} /></button>
                        </div>
                        <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-md)' }}>
                            Tentukan fitur yang dapat diakses oleh <strong>{selectedUser.full_name}</strong>
                        </p>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)', marginBottom: 'var(--space-lg)' }}>
                            {availablePermissions.map(p => (
                                <div 
                                    key={p.id} 
                                    className={`card ${permissions.includes(p.id) ? 'active' : ''}`}
                                    onClick={() => togglePermission(p.id)}
                                    style={{ 
                                        padding: 'var(--space-sm) var(--space-md)', 
                                        cursor: 'pointer',
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        justifyContent: 'space-between',
                                        border: permissions.includes(p.id) ? '1.5px solid var(--color-primary)' : '1.5px solid transparent',
                                        background: permissions.includes(p.id) ? 'var(--color-primary-light)' : 'var(--color-background-alt)'
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
                                        <span style={{ fontSize: 20 }}>{p.icon}</span>
                                        <span style={{ fontWeight: 600, fontSize: 'var(--font-size-sm)' }}>{p.label}</span>
                                    </div>
                                    {permissions.includes(p.id) ? <Check size={18} color="var(--color-primary)" /> : <Lock size={18} color="var(--color-text-tertiary)" />}
                                </div>
                            ))}
                        </div>

                        <button className="btn btn-primary btn-block" onClick={savePermissions} disabled={submitting}>
                            {submitting ? <Loader size={16} className="spin-animation" /> : 'Simpan Perubahan'}
                        </button>
                    </div>
                </div>
            )}

            {/* Invite Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => !submitting && setShowModal(false)}>
                    <div className="modal-content card" onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 400 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)' }}>
                            <h3 style={{ margin: 0 }}>Tambah Pengguna Baru</h3>
                            <button className="btn-icon btn-ghost" onClick={() => setShowModal(false)} disabled={submitting}>
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleCreateUser}>
                            <div className="form-group">
                                <label className="form-label">Nama Lengkap</label>
                                <input type="text" className="form-input" value={form.fullName} onChange={e => setForm({...form, fullName: e.target.value})} required disabled={submitting} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Email</label>
                                <input type="email" className="form-input" value={form.email} onChange={e => setForm({...form, email: e.target.value})} required disabled={submitting} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Password</label>
                                <input type="password" className="form-input" value={form.password} onChange={e => setForm({...form, password: e.target.value})} required minLength={6} disabled={submitting} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Peran</label>
                                <select className="form-select" value={form.role} onChange={e => setForm({...form, role: e.target.value as 'surveyor' | 'admin'})} disabled={submitting}>
                                    <option value="surveyor">Surveyor</option>
                                    <option value="admin">Administrator</option>
                                </select>
                            </div>
                            <div style={{ marginTop: 'var(--space-lg)' }}>
                                <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
                                    {submitting ? <Loader size={16} className="spin-animation" /> : <UserPlus size={16} />}
                                    {submitting ? ' Memproses...' : ' Buat Pengguna'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
