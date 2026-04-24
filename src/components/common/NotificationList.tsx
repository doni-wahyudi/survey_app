import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../../store/useAuth';
import { fetchNotifications, markNotificationAsRead, supabase, TABLES } from '../../lib/supabase';
import type { AppNotification } from '../../types';
import { Bell, Check, Clock, Info, AlertTriangle, CheckCircle, XCircle, ArrowLeft, Loader, CheckCheck, ListFilter } from 'lucide-react';

interface Props {
    onBack: () => void;
}

export default function NotificationList({ onBack }: Props) {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState<AppNotification[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'unread'>('all');

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

    const handleMarkAllRead = async () => {
        if (!user || !supabase) return;
        try {
            const { error } = await supabase
                .from(TABLES.notifications)
                .update({ is_read: true })
                .eq('user_id', user.id)
                .eq('is_read', false);
            
            if (error) throw error;
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        } catch (error) {
            console.error('Error marking all as read:', error);
        }
    };

    const filteredNotifications = useMemo(() => {
        if (filter === 'unread') return notifications.filter(n => !n.is_read);
        return notifications;
    }, [notifications, filter]);

    const getIcon = (type: string) => {
        switch (type) {
            case 'alert': return <AlertTriangle size={18} style={{ color: 'var(--color-error)' }} />;
            case 'task': return <CheckCircle size={18} style={{ color: 'var(--color-warning)' }} />;
            case 'success': return <CheckCircle size={18} style={{ color: 'var(--color-success)' }} />;
            case 'warning': return <AlertTriangle size={18} style={{ color: 'var(--color-warning)' }} />;
            case 'error': return <XCircle size={18} style={{ color: 'var(--color-error)' }} />;
            default: return <Info size={18} style={{ color: 'var(--color-info)' }} />;
        }
    };

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'alert': return 'var(--color-error)';
            case 'task': return 'var(--color-warning)';
            case 'success': return 'var(--color-success)';
            case 'info': return 'var(--color-primary)';
            default: return 'var(--color-primary)';
        }
    };

    return (
        <div className="page-enter">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-lg)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                    <button className="btn btn-icon btn-ghost" onClick={onBack}>
                        <ArrowLeft size={20} />
                    </button>
                    <h2 style={{ fontSize: 'var(--font-size-md)', fontWeight: 700 }}>Notifikasi</h2>
                </div>
                {notifications.some(n => !n.is_read) && (
                    <button className="btn btn-ghost btn-xs" onClick={handleMarkAllRead} style={{ color: 'var(--color-primary)' }}>
                        <CheckCheck size={14} /> Tandai Semua Dibaca
                    </button>
                )}
            </div>

            <div style={{ display: 'flex', gap: 'var(--space-sm)', marginBottom: 'var(--space-md)' }}>
                <button 
                    className={`filter-pill ${filter === 'all' ? 'active' : ''}`}
                    onClick={() => setFilter('all')}
                >
                    Semua
                </button>
                <button 
                    className={`filter-pill ${filter === 'unread' ? 'active' : ''}`}
                    onClick={() => setFilter('unread')}
                >
                    Belum Dibaca
                    {notifications.filter(n => !n.is_read).length > 0 && (
                        <span className="count-badge" style={{ marginLeft: 6, position: 'static' }}>
                            {notifications.filter(n => !n.is_read).length}
                        </span>
                    )}
                </button>
            </div>

            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-xl)' }}>
                    <Loader className="spin-animation" style={{ color: 'var(--color-primary)' }} />
                </div>
            ) : filteredNotifications.length === 0 ? (
                <div className="empty-state">
                    <Bell size={48} style={{ opacity: 0.2, marginBottom: 'var(--space-md)' }} />
                    <p>{filter === 'unread' ? 'Semua notifikasi sudah dibaca!' : 'Belum ada notifikasi.'}</p>
                </div>
            ) : (
                <div className="notification-list" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                    {filteredNotifications.map(n => (
                        <div 
                            key={n.id} 
                            className={`card ${n.is_read ? '' : 'unread'}`} 
                            style={{ 
                                position: 'relative',
                                borderLeft: n.is_read ? '1px solid var(--color-border)' : `4px solid ${getTypeColor(n.type)}`,
                                transition: 'all 0.2s ease',
                                transform: !n.is_read ? 'scale(1.02)' : 'scale(1)'
                            }}
                            onClick={() => !n.is_read && handleMarkAsRead(n.id)}
                        >
                            <div style={{ display: 'flex', gap: 'var(--space-md)' }}>
                                <div style={{ 
                                    width: 32, height: 32, borderRadius: 'var(--radius-sm)', 
                                    background: `${getTypeColor(n.type)}15`, 
                                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                                }}>
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
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
