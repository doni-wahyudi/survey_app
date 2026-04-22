import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { 
    Search, 
    Download, 
    Filter,
    MoreHorizontal,
    ChevronLeft,
    ChevronRight,
    Loader2,
    MapPin,
    User,
    RefreshCw,
    MessageSquare
} from 'lucide-react';
import { fetchAspirations, fetchCensus, fetchMediaMonitoring, fetchVouchers } from './lib/supabase';
import { formatDate, getStatusColor, getStatusLabel } from './utils/helpers';
import * as XLSX from 'xlsx';
import { useAuth } from './store/useAuth';
import { useActivityLog } from './store/useActivityLog';
import type { Aspiration, CensusData, MediaMonitoring, InsuranceData } from './types';

type FilterType = 'all' | 'aspiration' | 'census' | 'media' | 'insurance';

const ITEMS_PER_PAGE = 10;

type SortKey = 'date' | 'type' | 'title' | 'location' | 'reporter' | 'status';

interface ReportRow {
  id: string;
  date: string;
  type: 'Aspiration' | 'Census' | 'Media' | 'Insurance';
  title: string;
  description: string;
  kabupaten: string;
  kecamatan?: string;
  desa?: string;
  reporter: string;
  status: string;
  rawData: any;
}

const typeLabels: Record<string, string> = {
  'Aspiration': 'ASPIRASI',
  'Media': 'MEDIA',
  'Census': 'SENSUS',
  'Insurance': 'ASURANSI'
};

const typeStyles: Record<string, string> = {
  'Aspiration': 'bg-indigo-100 text-indigo-700 ring-indigo-200',
  'Media': 'bg-rose-100 text-rose-700 ring-rose-200',
  'Census': 'bg-emerald-100 text-emerald-700 ring-emerald-200',
  'Insurance': 'bg-amber-100 text-amber-700 ring-amber-200'
};

