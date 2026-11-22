import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    Plus,
    Search,
    Edit2,
    Trash2,
    Building2,
    Loader2,
    X,
    Users,
    Bed,
    Filter,
    Eye,
    ChevronLeft,
    ChevronRight,
    Moon,
    Sun,
    Bell,
    ChevronRight as ChevronRightSmall
} from 'lucide-react';
import { asramaAPI } from '../api';
import toast from 'react-hot-toast';
import Skeleton from '../components/Skeleton';



export default function AsramaPage() {
    const [asramas, setAsramas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');



    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const fetchAsramas = async () => {
        try {
            setLoading(true);
            const response = await asramaAPI.list({ search, limit: 100 });
            const items = response.data.items || [];
            setAsramas(items);


        } catch (error) {
            console.error(error);
            toast.error('Gagal memuat data asrama');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAsramas();
    }, [search]);



    // Delete asrama
    const handleDelete = async (id) => {
        try {
            await asramaAPI.delete(id);
            toast.success('Asrama berhasil dihapus');
            setDeleteConfirm(null);
            fetchAsramas();
        } catch (error) {
            toast.error(error.response?.data?.detail || 'Gagal menghapus asrama');
        }
    };

    return (
        <div className="flex-1 flex flex-col min-h-screen bg-slate-50/50 font-sans -mx-6 -mt-6 lg:-mx-10 lg:-mt-8 mb-6">
            {/* Header */}
            <header className="h-16 flex items-center justify-between px-8 bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-40">
                <div className="flex items-center gap-2">
                    <span className="text-slate-400 text-sm">Dashboard</span>
                    <ChevronRightSmall className="text-slate-300" size={18} />
                    <span className="text-slate-800 font-semibold text-sm">Data Asrama</span>
                </div>
                <div className="flex items-center gap-4">
                    <button className="p-2 rounded-full hover:bg-slate-100 text-slate-500 transition-colors">
                        <Moon size={20} />
                    </button>
                    <div className="h-6 w-[1px] bg-slate-200 mx-2"></div>
                    <button className="p-2 rounded-full hover:bg-slate-100 text-slate-500 relative">
                        <Bell size={20} />
                        <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                    </button>
                </div>
            </header>

            <div className="p-8 max-w-7xl w-full mx-auto space-y-8">
                {/* Title Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                        <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Data Asrama</h2>
                        <p className="text-slate-500 mt-1">Kelola data asrama santri, kapasitas, dan fasilitas pesantren.</p>
                    </div>
                    <Link
                        to="/asrama/tambah"
                        className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-emerald-500/25 transition-all active:scale-95"
                    >
                        <Plus size={20} />
                        Tambah Asrama
                    </Link>
                </div>

                {/* Search and Table Card */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                            <input
                                className="w-full pl-12 pr-4 py-3 bg-slate-50 border-slate-200 rounded-xl text-sm focus:ring-emerald-500 focus:border-emerald-500 transition-all outline-none"
                                placeholder="Cari kode, nama asrama, atau penanggung jawab..."
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                        <button className="inline-flex items-center gap-2 px-5 py-3 border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
                            <Filter size={18} />
                            Filter
                        </button>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50">
                                    <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">Kode</th>
                                    <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">Nama Asrama</th>
                                    <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">Penanggung Jawab</th>
                                    <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200 text-center">Kapasitas</th>
                                    <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">Status</th>
                                    <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200 text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {loading ? (
                                    <>
                                        {[1, 2, 3, 4].map(i => (
                                            <tr key={i} className="hover:bg-slate-50/50">
                                                <td className="px-6 py-5"><Skeleton className="w-16 h-5 rounded-md" /></td>
                                                <td className="px-6 py-5">
                                                    <Skeleton className="w-36 h-4 mb-1" />
                                                    <Skeleton className="w-24 h-3" />
                                                </td>
                                                <td className="px-6 py-5">
                                                    <div className="flex items-center gap-3">
                                                        <Skeleton.Circle className="w-9 h-9" />
                                                        <Skeleton className="w-28 h-4" />
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5 text-center"><Skeleton className="w-16 h-5 mx-auto" /></td>
                                                <td className="px-6 py-5"><Skeleton className="w-16 h-6 rounded-full" /></td>
                                                <td className="px-6 py-5 text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <Skeleton.Circle className="w-9 h-9" />
                                                        <Skeleton.Circle className="w-9 h-9" />
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </>
                                ) : asramas.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="px-6 py-12 text-center">
                                            <Building2 size={48} className="text-slate-300 mx-auto mb-3" />
                                            <p className="text-slate-500 text-sm">Tidak ada data asrama ditemukan.</p>
                                        </td>
                                    </tr>
                                ) : (
                                    asramas.map((asrama) => (
                                        <tr key={asrama.id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-6 py-5 whitespace-nowrap">
                                                <span className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-xs font-bold font-mono border border-slate-200">{asrama.kode_asrama}</span>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold text-slate-800">{asrama.nama_asrama}</span>
                                                    <span className="text-[11px] text-slate-400 mt-0.5">{asrama.deskripsi || 'Tidak ada deskripsi'}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 whitespace-nowrap">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500 border border-amber-500/20">
                                                        <Users size={16} />
                                                    </div>
                                                    <span className="text-sm font-medium text-slate-700">{asrama.penanggung_jawab || '-'}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex items-center justify-center gap-6">
                                                    <div className="flex flex-col items-center">
                                                        <div className="flex items-center gap-1.5 text-slate-500">
                                                            <Bed size={16} />
                                                            <span className="text-sm font-bold text-slate-800">{asrama.jumlah_kamar || 0}</span>
                                                        </div>
                                                        <span className="text-[10px] text-slate-400 font-medium">Kamar</span>
                                                    </div>
                                                    <div className="flex flex-col items-center">
                                                        <div className="flex items-center gap-1.5 text-slate-500">
                                                            <Users size={16} />
                                                            <span className="text-sm font-bold text-slate-800">{asrama.jumlah_santri || 0}</span>
                                                        </div>
                                                        <span className="text-[10px] text-slate-400 font-medium">Santri</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 whitespace-nowrap">
                                                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold border ${asrama.status === 'active'
                                                    ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                                    : 'bg-slate-100 text-slate-600 border-slate-200'
                                                    }`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full ${asrama.status === 'active' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`}></span>
                                                    {asrama.status === 'active' ? 'Aktif' : 'Non-Aktif'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-5 whitespace-nowrap text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Link to={`/asrama/${asrama.id}`} className="p-2 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 rounded-lg transition-all" title="Detail">
                                                        <Eye size={18} />
                                                    </Link>
                                                    <Link
                                                        to={`/asrama/edit/${asrama.id}`}
                                                        className="p-2 text-slate-400 hover:text-amber-500 hover:bg-amber-50 rounded-lg transition-all"
                                                        title="Edit"
                                                    >
                                                        <Edit2 size={18} />
                                                    </Link>
                                                    <button
                                                        onClick={() => setDeleteConfirm(asrama)}
                                                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
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
                </div>


            </div>



            {/* Delete Confirmation */}
            {deleteConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm transition-all" onClick={() => setDeleteConfirm(null)}>
                    <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl p-6 text-center" onClick={(e) => e.stopPropagation()}>
                        <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Trash2 size={32} />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-2">Hapus Asrama?</h3>
                        <p className="text-slate-500 mb-6">
                            Data asrama <strong>{deleteConfirm.nama_asrama}</strong> akan dihapus permanen.
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
