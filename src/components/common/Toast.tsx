import { useApp } from '../../store/useApp';
import { CheckCircle, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

const ICON_MAP = {
    success: CheckCircle,
    error: AlertCircle,
    info: Info,
    warning: AlertTriangle,
};

export default function Toast() {
    const { toasts, removeToast } = useApp();

    if (toasts.length === 0) return null;

    return (
        <div className="toast-container">
            {toasts.map((toast) => {
                const Icon = ICON_MAP[toast.type];
                return (
                    <div key={toast.id} className={`toast toast-${toast.type}`}>
                        <Icon size={18} className="toast-icon" style={{ color: `var(--color-${toast.type})` }} />
                        <span style={{ flex: 1 }}>{toast.message}</span>
                        <button onClick={() => removeToast(toast.id)} className="btn-ghost" style={{ padding: 4 }}>
                            <X size={14} />
                        </button>
                    </div>
                );
            })}
        </div>
    );
}