export default function Table() {
  const [reports, setReports] = useState<ReportRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState<FilterType>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [selectedKabupaten, setSelectedKabupaten] = useState('all');
  const [sortConfig, setSortConfig] = useState<{key: SortKey, direction: 'asc' | 'desc'}>({
    key: 'date',
    direction: 'desc'
  });

  const { user } = useAuth();
  const { addLog } = useActivityLog();

  const uniqueKabupatens = useMemo(() => {
    const kabupatens = new Set(reports.map(r => r.kabupaten).filter(Boolean));
    return Array.from(kabupatens).sort();
  }, [reports]);

  const stats = useMemo(() => {
    return {
      total: reports.length,
      aspiration: reports.filter(r => r.type === 'Aspiration').length,
      census: reports.filter(r => r.type === 'Census').length,
      media: reports.filter(r => r.type === 'Media').length,
      insurance: reports.filter(r => r.type === 'Insurance').length,
    };
  }, [reports]);

  const filteredReports = useMemo(() => {
    let result = [...reports];
    if (activeTab !== 'all') {
      result = result.filter(r => r.type.toLowerCase() === activeTab);
    }
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(r => 
        r.title.toLowerCase().includes(query) ||
        r.description?.toLowerCase().includes(query) ||
        r.reporter.toLowerCase().includes(query) ||
        r.kabupaten.toLowerCase().includes(query)
      );
    }
    if (selectedKabupaten !== 'all') {
      result = result.filter(r => r.kabupaten === selectedKabupaten);
    }
    if (dateRange.start) {
      result = result.filter(r => new Date(r.date) >= new Date(dateRange.start));
    }
    if (dateRange.end) {
      const endDate = new Date(dateRange.end);
      endDate.setHours(23, 59, 59);
      result = result.filter(r => new Date(r.date) <= endDate);
    }
    result.sort((a, b) => {
      let key = sortConfig.key === 'location' ? 'kabupaten' : sortConfig.key;
      let aValue: any = (a as any)[key];
      let bValue: any = (b as any)[key];
      if (sortConfig.key === 'date') {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      }
      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
    return result;
  }, [reports, activeTab, searchQuery, selectedKabupaten, dateRange, sortConfig]);

  const totalPages = useMemo(() => Math.ceil(filteredReports.length / ITEMS_PER_PAGE), [filteredReports]);
  const paginatedReports = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredReports.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredReports, currentPage]);

  const loadData = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
    else setIsRefreshing(true);
    try {
        const [aspirations, census, media, insurance] = await Promise.all([
            fetchAspirations(),
            fetchCensus(),
            fetchMediaMonitoring(),
            fetchVouchers()
        ]);
        const mappedAspirations = (aspirations || []).map((a: Aspiration) => ({
            id: a.id,
            date: a.created_at,
            type: 'Aspiration' as const,
            title: a.judul,
            description: a.deskripsi,
            kabupaten: a.kabupaten,
            kecamatan: a.kecamatan,
            desa: a.desa,
            reporter: (a as any).profiles?.full_name || 'System',
            status: a.status,
            rawData: a
        }));
        const mappedCensus = (census || []).map((c: CensusData) => ({
            id: c.id,
            date: c.collected_at,
            type: 'Census' as const,
            title: c.respondent_name,
            description: `NIK: ${c.nik}`,
            kabupaten: c.kabupaten,
            kecamatan: c.kecamatan,
            desa: c.desa,
            reporter: (c as any).profiles?.full_name || 'System',
            status: 'submitted',
            rawData: c
        }));
        const mappedMedia = (media || []).map((m: MediaMonitoring) => ({
            id: m.id,
            date: m.reported_at,
            type: 'Media' as const,
            title: m.title,
            description: m.content,
            kabupaten: m.category,
            reporter: (m as any).profiles?.full_name || 'System',
            status: 'published',
            rawData: m
        }));
        const mappedInsurance = (insurance || []).map((i: InsuranceData) => ({
            id: i.id,
            date: i.created_at,
            type: 'Insurance' as const,
            title: (i as any).subject || i.policy_number,
            description: (i as any).details || 'Pendaftaran Asuransi',
            kabupaten: (i as any).kabupaten || '-',
            reporter: (i as any).profiles?.full_name || 'System',
            status: i.status || 'active',
            rawData: i
        }));
        setReports([...mappedAspirations, ...mappedCensus, ...mappedMedia, ...mappedInsurance]);
    } catch (e) {
        console.error(e);
    } finally {
        setIsLoading(false);
        setIsRefreshing(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleSort = (key: SortKey) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc'
    }));
  };

  const exportToExcel = () => {
    const dataToExport = filteredReports.map(r => ({
      Tanggal: formatDate(r.date),
      Tipe: typeLabels[r.type],
      Judul: r.title,
      Deskripsi: r.description,
      Kabupaten: r.kabupaten,
      Kecamatan: r.kecamatan || '-',
      Desa: r.desa || '-',
      Reporter: r.reporter,
      Status: getStatusLabel(r.status)
    }));
    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Reports");
    XLSX.writeFile(wb, `Report_Data_${new Date().toISOString().split('T')[0]}.xlsx`);
    if (user) addLog(user.id, 'data_exported', `Export data sebanyak ${dataToExport.length} baris`);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
        <p className="text-gray-500 font-medium">Menyiapkan data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analisis Laporan</h1>
          <p className="text-gray-500 mt-1">Kelola dan monitor semua aktivitas aplikasi dalam satu tampilan</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => loadData(true)} disabled={isRefreshing} className="p-2.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all border border-gray-200">
            <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
          <button onClick={exportToExcel} className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-all shadow-sm">
            <Download className="w-4 h-4" />
            <span>Export XLSX</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row gap-4 justify-between items-center bg-gray-50/30">
          <div className="flex bg-white p-1 rounded-xl border border-gray-200">
            {(['all', 'aspiration', 'census', 'media', 'insurance'] as FilterType[]).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === tab ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input type="text" placeholder="Cari..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-xl outline-none text-sm" />
            </div>
            <button onClick={() => setShowFilters(!showFilters)} className={`p-2 rounded-xl border ${showFilters ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-white border-gray-200'}`}>
              <Filter className="w-5 h-5" />
            </button>
          </div>
        </div>

        {showFilters && (
          <div className="p-4 bg-gray-50 border-b border-gray-100 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-2">Kabupaten</label>
              <select value={selectedKabupaten} onChange={(e) => setSelectedKabupaten(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm">
                <option value="all">Semua Kabupaten</option>
                {uniqueKabupatens.map(k => <option key={k} value={k}>{k}</option>)}
              </select>
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50/50 text-gray-500 text-xs font-semibold uppercase tracking-wider">
                <th className="px-6 py-4 cursor-pointer" onClick={() => handleSort('date')}>Tanggal</th>
                <th className="px-6 py-4">Tipe</th>
                <th className="px-6 py-4">Judul/Nama</th>
                <th className="px-6 py-4">Lokasi</th>
                <th className="px-6 py-4">Pelapor</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginatedReports.map((report) => (
                <tr key={report.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4 text-sm text-gray-600">{formatDate(report.date)}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ring-1 ring-inset ${typeStyles[report.type]}`}>
                      {typeLabels[report.type]}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{report.title}</div>
                    <div className="text-xs text-gray-500">{report.description}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{report.kabupaten}</td>
                  <td className="px-6 py-4 text-sm text-gray-900 font-medium">{report.reporter}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-${getStatusColor(report.status)}-100 text-${getStatusColor(report.status)}-800`}>
                      {getStatusLabel(report.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right"><MoreHorizontal size={20} className="text-gray-400" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Menampilkan <span className="font-medium text-gray-900">{paginatedReports.length}</span> dari <span className="font-medium text-gray-900">{filteredReports.length}</span> hasil
          </p>
          <div className="flex items-center gap-2">
            <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}
              className="p-2 rounded-lg border border-gray-200 disabled:opacity-50 hover:bg-gray-50">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-sm font-medium text-gray-900">Page {currentPage} of {totalPages}</span>
            <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages}
              className="p-2 rounded-lg border border-gray-200 disabled:opacity-50 hover:bg-gray-50">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
