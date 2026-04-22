import { useEffect, useState } from 'react';
import { useAuth } from '../../store/useAuth';
import { fetchNotifications, markNotificationAsRead } from '../../lib/supabase';
import type { AppNotification } from '../../types';
import { Bell, Check, Clock, Info, AlertTriangle, CheckCircle, XCircle, ArrowLeft, Loader } from 'lucide-react';


interface Props {
    onBack: () => void;
}

export default function NotificationList({ onBack }: Props) {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState<AppNotification[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) {
            loadNotifications();
        }
    }, [user]);

    const loadNotifications = async () => {
        if (!user) return;
        setLoading(true);
        const data = await fetchNotifications(user.id);
        setNotifications(data);
        setLoading(false);
    };

    const handleMarkAsRead = async (notificationId: string) => {
        await markNotificationAsRead(notificationId);
        setNotifications(prev => 
            prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
        );
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'success': return <CheckCircle size={18} style={{ color: 'var(--color-success)' }} />;
            case 'warning': return <AlertTriangle size={18} style={{ color: 'var(--color-warning)' }} />;
            case 'error': return <XCircle size={18} style={{ color: 'var(--color-error)' }} />;
            default: return <Info size={18} style={{ color: 'var(--color-info)' }} />;
        }
    };

    return (
        <div className="page-enter">
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 'var(--space-lg)' }}>
                <button className="btn btn-icon btn-ghost" onClick={onBack}>
                    <ArrowLeft size={20} />
                </button>
                <h2 style={{ fontSize: 'var(--font-size-md)', fontWeight: 700 }}>Notifikasi</h2>
            </div>

            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-xl)' }}>
                    <Loader className="spin-animation" style={{ color: 'var(--color-primary)' }} />
                </div>
            ) : notifications.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 'var(--space-xl)', color: 'var(--color-text-tertiary)' }}>
                    <Bell size={48} style={{ opacity: 0.2, marginBottom: 'var(--space-md)' }} />
                    <p>Tidak ada notifikasi baru</p>
                </div>
            ) : (
                <div className="notification-list" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                    {notifications.map(n => (
                        <div 
                            key={n.id} 
                            className={`card ${n.is_read ? '' : 'unread'}`} 
                            style={{ 
                                position: 'relative',
                                borderLeft: n.is_read ? '1px solid var(--color-border)' : `4px solid var(--color-${n.type === 'info' ? 'primary' : n.type})`,
                                opacity: n.is_read ? 0.8 : 1
                            }}
                            onClick={() => !n.is_read && handleMarkAsRead(n.id)}
                        >
                            <div style={{ display: 'flex', gap: 'var(--space-md)' }}>
                                <div style={{ marginTop: 2 }}>
                                    {getIcon(n.type)}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <h4 style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600, marginBottom: 2 }}>{n.title}</h4>
                                    <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', lineHeight: 1.4 }}>{n.message}</p>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 8, fontSize: '10px', color: 'var(--color-text-tertiary)' }}>
                                        <Clock size={10} />
                                        {new Date(n.created_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                                    </div>
                                </div>
                                {!n.is_read && (
                                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--color-primary)', position: 'absolute', top: 12, right: 12 }} />
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
