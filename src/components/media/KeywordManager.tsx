import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Plus, Trash2, ArrowLeft, Loader, Info, ShieldCheck } from 'lucide-react';
import { useApp } from '../../store/useApp';

interface Keyword {
    id: string;
    term: string;
    type: string;
    is_active: boolean;
    created_at: string;
}

interface Props {
    onBack: () => void;
}

export default function KeywordManager({ onBack }: Props) {
    const { addToast } = useApp();
    const [loading, setLoading] = useState(true);
    const [keywords, setKeywords] = useState<Keyword[]>([]);
    const [newKeyword, setNewKeyword] = useState('');
    const [newType, setNewType] = useState('individual');
    const [submitting, setSubmitting] = useState(false);
    const [syncing, setSyncing] = useState(false);

    useEffect(() => {
        fetchKeywords();
    }, []);

    const fetchKeywords = async () => {
        if (!supabase) return;
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('monitoring_keywords')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setKeywords(data || []);
        } catch (error) {
            console.error('Error fetching keywords:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = async () => {
        if (!newKeyword.trim()) return;
        setSubmitting(true);
        try {
            const { data, error } = await supabase!
                .from('monitoring_keywords')
                .insert({
                    term: newKeyword.trim(),
                    type: newType,
                    is_active: true
                })
                .select()
                .single();

            if (error) throw error;
            setKeywords([data, ...keywords]);
            setNewKeyword('');
            addToast('Keyword berhasil ditambahkan', 'success');
        } catch (error) {
            console.error('Error adding keyword:', error);
            addToast('Gagal menambahkan keyword', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        try {
            const { error } = await supabase!
                .from('monitoring_keywords')
                .delete()
                .eq('id', id);

            if (error) throw error;
            setKeywords(keywords.filter(k => k.id !== id));
            addToast('Keyword dihapus', 'success');
        } catch (error) {
            console.error('Error deleting keyword:', error);
        }
    };

    const handleSyncNews = async () => {
        setSyncing(true);
        try {
            // Calling the Supabase Edge Function (using your deployed name: clever-handler)
            const { data, error } = await supabase!.functions.invoke('clever-handler');
            
            if (error) throw error;
            
            addToast(data.message || 'Sinkronisasi berhasil', 'success');
            // Refresh to see new news
            if (window.confirm('Berita baru telah ditambahkan. Ingin melihat daftar berita?')) {
                onBack(); // Go back to dashboard/list
            }
        } catch (error) {
            console.error('Error syncing news:', error);
            addToast('Sinkronisasi gagal. Pastikan API Key sudah terpasang.', 'error');
        } finally {
            setSyncing(false);
        }
    };

    return (
        <div className="page-enter">
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 'var(--space-lg)' }}>
                <button className="btn btn-icon btn-ghost" onClick={onBack}>
                    <ArrowLeft size={20} />
                </button>
                <h2 style={{ fontSize: 'var(--font-size-md)', fontWeight: 700 }}>Pengaturan Keyword Monitoring</h2>
                <button 
                    className="btn btn-secondary btn-sm" 
                    onClick={handleSyncNews}
                    disabled={syncing || keywords.length === 0}
                    style={{ marginLeft: 'auto' }}
                >
                    {syncing ? <Loader className="spin-animation" size={14} /> : <Plus size={14} />}
                    Sync Berita
                </button>
            </div>

            <div className="card" style={{ marginBottom: 'var(--space-lg)', background: 'var(--color-info-light)', border: 'none' }}>
                <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                    <Info size={20} style={{ color: 'var(--color-info)', flexShrink: 0 }} />
                    <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
                        Keyword yang Anda masukkan di sini akan dipantau secara otomatis oleh sistem melalui berbagai portal berita nasional.
                        <br /><br />
                        <strong>Cara Pakai:</strong> Masukkan nama orang/partai, lalu tekan <strong>Sync Berita</strong> untuk menarik berita terbaru secara otomatis.
                    </p>
                </div>
            </div>

            <div className="card" style={{ marginBottom: 'var(--space-xl)' }}>
                <h3 style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600, marginBottom: 'var(--space-md)' }}>Tambah Keyword Baru</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">Nama Individu / Partai / Isu</label>
                        <input 
                            className="form-input" 
                            placeholder="Contoh: Partai Golkar, Prabowo Subianto"
                            value={newKeyword}
                            onChange={(e) => setNewKeyword(e.target.value)}
                        />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">Kategori</label>
                        <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                            {['individual', 'party', 'issue'].map(t => (
                                <button 
                                    key={t}
                                    className={`filter-pill ${newType === t ? 'active' : ''}`}
                                    onClick={() => setNewType(t)}
                                    style={{ flex: 1, textTransform: 'capitalize' }}
                                >
                                    {t === 'individual' ? 'Individu' : t === 'party' ? 'Partai' : 'Isu'}
                                </button>
                            ))}
                        </div>
                    </div>
                    <button 
                        className="btn btn-primary btn-block" 
                        onClick={handleAdd}
                        disabled={submitting || !newKeyword.trim()}
                    >
                        {submitting ? <Loader className="spin-animation" size={18} /> : <Plus size={18} />}
                        Simpan Keyword
                    </button>
                </div>
            </div>

            <h3 style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600, marginBottom: 'var(--space-md)' }}>Daftar Monitoring Aktif</h3>
            
            {loading ? (
                <div style={{ textAlign: 'center', padding: 'var(--space-xl)' }}>
                    <Loader className="spin-animation" style={{ color: 'var(--color-primary)' }} />
                </div>
            ) : keywords.length === 0 ? (
                <div className="empty-state">
                    <p>Belum ada keyword yang dipantau.</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                    {keywords.map(k => (
                        <div key={k.id} className="list-item" style={{ background: 'var(--color-surface-elevated)' }}>
                            <div style={{ 
                                width: 36, height: 36, borderRadius: 'var(--radius-full)', 
                                background: 'var(--color-success-light)', color: 'var(--color-success)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                            }}>
                                <ShieldCheck size={18} />
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: 600, fontSize: 'var(--font-size-sm)' }}>{k.term}</div>
                                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-tertiary)', textTransform: 'capitalize' }}>
                                    Tipe: {k.type === 'individual' ? 'Individu' : k.type === 'party' ? 'Partai' : 'Isu'}
                                </div>
                            </div>
                            <button className="btn btn-icon btn-ghost" onClick={() => handleDelete(k.id)} style={{ color: 'var(--color-error)' }}>
                                <Trash2 size={18} />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
