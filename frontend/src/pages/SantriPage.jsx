import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Plus,
    Search,
    Edit2,
    Trash2,
    Users,
    User,
    Loader2,
    X,
    Building2,
    Upload,
    FileSpreadsheet,
    Bed,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    MapPin
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { santriAPI, asramaAPI, kamarAPI } from '../api';
import toast from 'react-hot-toast';
import Skeleton from '../components/Skeleton';

const santriSchema = z.object({
    nis: z.string().min(3, 'NIS minimal 3 karakter').max(20),
    nama_lengkap: z.string().min(2, 'Nama minimal 2 karakter').max(100),
    jenis_kelamin: z.enum(['L', 'P'], { required_error: 'Pilih jenis kelamin' }),
    asrama_id: z.string().optional(),
    kamar_id: z.string().optional(),
    kelas: z.string().optional(),
    nama_wali: z.string().optional(),
    no_hp_wali: z.string().optional(),
    alamat: z.string().optional(),
    foto: z.string().optional(),
    status: z.enum(['active', 'inactive', 'graduated']),
});

export default function SantriPage() {
    const navigate = useNavigate();
    const [santris, setSantris] = useState([]);
    const [asramas, setAsramas] = useState([]);
    const [kamars, setKamars] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterAsrama, setFilterAsrama] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [modalOpen, setModalOpen] = useState(false);
    const [importModalOpen, setImportModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const fileInputRef = useRef(null);

    const {
        register,
        handleSubmit,
        reset,
        watch,
        setValue,
        formState: { errors, isSubmitting },
    } = useForm({
        resolver: zodResolver(santriSchema),
        defaultValues: {
            status: 'active',
            jenis_kelamin: 'L',
        },
    });

    const watchAsrama = watch('asrama_id');

    const fetchSantris = async () => {
        try {
            setLoading(true);
            const params = { search };
            if (filterAsrama && filterAsrama !== 'Semua Asrama') params.asrama_id = filterAsrama;
            if (filterStatus && filterStatus !== 'Semua Status') params.status = filterStatus;
            const response = await santriAPI.list(params);
            setSantris(response.data.items || []);
        } catch (error) {
            toast.error('Gagal memuat data santri');
        } finally {
            setLoading(false);
        }
    };

    const fetchAsramas = async () => {
        try {
            const response = await asramaAPI.list({ status: 'active' });
            setAsramas(response.data.items || []);
        } catch (error) {
            console.error('Failed to fetch asramas');
        }
    };

    const fetchKamars = async (asramaId) => {
        if (!asramaId) {
            setKamars([]);
            return;
        }
        try {
            const response = await kamarAPI.list({ asrama_id: asramaId });
            setKamars(response.data.items || []);
        } catch (error) {
            console.error('Failed to fetch kamars');
        }
    };

    useEffect(() => {
        fetchAsramas();
    }, []);

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            fetchSantris();
        }, 300);
        return () => clearTimeout(timeoutId);
    }, [search, filterAsrama, filterStatus]);

    useEffect(() => {
        if (watchAsrama) {
            fetchKamars(watchAsrama);
        }
    }, [watchAsrama]);

    const openCreateModal = () => {
        reset({
            nis: '',
            nama_lengkap: '',
            jenis_kelamin: 'L',
            asrama_id: '',
            kamar_id: '',
            kelas: '',
            nama_wali: '',
            no_hp_wali: '',
            alamat: '',
            foto: '',
            status: 'active',
        });
        setKamars([]);
        setEditingId(null);
        setModalOpen(true);
    };

    const openEditModal = async (santri) => {
        if (santri.asrama_id) {
            await fetchKamars(santri.asrama_id);
        }
        reset({
            nis: santri.nis,
            nama_lengkap: santri.nama_lengkap,
            jenis_kelamin: santri.jenis_kelamin,
            asrama_id: santri.asrama_id?.toString() || '',
            kamar_id: santri.kamar_id?.toString() || '',
            kelas: santri.kelas || '',
            nama_wali: santri.nama_wali || '',
            no_hp_wali: santri.no_hp_wali || '',
            alamat: santri.alamat || '',
            foto: santri.foto || '',
            status: santri.status,
        });
        setEditingId(santri.id);
        setModalOpen(true);
    };

    const onSubmit = async (data) => {
        try {
            const payload = {
                ...data,
                asrama_id: data.asrama_id || null,
                kamar_id: data.kamar_id || null,
            };

            if (editingId) {
                await santriAPI.update(editingId, payload);
                toast.success('Santri berhasil diperbarui');
            } else {
                await santriAPI.create(payload);
                toast.success('Santri berhasil ditambahkan');
            }
            setModalOpen(false);
            fetchSantris();
        } catch (error) {
            console.error('Error saving santri:', error);
            toast.error(error.response?.data?.detail || 'Terjadi kesalahan');
        }
    };

    const handleDelete = async (id) => {
        try {
            await santriAPI.delete(id);
            toast.success('Santri berhasil dihapus');
            setDeleteConfirm(null);
            fetchSantris();
        } catch (error) {
            toast.error(error.response?.data?.detail || 'Gagal menghapus santri');
        }
    };

    const handleImport = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await santriAPI.bulkImport(formData);
            toast.success(response.data.message);
            setImportModalOpen(false);
            fetchSantris();
        } catch (error) {
            toast.error(error.response?.data?.detail || 'Gagal import data');
        }

        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <div className="flex-1 flex flex-col min-h-screen font-sans bg-slate-50/50">
            {/* Header */}
            <header className="px-8 py-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Data Santri</h2>
                    <p className="text-slate-500 mt-1 font-medium">Kelola informasi lengkap santri dan asrama</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setImportModalOpen(true)}
                        className="flex items-center gap-2 px-5 py-2.5 bg-white text-slate-700 font-bold text-sm rounded-xl border border-slate-200 hover:bg-slate-50 transition-all shadow-sm"
                    >
                        <Upload size={18} />
                        Import
                    </button>
                    <button
                        onClick={() => navigate('/santri/tambah')}
                        className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white font-bold text-sm rounded-xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20"
                    >
                        <Plus size={18} />
                        Tambah Santri
                    </button>
                </div>
            </header>

            <div className="px-8 pb-8 flex-1">
                {/* Filters */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col lg:flex-row gap-4 mb-6">
                    <div className="relative flex-1 group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors" size={20} />
                        <input
                            className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 placeholder-slate-400 transition-all outline-none"
                            placeholder="Cari NIS, nama, atau wali..."
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3">
                        <div className="relative min-w-[180px]">
                            <select
                                className="w-full pl-4 pr-10 py-2.5 bg-slate-50 border-none rounded-xl text-sm font-medium focus:ring-2 focus:ring-emerald-500/20 appearance-none cursor-pointer outline-none text-slate-600"
                                value={filterAsrama}
                                onChange={(e) => setFilterAsrama(e.target.value)}
                            >
                                <option value="">Semua Asrama</option>
                                {asramas.map((asrama) => (
                                    <option key={asrama.id} value={asrama.id}>{asrama.nama_asrama}</option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
                        </div>
                        <div className="relative min-w-[150px]">
                            <select
                                className="w-full pl-4 pr-10 py-2.5 bg-slate-50 border-none rounded-xl text-sm font-medium focus:ring-2 focus:ring-emerald-500/20 appearance-none cursor-pointer outline-none text-slate-600"
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                            >
                                <option value="">Semua Status</option>
                                <option value="active">Aktif</option>
                                <option value="inactive">Non-Aktif</option>
                                <option value="graduated">Lulus</option>
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-100">
                                    <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Santri Profile</th>
                                    <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Info Kamar</th>
                                    <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider text-center">Gender / Kelas</th>
                                    <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Wali</th>
                                    <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {loading ? (
                                    <>
                                        {[1, 2, 3, 4, 5].map(i => (
                                            <tr key={i} className="hover:bg-slate-50">
                                                <td className="px-6 py-5">
                                                    <div className="flex items-center gap-4">
                                                        <Skeleton.Circle className="w-11 h-11" />
                                                        <div>
                                                            <Skeleton className="w-32 h-4 mb-1" />
                                                            <Skeleton className="w-20 h-3" />
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <Skeleton className="w-28 h-4 mb-1" />
                                                    <Skeleton className="w-20 h-3" />
                                                </td>
                                                <td className="px-6 py-5">
                                                    <Skeleton className="w-16 h-5" />
                                                </td>
                                                <td className="px-6 py-5">
                                                    <Skeleton className="w-32 h-4 mb-1" />
                                                    <Skeleton className="w-24 h-3" />
                                                </td>
                                                <td className="px-6 py-5">
                                                    <Skeleton className="w-20 h-6 rounded-full" />
                                                </td>
                                                <td className="px-6 py-5 text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <Skeleton.Circle className="w-9 h-9" />
                                                        <Skeleton.Circle className="w-9 h-9" />
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </>
                                ) : santris.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="px-6 py-12 text-center">
                                            <Users size={48} className="text-slate-300 mx-auto mb-3" />
                                            <p className="text-slate-500 text-sm">Tidak ada data santri ditemukan.</p>
                                        </td>
                                    </tr>
                                ) : (
                                    santris.map((santri) => (
                                        <tr key={santri.id} className="hover:bg-slate-50 transition-colors">
                                            {/* Profile */}
                                            <td className="px-6 py-5">
                                                <div className="flex items-center gap-4">
                                                    <div className="relative">
                                                        <img
                                                            alt={santri.nama_lengkap}
                                                            className="w-11 h-11 rounded-full object-cover ring-2 ring-slate-100 bg-slate-100"
                                                            src={santri.foto && santri.foto.length > 0
                                                                ? (santri.foto.startsWith('http') ? santri.foto : `http://localhost:8000/uploads/${santri.foto}`)
                                                                : `https://ui-avatars.com/api/?name=${encodeURIComponent(santri.nama_lengkap)}&background=random`}
                                                            onError={(e) => {
                                                                e.target.onerror = null;
                                                                e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(santri.nama_lengkap)}&background=random`;
                                                            }}
                                                        />
                                                        <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 border-2 border-white rounded-full ${santri.status === 'active' ? 'bg-emerald-500' : 'bg-slate-400'}`}></div>
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-slate-800 text-sm">{santri.nama_lengkap}</p>
                                                        <p className="text-xs font-semibold text-slate-400 tracking-wider">NIS: {santri.nis}</p>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Kamar Info */}
                                            <td className="px-6 py-5">
                                                <div className="space-y-1.5">
                                                    <div className="flex items-center gap-2 text-slate-600">
                                                        <Building2 size={16} className="text-emerald-600" />
                                                        <span className="text-xs font-medium uppercase tracking-tight">{santri.asrama?.nama_asrama || '-'}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-slate-500">
                                                        <Bed size={16} className="text-amber-600" />
                                                        <span className="text-xs font-bold">{santri.kamar?.nama_kamar || '-'}</span>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Gender / Kelas */}
                                            <td className="px-6 py-5">
                                                <div className="flex flex-col items-center gap-2">
                                                    <span className={`px-3 py-1 text-[10px] font-bold rounded-full ${santri.jenis_kelamin === 'L' ? 'bg-blue-50 text-blue-600' : 'bg-pink-50 text-pink-600'}`}>
                                                        {santri.jenis_kelamin === 'L' ? 'LAKI-LAKI' : 'PEREMPUAN'}
                                                    </span>
                                                    <span className="text-xs font-bold text-slate-700">{santri.kelas || '-'}</span>
                                                </div>
                                            </td>

                                            {/* Wali */}
                                            <td className="px-6 py-5">
                                                <p className="text-sm font-semibold text-slate-700">{santri.nama_wali || '-'}</p>
                                                <p className="text-[10px] font-medium text-slate-400 uppercase mt-0.5">Wali Murid</p>
                                            </td>

                                            {/* Status */}
                                            <td className="px-6 py-5">
                                                <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full w-fit ${santri.status === 'active' ? 'text-emerald-600 bg-emerald-50' :
                                                    santri.status === 'graduated' ? 'text-blue-600 bg-blue-50' : 'text-slate-600 bg-slate-50'
                                                    }`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${santri.status === 'active' ? 'bg-emerald-500' :
                                                        santri.status === 'graduated' ? 'bg-blue-500' : 'bg-slate-500'
                                                        }`}></span>
                                                    <span className="text-xs font-bold uppercase tracking-wide">
                                                        {santri.status === 'active' ? 'Aktif' : santri.status === 'graduated' ? 'Lulus' : 'Non-Aktif'}
                                                    </span>
                                                </div>
                                            </td>

                                            {/* Aksi */}
                                            <td className="px-6 py-5 text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <button
                                                        onClick={() => navigate(`/santri/edit/${santri.id}`)}
                                                        className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                                                        title="Edit Data"
                                                    >
                                                        <Edit2 size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => setDeleteConfirm(santri)}
                                                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                                        title="Hapus Data"
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

                    {/* Pagination (Visual Only for now as API returns all) */}
                    {santris.length > 0 && (
                        <div className="px-6 py-4 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-100">
                            <p className="text-xs font-medium text-slate-500">
                                Menampilkan <span className="text-slate-900 font-bold">1 - {santris.length}</span> dari <span className="text-slate-900 font-bold">{santris.length}</span> Santri
                            </p>
                            <div className="flex items-center gap-1">
                                <button className="p-2 text-slate-400 hover:text-emerald-600 disabled:opacity-30" disabled>
                                    <ChevronLeft size={20} />
                                </button>
                                <button className="w-8 h-8 rounded-lg bg-emerald-600 text-white text-xs font-bold shadow-sm shadow-emerald-600/20">1</button>
                                {/* <button className="w-8 h-8 rounded-lg text-slate-600 hover:bg-slate-100 text-xs font-bold">2</button> */}
                                <button className="p-2 text-slate-600 hover:text-emerald-600" disabled>
                                    <ChevronRight size={20} />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Modals remain mostly unchanged in structure but styled if needed, keeping functionality */}
            {/* Create/Edit Modal */}
            {modalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm transition-all" onClick={() => setModalOpen(false)}>
                    <div className="bg-white rounded-2xl w-full max-w-2xl shadow-xl transform transition-all" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between p-6 border-b border-slate-100">
                            <h3 className="text-xl font-bold text-slate-800">
                                {editingId ? 'Edit Data Santri' : 'Tambah Santri Baru'}
                            </h3>
                            <button onClick={() => setModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-xl text-slate-500 transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit(onSubmit)}>
                            <div className="p-6 space-y-6">
                                {/* Form Content */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-2">NIS <span className="text-red-500">*</span></label>
                                        <input {...register('nis')} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all" placeholder="Nomor Induk Santri" />
                                        {errors.nis && <p className="text-xs text-red-500 mt-1">{errors.nis.message}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-2">Jenis Kelamin <span className="text-red-500">*</span></label>
                                        <select {...register('jenis_kelamin')} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all">
                                            <option value="L">Laki-laki</option>
                                            <option value="P">Perempuan</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">Nama Lengkap <span className="text-red-500">*</span></label>
                                    <input {...register('nama_lengkap')} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all" placeholder="Nama lengkap sesuai ijazah" />
                                    {errors.nama_lengkap && <p className="text-xs text-red-500 mt-1">{errors.nama_lengkap.message}</p>}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-2">Kelas</label>
                                        <input {...register('kelas')} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all" placeholder="Contoh: VII A" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-2">Asrama</label>
                                        <select {...register('asrama_id')} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all">
                                            <option value="">Pilih Asrama</option>
                                            {asramas.map((asrama) => (
                                                <option key={asrama.id} value={asrama.id}>{asrama.nama_asrama}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-2">Kamar</label>
                                        <select {...register('kamar_id')} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all" disabled={!watchAsrama}>
                                            <option value="">Pilih Kamar</option>
                                            {kamars.map((kamar) => (
                                                <option key={kamar.id} value={kamar.id}>{kamar.nama_kamar}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-2">Nama Wali</label>
                                        <input {...register('nama_wali')} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all" placeholder="Nama Orang Tua / Wali" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-2">No. HP Wali</label>
                                        <input {...register('no_hp_wali')} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all" placeholder="08xxxxxxxxxx" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-2">Alamat</label>
                                        <textarea {...register('alamat')} rows="3" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all resize-none" placeholder="Alamat lengkap..." />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-2">Foto Profile</label>

                                        <div className="flex items-start gap-4">
                                            {watch('foto') ? (
                                                <div className="relative w-20 h-20 rounded-xl overflow-hidden border border-slate-200 group">
                                                    <img src={watch('foto').startsWith('http') ? watch('foto') : `http://localhost:8000/uploads/${watch('foto')}`} className="w-full h-full object-cover" />
                                                    <button type="button" onClick={() => setValue('foto', '')} className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white">
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="w-20 h-20 rounded-xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 bg-slate-50">
                                                    <User size={24} />
                                                </div>
                                            )}

                                            <div className="flex-1">
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    id="upload-foto"
                                                    className="hidden"
                                                    onChange={async (e) => {
                                                        const file = e.target.files[0];
                                                        if (!file) return;
                                                        const formData = new FormData();
                                                        formData.append('file', file);
                                                        try {
                                                            const toastId = toast.loading('Mengupload...');
                                                            const response = await santriAPI.uploadPhoto(formData);
                                                            setValue('foto', response.data.filename);
                                                            toast.dismiss(toastId);
                                                            toast.success('Berhasil');
                                                        } catch (e) {
                                                            toast.dismiss();
                                                            toast.error('Gagal upload');
                                                        }
                                                    }}
                                                />
                                                <label htmlFor="upload-foto" className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer transition-colors">
                                                    <Upload size={16} />
                                                    Pilih Foto
                                                </label>
                                                <p className="text-xs text-slate-400 mt-2">Max 2MB. JPG, PNG.</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="p-6 border-t border-slate-100 flex justify-end gap-3 bg-slate-50 rounded-b-2xl">
                                <button type="button" onClick={() => setModalOpen(false)} className="px-5 py-2.5 rounded-xl text-slate-600 font-bold text-sm hover:bg-slate-200 transition-colors">
                                    Batal
                                </button>
                                <button type="submit" disabled={isSubmitting} className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl font-bold text-sm hover:bg-emerald-700 shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2">
                                    {isSubmitting && <Loader2 size={16} className="animate-spin" />}
                                    Simpan Santri
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Import Modal */}
            {importModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm transition-all" onClick={() => setImportModalOpen(false)}>
                    <div className="bg-white rounded-2xl w-full max-w-md shadow-xl" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between p-6 border-b border-slate-100">
                            <h3 className="text-xl font-bold text-slate-800">Import Data Santri</h3>
                            <button onClick={() => setImportModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-xl text-slate-500 transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-8">
                            <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center bg-slate-50/50 hover:bg-slate-50 transition-colors">
                                <FileSpreadsheet size={48} className="mx-auto mb-4 text-emerald-500" />
                                <p className="text-slate-700 font-medium mb-1">Upload file Excel atau CSV</p>
                                <p className="text-sm text-slate-500 mb-6">Format: .xlsx, .xls, .csv</p>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".xlsx,.xls,.csv"
                                    onChange={handleImport}
                                    className="hidden"
                                    id="file-upload"
                                />
                                <label htmlFor="file-upload" className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl font-bold text-sm cursor-pointer hover:bg-emerald-700 shadow-lg shadow-emerald-500/20 transition-all">
                                    <Upload size={18} />
                                    Pilih File
                                </label>
                            </div>
                            <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-100">
                                <p className="text-sm font-bold text-blue-700 mb-2 flex items-center gap-2">
                                    <MapPin size={16} /> Kolom Wajib:
                                </p>
                                <ul className="text-sm text-blue-600 space-y-1 ml-6 list-disc">
                                    <li>nis, nama_lengkap, jenis_kelamin (L/P)</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirm */}
            {deleteConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm transition-all" onClick={() => setDeleteConfirm(null)}>
                    <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl p-6 text-center" onClick={(e) => e.stopPropagation()}>
                        <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Trash2 size={32} />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-2">Hapus Santri?</h3>
                        <p className="text-slate-500 mb-6">
                            Data santri <strong>{deleteConfirm.nama_lengkap}</strong> akan dihapus secara permanen. Tindakan ini tidak dapat dibatalkan.
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
