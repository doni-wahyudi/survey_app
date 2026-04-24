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
import NotificationManager from './components/admin/NotificationManager';
import NotificationList from './components/common/NotificationList';
import {
    ClipboardList, Home, ClipboardCheck, Newspaper, Users, MessageSquare,
    BarChart3, UserCog, FileText, Settings, LogOut, User, ChevronRight,
    Bell, MapPin, Activity, WifiOff, ArrowLeft, UserCheck, Menu, X
} from 'lucide-react';
import { App as CapApp } from '@capacitor/app';
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

    // Fetch unread notifications and setup Realtime
    useEffect(() => {
        if (!user?.id || !supabase) return;

        const fetchCount = async () => {
            try {
                const { count } = await supabase!
                    .from('notifications')
                    .select('*', { count: 'exact', head: true })
                    .eq('user_id', user.id)
                    .eq('is_read', false);
                setUnreadCount(count || 0);
            } catch (err) {
                console.error('Error fetching notification count:', err);
            }
        };

        fetchCount();
        
        // Supabase Realtime Subscription
        // Use a unique channel name per user session to avoid collisions
        const channel = supabase.channel(`user-notifs-${user.id}-${Math.random().toString(36).substring(7)}`);
        
        channel
            .on('postgres_changes', { 
                event: 'INSERT', 
                schema: 'public', 
                table: 'notifications',
                filter: `user_id=eq.${user.id}`
            }, (payload) => {
                console.log('New notification:', payload);
                setUnreadCount(prev => prev + 1);
                addToast('Notifikasi baru diterima', 'info');
            })
            .on('postgres_changes', {
                event: 'UPDATE',
                schema: 'public',
                table: 'notifications',
                filter: `user_id=eq.${user.id}`
            }, () => {
                fetchCount();
            })
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    console.log('Successfully subscribed to notifications');
                }
            });

        return () => {
            supabase?.removeChannel(channel);
        };
    }, [user?.id]);

    const [isLoading, setIsLoading] = useState(true);
    const [isOpen, setIsOpen] = useState(false); // Floating Menu State

    // Initial Loading Simulation
    useEffect(() => {
        const timer = setTimeout(() => {
            setIsLoading(false);
        }, 2000);
        return () => clearTimeout(timer);
    }, []);
    
    // Hardware Back Button Handling
    useEffect(() => {
        const handleBackButton = async () => {
            // Close floating menu if open
            if (isOpen) {
                setIsOpen(false);
                return;
            }

            // If Admin is on any tab other than dashboard, go back to dashboard
            if (user?.role === 'admin' && adminTab !== 'dashboard') {
                setAdminTab('dashboard');
                return;
            }

            // If Surveyor is on any tab other than home, go back to home
            if (user?.role === 'surveyor' && surveyorTab !== 'home') {
                setSurveyorTab('home');
                return;
            }

            // If we are showing notifications, hide them
            if (showNotifications) {
                setShowNotifications(false);
                return;
            }
        };

        const listener = CapApp.addListener('backButton', handleBackButton);
        
        return () => {
            listener.then(l => l.remove());
        };
    }, [isOpen, adminTab, surveyorTab, user, showNotifications]);

    // Not authenticated → Login
    if (!isAuthenticated || !user) {
        return (
            <>
                <Toast />
                <LoginPage />
            </>
        );
    }

    // Splash Screen
    if (isLoading) {
        return (
            <div className="splash-screen">
                <div className="splash-content">
                    <img src="swaraya_logo.png" alt="Swaraya Logo" className="splash-logo" />
                    <div className="splash-loader">
                        <div className="loader-bar"></div>
                    </div>
                    <p>Swarasurvey - Menghubungkan Suara Masyarakat</p>
                </div>
            </div>
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
        const userPermissions = user?.permissions || ['home', 'survey', 'media', 'sensus', 'aspirasi'];

        const features = [
            { id: 'survey', name: 'Survey', count: 'Isi kuesioner', icon: ClipboardCheck, color: 'var(--color-primary-dark)', bg: 'rgba(196,149,106,0.15)' },
            { id: 'media', name: 'Media', count: 'Monitoring media', icon: Newspaper, color: 'var(--color-info)', bg: 'var(--color-info-light)' },
            { id: 'sensus', name: 'Sensus', count: 'Data penduduk', icon: Users, color: 'var(--color-success)', bg: 'var(--color-success-light)' },
            { id: 'aspirasi', name: 'Aspirasi', count: 'Suara warga', icon: MessageSquare, color: 'var(--color-warning)', bg: 'var(--color-warning-light)' },
        ].filter(f => userPermissions.includes(f.id));

        return (
            <div className="page-enter">
                <div className="dashboard-greeting">
                    <h2>Selamat Datang! 👋</h2>
                    <p>{user?.full_name || 'Surveyor'} — {user?.assigned_region?.kecamatan || 'N/A'}, {user?.assigned_region?.kabupaten || 'N/A'}</p>
                </div>

                <div className="feature-grid">
                    {features.map(f => (
                        <div key={f.id} className="feature-card" onClick={() => setSurveyorTab(f.id as SurveyorTab)}>
                            <div className="feature-icon" style={{ background: f.bg, color: f.color }}>
                                <f.icon size={26} />
                            </div>
                            <span className="feature-name">{f.name}</span>
                            <span className="feature-count">{f.count}</span>
                        </div>
                    ))}
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
                case 'pengumuman': return <NotificationManager />;
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

    // ── Floating Menu (FAB) ──
    const FloatingMenu = () => {
        const userPermissions = user?.permissions || ['home', 'survey', 'media', 'sensus', 'aspirasi'];

        const adminTabs: { key: AdminTab; label: string; icon: any }[] = [
            { key: 'dashboard', label: 'Dashboard', icon: BarChart3 },
            { key: 'respondent', label: 'Responden', icon: Users },
            { key: 'results', label: 'Hasil', icon: FileText },
            { key: 'media', label: 'Media', icon: Newspaper },
            { key: 'sensus', label: 'Sensus', icon: UserCheck },
            { key: 'aspirasi', label: 'Aspirasi', icon: MessageSquare },
            { key: 'pengumuman', label: 'Siaran', icon: Bell },
            { key: 'users', label: 'Pengguna', icon: UserCog },
            { key: 'settings', label: 'Kuesioner', icon: ClipboardList },
        ];

        const surveyorTabs: { key: SurveyorTab; label: string; icon: any }[] = [
            { key: 'home' as SurveyorTab, label: 'Beranda', icon: Home },
            { key: 'survey' as SurveyorTab, label: 'Survey', icon: ClipboardCheck },
            { key: 'media' as SurveyorTab, label: 'Media', icon: Newspaper },
            { key: 'sensus' as SurveyorTab, label: 'Sensus', icon: Users },
            { key: 'aspirasi' as SurveyorTab, label: 'Aspirasi', icon: MessageSquare },
        ].filter(t => t.key === 'home' || userPermissions.includes(t.key));

        const tabs = isAdmin ? adminTabs : surveyorTabs;
        const activeKey = isAdmin ? adminTab : surveyorTab;

        return (
            <>
                {/* FAB Button */}
                <button 
                    className={`fab-button ${isOpen ? 'open' : ''}`} 
                    onClick={() => setIsOpen(!isOpen)}
                    aria-label="Toggle Menu"
                >
                    {isOpen ? <X size={24} /> : <Menu size={24} />}
                </button>

                {/* Expanded Menu Overlay */}
                {isOpen && (
                    <div className="fab-overlay" onClick={() => setIsOpen(false)}>
                        <div className="fab-menu-grid" onClick={e => e.stopPropagation()}>
                            <div className="menu-header">
                                <h3>Menu Utama</h3>
                                <p>Pilih fitur untuk diakses</p>
                            </div>
                            <div className="grid-container">
                                {tabs.map(t => (
                                    <div 
                                        key={t.key} 
                                        className={`grid-item ${activeKey === t.key ? 'active' : ''}`}
                                        onClick={() => {
                                            if (isAdmin) setAdminTab(t.key as AdminTab);
                                            else setSurveyorTab(t.key as SurveyorTab);
                                            setIsOpen(false);
                                            setShowNotifications(false);
                                        }}
                                    >
                                        <div className="grid-icon">
                                            <t.icon size={24} />
                                        </div>
                                        <span>{t.label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </>
        );
    };

    return (
        <div className="app-container">
            <Toast />

            {/* Header */}
            <header className="app-header">
                <div className="header-brand" onClick={() => { setSurveyorTab('home'); setAdminTab('dashboard'); setShowNotifications(false); }}>
                    <div className="brand-icon">
                        <img src="swaraya_icon.png" alt="Icon" style={{ width: 22, height: 22 }} />
                    </div>
                    <h1>SwaraSurvey</h1>
                </div>
                <div className="header-actions">
                    {/* Offline indicator */}
                    {!isOnline && (
                        <div className="offline-badge">
                            <WifiOff size={10} /> Offline
                        </div>
                    )}
                    
                    {/* Notification & Sync Buttons */}
                    <button className="header-btn" onClick={() => { setShowNotifications(true); }}>
                        <Bell size={20} />
                        {unreadCount > 0 && (
                            <span className="notification-dot">
                                {unreadCount > 9 ? '9+' : unreadCount}
                            </span>
                        )}
                        {pendingCount > 0 && (
                            <span className="sync-dot">
                                {pendingCount}
                            </span>
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

            {/* Floating Action Menu */}
            <FloatingMenu />

            {/* Profile Modal */}
            {showProfile && <ProfileModal />}
        </div>
        );
}

export default App;
