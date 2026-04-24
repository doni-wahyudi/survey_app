import { useApp } from '../../store/useApp';
import { ArrowLeft, Moon, Sun, Monitor, Bell, Shield, Database } from 'lucide-react';

interface Props {
    onBack: () => void;
}

export default function SettingsEditor({ onBack }: Props) {
    const { theme, toggleTheme, addToast } = useApp();

    return (
        <div className="page-enter">
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 'var(--space-lg)' }}>
                <button className="btn btn-icon btn-ghost" onClick={onBack}>
                    <ArrowLeft size={20} />
                </button>
                <h2 style={{ fontSize: 'var(--font-size-md)', fontWeight: 700 }}>Pengaturan</h2>
            </div>

            <div className="settings-list" style={{ padding: 0 }}>
                <div className="settings-item" onClick={toggleTheme}>
                    <div className="settings-icon" style={{ color: 'var(--color-primary)' }}>
                        {theme === 'light' ? <Sun size={18} /> : <Moon size={18} />}
                    </div>
                    <div className="settings-text">
                        <h4>Tema Aplikasi</h4>
                        <p>Saat ini: {theme === 'light' ? 'Terang' : 'Gelap'}</p>
                    </div>
                    <div className="form-switch" style={{ pointerEvents: 'none' }}>
                        <div className={`switch-handle ${theme === 'dark' ? 'active' : ''}`} />
                    </div>
                </div>

                <div className="settings-item" onClick={() => addToast('Fitur ini akan segera hadir', 'info')}>
                    <div className="settings-icon" style={{ color: 'var(--color-info)' }}><Bell size={18} /></div>
                    <div className="settings-text">
                        <h4>Notifikasi Push</h4>
                        <p>Terima pemberitahuan di perangkat</p>
                    </div>
                </div>

                <div className="settings-item" onClick={() => addToast('Fitur ini akan segera hadir', 'info')}>
                    <div className="settings-icon" style={{ color: 'var(--color-success)' }}><Shield size={18} /></div>
                    <div className="settings-text">
                        <h4>Keamanan</h4>
                        <p>Dua langkah verifikasi</p>
                    </div>
                </div>

                <div className="settings-item" onClick={() => addToast('Cache dibersihkan', 'success')}>
                    <div className="settings-icon" style={{ color: 'var(--color-warning)' }}><Database size={18} /></div>
                    <div className="settings-text">
                        <h4>Pembersihan Cache</h4>
                        <p>Hapus data sementara aplikasi</p>
                    </div>
                </div>
            </div>

            <div style={{ marginTop: 'var(--space-xl)', textAlign: 'center', fontSize: 'var(--font-size-xs)', color: 'var(--color-text-tertiary)' }}>
                <p>SurveyKu Version 1.0.4 (Production)</p>
                <p style={{ marginTop: 4 }}>© 2026 SurveyKu Digital Indonesia</p>
            </div>
        </div>
    );
}
