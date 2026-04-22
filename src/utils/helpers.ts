/**
 * Helper utilities for SurveyKu
 */

export function formatDate(dateStr: string): string {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function formatDateTime(dateStr: string): string {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    return d.toLocaleDateString('id-ID', {
        day: 'numeric', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });
}

export function formatTimeAgo(dateStr: string): string {
    const now = new Date().getTime();
    const then = new Date(dateStr).getTime();
    const diffMs = now - then;
    const diffMin = Math.floor(diffMs / 60000);
    const diffHr = Math.floor(diffMs / 3600000);
    const diffDay = Math.floor(diffMs / 86400000);

    if (diffMin < 1) return 'Baru saja';
    if (diffMin < 60) return `${diffMin} menit lalu`;
    if (diffHr < 24) return `${diffHr} jam lalu`;
    if (diffDay < 7) return `${diffDay} hari lalu`;
    return formatDate(dateStr);
}

export function generateId(prefix: string = 'id'): string {
    return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 8)}`;
}

export function getStatusColor(status: string): string {
    const map: Record<string, string> = {
        pending: 'var(--color-warning)',
        surveyed: 'var(--color-success)',
        rejected: 'var(--color-error)',
        draft: 'var(--color-text-secondary)',
        submitted: 'var(--color-success)',
        baru: 'var(--color-info)',
        diproses: 'var(--color-warning)',
        selesai: 'var(--color-success)',
        ditolak: 'var(--color-error)',
    };
    return map[status] || 'var(--color-text-secondary)';
}

export function getStatusLabel(status: string): string {
    const map: Record<string, string> = {
        pending: 'Menunggu',
        surveyed: 'Selesai',
        rejected: 'Ditolak',
        draft: 'Draf',
        submitted: 'Terkirim',
        baru: 'Baru',
        diproses: 'Diproses',
        selesai: 'Selesai',
        ditolak: 'Ditolak',
    };
    return map[status] || status;
}

export function getSentimentColor(sentiment: string): string {
    const map: Record<string, string> = {
        positive: 'var(--color-success)',
        negative: 'var(--color-error)',
        neutral: 'var(--color-info)',
    };
    return map[sentiment] || 'var(--color-text-secondary)';
}

export function getSentimentLabel(sentiment: string): string {
    const map: Record<string, string> = {
        positive: 'Positif',
        negative: 'Negatif',
        neutral: 'Netral',
    };
    return map[sentiment] || sentiment;
}

export function getPriorityColor(priority: string): string {
    const map: Record<string, string> = {
        rendah: 'var(--color-info)',
        sedang: 'var(--color-warning)',
        tinggi: 'var(--color-error)',
    };
    return map[priority] || 'var(--color-text-secondary)';
}

export function getPriorityLabel(priority: string): string {
    const map: Record<string, string> = {
        rendah: 'Rendah',
        sedang: 'Sedang',
        tinggi: 'Tinggi',
    };
    return map[priority] || priority;
}

export function truncate(str: string, length: number = 100): string {
    if (str.length <= length) return str;
    return str.substring(0, length) + '...';
}
