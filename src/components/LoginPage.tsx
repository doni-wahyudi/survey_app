import { useState } from 'react';
import { useApp } from '../store/useApp';
import { useAuth } from '../store/useAuth';
import { useActivityLog } from '../store/useActivityLog';
import { ClipboardList, Eye, EyeOff, AlertCircle, LogIn, UserPlus } from 'lucide-react';

export default function LoginPage() {
    const { addToast } = useApp();
    const [isLogin, setIsLogin] = useState(true);
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const { login, signUp, isLoading, error, clearError } = useAuth();
    const { addLog } = useActivityLog();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        clearError();
        
        if (isLogin) {
            const success = await login(email, password);
            if (success) {
                addLog(email, 'login', `${email} masuk ke aplikasi`);
            }
        } else {
            const success = await signUp(email, password, fullName);
            if (success) {
                addToast('Pendaftaran berhasil! Silakan login (atau cek email untuk verifikasi jika diaktifkan).', 'success');
                setIsLogin(true);
            }
        }
    };

    const fillDemo = (demoEmail: string, demoPassword: string) => {
        setEmail(demoEmail);
        setPassword(demoPassword);
        setIsLogin(true);
        clearError();
    };

    return (
        <div className="login-page">
            <div className="login-card">
                <div className="login-logo">
                    <div className="logo-icon">
                        <ClipboardList size={36} />
                    </div>
                    <h1>SurveyKu</h1>
                    <p>Aplikasi Surveyor & Enumerator</p>
                </div>

                {error && (
                    <div className="login-error">
                        <AlertCircle size={16} />
                        {error}
                    </div>
                )}

                <div style={{ display: 'flex', marginBottom: 'var(--space-md)', background: 'var(--color-bg-secondary)', borderRadius: 'var(--radius-md)', padding: 4 }}>
                    <button 
                        type="button"
                        onClick={() => { setIsLogin(true); clearError(); }}
                        style={{ flex: 1, padding: '8px', borderRadius: 'var(--radius-sm)', border: 'none', background: isLogin ? 'var(--color-bg-primary)' : 'transparent', fontWeight: isLogin ? 600 : 400, boxShadow: isLogin ? 'var(--shadow-sm)' : 'none', cursor: 'pointer' }}
                    >
                        Masuk
                    </button>
                    <button 
                        type="button"
                        onClick={() => { setIsLogin(false); clearError(); }}
                        style={{ flex: 1, padding: '8px', borderRadius: 'var(--radius-sm)', border: 'none', background: !isLogin ? 'var(--color-bg-primary)' : 'transparent', fontWeight: !isLogin ? 600 : 400, boxShadow: !isLogin ? 'var(--shadow-sm)' : 'none', cursor: 'pointer' }}
                    >
                        Daftar
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    {!isLogin && (
                        <div className="form-group">
                            <label className="form-label">Nama Lengkap</label>
                            <input
                                type="text"
                                className="form-input"
                                placeholder="Masukkan nama lengkap"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                required={!isLogin}
                            />
                        </div>
                    )}

                    <div className="form-group">
                        <label className="form-label">Email</label>
                        <input
                            id="login-email"
                            type="email"
                            className="form-input"
                            placeholder="Masukkan email Anda"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            autoComplete="email"
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Password</label>
                        <div style={{ position: 'relative' }}>
                            <input
                                id="login-password"
                                type={showPassword ? 'text' : 'password'}
                                className="form-input"
                                placeholder="Masukkan password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                autoComplete={isLogin ? "current-password" : "new-password"}
                                style={{ paddingRight: 44 }}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                style={{
                                    position: 'absolute', right: 12, top: '50%',
                                    transform: 'translateY(-50%)', color: 'var(--color-text-tertiary)',
                                    background: 'none', border: 'none', cursor: 'pointer', padding: 0
                                }}
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    <button
                        id="login-submit"
                        type="submit"
                        className="btn btn-primary btn-lg btn-block"
                        disabled={isLoading || !email || !password || (!isLogin && !fullName)}
                        style={{ marginTop: 8 }}
                    >
                        {isLoading ? (
                            <div className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }} />
                        ) : isLogin ? (
                            <><LogIn size={18} /> Masuk</>
                        ) : (
                            <><UserPlus size={18} /> Daftar</>
                        )}
                    </button>
                </form>

                <div className="login-demo" style={{ marginTop: 'var(--space-xl)' }}>
                    <p>Demo credentials:</p>
                    <div className="demo-credentials">
                        <div className="demo-credential" onClick={() => fillDemo('surveyor@test.com', 'surveyor123')}>
                            <span>surveyor@test.com</span>
                            <span className="role-badge badge badge-primary">Surveyor</span>
                        </div>
                        <div className="demo-credential" onClick={() => fillDemo('admin@test.com', 'admin123')}>
                            <span>admin@test.com</span>
                            <span className="role-badge badge badge-warning">Admin</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
