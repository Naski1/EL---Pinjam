import { useState, useEffect } from 'react';
import {
    Plus,
    Search,
    Edit2,
    Trash2,
    Building2,
    Loader2,
    X,
    Users,
    Filter,
    ChevronLeft,
    ChevronRight,
    Moon,
    Sun,
    Bell,
    CheckCircle,
    XCircle,
    ChevronDown
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { kamarAPI, asramaAPI } from '../api';
import toast from 'react-hot-toast';
import Skeleton from '../components/Skeleton';

const kamarSchema = z.object({
    asrama_id: z.string().min(1, 'Pilih asrama'),
    kode_kamar: z.string().min(1, 'Kode minimal 1 karakter').max(10),
    nama_kamar: z.string().min(1, 'Nama minimal 1 karakter').max(50),
    kapasitas: z.number().min(1, 'Kapasitas minimal 1'),
});

export default function KamarPage() {
    const [kamars, setKamars] = useState([]);
    const [asramas, setAsramas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterAsrama, setFilterAsrama] = useState('');
    const [modalOpen, setModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState(null);

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const limit = 10;

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isSubmitting },
    } = useForm({
        resolver: zodResolver(kamarSchema),
        defaultValues: {
            kapasitas: 4,
        },
    });

    // Fetch kamars
    const fetchKamars = async () => {
        try {
            setLoading(true);
            const params = {
                search,
                skip: (currentPage - 1) * limit,
                limit
            };
            if (filterAsrama) params.asrama_id = filterAsrama;

            const response = await kamarAPI.list(params);
            setKamars(response.data.items);
            setTotalItems(response.data.total);
            setTotalPages(Math.ceil(response.data.total / limit));
        } catch (error) {
            toast.error('Gagal memuat data kamar');
        } finally {
            setLoading(false);
        }
    };

    // Fetch asramas for dropdown
    const fetchAsramas = async () => {
        try {
            const response = await asramaAPI.list({ status: 'active', limit: 100 });
            setAsramas(response.data.items);
        } catch (error) {
            console.error('Failed to fetch asramas');
        }
    };

    useEffect(() => {
        fetchAsramas();
    }, []);

    useEffect(() => {
        fetchKamars();
    }, [currentPage, search, filterAsrama]);

    // Reset pagination when filter changes
    useEffect(() => {
        setCurrentPage(1);
    }, [search, filterAsrama]);


    // Open modal for create
    const openCreateModal = () => {
        reset({
            asrama_id: asramas[0]?.id || '',
            kode_kamar: '',
            nama_kamar: '',
            kapasitas: 4,
        });
        setEditingId(null);
        setModalOpen(true);
    };

    // Open modal for edit
    const openEditModal = (kamar) => {
        reset({
            asrama_id: kamar.asrama_id,
            kode_kamar: kamar.kode_kamar,
            nama_kamar: kamar.nama_kamar,
            kapasitas: kamar.kapasitas,
        });
        setEditingId(kamar.id);
        setModalOpen(true);
    };

    // Submit form
    const onSubmit = async (data) => {
        try {
            if (editingId) {
                await kamarAPI.update(editingId, data);
                toast.success('Kamar berhasil diperbarui');
            } else {
                await kamarAPI.create(data);
                toast.success('Kamar berhasil ditambahkan');
            }
            setModalOpen(false);
            fetchKamars();
        } catch (error) {
            toast.error(error.response?.data?.detail || 'Terjadi kesalahan');
        }
    };

    // Delete kamar
    const handleDelete = async (id) => {
        try {
            await kamarAPI.delete(id);
            toast.success('Kamar berhasil dihapus');
            setDeleteConfirm(null);
            fetchKamars();
        } catch (error) {
            toast.error(error.response?.data?.detail || 'Gagal menghapus kamar');
        }
    };

    return (
        <div className="flex-1 flex flex-col min-h-screen bg-slate-50/50 font-sans -mx-6 -mt-6 lg:-mx-10 lg:-mt-8 mb-6">
            {/* Header */}
            <div className="p-8 max-w-7xl mx-auto space-y-8 w-full">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <h2 className="font-display font-extrabold text-3xl text-slate-800">Data Kamar</h2>
                        </div>
                        <p className="text-slate-500">Kelola data kamar per asrama secara efisien</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={openCreateModal}
                            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-xl font-bold text-sm transition-all shadow-lg shadow-emerald-500/20 active:scale-95"
                        >
                            <Plus size={20} />
                            Tambah Kamar
                        </button>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                        <input
                            className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 bg-white text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all placeholder:text-slate-400 font-medium"
                            placeholder="Cari kode atau nama kamar..."
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <div className="relative w-full md:w-64">
                        <select
                            className="w-full pl-4 pr-10 py-3 rounded-xl border border-slate-200 bg-white text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none appearance-none font-medium text-slate-600 cursor-pointer"
                            value={filterAsrama}
                            onChange={(e) => setFilterAsrama(e.target.value)}
                        >
                            <option value="">Semua Asrama</option>
                            {asramas.map((asrama) => (
                                <option key={asrama.id} value={asrama.id}>{asrama.nama_asrama}</option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={20} />
                    </div>
                </div>

                {/* Table */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-200">
                                    <th className="px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest">Kode</th>
                                    <th className="px-6 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest">Nama Kamar</th>
                                    <th className="px-6 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest">Asrama</th>
                                    <th className="px-6 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest text-center">Kapasitas</th>
                                    <th className="px-6 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest">Penghuni</th>
                                    <th className="px-6 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest">Status</th>
                                    <th className="px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {loading ? (
                                    <>
                                        {[1, 2, 3, 4, 5].map(i => (
                                            <tr key={i} className="hover:bg-slate-50/50">
                                                <td className="px-8 py-5"><Skeleton className="w-16 h-5 rounded-md" /></td>
                                                <td className="px-6 py-5"><Skeleton className="w-24 h-4" /></td>
                                                <td className="px-6 py-5"><Skeleton className="w-28 h-4" /></td>
                                                <td className="px-6 py-5"><Skeleton className="w-16 h-4" /></td>
                                                <td className="px-6 py-5"><Skeleton className="w-12 h-5" /></td>
                                                <td className="px-6 py-5"><Skeleton className="w-20 h-6 rounded-full" /></td>
                                                <td className="px-8 py-5 text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <Skeleton.Circle className="w-9 h-9" />
                                                        <Skeleton.Circle className="w-9 h-9" />
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </>
                                ) : kamars.length === 0 ? (
                                    <tr>
                                        <td colSpan="7" className="px-6 py-12 text-center">
                                            <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                                <Building2 size={32} className="text-slate-300" />
                                            </div>
                                            <p className="text-slate-500 text-sm font-medium">Belum ada data kamar ditemukan.</p>
                                        </td>
                                    </tr>
                                ) : (
                                    kamars.map((kamar) => (
                                        <tr key={kamar.id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-8 py-5">
                                                <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200 font-mono">
                                                    {kamar.kode_kamar}
                                                </span>
                                            </td>
                                            <td className="px-6 py-5">
                                                <span className="text-sm font-bold text-slate-800">{kamar.nama_kamar}</span>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex items-center gap-2">
                                                    <Building2 size={16} className="text-emerald-600 opacity-60" />
                                                    <span className="text-sm text-slate-600">{kamar.asrama?.nama_asrama || '-'}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 text-center">
                                                <span className="text-sm font-medium text-slate-700">{kamar.kapasitas}</span>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex items-center gap-2">
                                                    <Users size={16} className="text-slate-400" />
                                                    <span className="text-sm font-medium text-slate-600">
                                                        {kamar.jumlah_penghuni}/{kamar.kapasitas} <span className="text-xs text-slate-400 font-normal ml-1">Santri</span>
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${kamar.status === 'available'
                                                    ? 'bg-emerald-100 text-emerald-600'
                                                    : 'bg-red-100 text-red-600'
                                                    }`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full mr-2 ${kamar.status === 'available'
                                                        ? 'bg-emerald-500 animate-pulse'
                                                        : 'bg-red-500'
                                                        }`}></span>
                                                    {kamar.status === 'available' ? 'Tersedia' : 'Penuh'}
                                                </span>
                                            </td>
                                            <td className="px-8 py-5 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => openEditModal(kamar)}
                                                        className="p-2 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all"
                                                        title="Edit"
                                                    >
                                                        <Edit2 size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => setDeleteConfirm(kamar)}
                                                        className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all"
                                                        title="Hapus"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <div className="px-8 py-5 border-t border-slate-200 flex items-center justify-between bg-slate-50">
                        <p className="text-sm text-slate-500">
                            Showing <span className="font-medium text-slate-900">{kamars.length > 0 ? (currentPage - 1) * limit + 1 : 0}</span> to <span className="font-medium text-slate-900">{Math.min(currentPage * limit, totalItems)}</span> of <span className="font-medium text-slate-900">{totalItems}</span> rooms
                        </p>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                disabled={currentPage === 1}
                                className="p-2 border border-slate-200 rounded-lg text-slate-400 hover:bg-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <ChevronLeft size={20} />
                            </button>
                            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                                // Simple pagination logic: show first 5 pages or centered around current
                                // For now, let's keep it simple: show all specific pages if total <= 5
                                let pageNum = i + 1;
                                // Adjust if totalPages > 5 logic needed later, for now straightforward mapping
                                if (totalPages > 5) {
                                    // Better pagination logic can be added here
                                    // If current > 3, shift window
                                    if (currentPage > 3) pageNum = currentPage - 2 + i;
                                    if (pageNum > totalPages) return null;
                                }

                                return (
                                    <button
                                        key={pageNum}
                                        onClick={() => setCurrentPage(pageNum)}
                                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${currentPage === pageNum
                                            ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/20'
                                            : 'text-slate-600 hover:bg-slate-100 font-medium'
                                            }`}
                                    >
                                        {pageNum}
                                    </button>
                                );
                            })}
                            <button
                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                disabled={currentPage === totalPages || totalPages === 0}
                                className="p-2 border border-slate-200 rounded-lg text-slate-400 hover:bg-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <ChevronRight size={20} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Create/Edit Modal - Styled to match theme */}
            {modalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm transition-all" onClick={() => setModalOpen(false)}>
                    <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between p-6 border-b border-slate-100">
                            <h3 className="text-xl font-bold text-slate-800">
                                {editingId ? 'Edit Kamar' : 'Tambah Kamar Baru'}
                            </h3>
                            <button onClick={() => setModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-xl text-slate-500 transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit(onSubmit)}>
                            <div className="p-6 space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700">Asrama <span className="text-red-500">*</span></label>
                                    <div className="relative">
                                        <select
                                            {...register('asrama_id')}
                                            className="w-full pl-4 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all font-medium appearance-none cursor-pointer"
                                        >
                                            <option value="">Pilih Asrama</option>
                                            {asramas.map((asrama) => (
                                                <option key={asrama.id} value={asrama.id}>
                                                    {asrama.nama_asrama}
                                                </option>
                                            ))}
                                        </select>
                                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
                                    </div>
                                    {errors.asrama_id && <p className="text-xs text-red-500 font-medium">{errors.asrama_id.message}</p>}
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-slate-700">Kode Kamar <span className="text-red-500">*</span></label>
                                        <input
                                            {...register('kode_kamar')}
                                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all placeholder:text-slate-400 font-medium"
                                            placeholder="K001"
                                        />
                                        {errors.kode_kamar && <p className="text-xs text-red-500 font-medium">{errors.kode_kamar.message}</p>}
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-slate-700">Kapasitas <span className="text-red-500">*</span></label>
                                        <input
                                            type="number"
                                            {...register('kapasitas', { valueAsNumber: true })}
                                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all placeholder:text-slate-400 font-medium"
                                        />
                                        {errors.kapasitas && <p className="text-xs text-red-500 font-medium">{errors.kapasitas.message}</p>}
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700">Nama Kamar <span className="text-red-500">*</span></label>
                                    <input
                                        {...register('nama_kamar')}
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all placeholder:text-slate-400 font-medium"
                                        placeholder="Contoh: Kamar 01"
                                    />
                                    {errors.nama_kamar && <p className="text-xs text-red-500 font-medium">{errors.nama_kamar.message}</p>}
                                </div>
                            </div>
                            <div className="p-6 border-t border-slate-100 flex justify-end gap-3 bg-slate-50 rounded-b-2xl">
                                <button type="button" onClick={() => setModalOpen(false)} className="px-5 py-2.5 rounded-xl text-slate-600 font-bold text-sm hover:bg-slate-200 transition-colors">
                                    Batal
                                </button>
                                <button type="submit" disabled={isSubmitting} className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl font-bold text-sm hover:bg-emerald-700 shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2">
                                    {isSubmitting && <Loader2 size={16} className="animate-spin" />}
                                    Simpan Data
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation */}
            {deleteConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm transition-all" onClick={() => setDeleteConfirm(null)}>
                    <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl p-6 text-center" onClick={(e) => e.stopPropagation()}>
                        <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Trash2 size={32} />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-2">Hapus Kamar?</h3>
                        <p className="text-slate-500 mb-6">
                            Data kamar <strong>{deleteConfirm.nama_kamar}</strong> akan dihapus permanen.
                        </p>
                        <div className="flex gap-3 justify-center">
                            <button onClick={() => setDeleteConfirm(null)} className="px-5 py-2.5 rounded-xl text-slate-700 font-bold bg-slate-100 hover:bg-slate-200 transition-colors">
                                Batal
                            </button>
                            <button onClick={() => handleDelete(deleteConfirm.id)} className="px-5 py-2.5 rounded-xl text-white font-bold bg-red-600 hover:bg-red-700 shadow-lg shadow-red-500/20 transition-colors">
                                Ya, Hapus
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
