import { useState, useEffect } from 'react';
import {
    FileText,
    Download,
    FileSpreadsheet,
    Filter,
    Calendar,
    BookOpen,
    Users,
    RotateCcw,
    Building2,
    ChevronDown,
    RefreshCw,
    Clock,
    AlertTriangle,
    CheckCircle,
    TrendingUp,
    TrendingDown,
    Search,
    X
} from 'lucide-react';
import { reportsAPI, asramaAPI, categoryAPI } from '../api';
import toast from 'react-hot-toast';
import Skeleton from '../components/Skeleton';

// Period options for filtering
const PERIOD_OPTIONS = [
    { value: 'today', label: 'Hari Ini' },
    { value: 'yesterday', label: 'Kemarin' },
    { value: 'this_week', label: 'Minggu Ini' },
    { value: 'last_week', label: 'Minggu Lalu' },
    { value: 'this_month', label: 'Bulan Ini' },
    { value: 'last_month', label: 'Bulan Lalu' },
    { value: 'this_year', label: 'Tahun Ini' },
    { value: 'last_year', label: 'Tahun Lalu' },
    { value: 'all_time', label: 'Semua Waktu' },
];

// Report tabs
const REPORT_TABS = [
    { id: 'borrowings', label: 'Peminjaman', icon: BookOpen },
    { id: 'returns', label: 'Pengembalian', icon: RotateCcw },
    { id: 'books', label: 'Stok Buku', icon: BookOpen },
    { id: 'santri', label: 'Data Santri', icon: Users },
];

