import { useMemo } from 'react';
import { useAuth } from '../../store/useAuth';
import { useActivityLog, getActionLabel, getActionStyle } from '../../store/useActivityLog';
import { useOfflineSync } from '../../store/useOfflineSync';
import { formatDateTime, formatTimeAgo } from '../../utils/helpers';
import { Activity, Trash2, Wifi, WifiOff, RefreshCw, CloudOff, UploadCloud } from 'lucide-react';
import { useApp } from '../../store/useApp';

export default function ActivityLogViewer() {
    const { user } = useAuth();
    const { addToast } = useApp();
    const isAdmin = user?.role === 'admin';
    const logsState = useActivityLog(s => s.logs);
    const logs = useMemo(() => {
        const filtered = isAdmin ? logsState : logsState.filter(l => l.user_id === user?.id);
        return filtered.slice(-50).reverse();
    }, [logsState, isAdmin, user?.id]);
    const clearLogs = useActivityLog(s => s.clearLogs);

    // Offline sync
    const { queue, isOnline, isSyncing, syncAll, getPendingCount, getFailedCount, clearAll: clearQueue } = useOfflineSync();
    const pendingCount = getPendingCount();
    const failedCount = getFailedCount();

    const handleClear = () => {
        clearLogs();
        addToast('Log aktivitas dibersihkan', 'info');
    };

    const handleSync = async () => {
        if (!isOnline) {
            addToast('Tidak ada koneksi internet', 'warning');
            return;
        }
        await syncAll();
        addToast('Sinkronisasi selesai', 'success');
    };

    return (
        <div>
            <div className="section-header">
                <h2 className="section-title">Log Aktivitas</h2>
                {logs.length > 0 && (
                    <button className="btn btn-secondary btn-sm" onClick={handleClear}>
                        <Trash2 size={14} /> Hapus
                    </button>
                )}
            </div>

            {/* Connectivity & Sync Status */}
            <div className="card" style={{
                padding: 'var(--space-md)',
                marginBottom: 'var(--space-md)',
                background: isOnline ? 'var(--color-success-light)' : 'var(--color-warning-light)',
                border: 'none'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', fontSize: 'var(--font-size-sm)' }}>
                        {isOnline ? (
                            <><Wifi size={16} style={{ color: 'var(--color-success)' }} />
                                <span style={{ color: 'var(--color-success)', fontWeight: 600 }}>Online</span></>
                        ) : (
                            <><WifiOff size={16} style={{ color: 'var(--color-warning)' }} />
                                <span style={{ color: 'var(--color-warning)', fontWeight: 600 }}>Offline</span></>
                        )}
                    </div>
                    {pendingCount > 0 && (
                        <button
                            className="btn btn-primary btn-sm"
                            onClick={handleSync}
                            disabled={isSyncing || !isOnline}
                            style={{ fontSize: 'var(--font-size-xs)' }}
                        >
                            {isSyncing ? (
                                <><div className="spinner" style={{ width: 12, height: 12, borderWidth: 2 }} /> Sinkronisasi...</>
                            ) : (
                                <><UploadCloud size={12} /> Sync ({pendingCount})</>
                            )}
                        </button>
                    )}
                </div>
                {queue.length > 0 && (
                    <div style={{ marginTop: 'var(--space-sm)', fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>
                        {pendingCount > 0 && <span>⏳ {pendingCount} menunggu sinkronisasi </span>}
                        {failedCount > 0 && <span style={{ color: 'var(--color-error)' }}>⚠️ {failedCount} gagal </span>}
                    </div>
                )}
            </div>

            {/* Offline Queue Items */}
            {queue.length > 0 && (
                <div className="card" style={{ marginBottom: 'var(--space-md)', padding: 'var(--space-md)' }}>
                    <div className="card-header" style={{ marginBottom: 'var(--space-sm)' }}>
                        <span className="card-title" style={{ fontSize: 'var(--font-size-sm)' }}>
                            <CloudOff size={14} style={{ verticalAlign: -2 }} /> Antrian Offline
                        </span>
                    </div>
                    {queue.slice(-5).reverse().map(item => (
                        <div key={item.id} style={{
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            padding: '6px 0', borderBottom: '1px solid var(--color-border-light)',
                            fontSize: 'var(--font-size-xs)'
                        }}>
                            <div>
                                <span style={{ fontWeight: 600, textTransform: 'capitalize' }}>{item.type}</span>
                                <span style={{ color: 'var(--color-text-tertiary)', marginLeft: 8 }}>
                                    {formatTimeAgo(item.created_at)}
                                </span>
                            </div>
                            <span className="badge" style={{
                                background: item.status === 'synced' ? 'var(--color-success-light)' :
                                    item.status === 'failed' ? 'var(--color-error-light)' :
                                        item.status === 'syncing' ? 'var(--color-warning-light)' : 'var(--color-info-light)',
                                color: item.status === 'synced' ? 'var(--color-success)' :
                                    item.status === 'failed' ? 'var(--color-error)' :
                                        item.status === 'syncing' ? 'var(--color-warning)' : 'var(--color-info)',
                                fontSize: '0.6rem',
                            }}>
                                {item.status === 'synced' ? 'Tersinkron' :
                                 item.status === 'failed' ? 'Gagal' :
                                 item.status === 'syncing' ? 'Sinkronisasi...' : 'Menunggu'}
                            </span>
                        </div>
                    ))}
                </div>
            )}

            {/* Activity Log Timeline */}
            {logs.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-state-icon"><Activity size={32} /></div>
                    <h3>Belum ada aktivitas</h3>
                    <p>Aktivitas Anda akan tercatat secara otomatis.</p>
                </div>
            ) : (
                <div className="activity-log-list">
                    {logs.map(log => {
                        const style = getActionStyle(log.action);
                        return (
                            <div key={log.id} className="card" style={{
                                marginBottom: 'var(--space-xs)',
                                padding: 'var(--space-sm) var(--space-md)',
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                                    <span style={{ fontSize: 'var(--font-size-md)', lineHeight: 1 }}>{style.icon}</span>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600, color: style.color }}>
                                            {getActionLabel(log.action)}
                                        </div>
                                        {log.details && (
                                            <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', marginTop: 1 }}>
                                                {log.details}
                                            </div>
                                        )}
                                    </div>
                                    <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-tertiary)', whiteSpace: 'nowrap' }}>
                                        {formatTimeAgo(log.timestamp)}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
