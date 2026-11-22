import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Plus,
    Search,
    Edit2,
    Trash2,
    BookOpen,
    Loader2,
    X,
    BookMarked,
    Upload,
    Barcode,
    Download,
    FileSpreadsheet,
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { bookAPI, categoryAPI } from '../api';
import toast from 'react-hot-toast';
import Skeleton from '../components/Skeleton';

const bookSchema = z.object({
    kode_buku: z.string().min(2, 'Kode minimal 2 karakter').max(20),
    judul: z.string().min(1, 'Judul wajib diisi').max(255),
    pengarang: z.string().optional(),
    penerbit: z.string().optional(),
    tahun_terbit: z.string().optional(),
    isbn: z.string().optional(),
    category_id: z.string().optional(),
    lokasi_rak: z.string().optional(),
    total_stok: z.number().min(0, 'Stok minimal 0'),
    harga: z.number().min(0, 'Harga minimal 0').optional(),
    deskripsi: z.string().optional(),
    status: z.enum(['available', 'unavailable']),
});

export default function BookPage() {
    const [books, setBooks] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterCategory, setFilterCategory] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [modalOpen, setModalOpen] = useState(false);
    const [importModalOpen, setImportModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const fileInputRef = useRef(null);
    const navigate = useNavigate();

    const {
        register,
        handleSubmit,
        reset,
        setValue,
        watch,
        formState: { errors, isSubmitting },
    } = useForm({
        resolver: zodResolver(bookSchema),
        defaultValues: {
            status: 'available',
            total_stok: 1,
            harga: 0,
        },
    });

    // Fetch books
    const fetchBooks = async () => {
        try {
            setLoading(true);
            const params = { search };
            if (filterCategory) params.category_id = filterCategory;
            if (filterStatus) params.status = filterStatus;
            const response = await bookAPI.list(params);
            setBooks(response.data.items);
        } catch (error) {
            toast.error('Gagal memuat data buku');
        } finally {
            setLoading(false);
        }
    };

    // Fetch categories
    const fetchCategories = async () => {
        try {
            const response = await categoryAPI.list({});
            setCategories(response.data.items);
        } catch (error) {
            console.error('Failed to fetch categories');
        }
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    useEffect(() => {
        fetchBooks();
    }, [search, filterCategory, filterStatus]);

    // Open modal for create
    const openCreateModal = () => {
        reset({
            kode_buku: '',
            judul: '',
            pengarang: '',
            penerbit: '',
            tahun_terbit: '',
            isbn: '',
            category_id: '',
            lokasi_rak: '',
            total_stok: 1,
            harga: 0,
            deskripsi: '',
            status: 'available',
        });
        setEditingId(null);
        setModalOpen(true);
    };

    // Open modal for edit
    const openEditModal = (book) => {
        reset({
            kode_buku: book.kode_buku,
            judul: book.judul,
            pengarang: book.pengarang || '',
            penerbit: book.penerbit || '',
            tahun_terbit: book.tahun_terbit?.toString() || '',
            isbn: book.isbn || '',
            category_id: book.category_id?.toString() || '',
            lokasi_rak: book.lokasi_rak || '',
            total_stok: book.total_stok,
            harga: book.harga || 0,
            deskripsi: book.deskripsi || '',
            status: book.status,
        });
        setEditingId(book.id);
        setModalOpen(true);
    };

    // Submit form
    const onSubmit = async (data) => {
        try {
            const payload = {
                ...data,
                category_id: data.category_id || null,
                tahun_terbit: data.tahun_terbit ? parseInt(data.tahun_terbit) : null,
            };

            if (editingId) {
                await bookAPI.update(editingId, payload);
                toast.success('Buku berhasil diperbarui');
            } else {
                await bookAPI.create(payload);
                toast.success('Buku berhasil ditambahkan');
            }
            setModalOpen(false);
            fetchBooks();
        } catch (error) {
            console.error('Error saving book:', error);
            toast.error(error.response?.data?.detail || 'Terjadi kesalahan');
        }
    };

    // Delete book
    const handleDelete = async (id) => {
        try {
            await bookAPI.delete(id);
            toast.success('Buku berhasil dihapus');
            setDeleteConfirm(null);
            fetchBooks();
        } catch (error) {
            toast.error(error.response?.data?.detail || 'Gagal menghapus buku');
        }
    };

    // Generate barcode
    const handleGenerateBarcode = async (book) => {
        try {
            const response = await bookAPI.getBarcode(book.id);
            // Create download link
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `barcode_${book.kode_buku}.png`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            toast.success('Barcode berhasil diunduh');
        } catch (error) {
            toast.error('Gagal generate barcode');
        }
    };

    // Handle file import
    const handleImport = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await bookAPI.bulkImport(formData);
            toast.success(response.data.message);
            setImportModalOpen(false);
            fetchBooks();
        } catch (error) {
            toast.error(error.response?.data?.detail || 'Gagal import data');
        }

        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    // Helper for number formatting (thousands separator)
    const formatNumber = (num) => {
        if (num === '' || num === null || num === undefined) return '';
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    };

    const parseNumber = (str) => {
        return str.replace(/\./g, '');
    };

    const handlePriceChange = (e) => {
        // Only allow numbers and dots
        const value = e.target.value;
        const cleanValue = value.replace(/[^0-9.]/g, '');
        // Remove dots for storage
        const rawValue = parseNumber(cleanValue);
        setValue('harga', rawValue ? parseInt(rawValue) : 0);
    };

    // Helper for category colors
    const getCategoryColor = (categoryName) => {
        const name = categoryName?.toLowerCase() || '';
        if (name.includes('fiqh') || name.includes('fikih')) return 'bg-purple-50 text-purple-600 border-purple-100';
        if (name.includes('adab') || name.includes('akhlak')) return 'bg-blue-50 text-blue-600 border-blue-100';
        if (name.includes('aqidah') || name.includes('tauhid')) return 'bg-amber-50 text-amber-600 border-amber-100';
        if (name.includes('hadits') || name.includes('hadis')) return 'bg-emerald-50 text-emerald-600 border-emerald-100';
        if (name.includes('quran') || name.includes('tafsir')) return 'bg-teal-50 text-teal-600 border-teal-100';
        if (name.includes('sejarah') || name.includes('sirah')) return 'bg-orange-50 text-orange-600 border-orange-100';
        return 'bg-slate-50 text-slate-600 border-slate-100';
    };

    // Helper for category icon placeholder
    const getCategoryIcon = (categoryName) => {
        const name = categoryName?.toLowerCase() || '';
        if (name.includes('fiqh')) return 'auto_stories'; // Lucide mapping needed? No, just use generic Book
        return 'book';
    };

    return (
        <div className="flex-1 overflow-y-auto font-sans bg-gray-50/30 min-h-screen">
            <header className="p-8 pb-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight text-slate-900">Koleksi Buku</h2>
                        <p className="text-slate-500 mt-1">Kelola koleksi buku dan kitab perpustakaan dengan mudah.</p>
                    </div>
                    <div className="flex items-center space-x-3">
                        <button
                            onClick={() => setImportModalOpen(true)}
                            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-all font-medium text-sm shadow-sm"
                        >
                            <Upload size={18} />
                            <span>Import</span>
                        </button>
                        <button
                            onClick={() => navigate('/buku/tambah')}
                            className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white transition-all font-semibold text-sm shadow-lg shadow-primary-600/20"
                        >
                            <Plus size={18} />
                            <span>Tambah Buku</span>
                        </button>
                    </div>
                </div>

                <div className="mt-8 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center">
                    <div className="flex-1 w-full relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            className="w-full pl-11 pr-4 py-2.5 rounded-xl border-slate-200 bg-slate-50/50 focus:ring-2 focus:ring-primary-600/20 focus:border-primary-600 text-sm transition-all"
                            placeholder="Cari kode, judul, pengarang..."
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center space-x-3 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
                        <select
                            value={filterCategory}
                            onChange={(e) => setFilterCategory(e.target.value)}
                            className="rounded-xl border-slate-200 bg-slate-50/50 text-sm focus:ring-2 focus:ring-primary-600/20 focus:border-primary-600 py-2.5 pl-4 pr-10 min-w-[150px]"
                        >
                            <option value="">Semua Kategori</option>
                            {categories.map((cat) => (
                                <option key={cat.id} value={cat.id}>{cat.nama_kategori}</option>
                            ))}
                        </select>
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="rounded-xl border-slate-200 bg-slate-50/50 text-sm focus:ring-2 focus:ring-primary-600/20 focus:border-primary-600 py-2.5 pl-4 pr-10"
                        >
                            <option value="">Semua Status</option>
                            <option value="available">Tersedia</option>
                            <option value="unavailable">Kosong</option>
                        </select>
                        {/* Tune button placeholder or advanced filter toggle */}
                        <button className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-500 transition-colors bg-white">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 21v-7" /><path d="M4 10V3" /><path d="M12 21v-9" /><path d="M12 8V3" /><path d="M20 21v-5" /><path d="M20 12V3" /><path d="M1 14h6" /><path d="M9 8h6" /><path d="M17 16h6" /></svg>
                        </button>
                    </div>
                </div>
            </header>

            <div className="px-8 pb-12">
                <div className="bg-white rounded-[2rem] border border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden">
                    {loading ? (
                        <div className="overflow-hidden">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50/50 border-b border-slate-100">
                                        <th className="px-6 py-5 text-[11px] font-bold text-slate-400 uppercase tracking-widest pl-8">Cover</th>
                                        <th className="px-6 py-5 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Kode</th>
                                        <th className="px-6 py-5 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Informasi Buku</th>
                                        <th className="px-6 py-5 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Kategori</th>
                                        <th className="px-6 py-5 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Stok</th>
                                        <th className="px-6 py-5 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Status</th>
                                        <th className="px-6 py-5 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-center pr-8">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {[1, 2, 3, 4, 5].map(i => (
                                        <tr key={i} className="hover:bg-slate-50/50">
                                            <td className="px-6 py-4 pl-8">
                                                <Skeleton className="w-14 h-20 rounded-lg" />
                                            </td>
                                            <td className="px-6 py-4">
                                                <Skeleton className="w-20 h-5 rounded-md" />
                                            </td>
                                            <td className="px-6 py-4">
                                                <Skeleton className="w-40 h-4 mb-2" />
                                                <Skeleton className="w-28 h-3" />
                                            </td>
                                            <td className="px-6 py-4">
                                                <Skeleton className="w-24 h-6 rounded-full" />
                                            </td>
                                            <td className="px-6 py-4">
                                                <Skeleton className="w-10 h-5" />
                                            </td>
                                            <td className="px-6 py-4">
                                                <Skeleton className="w-20 h-6 rounded-full" />
                                            </td>
                                            <td className="px-6 py-4 pr-8">
                                                <div className="flex items-center justify-center gap-2">
                                                    <Skeleton.Circle className="w-9 h-9" />
                                                    <Skeleton.Circle className="w-9 h-9" />
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : books.length === 0 ? (
                        <div className="text-center py-20">
                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                <BookOpen className="text-slate-300" size={32} />
                            </div>
                            <h3 className="text-lg font-bold text-slate-700">Tidak ada buku ditemukan</h3>
                            <p className="text-slate-500">Coba ubah kata kunci pencarian atau filter.</p>
                        </div>
                    ) : (
                        <>
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50/50 border-b border-slate-100">
                                        <th className="px-6 py-5 text-[11px] font-bold text-slate-400 uppercase tracking-widest pl-8">Cover</th>
                                        <th className="px-6 py-5 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Kode</th>
                                        <th className="px-6 py-5 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Informasi Buku</th>
                                        <th className="px-6 py-5 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Kategori</th>
                                        <th className="px-6 py-5 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Stok</th>
                                        <th className="px-6 py-5 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Status</th>
                                        <th className="px-6 py-5 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-center pr-8">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {books.map((book) => {
                                        const stockPercent = book.total_stok > 0 ? (book.stok_tersedia / book.total_stok) * 100 : 0;
                                        const isAvailable = book.stok_tersedia > 0;
                                        const statusColor = isAvailable ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700';
                                        const statusDot = isAvailable ? 'bg-emerald-500' : 'bg-red-500';

                                        return (
                                            <tr key={book.id} className="hover:bg-slate-50/50 transition-colors group">
                                                <td className="px-6 py-5 pl-8">
                                                    <div className="w-12 h-16 bg-slate-100 rounded-lg overflow-hidden border border-slate-200 shadow-sm flex items-center justify-center">
                                                        {book.cover ? (
                                                            <img
                                                                src={`http://localhost:8000/uploads/${book.cover}`}
                                                                alt={book.judul}
                                                                className="w-full h-full object-cover"
                                                            />
                                                        ) : (
                                                            <BookOpen size={20} className="text-slate-300" />
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <span className="px-2.5 py-1 bg-slate-100 rounded-lg text-xs font-bold text-slate-600 border border-slate-200">
                                                        {book.kode_buku}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-slate-800 leading-tight text-[15px]">{book.judul}</span>
                                                        <span className="text-[13px] text-slate-500 mt-1 font-medium">{book.pengarang || 'Tanpa Pengarang'}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <div className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full text-[10px] font-bold border capitalize ${getCategoryColor(book.category?.nama_kategori)}`}>
                                                        <BookMarked size={12} />
                                                        <span>{book.category?.nama_kategori || 'UMUM'}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <div className="w-32">
                                                        <div className="flex justify-between text-[11px] font-bold mb-1.5">
                                                            <span className={isAvailable ? 'text-primary-600' : 'text-red-500'}>
                                                                {book.stok_tersedia} <span className="text-slate-400 font-normal">Tersedia</span>
                                                            </span>
                                                            <span className="text-slate-500">
                                                                {book.total_stok} <span className="text-slate-400 font-normal">Total</span>
                                                            </span>
                                                        </div>
                                                        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                                            <div
                                                                className={`h-full rounded-full transition-all duration-500 ${isAvailable ? 'bg-primary-500' : 'bg-red-400'}`}
                                                                style={{ width: `${stockPercent}%` }}
                                                            ></div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${statusColor}`}>
                                                        <span className={`w-1.5 h-1.5 rounded-full ${statusDot} mr-2`}></span>
                                                        {isAvailable ? 'Tersedia' : 'Kosong'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-5 pr-8">
                                                    <div className="flex items-center justify-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button
                                                            onClick={() => handleGenerateBarcode(book)}
                                                            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all"
                                                            title="Generate Barcode"
                                                        >
                                                            <Barcode size={18} />
                                                        </button>
                                                        <button
                                                            onClick={() => navigate(`/buku/edit/${book.id}`)}
                                                            className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition-all"
                                                            title="Edit"
                                                        >
                                                            <Edit2 size={18} />
                                                        </button>
                                                        <button
                                                            onClick={() => setDeleteConfirm(book)}
                                                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                                                            title="Hapus"
                                                        >
                                                            <Trash2 size={18} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                            {/* Pagination (Visual Only for now as state logic is same, but styled) */}
                            <div className="px-8 py-5 bg-slate-50 border-t border-slate-100 flex items-center justify-between rounded-b-[2rem]">
                                <span className="text-sm text-slate-500 font-medium">
                                    Menampilkan <span className="font-bold text-slate-800">{books.length}</span> data
                                </span>
                                <div className="flex items-center space-x-1">
                                    <button className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:bg-white border border-transparent hover:border-slate-200 hover:text-slate-600 transition-all disabled:opacity-50">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
                                    </button>
                                    <button className="w-9 h-9 rounded-xl flex items-center justify-center bg-primary-600 text-white font-bold text-sm shadow-lg shadow-primary-600/20">1</button>
                                    <button className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:bg-white border border-transparent hover:border-slate-200 hover:text-slate-600 transition-all disabled:opacity-50">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Modals (Keep existing structure but improve classes if needed) */}
            {/* Create/Edit Modal */}
            {modalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-fade-in" onClick={() => setModalOpen(false)}>
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
                        <div className="px-8 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <h3 className="text-lg font-bold text-slate-800">{editingId ? 'Edit Buku' : 'Tambah Buku Baru'}</h3>
                            <button onClick={() => setModalOpen(false)} className="p-2 hover:bg-slate-200/50 rounded-full transition-colors text-slate-400 hover:text-slate-600">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit(onSubmit)}>
                            <div className="p-8 space-y-5">
                                <div className="grid grid-cols-2 gap-5">
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-bold text-slate-700">Kode Buku <span className="text-red-500">*</span></label>
                                        <input {...register('kode_buku')} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-600/20 focus:border-primary-600 transition-all font-medium" placeholder="BK001" />
                                        {errors.kode_buku && <p className="text-xs text-red-500 font-medium mt-1">{errors.kode_buku.message}</p>}
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-bold text-slate-700">ISBN</label>
                                        <input {...register('isbn')} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-600/20 focus:border-primary-600 transition-all font-medium" placeholder="978-xxx-xxx" />
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-sm font-bold text-slate-700">Judul Buku <span className="text-red-500">*</span></label>
                                    <input {...register('judul')} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-600/20 focus:border-primary-600 transition-all font-medium" placeholder="Masukkan judul buku..." />
                                    {errors.judul && <p className="text-xs text-red-500 font-medium mt-1">{errors.judul.message}</p>}
                                </div>
                                <div className="grid grid-cols-2 gap-5">
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-bold text-slate-700">Pengarang</label>
                                        <input {...register('pengarang')} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-600/20 focus:border-primary-600 transition-all font-medium" placeholder="Nama pengarang" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-bold text-slate-700">Penerbit</label>
                                        <input {...register('penerbit')} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-600/20 focus:border-primary-600 transition-all font-medium" placeholder="Nama penerbit" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-3 gap-5">
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-bold text-slate-700">Tahun</label>
                                        <input {...register('tahun_terbit')} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-600/20 focus:border-primary-600 transition-all font-medium" placeholder="2024" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-bold text-slate-700">Kategori</label>
                                        <select {...register('category_id')} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-600/20 focus:border-primary-600 transition-all font-medium text-slate-600">
                                            <option value="">Pilih Kategori</option>
                                            {categories.map((cat) => (
                                                <option key={cat.id} value={cat.id}>{cat.nama_kategori}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-bold text-slate-700">Rak</label>
                                        <input {...register('lokasi_rak')} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-600/20 focus:border-primary-600 transition-all font-medium" placeholder="A-01" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-3 gap-5">
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-bold text-slate-700">Stok</label>
                                        <input
                                            type="number"
                                            {...register('total_stok', { valueAsNumber: true })}
                                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-600/20 focus:border-primary-600 transition-all font-medium"
                                        />
                                    </div>
                                    <div className="space-y-1.5 col-span-2">
                                        <label className="text-sm font-bold text-slate-700">Status Awal</label>
                                        <select {...register('status')} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-600/20 focus:border-primary-600 transition-all font-medium text-slate-600">
                                            <option value="available">Tersedia (Bisa Dipinjam)</option>
                                            <option value="unavailable">Tidak Tersedia (Rusak/Hilang)</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                            <div className="px-8 py-5 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                                <button type="button" onClick={() => setModalOpen(false)} className="px-5 py-2.5 rounded-xl font-bold text-slate-500 hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-200 transition-all text-sm">
                                    Batal
                                </button>
                                <button type="submit" disabled={isSubmitting} className="px-5 py-2.5 rounded-xl font-bold bg-primary-600 text-white hover:bg-primary-700 shadow-lg shadow-primary-600/20 disabled:opacity-50 disabled:shadow-none transition-all text-sm flex items-center gap-2">
                                    {isSubmitting && <Loader2 size={16} className="animate-spin" />}
                                    Simpan Buku
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Import Modal */}
            {importModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-fade-in" onClick={() => setImportModalOpen(false)}>
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden" onClick={(e) => e.stopPropagation()}>
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <h3 className="text-lg font-bold text-slate-800">Import Data Buku</h3>
                            <button onClick={() => setImportModalOpen(false)} className="p-2 hover:bg-slate-200/50 rounded-full transition-colors text-slate-400 hover:text-slate-600">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-6">
                            <div className="border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center hover:border-primary-500/50 hover:bg-slate-50/50 transition-all group cursor-pointer" onClick={() => fileInputRef.current.click()}>
                                <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                                    <FileSpreadsheet size={32} />
                                </div>
                                <p className="font-bold text-slate-700 mb-1">Klik untuk upload file</p>
                                <p className="text-sm text-slate-500 mb-4">Format: .xlsx, .xls, .csv</p>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".xlsx,.xls,.csv"
                                    onChange={handleImport}
                                    className="hidden"
                                    id="book-file-upload"
                                />
                            </div>
                            <div className="mt-6 p-4 bg-slate-50 rounded-xl border border-slate-100">
                                <p className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Kolom Wajib:</p>
                                <ul className="text-sm text-slate-600 space-y-1">
                                    <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-slate-400"></div>kode_buku</li>
                                    <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-slate-400"></div>judul</li>
                                    <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-slate-400"></div>pengarang</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation */}
            {deleteConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-fade-in" onClick={() => setDeleteConfirm(null)}>
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden" onClick={(e) => e.stopPropagation()}>
                        <div className="p-8 text-center">
                            <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Trash2 size={32} className="text-red-500" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-2">Hapus Buku?</h3>
                            <p className="text-slate-500 mb-8">
                                Buku <strong className="text-slate-800">{deleteConfirm.judul}</strong> akan dihapus permanen. Tindakan ini tidak dapat dibatalkan.
                            </p>
                            <div className="flex gap-3 justify-center">
                                <button onClick={() => setDeleteConfirm(null)} className="flex-1 px-5 py-2.5 rounded-xl font-bold text-slate-500 hover:bg-slate-50 border border-slate-200 transition-all text-sm">
                                    Batal
                                </button>
                                <button onClick={() => handleDelete(deleteConfirm.id)} className="flex-1 px-5 py-2.5 rounded-xl font-bold bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-500/20 transition-all text-sm">
                                    Hapus
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