export default function ReportsPage() {
    const [activeTab, setActiveTab] = useState('borrowings');
    const [loading, setLoading] = useState(true);
    const [exporting, setExporting] = useState(false);

    // Filter states
    const [period, setPeriod] = useState('this_month');
    const [asramaId, setAsramaId] = useState('');
    const [categoryId, setCategoryId] = useState('');
    const [reportType, setReportType] = useState('all');

    // Data states
    const [data, setData] = useState({ items: [], total: 0, summary: {} });
    const [asramas, setAsramas] = useState([]);
    const [categories, setCategories] = useState([]);

    // Fetch filter options on mount
    useEffect(() => {
        const fetchFilterOptions = async () => {
            try {
                const [asramaRes, categoryRes] = await Promise.all([
                    asramaAPI.list(),
                    categoryAPI.list()
                ]);
                // Handle both array and paginated object responses
                const asramaData = asramaRes.data?.items || asramaRes.data || [];
                const categoryData = categoryRes.data?.items || categoryRes.data || [];
                setAsramas(Array.isArray(asramaData) ? asramaData : []);
                setCategories(Array.isArray(categoryData) ? categoryData : []);
            } catch (error) {
                console.error('Failed to load filter options', error);
            }
        };
        fetchFilterOptions();
    }, []);

    // Fetch report data when tab or filters change
    useEffect(() => {
        fetchReportData();
    }, [activeTab, period, asramaId, categoryId, reportType]);

    const fetchReportData = async () => {
        setLoading(true);
        try {
            const params = { period };
            if (asramaId) params.asrama_id = asramaId;
            if (categoryId) params.category_id = categoryId;
            if (reportType && reportType !== 'all') params.report_type = reportType;

            let response;
            switch (activeTab) {
                case 'borrowings':
                    response = await reportsAPI.getBorrowings(params);
                    break;
                case 'returns':
                    response = await reportsAPI.getReturns(params);
                    break;
                case 'books':
                    response = await reportsAPI.getBooks(params);
                    break;
                case 'santri':
                    response = await reportsAPI.getSantri(params);
                    break;
                default:
                    response = { data: { items: [], total: 0, summary: {} } };
            }
            setData(response.data);
        } catch (error) {
            console.error('Failed to load report', error);
            toast.error('Gagal memuat laporan');
        } finally {
            setLoading(false);
        }
    };

    const handleExport = async (format) => {
        setExporting(true);
        try {
            const params = {
                report: activeTab,
                period,
                ...(asramaId && { asrama_id: asramaId }),
                ...(categoryId && { category_id: categoryId }),
                ...(reportType && reportType !== 'all' && { report_type: reportType })
            };

            const response = format === 'excel'
                ? await reportsAPI.exportExcel(params)
                : await reportsAPI.exportPdf(params);

            // Create download link
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `laporan_${activeTab}_${new Date().toISOString().split('T')[0]}.${format === 'excel' ? 'xlsx' : 'pdf'}`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);

            toast.success(`Berhasil export ke ${format.toUpperCase()}`);
        } catch (error) {
            console.error('Export failed', error);
            toast.error('Gagal export laporan');
        } finally {
            setExporting(false);
        }
    };

    const resetFilters = () => {
        setPeriod('this_month');
        setAsramaId('');
        setCategoryId('');
        setReportType('all');
    };

    // Get sub-type options based on active tab
    const getSubTypeOptions = () => {
        switch (activeTab) {
            case 'returns':
                return [
                    { value: 'all', label: 'Semua Pengembalian' },
                    { value: 'on_time', label: 'Tepat Waktu' },
                    { value: 'late', label: 'Terlambat' },
                ];
            case 'books':
                return [
                    { value: 'all', label: 'Semua Buku' },
                    { value: 'popular', label: 'Sering Dipinjam' },
                    { value: 'rare', label: 'Jarang Dipinjam' },
                    { value: 'lost', label: 'Hilang/Rusak' },
                ];
            case 'santri':
                return [
                    { value: 'all', label: 'Semua Santri' },
                    { value: 'active', label: 'Sedang Meminjam' },
                    { value: 'with_fine', label: 'Punya Denda' },
                    { value: 'never_borrowed', label: 'Belum Pernah Pinjam' },
                ];
            default:
                return [];
        }
    };

    // Render summary cards
    const renderSummary = () => {
        const { summary } = data;
        if (!summary) return null;

        let cards = [];

        switch (activeTab) {
            case 'borrowings':
                cards = [
                    { label: 'Total Peminjaman', value: summary.total_borrowings || 0, icon: BookOpen, color: 'emerald' },
                    { label: 'Sedang Dipinjam', value: summary.borrowed || 0, icon: Clock, color: 'blue' },
                    { label: 'Sudah Kembali', value: summary.returned || 0, icon: CheckCircle, color: 'green' },
                    { label: 'Terlambat', value: summary.overdue || 0, icon: AlertTriangle, color: 'red' },
                ];
                break;
            case 'returns':
                cards = [
                    { label: 'Total Pengembalian', value: summary.total_returns || 0, icon: RotateCcw, color: 'emerald' },
                    { label: 'Tepat Waktu', value: summary.on_time_count || 0, icon: CheckCircle, color: 'green' },
                    { label: 'Terlambat', value: summary.late_count || 0, icon: AlertTriangle, color: 'amber' },
                    { label: 'Total Denda', value: `Rp ${(summary.total_fine_collected || 0).toLocaleString('id-ID')}`, icon: FileText, color: 'red', isText: true },
                ];
                break;
            case 'books':
                cards = [
                    { label: 'Total Buku', value: summary.total_books || 0, icon: BookOpen, color: 'emerald' },
                    { label: 'Stok Tersedia', value: summary.stok_tersedia || 0, icon: CheckCircle, color: 'green' },
                    { label: 'Populer', value: summary.popular_books || 0, icon: TrendingUp, color: 'blue' },
                    { label: 'Jarang Dipinjam', value: summary.rare_books || 0, icon: TrendingDown, color: 'slate' },
                ];
                break;
            case 'santri':
                cards = [
                    { label: 'Total Santri', value: summary.total_santri || 0, icon: Users, color: 'emerald' },
                    { label: 'Aktif Meminjam', value: summary.active_borrowers || 0, icon: BookOpen, color: 'blue' },
                    { label: 'Punya Denda', value: summary.with_unpaid_fine || 0, icon: AlertTriangle, color: 'amber' },
                    { label: 'Belum Pernah Pinjam', value: summary.never_borrowed || 0, icon: X, color: 'slate' },
                ];
                break;
        }

        return (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {cards.map((card, idx) => (
                    <div key={idx} className={`bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm`}>
                        <div className="flex items-center justify-between mb-3">
                            <div className={`w-10 h-10 rounded-xl bg-${card.color}-100 dark:bg-${card.color}-900/30 flex items-center justify-center`}>
                                <card.icon size={20} className={`text-${card.color}-600 dark:text-${card.color}-400`} />
                            </div>
                        </div>
                        <p className="text-2xl font-bold text-slate-800 dark:text-white">
                            {card.isText ? card.value : card.value.toLocaleString('id-ID')}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{card.label}</p>
                    </div>
                ))}
            </div>
        );
    };

    // Render table based on active tab
    const renderTable = () => {
        if (loading) {
            return (
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                                {[1, 2, 3, 4, 5, 6].map(i => (
                                    <th key={i} className="px-6 py-4">
                                        <Skeleton className="w-20 h-4" />
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {[1, 2, 3, 4, 5].map(i => (
                                <tr key={i} className="border-b border-slate-100 dark:border-slate-700/50">
                                    {[1, 2, 3, 4, 5, 6].map(j => (
                                        <td key={j} className="px-6 py-4">
                                            <Skeleton className="w-24 h-4" />
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            );
        }

        if (data.items.length === 0) {
            return (
                <div className="text-center py-16">
                    <FileText size={48} className="text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-500 font-medium">Tidak ada data untuk ditampilkan</p>
                    <p className="text-slate-400 text-sm mt-1">Coba ubah filter atau periode waktu</p>
                </div>
            );
        }

        switch (activeTab) {
            case 'borrowings':
                return (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">No</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">Santri</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">Buku</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">Tgl Pinjam</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">Jatuh Tempo</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">Status</th>
                                    <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase">Denda</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                                {data.items.map((item, idx) => (
                                    <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                        <td className="px-6 py-4 text-sm text-slate-600">{idx + 1}</td>
                                        <td className="px-6 py-4">
                                            <p className="text-sm font-medium text-slate-800 dark:text-white">{item.santri_nama}</p>
                                            <p className="text-xs text-slate-400">{item.asrama}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-sm text-slate-700 dark:text-slate-300">{item.book_judul}</p>
                                            <p className="text-xs text-slate-400">{item.category}</p>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-600">{item.borrow_date}</td>
                                        <td className="px-6 py-4 text-sm text-slate-600">{item.due_date}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${item.status === 'RETURNED' ? 'bg-green-100 text-green-700' :
                                                item.is_overdue ? 'bg-red-100 text-red-700' :
                                                    'bg-blue-100 text-blue-700'
                                                }`}>
                                                {item.status === 'RETURNED' ? 'Dikembalikan' : item.is_overdue ? 'Terlambat' : 'Dipinjam'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-right font-medium text-slate-700">
                                            {item.fine_amount > 0 ? `Rp ${item.fine_amount.toLocaleString('id-ID')}` : '-'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                );

            case 'returns':
                return (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">No</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">Santri</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">Buku</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">Tgl Kembali</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">Keterlambatan</th>
                                    <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase">Denda</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                                {data.items.map((item, idx) => (
                                    <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                        <td className="px-6 py-4 text-sm text-slate-600">{idx + 1}</td>
                                        <td className="px-6 py-4">
                                            <p className="text-sm font-medium text-slate-800 dark:text-white">{item.santri_nama}</p>
                                            <p className="text-xs text-slate-400">{item.asrama}</p>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-700 dark:text-slate-300">{item.book_judul}</td>
                                        <td className="px-6 py-4 text-sm text-slate-600">{item.return_date}</td>
                                        <td className="px-6 py-4">
                                            {item.days_late > 0 ? (
                                                <span className="text-sm text-red-600 font-medium">{item.days_late} hari</span>
                                            ) : (
                                                <span className="text-sm text-green-600 font-medium">Tepat waktu</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-right font-medium text-slate-700">
                                            {item.fine_amount > 0 ? `Rp ${item.fine_amount.toLocaleString('id-ID')}` : '-'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                );

            case 'books':
                return (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">No</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">Kode</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">Judul Buku</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">Kategori</th>
                                    <th className="px-6 py-4 text-center text-xs font-bold text-slate-500 uppercase">Stok</th>
                                    <th className="px-6 py-4 text-center text-xs font-bold text-slate-500 uppercase">Tersedia</th>
                                    <th className="px-6 py-4 text-center text-xs font-bold text-slate-500 uppercase">Dipinjam</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                                {data.items.map((item, idx) => (
                                    <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                        <td className="px-6 py-4 text-sm text-slate-600">{idx + 1}</td>
                                        <td className="px-6 py-4">
                                            <span className="px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded text-xs font-mono">{item.kode_buku}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-sm font-medium text-slate-800 dark:text-white">{item.judul}</p>
                                            <p className="text-xs text-slate-400">{item.penulis}</p>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-600">{item.category}</td>
                                        <td className="px-6 py-4 text-center text-sm font-medium text-slate-700">{item.total_stok}</td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${item.stok_tersedia > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                {item.stok_tersedia}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center text-sm font-medium text-blue-600">{item.borrow_count}x</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                );

            case 'santri':
                return (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">No</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">NIS</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">Nama Santri</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">Asrama</th>
                                    <th className="px-6 py-4 text-center text-xs font-bold text-slate-500 uppercase">Total Pinjam</th>
                                    <th className="px-6 py-4 text-center text-xs font-bold text-slate-500 uppercase">Aktif</th>
                                    <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase">Total Denda</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                                {data.items.map((item, idx) => (
                                    <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                        <td className="px-6 py-4 text-sm text-slate-600">{idx + 1}</td>
                                        <td className="px-6 py-4">
                                            <span className="px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded text-xs font-mono">{item.nis}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-sm font-medium text-slate-800 dark:text-white">{item.nama}</p>
                                            <p className="text-xs text-slate-400">{item.kamar}</p>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-600">{item.asrama}</td>
                                        <td className="px-6 py-4 text-center text-sm font-medium text-slate-700">{item.total_borrow}x</td>
                                        <td className="px-6 py-4 text-center">
                                            {item.active_borrow > 0 ? (
                                                <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold">{item.active_borrow}</span>
                                            ) : (
                                                <span className="text-slate-400">-</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-right font-medium">
                                            {item.total_fine > 0 ? (
                                                <span className="text-red-600">Rp {item.total_fine.toLocaleString('id-ID')}</span>
                                            ) : (
                                                <span className="text-slate-400">-</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <div className="flex-1 flex flex-col min-h-screen bg-slate-50/50 dark:bg-slate-900 font-sans -mx-6 -mt-6 lg:-mx-10 lg:-mt-8 mb-6">
            {/* Header */}
            <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-8 py-6">
                <div className="max-w-7xl mx-auto">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
                                <FileText className="text-emerald-600" size={28} />
                                Laporan
                            </h1>
                            <p className="text-slate-500 dark:text-slate-400 mt-1">
                                Generate dan export laporan perpustakaan
                            </p>
                        </div>

                        {/* Export Buttons */}
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => handleExport('excel')}
                                disabled={exporting || loading}
                                className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium text-sm transition-colors disabled:opacity-50"
                            >
                                <FileSpreadsheet size={18} />
                                Export Excel
                            </button>
                            <button
                                onClick={() => handleExport('pdf')}
                                disabled={exporting || loading}
                                className="flex items-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium text-sm transition-colors disabled:opacity-50"
                            >
                                <Download size={18} />
                                Export PDF
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 max-w-7xl mx-auto w-full px-8 py-6">
                {/* Tabs */}
                <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
                    {REPORT_TABS.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => {
                                setActiveTab(tab.id);
                                setReportType('all');
                            }}
                            className={`flex items-center gap-2 px-5 py-3 rounded-xl font-medium text-sm whitespace-nowrap transition-all ${activeTab === tab.id
                                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200 dark:shadow-emerald-900/30'
                                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-emerald-300'
                                }`}
                        >
                            <tab.icon size={18} />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Filters */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 mb-6">
                    <div className="flex flex-wrap items-center gap-4">
                        {/* Period Filter */}
                        <div className="relative">
                            <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <select
                                value={period}
                                onChange={(e) => setPeriod(e.target.value)}
                                className="pl-10 pr-8 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-200 appearance-none cursor-pointer"
                            >
                                {PERIOD_OPTIONS.map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                            <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        </div>

                        {/* Asrama Filter (for borrowings & santri) */}
                        {(activeTab === 'borrowings' || activeTab === 'santri') && (
                            <div className="relative">
                                <Building2 size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <select
                                    value={asramaId}
                                    onChange={(e) => setAsramaId(e.target.value)}
                                    className="pl-10 pr-8 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-200 appearance-none cursor-pointer min-w-[160px]"
                                >
                                    <option value="">Semua Asrama</option>
                                    {asramas.map(a => (
                                        <option key={a.id} value={a.id}>{a.nama_asrama}</option>
                                    ))}
                                </select>
                                <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                            </div>
                        )}

                        {/* Category Filter (for borrowings & books) */}
                        {(activeTab === 'borrowings' || activeTab === 'books') && (
                            <div className="relative">
                                <BookOpen size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <select
                                    value={categoryId}
                                    onChange={(e) => setCategoryId(e.target.value)}
                                    className="pl-10 pr-8 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-200 appearance-none cursor-pointer min-w-[160px]"
                                >
                                    <option value="">Semua Kategori</option>
                                    {categories.map(c => (
                                        <option key={c.id} value={c.id}>{c.nama_kategori}</option>
                                    ))}
                                </select>
                                <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                            </div>
                        )}

                        {/* Sub-type Filter */}
                        {getSubTypeOptions().length > 0 && (
                            <div className="relative">
                                <Filter size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <select
                                    value={reportType}
                                    onChange={(e) => setReportType(e.target.value)}
                                    className="pl-10 pr-8 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-200 appearance-none cursor-pointer min-w-[180px]"
                                >
                                    {getSubTypeOptions().map(opt => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                                <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                            </div>
                        )}

                        {/* Refresh & Reset */}
                        <div className="flex items-center gap-2 ml-auto">
                            <button
                                onClick={fetchReportData}
                                disabled={loading}
                                className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl font-medium text-sm transition-colors"
                            >
                                <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                                Refresh
                            </button>
                            <button
                                onClick={resetFilters}
                                className="flex items-center gap-2 px-4 py-2.5 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 font-medium text-sm transition-colors"
                            >
                                <X size={16} />
                                Reset
                            </button>
                        </div>
                    </div>
                </div>

                {/* Summary Cards */}
                {renderSummary()}

                {/* Data Table */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                        <h3 className="font-bold text-slate-800 dark:text-white">
                            Data {REPORT_TABS.find(t => t.id === activeTab)?.label}
                        </h3>
                        <span className="text-sm text-slate-500 dark:text-slate-400">
                            {data.total.toLocaleString('id-ID')} item
                        </span>
                    </div>
                    {renderTable()}
                </div>
            </div>
        </div>
    );
}
