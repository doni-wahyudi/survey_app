import { useAuth } from './store/useAuth';
import { useApp } from './store/useApp';
import { useActivityLog } from './store/useActivityLog';
import { useOfflineSync } from './store/useOfflineSync';
import { useState, useEffect } from 'react';
import LoginPage from './components/LoginPage';
import KTPCapture from './components/onboarding/KTPCapture';
import ProfileSetup from './components/onboarding/ProfileSetup';
import ProfileEditor from './components/profile/ProfileEditor';
import SettingsEditor from './components/profile/SettingsEditor';
import Toast from './components/common/Toast';
import ActivityLogViewer from './components/common/ActivityLogViewer';
import DashboardSurveyor from './components/dashboard/DashboardSurveyor';
import DashboardAdmin from './components/dashboard/DashboardAdmin';
import SurveyList from './components/survey/SurveyList';
import MediaMonitoringList from './components/media/MediaMonitoringList';
import CensusList from './components/sensus/CensusList';
import AspirationList from './components/aspiration/AspirationList';
import RespondentManager from './components/admin/RespondentManager';
import UserManager from './components/admin/UserManager';
import SurveyResults from './components/admin/SurveyResults';
import QuestionnaireManager from './components/admin/QuestionnaireManager';
import NotificationList from './components/common/NotificationList';
import {
    ClipboardList, Home, ClipboardCheck, Newspaper, Users, MessageSquare,
    BarChart3, UserCog, FileText, Settings, LogOut, User, ChevronRight,
    Bell, MapPin, Activity, WifiOff, ArrowLeft, UserCheck
} from 'lucide-react';
import { supabase, TABLES } from './lib/supabase';

import type { SurveyorTab, AdminTab } from './types';

