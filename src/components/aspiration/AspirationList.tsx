import { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../../store/useAuth';
import { getPriorityLabel, getPriorityColor, getStatusLabel, getStatusColor, formatTimeAgo } from '../../utils/helpers';
import { Plus, Search, MessageSquare, MapPin, ArrowUpCircle, CheckCircle, Clock, Loader, Download } from 'lucide-react';
import AspirationForm from './AspirationForm';
import { supabase, TABLES } from '../../lib/supabase';
import type { Aspiration } from '../../types';
import { exportAspirations } from '../../utils/export';

export default function AspirationList() {
    const { user } = useAuth();
    const isAdmin = user?.role === 'admin';
    const [loading, setLoading] = useState(true);
    const [aspirations, setAspirations] = useState<Aspiration[]>([]);
    const [showForm, setShowForm] = useState(false);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    const fetchAspirations = async () => {
        if (!supabase || !user?.id) return;
        setLoading(true);
        try {
            let query = supabase
                .from(TABLES.aspirations)
                .select('*');

            if (!isAdmin) {
                query = query.eq('reported_by', user.id);
            }

            const { data, error } = await query.order('created_at', { ascending: false });

            if (error) throw error;
            setAspirations((data || []) as Aspiration[]);
        } catch (error) {
            console.error('Error fetching aspirations:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user?.id) {
            fetchAspirations();
        }
    }, [user?.id, isAdmin]);

    const filtered = useMemo(() => {
        return aspirations.filter(a => {
            const matchSearch = !search || a.judul.toLowerCase().includes(search.toLowerCase()) || a.deskripsi.toLowerCase().includes(search.toLowerCase());
            const matchStatus = statusFilter === 'all' || a.status === statusFilter;
            return matchSearch && matchStatus;
        });
    }, [aspirations, search, statusFilter]);

    if (showForm) return <AspirationForm onBack={() => {
        setShowForm(false);
        fetchAspirations();
    }} />;

    if (loading) {
        return (
            <div className="flex items-center justify-center" style={{ minHeight: '60vh' }}>
                <Loader className="animate-spin" style={{ color: 'var(--color-primary)' }} />
            </div>
        );
    }

    const truncate = (str: string, n: number) => {
        return str.length > n ? str.substr(0, n - 1) + '...' : str;
    };

    return (
        <div className="p-4 space-y-4">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Aspirasi</h2>
                <div className="flex gap-2">
                    {isAdmin && (
                        <button className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 rounded-lg text-sm font-medium" onClick={() => exportAspirations(filtered)} disabled={filtered.length === 0}>
                            <Download size={14} /> Export
                        </button>
                    )}
                    {!isAdmin && (
                        <button className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium" onClick={() => setShowForm(true)}>
                            <Plus size={14} /> Tambah
                        </button>
                    )}
                </div>
            </div>

            <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input 
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl outline-none"
                    placeholder="Cari judul aspirasi..." 
                    value={search} 
                    onChange={(e) => setSearch(e.target.value)} 
                />
            </div>

            <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                {[
                    { key: 'all', label: 'Semua' },
                    { key: 'pending', label: 'Menunggu' },
                    { key: 'in_progress', label: 'Diproses' },
                    { key: 'resolved', label: 'Selesai' },
                ].map(f => (
                    <button 
                        key={f.key} 
                        className={`whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${statusFilter === f.key ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`} 
                        onClick={() => setStatusFilter(f.key)}
                    >
                        {f.label}
                    </button>
                ))}
            </div>

            {filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 mb-4">
                        <MessageSquare size={32} />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">Belum ada aspirasi</h3>
                    <p className="text-gray-500 max-w-xs">Mulai sampaikan aspirasi warga melalui tombol Tambah.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {filtered.map(a => (
                        <div key={a.id} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                            <div className="flex justify-between items-start mb-3">
                                <div className="flex items-center gap-2">
                                    <div className={`p-1.5 rounded-full ${
                                        (a.status as string) === 'resolved' || (a.status as string) === 'selesai'
                                            ? 'bg-green-100 text-green-600' 
                                            : 'bg-yellow-100 text-yellow-600'
                                    }`}>
                                        {(a.status as string) === 'resolved' || (a.status as string) === 'selesai' ? <CheckCircle size={14} /> : <Clock size={14} />}
                                    </div>
                                    <span className="font-bold text-gray-900">{truncate(a.judul, 30)}</span>
                                </div>
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase flex items-center gap-1 bg-opacity-10`} style={{ backgroundColor: getPriorityColor(a.prioritas) + '20', color: getPriorityColor(a.prioritas) }}>
                                    <ArrowUpCircle size={10} />
                                    {getPriorityLabel(a.prioritas)}
                                </span>
                            </div>

                            <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                                {a.deskripsi}
                            </p>

                            <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                                <div className="flex items-center gap-3 text-[10px] text-gray-500 font-medium">
                                    <span className="flex items-center gap-1 uppercase">
                                        <MapPin size={10} /> {a.desa}
                                    </span>
                                    <span>•</span>
                                    <span className="uppercase">{a.kategori}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-${getStatusColor(a.status)}-100 text-${getStatusColor(a.status)}-800`}>
                                        {getStatusLabel(a.status)}
                                    </span>
                                    <span className="text-[10px] text-gray-400">{formatTimeAgo(a.created_at)}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
