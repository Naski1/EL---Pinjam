import { useState, useEffect } from 'react';
import {
    Save,
    Loader2,
    Info,
    Settings,
    Library,
    Clock,
    BookOpen,
    AlertTriangle,
    Banknote,
    MapPin,
    Building2
} from 'lucide-react';
import { settingsAPI } from '../api';
import toast from 'react-hot-toast';
import SantriIllustration from '../components/SantriIllustration';
import Skeleton from '../components/Skeleton';

export default function SettingsPage() {
    const [settings, setSettings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({});

    // Fetch settings on mount
    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const response = await settingsAPI.list();
                setSettings(response.data);

                // Initialize form data
                const initialData = {};
                response.data.forEach(setting => {
                    initialData[setting.key] = setting.value;
                });
                setFormData(initialData);
            } catch (error) {
                console.error("Failed to load settings", error);
                toast.error('Gagal memuat pengaturan');
            } finally {
                setLoading(false);
            }
        };

        fetchSettings();
    }, []);

    const handleChange = (key, value) => {
        setFormData({
            ...formData,
            [key]: value
        });
    };

    const handleSave = async () => {
        try {
            setSaving(true);

            // Prepare data for bulk update
            const updates = Object.keys(formData).map(key => ({
                key,
                value: formData[key]
            }));

            await settingsAPI.update({ settings: updates });
            toast.success('Pengaturan berhasil disimpan');

            // Refresh settings to ensure sync
            const response = await settingsAPI.list();
            setSettings(response.data);
        } catch (error) {
            console.error("Failed to save settings", error);
            toast.error(error.response?.data?.detail || 'Gagal menyimpan pengaturan');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex-1 flex flex-col min-h-screen bg-slate-50/50 font-sans -mx-6 -mt-6 lg:-mx-10 lg:-mt-8 mb-6">
                {/* Header Skeleton */}
                <div className="bg-white border-b border-slate-200 px-8 py-8">
                    <div className="max-w-5xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                            <Skeleton className="w-48 h-8 mb-2" />
                            <Skeleton className="w-72 h-4" />
                        </div>
                        <Skeleton className="w-40 h-12 rounded-xl" />
                    </div>
                </div>

                {/* Content Skeleton */}
                <div className="max-w-5xl mx-auto w-full px-8 py-10">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Settings Cards Skeleton */}
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                                <div className="flex items-center gap-4 mb-6">
                                    <Skeleton className="w-12 h-12 rounded-xl" />
                                    <div>
                                        <Skeleton className="w-36 h-5 mb-1" />
                                        <Skeleton className="w-48 h-3" />
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    {[1, 2, 3].map(j => (
                                        <div key={j}>
                                            <Skeleton className="w-24 h-3 mb-2" />
                                            <Skeleton className="w-full h-11 rounded-xl" />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    // Helper to get description
    const getDescription = (key) => {
        const setting = settings.find(s => s.key === key);
        return setting?.description || '';
    };

    // Helper for number formatting (thousands separator)
    const formatNumber = (num) => {
        if (num === '' || num === null || num === undefined) return '';
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    };

    const parseNumber = (str) => {
        return str.replace(/\./g, '');
    };

    const handleNumberChange = (key, value) => {
        // Only allow numbers and dots
        const cleanValue = value.replace(/[^0-9.]/g, '');
        // Remove dots for storage
        const rawValue = parseNumber(cleanValue);
        handleChange(key, rawValue);
    };

    return (
        <div className="flex-1 flex flex-col min-h-screen bg-slate-50/50 font-sans -mx-6 -mt-6 lg:-mx-10 lg:-mt-8 mb-6">
            {/* Header Section */}
            <div className="bg-white border-b border-slate-200 px-8 py-8 relative overflow-hidden">
                <div className="absolute right-0 top-0 h-full opacity-10 pointer-events-none">
                    <SantriIllustration className="h-full w-auto" />
                </div>

                <div className="max-w-5xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                    <div className="flex items-center gap-6">
                        <div className="hidden md:block">
                            <SantriIllustration className="w-32 h-32 drop-shadow-lg" />
                        </div>
                        <div>
                            <h1 className="font-display font-extrabold text-3xl text-slate-900">Pengaturan Sistem</h1>
                            <p className="text-slate-500 mt-2 text-lg">Konfigurasi parameter global aplikasi perpustakaan santri</p>
                        </div>
                    </div>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3.5 rounded-xl font-bold text-sm transition-all shadow-lg shadow-emerald-500/20 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {saving ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
                        Simpan Perubahan
                    </button>
                </div>
            </div>

            <div className="p-8 max-w-5xl mx-auto space-y-8 w-full">

                {/* Info Box */}
                <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6 flex items-start gap-4 shadow-sm">
                    <div className="p-2 bg-blue-100 rounded-lg shrink-0">
                        <Info className="text-blue-600" size={24} />
                    </div>
                    <div>
                        <h4 className="font-bold text-blue-900 text-lg">Catatan Penting</h4>
                        <p className="text-blue-700 mt-1 leading-relaxed">
                            Perubahan pada pengaturan peminjaman dan denda akan berlaku efektif untuk transaksi baru.
                            Transaksi yang sedang berjalan akan tetap menggunakan aturan saat transaksi tersebut dibuat.
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column - Peminjaman */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Card: Aturan Peminjaman */}
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                            <div className="border-b border-slate-100 p-6 flex items-center gap-3 bg-slate-50/50">
                                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                                    <Clock size={20} />
                                </div>
                                <h2 className="text-xl font-bold text-slate-800">Aturan Peminjaman</h2>
                            </div>
                            <div className="p-8 space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Durasi Peminjaman */}
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-slate-700 flex items-center justify-between">
                                            Durasi Peminjaman
                                            <span className="text-xs font-normal text-slate-400">Hari</span>
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                value={formData['durasi_pinjam'] || ''}
                                                onChange={(e) => handleChange('durasi_pinjam', e.target.value)}
                                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-bold text-slate-700"
                                                min="1"
                                            />
                                        </div>
                                        <p className="text-xs text-slate-500">{getDescription('durasi_pinjam')}</p>
                                    </div>

                                    {/* Maksimal Buku */}
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-slate-700 flex items-center justify-between">
                                            Maksimal Buku
                                            <span className="text-xs font-normal text-slate-400">Buku/Santri</span>
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                value={formData['maksimal_buku'] || ''}
                                                onChange={(e) => handleChange('maksimal_buku', e.target.value)}
                                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-bold text-slate-700"
                                                min="1"
                                            />
                                        </div>
                                        <p className="text-xs text-slate-500">{getDescription('maksimal_buku')}</p>
                                    </div>

                                    {/* Maksimal Perpanjangan */}
                                    <div className="md:col-span-2 space-y-2">
                                        <label className="text-sm font-bold text-slate-700 flex items-center justify-between">
                                            Batas Perpanjangan
                                            <span className="text-xs font-normal text-slate-400">Kali</span>
                                        </label>
                                        <input
                                            type="number"
                                            value={formData['maksimal_perpanjangan'] || ''}
                                            onChange={(e) => handleChange('maksimal_perpanjangan', e.target.value)}
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-bold text-slate-700"
                                            min="0"
                                        />
                                        <p className="text-xs text-slate-500">{getDescription('maksimal_perpanjangan')}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Card: Denda & Sanksi */}
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                            <div className="border-b border-slate-100 p-6 flex items-center gap-3 bg-slate-50/50">
                                <div className="p-2 bg-rose-50 text-rose-600 rounded-lg">
                                    <Banknote size={20} />
                                </div>
                                <h2 className="text-xl font-bold text-slate-800">Denda & Sanksi</h2>
                            </div>
                            <div className="p-8 space-y-6">
                                {/* Denda Per Hari */}
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700">Denda Keterlambatan (Per Hari)</label>
                                    <div className="relative group">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold group-focus-within:text-rose-500 transition-colors">Rp</div>
                                        <input
                                            type="text"
                                            value={formatNumber(formData['denda_per_hari'])}
                                            onChange={(e) => handleNumberChange('denda_per_hari', e.target.value)}
                                            className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none transition-all font-bold text-slate-700 text-lg"
                                        />
                                    </div>
                                    <p className="text-xs text-slate-500">{getDescription('denda_per_hari')}</p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
                                    {/* Denda Rusak */}
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-slate-700">Denda Buku Rusak</label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                value={formData['denda_rusak_multiplier'] || ''}
                                                onChange={(e) => handleChange('denda_rusak_multiplier', e.target.value)}
                                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none transition-all font-bold text-slate-700"
                                                min="0.1"
                                                step="0.1"
                                            />
                                            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">x Harga</div>
                                        </div>
                                        <p className="text-xs text-slate-500">{getDescription('denda_rusak_multiplier')}</p>
                                    </div>

                                    {/* Denda Hilang */}
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-slate-700">Denda Buku Hilang</label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                value={formData['denda_hilang_multiplier'] || ''}
                                                onChange={(e) => handleChange('denda_hilang_multiplier', e.target.value)}
                                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none transition-all font-bold text-slate-700"
                                                min="1"
                                                step="0.1"
                                            />
                                            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">x Harga</div>
                                        </div>
                                        <p className="text-xs text-slate-500">{getDescription('denda_hilang_multiplier')}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Info Perpustakaan */}
                    <div className="space-y-8">
                        {/* Card: Identitas Perpustakaan */}
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden h-full">
                            <div className="border-b border-slate-100 p-6 flex items-center gap-3 bg-slate-50/50">
                                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                                    <Library size={20} />
                                </div>
                                <h2 className="text-xl font-bold text-slate-800">Identitas</h2>
                            </div>
                            <div className="p-8 space-y-6">
                                {/* Nama Perpustakaan */}
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700">Nama Perpustakaan</label>
                                    <div className="relative">
                                        <Building2 className="absolute left-4 top-3.5 text-slate-400" size={18} />
                                        <input
                                            type="text"
                                            value={formData['nama_perpustakaan'] || ''}
                                            onChange={(e) => handleChange('nama_perpustakaan', e.target.value)}
                                            className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all font-medium text-slate-700"
                                            placeholder="Contoh: Perpustakaan Al-Hikmah"
                                        />
                                    </div>
                                </div>

                                {/* Alamat */}
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700">Alamat Lengkap</label>
                                    <div className="relative">
                                        <MapPin className="absolute left-4 top-3.5 text-slate-400" size={18} />
                                        <textarea
                                            value={formData['alamat_perpustakaan'] || ''}
                                            onChange={(e) => handleChange('alamat_perpustakaan', e.target.value)}
                                            className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all font-medium text-slate-700 min-h-[120px] resize-none leading-relaxed"
                                            placeholder="Jalan..."
                                        />
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
