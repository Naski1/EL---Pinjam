import { useState, useEffect } from 'react';
import {
    Plus,
    Search,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    BookOpen,
    User,
    Clock,
    AlertTriangle,
    CheckCircle,
    RotateCcw,
    Trash2,
    Hourglass,
    FileCheck,
    X,
    Loader2,
    Calendar,
    RefreshCw
} from 'lucide-react';
import { borrowingAPI, santriAPI, bookAPI } from '../api';
import toast from 'react-hot-toast';
import Skeleton from '../components/Skeleton';

export default function PeminjamanPage() {
    // --- State Management ---
    const [borrowings, setBorrowings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState(''); // '' means all
    const [pagination, setPagination] = useState({ page: 1, total: 0, limit: 10 });

    // Stats


    // Modals
    const [modalOpen, setModalOpen] = useState(false);

    const [detailModalOpen, setDetailModalOpen] = useState(false);
    const [returnModalOpen, setReturnModalOpen] = useState(false);
    const [renewModalOpen, setRenewModalOpen] = useState(false);
    const [selectedBorrowing, setSelectedBorrowing] = useState(null);

    // Forms
    const [santriSearch, setSantriSearch] = useState('');
    const [santriResults, setSantriResults] = useState([]);
    const [selectedSantri, setSelectedSantri] = useState(null);
    const [bookSearch, setBookSearch] = useState('');
    const [bookResults, setBookResults] = useState([]);
    const [selectedBooks, setSelectedBooks] = useState([]);
    const [submitting, setSubmitting] = useState(false);

    // Return Form
    const [returnCondition, setReturnCondition] = useState('good');
    const [returnNotes, setReturnNotes] = useState('');
    const [payFine, setPayFine] = useState(true);

    // Renew Form
    const [extendDays, setExtendDays] = useState(7);

    // --- Helpers ---
    const getInitials = (name) => {
        if (!name) return '??';
        return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    };

    const getRandomColor = (index) => {
        const colors = [
            'bg-emerald-100 text-emerald-600',
            'bg-blue-100 text-blue-600',
            'bg-amber-100 text-amber-600',
            'bg-purple-100 text-purple-600',
            'bg-rose-100 text-rose-600',
        ];
        return colors[index % colors.length];
    };

    // --- Data Fetching ---
    const fetchBorrowings = async () => {
        try {
            setLoading(true);
            const params = {
                search,
                page: pagination.page,
                limit: pagination.limit
            };
            if (filterStatus) params.status = filterStatus;

            // Fetch list
            const listRes = await borrowingAPI.list(params);

            // Handle pagination structure
            const items = listRes.data.items || listRes.data;
            const total = listRes.data.total || items.length;

            setBorrowings(items);
            setPagination(prev => ({ ...prev, total }));

        } catch (error) {
            console.error(error);
            toast.error('Gagal memuat data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBorrowings();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search, filterStatus, pagination.page]);

    // --- Actions ---
    const searchSantri = async (query) => {
        if (query.length < 2) { setSantriResults([]); return; }
        try {
            const response = await santriAPI.list({ search: query, status: 'active', limit: 5 });
            setSantriResults(response.data.items);
        } catch (error) { console.error(error); }
    };

    const searchBooks = async (query) => {
        if (query.length < 2) { setBookResults([]); return; }
        try {
            const response = await bookAPI.list({ search: query, status: 'available', limit: 5 });
            const available = response.data.items.filter(
                b => b.stok_tersedia > 0 && !selectedBooks.find(sb => sb.id === b.id)
            );
            setBookResults(available);
        } catch (error) { console.error(error); }
    };

    const handleBorrow = async () => {
        if (!selectedSantri || selectedBooks.length === 0) {
            toast.error('Data belum lengkap');
            return;
        }
        try {
            setSubmitting(true);
            await borrowingAPI.create({
                santri_id: selectedSantri.id,
                book_ids: selectedBooks.map(b => b.id)
            });
            toast.success('Peminjaman berhasil dibuat');
            setModalOpen(false);
            resetForm();
            fetchBorrowings();
        } catch (error) {
            toast.error(error.response?.data?.detail || 'Gagal memproses');
        } finally {
            setSubmitting(false);
        }
    };

    const handleReturn = async () => {
        if (!selectedBorrowing) return;
        try {
            setSubmitting(true);
            await borrowingAPI.return(selectedBorrowing.id, {
                condition: returnCondition,
                notes: returnNotes,
                pay_fine: payFine
            });
            toast.success('Buku berhasil dikembalikan');
            setReturnModalOpen(false);
            fetchBorrowings();
        } catch (error) {
            toast.error('Gagal mengembalikan buku');
        } finally {
            setSubmitting(false);
        }
    };

    const handleRenew = async () => {
        if (!selectedBorrowing) return;
        try {
            setSubmitting(true);
            await borrowingAPI.renew(selectedBorrowing.id, {
                borrowing_id: selectedBorrowing.id,
                extend_days: extendDays
            });
            toast.success('Peminjaman diperpanjang');
            setRenewModalOpen(false);
            fetchBorrowings();
        } catch (error) {
            toast.error('Gagal memperpanjang');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Hapus riwayat peminjaman ini?')) return;
        try {
            await borrowingAPI.delete(id);
            toast.success('Data dihapus');
            fetchBorrowings();
        } catch (error) {
            toast.error('Gagal menghapus');
        }
    };

    const resetForm = () => {
        setSelectedSantri(null);
        setSelectedBooks([]);
        setSantriSearch('');
        setBookSearch('');
    };

    const openReturnModal = (borrowing) => {
        setSelectedBorrowing(borrowing);
        setReturnModalOpen(true);
    };

    const openRenewModal = (borrowing) => {
        setSelectedBorrowing(borrowing);
        setRenewModalOpen(true);
    };

    return (
        <div className="animate-fade-in font-sans">
            {/* Header Section */}
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight mb-1 text-slate-900">Transaksi Peminjaman</h2>
                    <p className="text-slate-500">Kelola peminjaman dan pengembalian buku perpustakaan</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setModalOpen(true)}
                        className="flex items-center gap-2 bg-primary-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-semibold shadow-lg shadow-primary-600/20 transition-all active:scale-95"
                    >
                        <Plus size={20} />
                        Pinjam Buku
                    </button>
                </div>
            </header>

            {/* Filters Section */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
                <div className="lg:col-span-3 relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-600 transition-colors" size={20} />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-12 pr-4 py-3.5 bg-white border-none rounded-2xl shadow-sm focus:ring-2 focus:ring-primary-600/20 placeholder:text-slate-400 transition-all ring-1 ring-slate-200"
                        placeholder="Cari NIS, nama santri, judul buku..."
                    />
                </div>
                <div className="relative">
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="w-full appearance-none pl-4 pr-10 py-3.5 bg-white border-none rounded-2xl shadow-sm focus:ring-2 focus:ring-primary-600/20 text-slate-600 ring-1 ring-slate-200 cursor-pointer"
                    >
                        <option value="">Semua Status</option>
                        <option value="borrowed">Dipinjam</option>
                        <option value="returned">Dikembalikan</option>
                        <option value="overdue">Terlambat</option>
                        <option value="lost">Hilang</option>
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={20} />
                </div>
            </div>

            {/* Table Section */}
            <div className="bg-white rounded-[2rem] border border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden">
                {loading ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-100 bg-slate-50/50">
                                    <th className="px-6 py-5 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Santri</th>
                                    <th className="px-6 py-5 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Buku</th>
                                    <th className="px-6 py-5 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Tgl Pinjam</th>
                                    <th className="px-6 py-5 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Jatuh Tempo</th>
                                    <th className="px-6 py-5 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Status</th>
                                    <th className="px-6 py-5 text-[11px] font-bold text-slate-500 uppercase tracking-widest text-center">Denda</th>
                                    <th className="px-6 py-5 text-[11px] font-bold text-slate-500 uppercase tracking-widest text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {[1, 2, 3, 4, 5].map(i => (
                                    <tr key={i} className="hover:bg-slate-50/50">
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-3">
                                                <Skeleton.Circle className="w-10 h-10" />
                                                <div>
                                                    <Skeleton className="w-28 h-4 mb-1" />
                                                    <Skeleton className="w-16 h-3" />
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <Skeleton className="w-36 h-4 mb-1" />
                                            <Skeleton className="w-20 h-3" />
                                        </td>
                                        <td className="px-6 py-5"><Skeleton className="w-20 h-4" /></td>
                                        <td className="px-6 py-5"><Skeleton className="w-20 h-4" /></td>
                                        <td className="px-6 py-5"><Skeleton className="w-20 h-6 rounded-full" /></td>
                                        <td className="px-6 py-5 text-center"><Skeleton className="w-16 h-5 mx-auto" /></td>
                                        <td className="px-6 py-5 text-right">
                                            <div className="flex justify-end gap-2">
                                                <Skeleton.Circle className="w-9 h-9" />
                                                <Skeleton.Circle className="w-9 h-9" />
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : borrowings.length === 0 ? (
                    <div className="text-center py-20">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <BookOpen className="text-slate-300" size={32} />
                        </div>
                        <p className="text-slate-500 font-medium">Belum ada data peminjaman</p>
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-slate-100 bg-slate-50/50">
                                        <th className="px-6 py-5 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Santri</th>
                                        <th className="px-6 py-5 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Buku</th>
                                        <th className="px-6 py-5 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Tgl Pinjam</th>
                                        <th className="px-6 py-5 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Jatuh Tempo</th>
                                        <th className="px-6 py-5 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Status</th>
                                        <th className="px-6 py-5 text-[11px] font-bold text-slate-500 uppercase tracking-widest text-center">Denda</th>
                                        <th className="px-6 py-5 text-[11px] font-bold text-slate-500 uppercase tracking-widest text-right">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {borrowings.map((item, idx) => {
                                        const isOverdue = item.is_overdue;
                                        const status = item.status;
                                        const dueDate = new Date(item.due_date);

                                        return (
                                            <tr
                                                key={item.id}
                                                className="group hover:bg-slate-50 transition-colors cursor-pointer"
                                                onClick={() => {
                                                    setSelectedBorrowing(item);
                                                    setDetailModalOpen(true);
                                                }}
                                            >
                                                <td className="px-6 py-5">
                                                    <div>
                                                        <div className="font-bold text-slate-900">{item.santri?.nama_lengkap || '-'}</div>
                                                        <div className="text-sm text-slate-500">{item.santri?.nis || '-'}</div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <div className="flex items-center gap-2">
                                                        <BookOpen className="text-slate-400" size={16} />
                                                        <div>
                                                            <div className="font-medium text-slate-800 line-clamp-1 max-w-[150px]">{item.book?.judul || '-'}</div>
                                                            <div className="text-sm text-slate-500">{item.book?.kode_buku || '-'}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <div className="text-sm font-medium text-slate-600">
                                                        {new Date(item.borrow_date).toLocaleDateString('id-ID')}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <div className={`text-sm font-medium ${isOverdue && status === 'borrowed' ? 'text-red-500' : 'text-slate-600'}`}>
                                                        {dueDate.toLocaleDateString('id-ID')}
                                                    </div>
                                                    {status === 'borrowed' && (
                                                        <div className={`text-[10px] font-bold flex items-center gap-1 ${isOverdue ? 'text-red-500' : 'text-slate-400'}`}>
                                                            {isOverdue ? (
                                                                <><AlertTriangle size={12} /> {item.days_overdue} HARI TERLAMBAT</>
                                                            ) : (
                                                                <><Clock size={12} /> {item.days_remaining} hari lagi</>
                                                            )}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-6 py-5">
                                                    {status === 'borrowed' && !isOverdue && (
                                                        <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-orange-100 text-orange-600">Dipinjam</span>
                                                    )}
                                                    {status === 'borrowed' && isOverdue && (
                                                        <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-red-100 text-red-600">Terlambat</span>
                                                    )}
                                                    {status === 'returned' && (
                                                        <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-600">Dikembalikan</span>
                                                    )}
                                                    {status === 'lost' && (
                                                        <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600">Hilang</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-5 text-center">
                                                    {item.fine_amount > 0 ? (
                                                        <span className="text-sm font-bold text-red-600">Rp {item.fine_amount.toLocaleString('id-ID')}</span>
                                                    ) : (
                                                        <span className="text-sm text-slate-400">-</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-5">
                                                    <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                                                        {status === 'borrowed' && (
                                                            <>
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        openReturnModal(item);
                                                                    }}
                                                                    className="p-2 rounded-lg text-emerald-600 hover:bg-emerald-50 transition-all"
                                                                    title="Kembalikan"
                                                                >
                                                                    <FileCheck size={20} />
                                                                </button>
                                                                {!isOverdue && (
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            openRenewModal(item);
                                                                        }}
                                                                        className="p-2 rounded-lg text-blue-600 hover:bg-blue-50 transition-all"
                                                                        title="Perpanjang"
                                                                    >
                                                                        <RefreshCw size={20} />
                                                                    </button>
                                                                )}
                                                            </>
                                                        )}
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleDelete(item.id);
                                                            }}
                                                            className="p-2 rounded-lg text-red-500 hover:bg-red-50 transition-all"
                                                            title="Hapus"
                                                        >
                                                            <Trash2 size={20} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination Footer */}
                        <div className="px-6 py-4 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-100">
                            <p className="text-sm text-slate-500">
                                Menampilkan <span className="font-bold text-slate-900">{Math.min((pagination.page - 1) * pagination.limit + 1, pagination.total)}-{Math.min(pagination.page * pagination.limit, pagination.total)}</span> dari <span className="font-bold text-slate-900">{pagination.total}</span> data peminjaman
                            </p>
                            <div className="flex items-center gap-2">
                                <button
                                    disabled={pagination.page <= 1}
                                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                                    className="p-2 rounded-lg border border-slate-200 hover:bg-white transition-colors disabled:opacity-50"
                                >
                                    <ChevronLeft size={20} />
                                </button>
                                {/* Simple Pagination Numbers (Just Page 1 for now if logic complex, or just current page) */}
                                <button className="w-10 h-10 flex items-center justify-center rounded-lg bg-primary-600 text-white font-bold text-sm">
                                    {pagination.page}
                                </button>
                                <button
                                    disabled={pagination.page * pagination.limit >= pagination.total}
                                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                                    className="p-2 rounded-lg border border-slate-200 hover:bg-white transition-colors disabled:opacity-50"
                                >
                                    <ChevronRight size={20} />
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>



            {/* --- Modals (Keep existing logic/UI, just ensure classes match if needed) --- */}

            {/* New Borrowing Modal */}
            {modalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                            <h3 className="text-lg font-bold text-slate-800">Pinjam Buku Baru</h3>
                            <button onClick={() => setModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                                <X size={20} className="text-slate-500" />
                            </button>
                        </div>
                        <div className="p-6 space-y-6">
                            {/* Santri Selection */}
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700">Santri</label>
                                {selectedSantri ? (
                                    <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center font-bold text-sm text-emerald-600">
                                                {getInitials(selectedSantri.nama_lengkap)}
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-900 text-sm">{selectedSantri.nama_lengkap}</p>
                                                <p className="text-xs text-slate-500">NIS: {selectedSantri.nis}</p>
                                            </div>
                                        </div>
                                        <button onClick={() => setSelectedSantri(null)} className="p-2 hover:bg-emerald-100 rounded-lg text-emerald-600">
                                            <X size={16} />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="relative">
                                        <input
                                            type="text"
                                            placeholder="Cari nama atau NIS..."
                                            value={santriSearch}
                                            onChange={(e) => { setSantriSearch(e.target.value); searchSantri(e.target.value); }}
                                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-600/20 focus:border-primary-600 transition-all"
                                        />
                                        {santriResults.length > 0 && (
                                            <div className="absolute top-full left-0 w-full mt-2 bg-white border border-slate-100 rounded-xl shadow-xl z-10 overflow-hidden max-h-60 overflow-y-auto">
                                                {santriResults.map(s => (
                                                    <button key={s.id} onClick={() => { setSelectedSantri(s); setSantriResults([]); setSantriSearch(''); }} className="w-full px-4 py-3 text-left hover:bg-slate-50 flex items-center gap-3 border-b border-slate-50 last:border-0">
                                                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500">{getInitials(s.nama_lengkap)}</div>
                                                        <div>
                                                            <p className="text-sm font-bold text-slate-700">{s.nama_lengkap}</p>
                                                            <p className="text-xs text-slate-500">NIS: {s.nis}</p>
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Book Selection */}
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700">Buku (Maks. 3)</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder="Cari judul atau kode buku..."
                                        value={bookSearch}
                                        onChange={(e) => { setBookSearch(e.target.value); searchBooks(e.target.value); }}
                                        disabled={selectedBooks.length >= 3}
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-600/20 focus:border-primary-600 transition-all disabled:opacity-50"
                                    />
                                    {bookResults.length > 0 && (
                                        <div className="absolute top-full left-0 w-full mt-2 bg-white border border-slate-100 rounded-xl shadow-xl z-10 overflow-hidden max-h-60 overflow-y-auto">
                                            {bookResults.map(b => (
                                                <button key={b.id} onClick={() => { setSelectedBooks([...selectedBooks, b]); setBookResults([]); setBookSearch(''); }} className="w-full px-4 py-3 text-left hover:bg-slate-50 flex items-center justify-between border-b border-slate-50 last:border-0">
                                                    <div className="flex items-center gap-3">
                                                        <BookOpen size={16} className="text-slate-400" />
                                                        <div>
                                                            <p className="text-sm font-bold text-slate-700">{b.judul}</p>
                                                            <p className="text-xs text-slate-500">{b.kode_buku}</p>
                                                        </div>
                                                    </div>
                                                    <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full font-bold">Stok: {b.stok_tersedia}</span>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                {/* Selected List */}
                                <div className="space-y-2 mt-3">
                                    {selectedBooks.map(book => (
                                        <div key={book.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
                                            <div className="flex items-center gap-3">
                                                <BookOpen size={16} className="text-slate-500" />
                                                <span className="text-sm font-medium text-slate-700">{book.judul}</span>
                                            </div>
                                            <button onClick={() => setSelectedBooks(selectedBooks.filter(b => b.id !== book.id))} className="text-slate-400 hover:text-red-500">
                                                <X size={16} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                            <button onClick={() => setModalOpen(false)} className="px-5 py-2.5 rounded-xl font-bold text-slate-500 hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-200 transition-all text-sm">Batal</button>
                            <button onClick={handleBorrow} disabled={submitting || !selectedSantri || selectedBooks.length === 0} className="px-5 py-2.5 rounded-xl font-bold bg-primary-600 text-white hover:bg-primary-700 shadow-lg shadow-primary-600/20 disabled:opacity-50 disabled:shadow-none transition-all text-sm flex items-center gap-2">
                                {submitting ? <Loader2 className="animate-spin" size={16} /> : <CheckCircle size={16} />}
                                Proses Peminjaman
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Return Modal (Simple implementation for now) */}
            {returnModalOpen && selectedBorrowing && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                            <h3 className="text-lg font-bold text-slate-800">Kembalikan Buku</h3>
                            <button onClick={() => setReturnModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                                <X size={20} className="text-slate-500" />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <p className="text-sm text-slate-600">Pastikan kondisi buku diperiksa sebelum dikembalikan.</p>
                            <div>
                                <label className="text-sm font-bold text-slate-700 mb-2 block">Kondisi</label>
                                <select value={returnCondition} onChange={(e) => setReturnCondition(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-600/20">
                                    <option value="good">Baik</option>
                                    <option value="damaged">Rusak</option>
                                    <option value="lost">Hilang</option>
                                </select>
                            </div>
                        </div>
                        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                            <button onClick={() => setReturnModalOpen(false)} className="px-5 py-2.5 rounded-xl font-bold text-slate-500 hover:bg-white transition-all text-sm">Batal</button>
                            <button onClick={handleReturn} disabled={submitting} className="px-5 py-2.5 rounded-xl font-bold bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-600/20 transition-all text-sm">
                                {submitting ? 'Memproses...' : 'Konfirmasi Kembali'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Renew Modal */}
            {renewModalOpen && selectedBorrowing && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                            <h3 className="text-lg font-bold text-slate-800">Perpanjang Peminjaman</h3>
                            <button onClick={() => setRenewModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                                <X size={20} className="text-slate-500" />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                                <p className="font-medium text-slate-800">{selectedBorrowing.book?.judul}</p>
                                <p className="text-sm text-slate-600 mt-1">
                                    Jatuh tempo: <span className="font-bold">{new Date(selectedBorrowing.due_date).toLocaleDateString('id-ID')}</span>
                                </p>
                            </div>

                            <div>
                                <label className="text-sm font-bold text-slate-700 mb-2 block">Durasi Perpanjangan</label>
                                <select
                                    value={extendDays}
                                    onChange={(e) => setExtendDays(parseInt(e.target.value))}
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-600/20"
                                >
                                    <option value={7}>7 Hari</option>
                                    <option value={14}>14 Hari</option>
                                </select>
                            </div>
                        </div>
                        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                            <button onClick={() => setRenewModalOpen(false)} className="px-5 py-2.5 rounded-xl font-bold text-slate-500 hover:bg-white transition-all text-sm">Batal</button>
                            <button onClick={handleRenew} disabled={submitting} className="px-5 py-2.5 rounded-xl font-bold bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-600/20 transition-all text-sm">
                                {submitting ? 'Memproses...' : 'Konfirmasi Perpanjang'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* Detail Modal */}
            {detailModalOpen && selectedBorrowing && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-fade-in" onClick={() => setDetailModalOpen(false)}>
                    <div className="bg-white rounded-3xl shadow-xl w-full max-w-lg overflow-hidden" onClick={e => e.stopPropagation()}>
                        <div className="relative h-32 bg-gradient-to-r from-primary-600 to-emerald-600">
                            <button
                                onClick={() => setDetailModalOpen(false)}
                                className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/30 text-white rounded-full transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>
                        <div className="px-8 pb-8">
                            <div className="relative -mt-16 mb-6 flex justify-center">
                                <div className="p-1 px-1 bg-white rounded-full">
                                    {selectedBorrowing.santri?.foto ? (
                                        <img
                                            src={selectedBorrowing.santri.foto.startsWith('http') ? selectedBorrowing.santri.foto : `http://localhost:8000/uploads/${selectedBorrowing.santri.foto}`}
                                            alt={selectedBorrowing.santri.nama_lengkap}
                                            className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg bg-slate-100"
                                            onError={(e) => {
                                                e.currentTarget.style.display = 'none';
                                                e.target.nextSibling.style.display = 'flex';
                                            }}
                                        />
                                    ) : null}
                                    <div
                                        className={`w-32 h-32 rounded-full flex items-center justify-center font-bold text-4xl border-4 border-white shadow-lg ${!selectedBorrowing.santri?.foto ? 'flex' : 'hidden'} ${getRandomColor(0)}`}
                                    >
                                        {getInitials(selectedBorrowing.santri?.nama_lengkap)}
                                    </div>
                                </div>
                            </div>

                            <div className="text-center mb-8">
                                <h3 className="text-2xl font-bold text-slate-900">{selectedBorrowing.santri?.nama_lengkap}</h3>
                                <p className="text-slate-500 font-medium">NIS: {selectedBorrowing.santri?.nis}</p>
                            </div>

                            <div className="space-y-6">
                                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-start gap-4">
                                    <div className="p-2 bg-white rounded-xl shadow-sm text-primary-600">
                                        <BookOpen size={24} />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Sedang Meminjam</p>
                                        <h4 className="font-bold text-slate-900">{selectedBorrowing.book?.judul}</h4>
                                        <p className="text-sm text-slate-500">{selectedBorrowing.book?.kode_buku}</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Tanggal Pinjam</p>
                                        <p className="font-semibold text-slate-700">
                                            {new Date(selectedBorrowing.borrow_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                                        </p>
                                    </div>
                                    <div className={`p-4 rounded-2xl border ${selectedBorrowing.is_overdue && selectedBorrowing.status === 'borrowed' ? 'bg-red-50 border-red-100' : 'bg-slate-50 border-slate-100'}`}>
                                        <p className={`text-xs font-bold uppercase tracking-wider mb-1 ${selectedBorrowing.is_overdue && selectedBorrowing.status === 'borrowed' ? 'text-red-400' : 'text-slate-400'}`}>
                                            Jatuh Tempo
                                        </p>
                                        <p className={`font-semibold ${selectedBorrowing.is_overdue && selectedBorrowing.status === 'borrowed' ? 'text-red-700' : 'text-slate-700'}`}>
                                            {new Date(selectedBorrowing.due_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                                        </p>
                                    </div>
                                </div>

                                {selectedBorrowing.status === 'borrowed' && (
                                    <div className="flex gap-3 pt-2">
                                        <button
                                            onClick={() => {
                                                setDetailModalOpen(false);
                                                openReturnModal(selectedBorrowing);
                                            }}
                                            className="flex-1 btn-primary btn-lg justify-center bg-emerald-600 hover:bg-emerald-700 text-white"
                                        >
                                            <FileCheck size={18} />
                                            Kembalikan
                                        </button>
                                        {!selectedBorrowing.is_overdue && (
                                            <button
                                                onClick={() => {
                                                    setDetailModalOpen(false);
                                                    openRenewModal(selectedBorrowing);
                                                }}
                                                className="flex-1 btn-outline btn-lg justify-center text-blue-600 border-blue-200 hover:bg-blue-50"
                                            >
                                                <RefreshCw size={18} />
                                                Perpanjang
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
