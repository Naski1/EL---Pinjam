import { useState, useEffect } from 'react';
import {
    Plus,
    Search,
    Edit2,
    Trash2,
    BookMarked,
    Loader2,
    X,
    BookOpen,
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { categoryAPI } from '../api';
import toast from 'react-hot-toast';
import Skeleton from '../components/Skeleton';

const categorySchema = z.object({
    kode_kategori: z.string().min(2, 'Kode minimal 2 karakter').max(10),
    nama_kategori: z.string().min(2, 'Nama minimal 2 karakter').max(100),
    deskripsi: z.string().optional(),
});

export default function CategoryPage() {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [modalOpen, setModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState(null);

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isSubmitting },
    } = useForm({
        resolver: zodResolver(categorySchema),
    });

    // Fetch categories
    const fetchCategories = async () => {
        try {
            setLoading(true);
            const response = await categoryAPI.list({ search });
            setCategories(response.data.items);
        } catch (error) {
            toast.error('Gagal memuat data kategori');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCategories();
    }, [search]);

    // Open modal for create
    const openCreateModal = () => {
        reset({
            kode_kategori: '',
            nama_kategori: '',
            deskripsi: '',
        });
        setEditingId(null);
        setModalOpen(true);
    };

    // Open modal for edit
    const openEditModal = (category) => {
        reset({
            kode_kategori: category.kode_kategori,
            nama_kategori: category.nama_kategori,
            deskripsi: category.deskripsi || '',
        });
        setEditingId(category.id);
        setModalOpen(true);
    };

    // Submit form
    const onSubmit = async (data) => {
        try {
            if (editingId) {
                await categoryAPI.update(editingId, data);
                toast.success('Kategori berhasil diperbarui');
            } else {
                await categoryAPI.create(data);
                toast.success('Kategori berhasil ditambahkan');
            }
            setModalOpen(false);
            fetchCategories();
        } catch (error) {
            toast.error(error.response?.data?.detail || 'Terjadi kesalahan');
        }
    };

    // Delete category
    const handleDelete = async (id) => {
        try {
            await categoryAPI.delete(id);
            toast.success('Kategori berhasil dihapus');
            setDeleteConfirm(null);
            fetchCategories();
        } catch (error) {
            toast.error(error.response?.data?.detail || 'Gagal menghapus kategori');
        }
    };

    // Helper for category icons
    const getCategoryIcon = (name) => {
        const lowerName = name?.toLowerCase() || '';
        if (lowerName.includes('akhlak') || lowerName.includes('ahlaq')) return 'auto_stories';
        if (lowerName.includes('aqidah') || lowerName.includes('tauhid')) return 'mosque';
        if (lowerName.includes('fiqih') || lowerName.includes('fiqh')) return 'balance';
        if (lowerName.includes('fiksi') || lowerName.includes('novel')) return 'star';
        if (lowerName.includes('tafsir') || lowerName.includes('quran')) return 'history_edu';
        if (lowerName.includes('adab')) return 'sentiment_very_satisfied';
        if (lowerName.includes('sejarah') || lowerName.includes('sirah')) return 'history';
        return 'category'; // Default icon
    };

    return (
        <div className="flex-1 p-10 min-w-0 font-sans bg-gray-50/50 min-h-screen">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
                <div>
                    <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Kategori Buku</h2>
                    <p className="text-slate-500 mt-1">Kelola dan atur kategori koleksi buku perpustakaan secara efisien.</p>
                </div>
                <button
                    onClick={openCreateModal}
                    className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-xl flex items-center justify-center gap-2 font-semibold shadow-lg shadow-primary-600/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                    <span className="material-symbols-rounded">add</span>
                    Tambah Kategori
                </button>
            </div>

            {/* Search Bar */}
            <div className="relative max-w-2xl mb-12">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <span className="material-symbols-rounded text-slate-400">search</span>
                </div>
                <input
                    className="block w-full pl-12 pr-4 py-4 bg-white border-none rounded-2xl shadow-sm focus:ring-2 focus:ring-primary-600/50 text-slate-700 placeholder:text-slate-400 transition-all font-medium"
                    placeholder="Cari kode atau nama kategori..."
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
                <div className="absolute inset-y-0 right-3 flex items-center">
                    <kbd className="hidden sm:inline-block px-2 py-1 text-xs font-semibold text-slate-400 bg-slate-50 border border-slate-200 rounded-lg">⌘K</kbd>
                </div>
            </div>

            {/* Grid Content */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                        <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200/60">
                            <div className="flex justify-between items-start mb-4">
                                <Skeleton className="w-14 h-14 rounded-2xl" />
                                <div className="flex gap-1">
                                    <Skeleton.Circle className="w-8 h-8" />
                                    <Skeleton.Circle className="w-8 h-8" />
                                </div>
                            </div>
                            <Skeleton className="w-24 h-5 mb-3" />
                            <Skeleton className="w-full h-3 mb-2" />
                            <Skeleton className="w-2/3 h-3 mb-5" />
                            <div className="flex justify-between">
                                <Skeleton className="w-16 h-5 rounded-full" />
                                <Skeleton className="w-12 h-4" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : categories.length === 0 && !loading ? (
                <div className="text-center py-20">
                    <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <span className="material-symbols-rounded text-4xl text-slate-400">category</span>
                    </div>
                    <h3 className="text-xl font-bold text-slate-800">Tidak ada kategori ditemukan</h3>
                    <p className="text-slate-500 mb-6">Mulai dengan menambahkan kategori baru.</p>
                    <button onClick={openCreateModal} className="text-primary-600 font-bold hover:underline">
                        + Tambah Kategori
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {/* Category Cards */}
                    {categories.map((category) => (
                        <div key={category.id} className="relative group bg-white p-6 rounded-2xl shadow-sm border border-slate-200/60 hover:shadow-xl hover:shadow-slate-200/50 hover:-translate-y-1 transition-all">
                            <div className="flex justify-between items-start mb-4">
                                <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-primary-600 group-hover:scale-110 transition-transform">
                                    <span className="material-symbols-rounded text-3xl">
                                        {getCategoryIcon(category.nama_kategori)}
                                    </span>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => openEditModal(category)}
                                        className="p-2 rounded-lg bg-slate-100 text-slate-500 hover:text-primary-600 transition-colors opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 duration-200"
                                        title="Edit"
                                    >
                                        <span className="material-symbols-rounded text-lg">edit</span>
                                    </button>
                                    <button
                                        onClick={() => setDeleteConfirm(category)}
                                        className="p-2 rounded-lg bg-red-50 text-red-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 duration-200 delay-75"
                                        title="Hapus"
                                    >
                                        <span className="material-symbols-rounded text-lg">delete</span>
                                    </button>
                                </div>
                            </div>
                            <div className="mb-5">
                                <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500 uppercase tracking-wider mb-2">
                                    {category.kode_kategori}
                                </span>
                                <h3 className="text-xl font-bold text-slate-800 line-clamp-1" title={category.nama_kategori}>
                                    {category.nama_kategori}
                                </h3>
                                {category.deskripsi && (
                                    <p className="text-xs text-slate-400 mt-1 line-clamp-1">{category.deskripsi}</p>
                                )}
                            </div>
                            <div className="flex items-center gap-2 pt-4 border-t border-slate-100">
                                <span className="material-symbols-rounded text-slate-400 text-base">book</span>
                                <span className="text-sm font-semibold text-slate-600">
                                    {category.jumlah_buku || 0} Buku
                                </span>
                            </div>
                        </div>
                    ))}

                    {/* Add New Card */}
                    <button
                        onClick={openCreateModal}
                        className="group border-2 border-dashed border-slate-300 p-6 rounded-2xl flex flex-col items-center justify-center gap-4 hover:border-primary-500/50 hover:bg-emerald-50/30 transition-all min-h-[220px]"
                    >
                        <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-primary-600 group-hover:text-white transition-all">
                            <span className="material-symbols-rounded text-3xl">add_circle</span>
                        </div>
                        <div className="text-center">
                            <p className="font-bold text-slate-500 group-hover:text-primary-700 transition-colors">Tambah Baru</p>
                            <p className="text-xs text-slate-400">Buat kategori buku lain</p>
                        </div>
                    </button>
                </div>
            )}

            {/* Modals - Keeping existing logic but updating styles slightly to match rounded theme */}
            {/* Create/Edit Modal */}
            {modalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-fade-in" onClick={() => setModalOpen(false)}>
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden" onClick={(e) => e.stopPropagation()}>
                        <div className="px-8 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <h3 className="text-lg font-bold text-slate-800">
                                {editingId ? 'Edit Kategori' : 'Tambah Kategori'}
                            </h3>
                            <button onClick={() => setModalOpen(false)} className="p-2 hover:bg-slate-200/50 rounded-full transition-colors text-slate-400 hover:text-slate-600">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit(onSubmit)}>
                            <div className="p-8 space-y-5">
                                <div className="space-y-1.5">
                                    <label className="text-sm font-bold text-slate-700">Kode Kategori <span className="text-red-500">*</span></label>
                                    <input
                                        {...register('kode_kategori')}
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-600/20 focus:border-primary-600 transition-all font-medium uppercase"
                                        placeholder="FIK"
                                    />
                                    {errors.kode_kategori && (
                                        <p className="text-xs text-red-500 font-medium mt-1">{errors.kode_kategori.message}</p>
                                    )}
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-sm font-bold text-slate-700">Nama Kategori <span className="text-red-500">*</span></label>
                                    <input
                                        {...register('nama_kategori')}
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-600/20 focus:border-primary-600 transition-all font-medium"
                                        placeholder="Fiksi"
                                    />
                                    {errors.nama_kategori && (
                                        <p className="text-xs text-red-500 font-medium mt-1">{errors.nama_kategori.message}</p>
                                    )}
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-sm font-bold text-slate-700">Deskripsi</label>
                                    <textarea
                                        {...register('deskripsi')}
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-600/20 focus:border-primary-600 transition-all font-medium"
                                        rows={3}
                                        placeholder="Deskripsi kategori (opsional)"
                                    />
                                </div>
                            </div>
                            <div className="px-8 py-5 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setModalOpen(false)}
                                    className="px-5 py-2.5 rounded-xl font-bold text-slate-500 hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-200 transition-all text-sm"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="px-5 py-2.5 rounded-xl font-bold bg-primary-600 text-white hover:bg-primary-700 shadow-lg shadow-primary-600/20 disabled:opacity-50 disabled:shadow-none transition-all text-sm flex items-center gap-2"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 size={16} className="animate-spin" />
                                            Menyimpan...
                                        </>
                                    ) : (
                                        'Simpan'
                                    )}
                                </button>
                            </div>
                        </form>
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
                            <h3 className="text-xl font-bold text-slate-900 mb-2">Hapus Kategori?</h3>
                            <p className="text-slate-500 mb-8">
                                Kategori <strong className="text-slate-800">{deleteConfirm.nama_kategori}</strong> akan dihapus permanen.
                            </p>
                            <div className="flex gap-3 justify-center">
                                <button
                                    onClick={() => setDeleteConfirm(null)}
                                    className="flex-1 px-5 py-2.5 rounded-xl font-bold text-slate-500 hover:bg-slate-50 border border-slate-200 transition-all text-sm"
                                >
                                    Batal
                                </button>
                                <button
                                    onClick={() => handleDelete(deleteConfirm.id)}
                                    className="flex-1 px-5 py-2.5 rounded-xl font-bold bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-500/20 transition-all text-sm"
                                >
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