function App() {
    const { user, isAuthenticated, logout } = useAuth();
    const { surveyorTab, setSurveyorTab, adminTab, setAdminTab, addToast, theme } = useApp();
    
    // Initialize Theme
    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
    }, [theme]);
    const { addLog } = useActivityLog();
    const pendingCount = useOfflineSync(s => s.getPendingCount());
    const isOnline = useOfflineSync(s => s.isOnline);
    const [showProfile, setShowProfile] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);

    // Fetch unread notifications
    useEffect(() => {
        const fetchCount = async () => {
            if (!user?.id || !supabase) return;
            const { count } = await supabase
                .from(TABLES.notifications)
                .select('*', { count: 'exact', head: true })
                .eq('user_id', user.id)
                .eq('is_read', false);
            setUnreadCount(count || 0);
        };
        fetchCount();
        
        // Polling or Subscription would be better, but let's do a simple check for now
        const interval = setInterval(fetchCount, 30000); // Every 30s
        return () => clearInterval(interval);
    }, [user?.id]);

    // Not authenticated → Login
    if (!isAuthenticated || !user) {
        return (
            <>
                <Toast />
                <LoginPage />
            </>
        );
    }

    // Onboarding: KTP → Profile Setup (only for surveyor who isn't onboarded)
    if (!user.is_onboarded && user.role === 'surveyor') {
        // Step 1: KTP if no KTP photo
        if (!user.ktp_photo_url) {
            return (
                <>
                    <Toast />
                    <KTPCapture />
                </>
            );
        }
        // Step 2: Profile Setup
        return (
            <>
                <Toast />
                <ProfileSetup />
            </>
        );
    }

    const isAdmin = user.role === 'admin';

    const handleLogout = () => {
        addLog(user.id, 'logout', `${user.full_name || user.email} keluar dari aplikasi`);
        logout();
        setShowProfile(false);
    };

    // ── Profile Modal ──
    const ProfileModal = () => {
        const [activeView, setActiveView] = useState<'menu' | 'edit' | 'logs' | 'settings'>('menu');

        return (
            <div className="modal-overlay" onClick={() => setShowProfile(false)}>
                <div className="modal-content" onClick={e => e.stopPropagation()}>
                    <div className="modal-handle" />
                    
                    {activeView === 'menu' && (
                        <div className="page-enter">
                            <div className="profile-section">
                                <div className="profile-avatar-large">
                                    {user.profile_photo_url ? (
                                        <img src={user.profile_photo_url} alt="Profile" />
                                    ) : (
                                        <User size={36} style={{ color: 'var(--color-primary-dark)' }} />
                                    )}
                                </div>
                                <div className="profile-name">{user.full_name || user.email}</div>
                                <div className="profile-role">{user.role}</div>
                                {user.assigned_region && (
                                    <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-tertiary)', marginTop: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                                        <MapPin size={12} /> {user.assigned_region.kecamatan}, {user.assigned_region.kabupaten}
                                    </div>
                                )}
                            </div>

                            <div className="settings-list">
                                <div className="settings-item" onClick={() => setActiveView('edit')}>
                                    <div className="settings-icon" style={{ color: 'var(--color-primary)' }}><User size={18} /></div>
                                    <div className="settings-text">
                                        <h4>Edit Profil</h4>
                                        <p>Ubah data diri Anda</p>
                                    </div>
                                    <ChevronRight size={16} style={{ color: 'var(--color-text-tertiary)' }} />
                                </div>
                                <div className="settings-item" onClick={() => setActiveView('logs')}>
                                    <div className="settings-icon" style={{ color: 'var(--color-success)' }}><Activity size={18} /></div>
                                    <div className="settings-text">
                                        <h4>Log Aktivitas</h4>
                                        <p>Riwayat aktivitas Anda</p>
                                    </div>
                                    <ChevronRight size={16} style={{ color: 'var(--color-text-tertiary)' }} />
                                </div>
                                <div className="settings-item" onClick={() => { setShowProfile(false); setShowNotifications(true); }}>
                                    <div className="settings-icon" style={{ color: 'var(--color-info)' }}><Bell size={18} /></div>
                                    <div className="settings-text">
                                        <h4>Notifikasi</h4>
                                        <p>Lihat kabar terbaru</p>
                                    </div>
                                    <ChevronRight size={16} style={{ color: 'var(--color-text-tertiary)' }} />
                                </div>
                                <div className="settings-item" onClick={() => setActiveView('settings')}>
                                    <div className="settings-icon" style={{ color: 'var(--color-text-secondary)' }}><Settings size={18} /></div>
                                    <div className="settings-text">
                                        <h4>Pengaturan</h4>
                                        <p>Pengaturan aplikasi</p>
                                    </div>
                                    <ChevronRight size={16} style={{ color: 'var(--color-text-tertiary)' }} />
                                </div>
                            </div>

                            {/* Offline queue info */}
                            {pendingCount > 0 && (
                                <div style={{
                                    marginTop: 'var(--space-md)',
                                    padding: 'var(--space-sm) var(--space-md)',
                                    background: 'var(--color-warning-light)',
                                    borderRadius: 'var(--radius-md)',
                                    fontSize: 'var(--font-size-xs)',
                                    color: 'var(--color-warning)',
                                    textAlign: 'center',
                                }}>
                                    ⏳ {pendingCount} data menunggu sinkronisasi
                                </div>
                            )}

                            <button
                                className="btn btn-danger btn-block"
                                onClick={handleLogout}
                                style={{ marginTop: 'var(--space-lg)' }}
                            >
                                <LogOut size={16} /> Keluar
                            </button>
                        </div>
                    )}

                    {activeView === 'edit' && <ProfileEditor onBack={() => setActiveView('menu')} />}
                    {activeView === 'settings' && <SettingsEditor onBack={() => setActiveView('menu')} />}
                    {activeView === 'logs' && (
                        <div className="page-enter">
                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 'var(--space-lg)' }}>
                                <button className="btn btn-icon btn-ghost" onClick={() => setActiveView('menu')}>
                                    <ArrowLeft size={20} />
                                </button>
                                <h2 style={{ fontSize: 'var(--font-size-md)', fontWeight: 700 }}>Log Aktivitas</h2>
                            </div>
                            <ActivityLogViewer />
                        </div>
                    )}
                </div>
            </div>
        );
    };

    // ── Surveyor Home ──
    const SurveyorHome = () => {
        return (
            <div className="page-enter">
                <div className="dashboard-greeting">
                    <h2>Selamat Datang! 👋</h2>
                    <p>{user?.full_name || 'Surveyor'} — {user?.assigned_region?.kecamatan || 'N/A'}, {user?.assigned_region?.kabupaten || 'N/A'}</p>
                </div>

                <div className="feature-grid">
                    <div className="feature-card" onClick={() => setSurveyorTab('survey')}>
                        <div className="feature-icon" style={{ background: 'rgba(196,149,106,0.15)', color: 'var(--color-primary-dark)' }}>
                            <ClipboardCheck size={26} />
                        </div>
                        <span className="feature-name">Survey</span>
                        <span className="feature-count">Isi kuesioner</span>
                    </div>
                    <div className="feature-card" onClick={() => setSurveyorTab('media')}>
                        <div className="feature-icon" style={{ background: 'var(--color-info-light)', color: 'var(--color-info)' }}>
                            <Newspaper size={26} />
                        </div>
                        <span className="feature-name">Media</span>
                        <span className="feature-count">Monitoring media</span>
                    </div>
                    <div className="feature-card" onClick={() => setSurveyorTab('sensus')}>
                        <div className="feature-icon" style={{ background: 'var(--color-success-light)', color: 'var(--color-success)' }}>
                            <Users size={26} />
                        </div>
                        <span className="feature-name">Sensus</span>
                        <span className="feature-count">Data penduduk</span>
                    </div>
                    <div className="feature-card" onClick={() => setSurveyorTab('aspirasi')}>
                        <div className="feature-icon" style={{ background: 'var(--color-warning-light)', color: 'var(--color-warning)' }}>
                            <MessageSquare size={26} />
                        </div>
                        <span className="feature-name">Aspirasi</span>
                        <span className="feature-count">Suara warga</span>
                    </div>
                </div>

                {/* Inline Dashboard */}
                <DashboardSurveyor />
            </div>
        );
    };

    // ── Render Content ──
    const renderContent = () => {
        if (showNotifications) {
            return <NotificationList onBack={() => setShowNotifications(false)} />;
        }

        if (isAdmin) {
            switch (adminTab) {
                case 'dashboard': return <DashboardAdmin />;
                case 'respondent': return <RespondentManager />;
                case 'results': return <SurveyResults />;
                case 'media': return <MediaMonitoringList />;
                case 'sensus': return <CensusList />;
                case 'aspirasi': return <AspirationList />;
                case 'users': return <UserManager />;
                case 'settings': return <QuestionnaireManager />;
                default: return <DashboardAdmin />;
            }
        } else {
            switch (surveyorTab) {
                case 'home': return <SurveyorHome />;
                case 'survey': return <SurveyList />;
                case 'media': return <MediaMonitoringList />;
                case 'sensus': return <CensusList />;
                case 'aspirasi': return <AspirationList />;
                default: return <SurveyorHome />;
            }
        }
    };

    // ── Surveyor Bottom Nav ──
    const SurveyorNav = () => {
        const tabs: { key: SurveyorTab; label: string; icon: typeof Home }[] = [
            { key: 'home', label: 'Beranda', icon: Home },
            { key: 'survey', label: 'Survey', icon: ClipboardCheck },
            { key: 'media', label: 'Media', icon: Newspaper },
            { key: 'sensus', label: 'Sensus', icon: Users },
            { key: 'aspirasi', label: 'Aspirasi', icon: MessageSquare },
        ];
        return (
            <nav className="bottom-nav">
                {tabs.map(t => (
                    <button key={t.key} className={surveyorTab === t.key && !showNotifications ? 'active' : ''} onClick={() => { setSurveyorTab(t.key); setShowNotifications(false); }}>
                        <t.icon size={20} />
                        <span>{t.label}</span>
                    </button>
                ))}
            </nav>
        );
    };

    // ── Admin Bottom Nav ──
    const AdminNav = () => {
        const tabs: { key: AdminTab; label: string; icon: typeof Home }[] = [
            { key: 'dashboard', label: 'Dashboard', icon: BarChart3 },
            { key: 'respondent', label: 'Responden', icon: Users },
            { key: 'results', label: 'Hasil', icon: FileText },
            { key: 'media', label: 'Media', icon: Newspaper },
            { key: 'sensus', label: 'Sensus', icon: UserCheck },
            { key: 'aspirasi', label: 'Aspirasi', icon: MessageSquare },
            { key: 'users', label: 'Pengguna', icon: UserCog },
            { key: 'settings', label: 'Kuesioner', icon: ClipboardList },
        ];
        return (
            <nav className="bottom-nav">
                {tabs.map(t => (
                    <button key={t.key} className={adminTab === t.key && !showNotifications ? 'active' : ''} onClick={() => { setAdminTab(t.key); setShowNotifications(false); }}>
                        <t.icon size={20} />
                        <span>{t.label}</span>
                    </button>
                ))}
            </nav>
        );
    };

    return (
        <div className="app-container">
            <Toast />

            {/* Header */}
            <header className="app-header">
                <div className="header-brand" onClick={() => { setSurveyorTab('home'); setAdminTab('dashboard'); setShowNotifications(false); }}>
                    <div className="brand-icon">
                        <ClipboardList size={18} />
                    </div>
                    <h1>SurveyKu</h1>
                </div>
                <div className="header-actions">
                    {/* Offline indicator */}
                    {!isOnline && (
                        <div style={{
                            display: 'flex', alignItems: 'center', gap: 4,
                            padding: '2px 8px', borderRadius: 'var(--radius-sm)',
                            background: 'var(--color-warning-light)',
                            fontSize: '0.65rem', color: 'var(--color-warning)', fontWeight: 600,
                        }}>
                            <WifiOff size={12} /> Offline
                        </div>
                    )}
                    {/* Pending sync badge */}
                    <button className="header-btn" onClick={() => { setShowNotifications(true); setUnreadCount(0); }}>
                        <Bell size={18} />
                        {unreadCount > 0 && (
                            <div className="badge" style={{ background: 'var(--color-error)', width: 8, height: 8, border: '2px solid var(--color-surface)' }} />
                        )}
                        {pendingCount > 0 && (
                            <div className="badge" style={{ background: 'var(--color-warning)', width: 8, height: 8, border: '2px solid var(--color-surface)', right: -2, top: -2 }} />
                        )}
                    </button>
                    <div className="header-avatar" onClick={() => setShowProfile(true)}>
                        {user.profile_photo_url ? (
                            <img src={user.profile_photo_url} alt="Avatar" />
                        ) : (
                            <User size={18} />
                        )}
                    </div>
                </div>
            </header>

            {/* Content */}
            <main className="app-content">
                {renderContent()}
            </main>

            {/* Bottom Navigation */}
            {isAdmin ? <AdminNav /> : <SurveyorNav />}

            {/* Profile Modal */}
            {showProfile && <ProfileModal />}
        </div>
        );
}

export default App;
