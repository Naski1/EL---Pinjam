import {
    BookOpen,
    Users,
    Building2,
    Clock,
    Calendar,
    Bell,
    Moon,
    Sun,
    Filter,
    MoreVertical,
    History,
    CalendarX,
    HelpCircle,
    Settings,
    UserSearch,
    Home
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { dashboardAPI } from '../api';
import { useAuthStore } from '../stores';
import Skeleton from '../components/Skeleton';

export default function DashboardPage() {
    const { user } = useAuthStore();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState(null);
    const [filterPeriod, setFilterPeriod] = useState('this_month');

    useEffect(() => {
        fetchDashboardData();
    }, [filterPeriod]);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            const response = await dashboardAPI.getStats({ period: filterPeriod });
            setData(response.data);
        } catch (error) {
            console.error('Failed to fetch dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    // Calculate chart scaling
    const maxChartValue = data?.chart_data?.length
        ? Math.max(...data.chart_data.map(d => d.count))
        : 10;

    // Helper for Gauge Chart
    const renderGauge = () => {
        if (!data?.borrowing_status_distribution) return null;

        const { on_time, warning, overdue } = data.borrowing_status_distribution;
        const total = on_time + warning + overdue;
        // Avoid division by zero
        const safeTotal = total || 1;

        const radius = 80;
        const circumference = 2 * Math.PI * radius; // ~502

        const p1 = (on_time / safeTotal);
        const p2 = (warning / safeTotal);
        const p3 = (overdue / safeTotal);

        const offset1 = circumference - (circumference * p1);
        const offset2 = circumference - (circumference * p2);
        const offset3 = circumference - (circumference * p3);

        const rot2 = p1 * 360;
        const rot3 = (p1 + p2) * 360;

        return (
            <svg className="w-48 h-48 transform -rotate-90">
                {/* Background Circle */}
                <circle className="text-slate-100 dark:text-slate-800" cx="96" cy="96" fill="transparent" r="80" stroke="currentColor" strokeWidth="24"></circle>

                {/* On Time (Primary/Green) */}
                {on_time > 0 && (
                    <circle
                        className="text-emerald-500 transition-all duration-1000 ease-out"
                        cx="96" cy="96" fill="transparent" r="80"
                        stroke="currentColor"
                        strokeDasharray={circumference}
                        strokeDashoffset={offset1}
                        strokeLinecap="round"
                        strokeWidth="24"
                    ></circle>
                )}

                {/* Warning (Amber) */}
                {warning > 0 && (
                    <circle
                        className="text-amber-500 transition-all duration-1000 ease-out delay-300"
                        cx="96" cy="96" fill="transparent" r="80"
                        stroke="currentColor"
                        strokeDasharray={circumference}
                        strokeDashoffset={offset2}
                        strokeLinecap="round"
                        strokeWidth="24"
                        style={{ transformOrigin: 'center', transform: `rotate(${rot2}deg)` }}
                    ></circle>
                )}

                {/* Overdue (Rose) */}
                {overdue > 0 && (
                    <circle
                        className="text-rose-500 transition-all duration-1000 ease-out delay-500"
                        cx="96" cy="96" fill="transparent" r="80"
                        stroke="currentColor"
                        strokeDasharray={circumference}
                        strokeDashoffset={offset3}
                        strokeLinecap="round"
                        strokeWidth="24"
                        style={{ transformOrigin: 'center', transform: `rotate(${rot3}deg)` }}
                    ></circle>
                )}
            </svg>
        );
    };

    return (
        <div className="font-sans animate-fade-in relative min-h-screen">
            <div className="absolute inset-0 islamic-pattern pointer-events-none"></div>

            <div className="relative max-w-7xl mx-auto">
                {/* Header */}
                <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <h2 className="text-4xl font-display font-extrabold text-slate-900 dark:text-white tracking-tight">Dashboard Overview</h2>
                        <p className="text-base text-slate-500 dark:text-slate-400 mt-1">Welcome back, <span className="text-emerald-600 font-bold">{user?.name || 'Admin Lib'}</span></p>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <div className="flex items-center bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 shadow-sm hover:border-emerald-500 transition-colors cursor-pointer group">
                                <Calendar size={20} className="text-slate-400 group-hover:text-emerald-600 mr-3" />
                                <div className="flex flex-col">
                                    <span className="text-[9px] font-bold text-slate-400 uppercase leading-none mb-0.5">Filter Period</span>
                                    <select
                                        value={filterPeriod}
                                        onChange={(e) => setFilterPeriod(e.target.value)}
                                        className="bg-transparent border-none p-0 text-sm font-bold focus:ring-0 text-slate-700 dark:text-slate-200 cursor-pointer outline-none"
                                    >
                                        <option value="today">Hari Ini</option>
                                        <option value="yesterday">Kemarin</option>
                                        <option value="this_week">Minggu Ini</option>
                                        <option value="last_week">Minggu Lalu</option>
                                        <option value="this_month">Bulan Ini</option>
                                        <option value="last_month">Bulan Lalu</option>
                                        <option value="this_year">Tahun Ini</option>
                                        <option value="last_year">Tahun Lalu</option>
                                        <option value="all_time">Semua Data</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button className="w-11 h-11 flex items-center justify-center rounded-xl bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-emerald-600 hover:border-emerald-600 transition-all shadow-sm">
                                <Bell size={20} />
                            </button>
                            <button className="w-11 h-11 flex items-center justify-center rounded-xl bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-amber-500 hover:border-amber-500 transition-all shadow-sm">
                                <Settings size={20} />
                            </button>
                        </div>
                    </div>
                </header>

                {loading ? (
                    <div className="animate-fade-in">
                        {/* Stats Grid Skeleton */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-5">
                                    <div className="flex justify-between items-start mb-4">
                                        <Skeleton.Circle className="w-12 h-12" />
                                        <Skeleton className="w-12 h-5 rounded-md" />
                                    </div>
                                    <Skeleton className="w-24 h-3 mb-2" />
                                    <Skeleton className="w-16 h-8" />
                                </div>
                            ))}
                        </div>

                        {/* Charts Skeleton */}
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-10">
                            {/* Gauge Skeleton */}
                            <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-8">
                                <div className="flex items-center justify-between mb-8">
                                    <div>
                                        <Skeleton className="w-40 h-5 mb-2" />
                                        <Skeleton className="w-32 h-3" />
                                    </div>
                                    <Skeleton.Circle className="w-8 h-8" />
                                </div>
                                <div className="flex items-center justify-center mb-8">
                                    <Skeleton.Circle className="w-48 h-48" />
                                </div>
                                <div className="space-y-3">
                                    {[1, 2, 3].map(i => (
                                        <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/30">
                                            <div className="flex items-center gap-3">
                                                <Skeleton.Circle className="w-3 h-3" />
                                                <div>
                                                    <Skeleton className="w-24 h-3 mb-1" />
                                                    <Skeleton className="w-16 h-2" />
                                                </div>
                                            </div>
                                            <Skeleton className="w-8 h-4" />
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Bar Chart Skeleton */}
                            <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-8">
                                <div className="flex items-center justify-between mb-6">
                                    <div>
                                        <Skeleton className="w-36 h-5 mb-2" />
                                        <Skeleton className="w-48 h-3" />
                                    </div>
                                    <Skeleton.Circle className="w-9 h-9" />
                                </div>
                                <div className="flex items-end justify-between h-48 gap-3 px-4 border-b border-slate-100 dark:border-slate-800 pb-4">
                                    {[1, 2, 3, 4, 5].map(i => (
                                        <div key={i} className="flex-1 flex flex-col items-center gap-3 h-full justify-end">
                                            <Skeleton className="w-10 rounded-t-lg" style={{ height: `${Math.random() * 60 + 20}%` }} />
                                            <Skeleton className="w-12 h-3" />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Tables Skeleton */}
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                            {[1, 2].map(tableIdx => (
                                <div key={tableIdx} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl overflow-hidden">
                                    <div className="px-8 py-6 border-b border-slate-50 dark:border-slate-800 flex justify-between items-center bg-slate-50/30">
                                        <div className="flex items-center gap-3">
                                            <Skeleton.Circle className="w-8 h-8" />
                                            <Skeleton className="w-32 h-4" />
                                        </div>
                                        <Skeleton className="w-16 h-6 rounded-lg" />
                                    </div>
                                    <div className="divide-y divide-slate-50 dark:divide-slate-800">
                                        {[1, 2, 3].map(rowIdx => (
                                            <div key={rowIdx} className="px-8 py-4 flex items-center gap-6">
                                                <div className="flex-1">
                                                    <Skeleton className="w-32 h-4 mb-1" />
                                                    <Skeleton className="w-16 h-3" />
                                                </div>
                                                <div className="flex-1">
                                                    <Skeleton className="w-40 h-4" />
                                                </div>
                                                <Skeleton className="w-20 h-6 rounded-full" />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Stats Grid */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                            {/* Total Buku */}
                            <div className="bg-white dark:bg-[#0f172a] p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow group">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="w-12 h-12 flex items-center justify-center bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 rounded-xl shrink-0 group-hover:scale-110 transition-transform">
                                        <BookOpen size={24} strokeWidth={2.5} />
                                    </div>
                                </div>
                                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Total Buku</p>
                                <h3 className="text-3xl font-extrabold font-display dark:text-white mt-1">{data?.stats?.total_books?.toLocaleString() || 0}</h3>
                            </div>

                            {/* Total Santri */}
                            <div className="bg-white dark:bg-[#0f172a] p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow group">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="w-12 h-12 flex items-center justify-center bg-blue-50 dark:bg-blue-900/30 text-blue-600 rounded-xl shrink-0 group-hover:scale-110 transition-transform">
                                        <UserSearch size={24} strokeWidth={2.5} />
                                    </div>
                                </div>
                                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Total Santri</p>
                                <h3 className="text-3xl font-extrabold font-display dark:text-white mt-1">{data?.stats?.total_santri?.toLocaleString() || 0}</h3>
                            </div>

                            {/* Total Asrama */}
                            <div className="bg-white dark:bg-[#0f172a] p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow group">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="w-12 h-12 flex items-center justify-center bg-amber-50 dark:bg-amber-900/30 text-amber-600 rounded-xl shrink-0 group-hover:scale-110 transition-transform">
                                        <Home size={24} strokeWidth={2.5} />
                                    </div>
                                </div>
                                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Total Asrama</p>
                                <h3 className="text-3xl font-extrabold font-display dark:text-white mt-1">{data?.stats?.total_asrama?.toLocaleString() || 0}</h3>
                            </div>

                            {/* Peminjaman Aktif */}
                            <div className="bg-white dark:bg-[#0f172a] p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow group">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="w-12 h-12 flex items-center justify-center bg-rose-50 dark:bg-rose-900/30 text-rose-600 rounded-xl shrink-0 group-hover:scale-110 transition-transform">
                                        <Clock size={24} strokeWidth={2.5} />
                                    </div>
                                </div>
                                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Peminjaman Aktif</p>
                                <h3 className="text-3xl font-extrabold font-display dark:text-white mt-1">{data?.stats?.active_borrowings?.toLocaleString() || 0}</h3>
                            </div>
                        </div>

                        {/* Mid Section: Charts */}
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-10">
                            {/* Status Gauge */}
                            <div className="lg:col-span-5 bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-sm">
                                <div className="flex items-center justify-between mb-8">
                                    <div>
                                        <h4 className="text-lg font-bold text-slate-800 dark:text-slate-100">Status Peminjaman</h4>
                                        <p className="text-xs text-slate-400 font-medium">Kesehatan operasional peminjaman</p>
                                    </div>
                                    <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-50 text-slate-400">
                                        <MoreVertical size={18} />
                                    </button>
                                </div>

                                <div className="flex items-center justify-center h-56 relative mb-8">
                                    {renderGauge()}
                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                        <span className="text-3xl font-extrabold dark:text-white">
                                            {(data?.borrowing_status_distribution?.on_time || 0) +
                                                (data?.borrowing_status_distribution?.warning || 0) +
                                                (data?.borrowing_status_distribution?.overdue || 0)}
                                        </span>
                                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Total</span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-3">
                                    <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/30">
                                        <div className="flex items-center gap-3">
                                            <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                                            <div>
                                                <p className="text-xs font-bold text-slate-700 dark:text-slate-200">Tepat Waktu</p>
                                                <p className="text-[10px] text-slate-400 font-semibold italic">On Time Schedule</p>
                                            </div>
                                        </div>
                                        <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{data?.borrowing_status_distribution?.on_time || 0}</span>
                                    </div>
                                    <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/30">
                                        <div className="flex items-center gap-3">
                                            <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                                            <div>
                                                <p className="text-xs font-bold text-slate-700 dark:text-slate-200">Mendekati Batas</p>
                                                <p className="text-[10px] text-slate-400 font-semibold italic">Warning Status</p>
                                            </div>
                                        </div>
                                        <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{data?.borrowing_status_distribution?.warning || 0}</span>
                                    </div>
                                    <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/30">
                                        <div className="flex items-center gap-3">
                                            <div className="w-3 h-3 rounded-full bg-rose-400"></div>
                                            <div>
                                                <p className="text-xs font-bold text-slate-700 dark:text-slate-200">Terlambat</p>
                                                <p className="text-[10px] text-slate-400 font-semibold italic">Overdue</p>
                                            </div>
                                        </div>
                                        <span className="text-sm font-bold text-rose-500">{data?.borrowing_status_distribution?.overdue || 0}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Top Popular Books (Horizontal Bar Chart) */}
                            <div className="lg:col-span-7 bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-sm flex flex-col">
                                <div className="flex items-center justify-between mb-6">
                                    <div>
                                        <h4 className="text-lg font-bold text-slate-800 dark:text-slate-100">Buku Terpopuler</h4>
                                        <p className="text-xs text-slate-400 font-medium">Top 5 buku paling banyak dipinjam</p>
                                    </div>
                                    <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg text-emerald-600">
                                        <BookOpen size={18} />
                                    </div>
                                </div>

                                <div className="flex-1 flex items-end justify-between px-4 pb-4 border-b border-slate-100 dark:border-slate-800 relative overflow-x-auto no-scrollbar min-h-[200px]">
                                    {/* Y-Axis Labels (Hidden visually but implied by height) or explicit */}
                                    <div className="absolute left-0 top-0 bottom-8 flex flex-col justify-between text-[9px] font-bold text-slate-300 pointer-events-none z-10">
                                        <span>{Math.max(...(data?.top_books?.map(b => b.count) || [0, 5]))}</span>
                                        <span>0</span>
                                    </div>

                                    {data?.top_books?.length > 0 ? (
                                        data.top_books.map((book, index) => {
                                            const maxCount = Math.max(...data.top_books.map(b => b.count));
                                            const heightPercent = maxCount > 0 ? (book.count / maxCount) * 100 : 0;

                                            // Distinct colors for top 3
                                            let barColor = "bg-emerald-100 dark:bg-emerald-900/20";
                                            if (index === 0) barColor = "bg-emerald-500";
                                            if (index === 1) barColor = "bg-emerald-400";
                                            if (index === 2) barColor = "bg-emerald-300";

                                            return (
                                                <div key={index} className="flex-1 min-w-[60px] flex flex-col items-center gap-3 h-full justify-end group px-1 z-20">
                                                    <div
                                                        className={`w-full max-w-[40px] rounded-t-lg hover:bg-emerald-600/80 transition-all cursor-pointer relative chart-bar ${barColor}`}
                                                        style={{ height: `${Math.max(heightPercent, 5)}%` }}
                                                        title={`${book.title} (${book.count} dipinjam)`}
                                                    >
                                                        <div className="absolute -top-10 left-1/2 -translate-x-1/2 flex flex-col items-center opacity-0 group-hover:opacity-100 transition-opacity z-30 pointer-events-none">
                                                            <div className="bg-slate-800 text-white text-[10px] px-2 py-1 rounded shadow-lg whitespace-nowrap mb-1 max-w-[150px] truncate">
                                                                {book.title}
                                                            </div>
                                                            <div className="text-[11px] font-bold text-emerald-600">
                                                                {book.count}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    {/* Truncated Title on X-Axis */}
                                                    <span className="text-[10px] font-bold text-slate-400 text-center w-full truncate px-1" title={book.title}>
                                                        {book.title.length > 8 ? book.title.substring(0, 8) + '...' : book.title}
                                                    </span>
                                                </div>
                                            );
                                        })
                                    ) : (
                                        <div className="w-full flex flex-col items-center justify-center text-slate-400 opacity-60">
                                            <BookOpen size={40} strokeWidth={1.5} className="mb-2" />
                                            <p className="text-sm font-medium">Belum ada data</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Recent & Due Tables */}
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                            {/* Recent Peminjaman */}
                            <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden flex flex-col">
                                <div className="px-8 py-6 border-b border-slate-50 dark:border-slate-800 flex justify-between items-center bg-slate-50/30 dark:bg-slate-800/10">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                                            <History size={18} />
                                        </div>
                                        <h4 className="font-bold text-base text-slate-800 dark:text-slate-100">Peminjaman Terbaru</h4>
                                    </div>
                                    <button className="text-xs font-bold text-emerald-600 hover:bg-emerald-50 px-3 py-1.5 rounded-lg transition-colors">View All</button>
                                </div>
                                <div className="overflow-x-auto no-scrollbar">
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="bg-white dark:bg-[#0f172a]">
                                                <th className="px-8 py-4 text-[11px] font-extrabold text-slate-400 uppercase tracking-widest border-b border-slate-50 dark:border-slate-800">Santri</th>
                                                <th className="px-8 py-4 text-[11px] font-extrabold text-slate-400 uppercase tracking-widest border-b border-slate-50 dark:border-slate-800">Buku & Kitab</th>
                                                <th className="px-8 py-4 text-[11px] font-extrabold text-slate-400 uppercase tracking-widest border-b border-slate-50 dark:border-slate-800 text-right">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                                            {data?.recent_loans?.length > 0 ? (
                                                data.recent_loans.map((loan, idx) => (
                                                    <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors group">
                                                        <td className="px-8 py-4">
                                                            <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{loan.santri_nama}</p>
                                                            <p className="text-[11px] text-slate-400 font-medium">{loan.santri_kamar || 'Unknown'}</p>
                                                        </td>
                                                        <td className="px-8 py-4">
                                                            <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">{loan.book_judul}</p>
                                                            <p className="text-[10px] text-emerald-600/70 font-bold uppercase">General</p>
                                                        </td>
                                                        <td className="px-8 py-4 text-right">
                                                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold ${loan.status === 'returned'
                                                                ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                                                                : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
                                                                }`}>
                                                                <span className={`w-1.5 h-1.5 rounded-full mr-2 ${loan.status === 'returned' ? 'bg-emerald-500' : 'bg-amber-500'
                                                                    }`}></span>
                                                                {loan.status.toUpperCase()}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan="3" className="px-8 py-6 text-center text-sm text-slate-400">Belum ada peminjaman</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Due Loans (Filtered) */}
                            <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden flex flex-col">
                                <div className="px-8 py-6 border-b border-slate-50 dark:border-slate-800 flex justify-between items-center bg-slate-50/30 dark:bg-slate-800/10">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center text-amber-600">
                                            <CalendarX size={18} />
                                        </div>
                                        <h4 className="font-bold text-base text-slate-800 dark:text-slate-100">Jatuh Tempo</h4>
                                    </div>
                                    <button className="text-xs font-bold text-emerald-600 hover:bg-emerald-50 px-3 py-1.5 rounded-lg transition-colors">View All</button>
                                </div>
                                <div className="overflow-x-auto no-scrollbar">
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="bg-white dark:bg-[#0f172a]">
                                                <th className="px-8 py-4 text-[11px] font-extrabold text-slate-400 uppercase tracking-widest border-b border-slate-50 dark:border-slate-800">Peminjam</th>
                                                <th className="px-8 py-4 text-[11px] font-extrabold text-slate-400 uppercase tracking-widest border-b border-slate-50 dark:border-slate-800">Judul Buku</th>
                                                <th className="px-8 py-4 text-[11px] font-extrabold text-slate-400 uppercase tracking-widest border-b border-slate-50 dark:border-slate-800 text-right">Batas Waktu</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                                            {data?.due_today?.length > 0 ? (
                                                data.due_today.map((item, idx) => (
                                                    <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors group">
                                                        <td className="px-8 py-4">
                                                            <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{item.santri_nama}</p>
                                                            <p className="text-[11px] text-slate-400 font-medium">{item.asrama_nama}</p>
                                                        </td>
                                                        <td className="px-8 py-4">
                                                            <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">{item.book_judul}</p>
                                                        </td>
                                                        <td className="px-8 py-4 text-right">
                                                            <div className="flex flex-col items-end">
                                                                <span className="px-2 py-1 bg-amber-50 dark:bg-amber-900/20 text-amber-600 rounded-md text-[11px] font-extrabold mb-1">
                                                                    {item.due_date ? new Date(item.due_date).toLocaleDateString('id-ID') : item.due_time}
                                                                </span>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td className="px-8 py-8 text-center" colSpan="3">
                                                        <div className="flex flex-col items-center gap-2 opacity-50">
                                                            <Clock size={32} className="text-slate-300" />
                                                            <p className="text-xs text-slate-400 font-medium italic">Tidak ada peminjaman jatuh tempo</p>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <footer className="mt-16 pt-8 border-t border-slate-200 dark:border-slate-800 flex flex-col md:flex-row justify-between items-center gap-6">
                            <div className="flex items-center gap-4">
                                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em]">
                                    © 2024 <span className="text-emerald-600 font-extrabold">EL-PINJAM</span> • Smart Pesantren Management
                                </p>
                            </div>
                            <div className="flex gap-8">
                                <a className="text-[11px] font-bold text-slate-400 hover:text-emerald-600 transition-all uppercase tracking-widest flex items-center gap-2" href="#">
                                    <HelpCircle size={14} /> Support
                                </a>
                                <a className="text-[11px] font-bold text-slate-400 hover:text-emerald-600 transition-all uppercase tracking-widest flex items-center gap-2" href="#">
                                    <Settings size={14} /> Preferences
                                </a>
                            </div>
                        </footer>
                    </>
                )}
            </div>
        </div>
    );
}
