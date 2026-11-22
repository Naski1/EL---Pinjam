import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { asramaAPI, kamarAPI } from '../api';
import toast from 'react-hot-toast';
import {
    ArrowLeft,
    Building2,
    Users,
    User,
    Edit,
    Trash2,
    Loader2,
    BedDouble,
    Plus,
    Search,
    ChevronLeft,
    ChevronRight,
    MapPin,
    MoreVertical
} from 'lucide-react';

export default function AsramaDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [asrama, setAsrama] = useState(null);
    const [kamars, setKamars] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchKamar, setSearchKamar] = useState('');

    // Fetch data
    const fetchDetail = async () => {
        try {
            setLoading(true);
            const [asramaRes, kamarRes] = await Promise.all([
                asramaAPI.get(id),
                kamarAPI.list({ asrama_id: id, search: searchKamar }) // Assuming API supports filtering by asrama_id
            ]);

            setAsrama(asramaRes.data);
            setKamars(kamarRes.data.items || kamarRes.data);
        } catch (error) {
            console.error(error);
            toast.error('Gagal memuat detail asrama');
            navigate('/asrama');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDetail();
    }, [id]);

    useEffect(() => {
        // Refetch Kamar when search changes
        const fetchKamars = async () => {
            try {
                const kamarRes = await kamarAPI.list({ asrama_id: id, search: searchKamar });
                setKamars(kamarRes.data.items || kamarRes.data);
            } catch (error) {
                console.error(error);
            }
        };
        // Simple debounce could be added here
        if (asrama) fetchKamars();
    }, [searchKamar]);


    const handleDeleteAsrama = async () => {
        if (!window.confirm('Hapus asrama ini? Semua data kamar dan santri terkait mungkin akan terpengaruh.')) return;
        try {
            await asramaAPI.delete(id);
            toast.success('Asrama berhasil dihapus');
            navigate('/asrama');
        } catch (error) {
            toast.error(error.response?.data?.detail || 'Gagal menghapus asrama');
        }
    };

    // Calculate stats
    const totalKapasitasKamar = kamars.reduce((acc, k) => acc + (k.kapasitas || 0), 0);
    const totalTerisi = kamars.reduce((acc, k) => acc + (k.terisi || 0), 0);
    const occupancyRate = totalKapasitasKamar > 0 ? Math.round((totalTerisi / totalKapasitasKamar) * 100) : 0;

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 size={32} className="animate-spin text-emerald-500" />
            </div>
        );
    }

    if (!asrama) return null;

    return (
        <div className="flex-1 flex flex-col font-sans -mx-6 -mt-6 lg:-mx-10 lg:-mt-8 mb-6">
            {/* Header / Breadcrumb area could go here, but we use a custom Detail Header */}

            <header className="bg-white border-b border-slate-200 sticky top-0 z-30 px-8 py-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link to="/asrama" className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500">
                        <ArrowLeft size={24} />
                    </Link>
                    <div>
                        <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                            {asrama.nama_asrama}
                            <span className={`px-2 py-0.5 text-[10px] uppercase rounded-full border ${asrama.status === 'active' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                                {asrama.status}
                            </span>
                        </h1>
                        <p className="text-sm text-slate-500">{asrama.kode_asrama}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Link
                        to={`/asrama/edit/${id}`}
                        className="p-2 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                        title="Edit Asrama"
                    >
                        <Edit size={20} />
                    </Link>
                    <button
                        onClick={handleDeleteAsrama}
                        className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                        title="Hapus Asrama"
                    >
                        <Trash2 size={20} />
                    </button>
                </div>
            </header>

            <div className="p-8 max-w-7xl mx-auto w-full space-y-8">
                {/* Info Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Capacity Card */}
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between h-full">
                        <div className="flex items-start justify-between mb-4">
                            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                                <Users size={24} />
                            </div>
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Kapasitas</span>
                        </div>
                        <div>
                            <div className="flex items-baseline gap-2">
                                <h3 className="text-3xl font-bold text-slate-900">{asrama.kapasitas}</h3>
                                <span className="text-sm text-slate-500">Santri</span>
                            </div>
                            <div className="mt-2 w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                <div className="bg-blue-500 h-full rounded-full" style={{ width: `${Math.min((asrama.jumlah_santri / asrama.kapasitas) * 100, 100)}%` }}></div>
                            </div>
                            <p className="text-xs text-slate-500 mt-2">{asrama.jumlah_santri || 0} Terisi</p>
                        </div>
                    </div>

                    {/* PJ Card */}
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between h-full">
                        <div className="flex items-start justify-between mb-4">
                            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                                <User size={24} />
                            </div>
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Penanggung Jawab</span>
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-slate-900 line-clamp-1">{asrama.penanggung_jawab || '-'}</h3>
                            <p className="text-sm text-slate-500">Musyrif</p>
                        </div>
                    </div>

                    {/* Rooms Card */}
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between h-full">
                        <div className="flex items-start justify-between mb-4">
                            <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                                <Building2 size={24} />
                            </div>
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Kamar</span>
                        </div>
                        <div>
                            <h3 className="text-3xl font-bold text-slate-900">{kamars.length}</h3>
                            <p className="text-sm text-slate-500 mt-1">Unit Kamar</p>
                        </div>
                    </div>
                </div>

                {/* Description & Location */}
                {asrama.deskripsi && (
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                        <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                            <MapPin size={18} className="text-slate-400" />
                            Deskripsi & Lokasi
                        </h3>
                        <p className="text-slate-600 leading-relaxed text-sm">
                            {asrama.deskripsi}
                        </p>
                    </div>
                )}

                {/* Room List */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-bold text-slate-800">Daftar Kamar</h3>
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Cari kamar..."
                                value={searchKamar}
                                onChange={(e) => setSearchKamar(e.target.value)}
                                className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 w-64"
                            />
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        </div>
                    </div>

                    {kamars.length === 0 ? (
                        <div className="bg-slate-50 rounded-2xl border border-slate-200 border-dashed p-12 text-center">
                            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                                <BedDouble className="text-slate-300" size={32} />
                            </div>
                            <p className="text-slate-500 font-medium">Belum ada data kamar di asrama ini.</p>
                            <Link to="/kamar" className="inline-flex items-center gap-2 text-emerald-600 font-bold mt-4 hover:underline">
                                <Plus size={16} /> Tambah Kamar
                            </Link>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {kamars.map(kamar => (
                                <div key={kamar.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all group">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                                            <BedDouble size={20} />
                                        </div>
                                        <span className={`px-2 py-1 text-[10px] font-bold uppercase rounded-md ${kamar.status === 'available' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                                            {kamar.status}
                                        </span>
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-slate-900 text-lg">{kamar.nama_kamar}</h4>
                                        <p className="text-slate-500 text-xs mb-3">{kamar.kode_kamar}</p>

                                        <div className="flex items-center gap-4 text-xs font-medium text-slate-600">
                                            <div className="flex items-center gap-1.5">
                                                <Users size={14} className="text-slate-400" />
                                                {kamar.terisi} / {kamar.kapasitas} Santri
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <div className={`w-1.5 h-1.5 rounded-full ${kamar.is_full ? 'bg-red-500' : 'bg-emerald-500'}`}></div>
                                                {kamar.is_full ? 'Penuh' : 'Tersedia'}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
