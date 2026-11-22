import { useNavigate, Link, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { asramaAPI } from '../api';
import toast from 'react-hot-toast';
import { useEffect, useState } from 'react';
import {
    ArrowLeft,
    Save,
    Info,
    SquareUser,
    ChevronDown,
    Building2,
    Users,
    AlertCircle,
    Loader2
} from 'lucide-react';

const asramaSchema = z.object({
    kode_asrama: z.string().min(2, 'Kode minimal 2 karakter').max(10),
    nama_asrama: z.string().min(2, 'Nama minimal 2 karakter').max(100),
    kapasitas: z.number().min(0, 'Kapasitas minimal 0'),
    penanggung_jawab: z.string().optional(),
    status: z.enum(['active', 'inactive']),
    deskripsi: z.string().optional(),
});

export default function AddAsramaPage() {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEditMode = !!id;
    const [isLoading, setIsLoading] = useState(false);

    const {
        register,
        handleSubmit,
        setValue,
        reset,
        formState: { errors, isSubmitting },
    } = useForm({
        resolver: zodResolver(asramaSchema),
        defaultValues: {
            status: 'active',
            kapasitas: 0,
        },
    });

    useEffect(() => {
        if (isEditMode) {
            fetchAsrama();
        }
    }, [id]);

    const fetchAsrama = async () => {
        try {
            setIsLoading(true);
            const response = await asramaAPI.get(id);
            const data = response.data;
            reset({
                kode_asrama: data.kode_asrama,
                nama_asrama: data.nama_asrama,
                kapasitas: data.kapasitas,
                penanggung_jawab: data.penanggung_jawab,
                status: data.status,
                deskripsi: data.deskripsi,
            });
        } catch (error) {
            toast.error('Gagal memuat data asrama');
            navigate('/asrama');
        } finally {
            setIsLoading(false);
        }
    };

    const onSubmit = async (data) => {
        try {
            if (isEditMode) {
                await asramaAPI.update(id, data);
                toast.success('Asrama berhasil diperbarui');
            } else {
                await asramaAPI.create(data);
                toast.success('Asrama berhasil ditambahkan');
            }
            navigate('/asrama');
        } catch (error) {
            toast.error(error.response?.data?.detail || 'Gagal menyimpan asrama');
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 size={32} className="animate-spin text-emerald-500" />
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col h-screen overflow-hidden -mx-6 -mt-6 lg:-mx-10 lg:-mt-8">
            <header className="bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between sticky top-0 z-10">
                <div className="flex items-center gap-4">
                    <Link to="/asrama" className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500">
                        <ArrowLeft size={24} />
                    </Link>
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">{isEditMode ? 'Edit Asrama' : 'Tambah Asrama Baru'}</h2>
                        <p className="text-sm text-slate-500">
                            {isEditMode ? 'Perbarui informasi data asrama.' : 'Silakan lengkapi formulir untuk menambahkan asrama baru ke sistem.'}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Link to="/asrama" className="px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-all">
                        Batal
                    </Link>
                    <button
                        onClick={handleSubmit(onSubmit)}
                        disabled={isSubmitting}
                        className="px-6 py-2.5 text-sm font-semibold text-white bg-emerald-500 hover:bg-emerald-600 rounded-lg shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                        Simpan Data
                    </button>
                </div>
            </header>

            <div className="flex-1 overflow-y-auto p-8 bg-slate-50">
                <div className="max-w-4xl mx-auto space-y-8 pb-12">
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
                            <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-500">
                                <Info size={20} />
                            </div>
                            <h3 className="font-bold text-slate-800">Informasi Dasar</h3>
                        </div>
                        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-2">
                                <label className="block text-sm font-semibold text-slate-700">
                                    Kode Asrama <span className="text-red-500">*</span>
                                </label>
                                <input
                                    {...register('kode_asrama')}
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none"
                                    placeholder="Contoh: ASR01"
                                    type="text"
                                />
                                {errors.kode_asrama && <p className="text-xs text-red-500 flex items-center gap-1 mt-1"><AlertCircle size={12} /> {errors.kode_asrama.message}</p>}
                                <p className="text-xs text-slate-400 italic">Gunakan kode unik untuk setiap asrama</p>
                            </div>
                            <div className="space-y-2">
                                <label className="block text-sm font-semibold text-slate-700">
                                    Kapasitas (Santri) <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <input
                                        {...register('kapasitas', { valueAsNumber: true })}
                                        className="w-full pl-4 pr-12 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none"
                                        placeholder="0"
                                        type="number"
                                    />
                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
                                        <Users size={18} />
                                    </span>
                                </div>
                                {errors.kapasitas && <p className="text-xs text-red-500 flex items-center gap-1 mt-1"><AlertCircle size={12} /> {errors.kapasitas.message}</p>}
                            </div>
                            <div className="space-y-2 md:col-span-2">
                                <label className="block text-sm font-semibold text-slate-700">
                                    Nama Asrama <span className="text-red-500">*</span>
                                </label>
                                <input
                                    {...register('nama_asrama')}
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none"
                                    placeholder="Contoh: Asrama Putra Al-Ikhlas"
                                    type="text"
                                />
                                {errors.nama_asrama && <p className="text-xs text-red-500 flex items-center gap-1 mt-1"><AlertCircle size={12} /> {errors.nama_asrama.message}</p>}
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
                            <div className="p-2 bg-amber-500/10 rounded-lg text-amber-500">
                                <SquareUser size={20} />
                            </div>
                            <h3 className="font-bold text-slate-800">Manajemen Operasional</h3>
                        </div>
                        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-2">
                                <label className="block text-sm font-semibold text-slate-700">
                                    Penanggung Jawab / Musyrif
                                </label>
                                <div className="relative">
                                    <input
                                        {...register('penanggung_jawab')}
                                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none"
                                        placeholder="Cari atau masukkan nama Ustadz"
                                        type="text"
                                    />
                                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                                        <SquareUser size={18} />
                                    </span>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="block text-sm font-semibold text-slate-700">
                                    Status Operasional <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <select
                                        {...register('status')}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none appearance-none"
                                    >
                                        <option value="active">Aktif</option>
                                        <option value="inactive">Non-Aktif / Renovasi</option>
                                    </select>
                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                                        <ChevronDown size={20} />
                                    </span>
                                </div>
                            </div>
                            <div className="space-y-2 md:col-span-2">
                                <label className="block text-sm font-semibold text-slate-700">
                                    Deskripsi & Lokasi
                                </label>
                                <textarea
                                    {...register('deskripsi')}
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none resize-none"
                                    placeholder="Masukkan deskripsi singkat asrama, detail lokasi (lantai, blok), atau fasilitas pendukung..."
                                    rows="4"
                                ></textarea>
                            </div>
                        </div>
                    </div>

                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex gap-3">
                        <Info className="text-amber-500 shrink-0" size={20} />
                        <p className="text-sm text-amber-800 leading-relaxed">
                            <strong>Catatan:</strong> Setelah data asrama disimpan, Anda dapat mulai menambahkan unit kamar ke dalam asrama ini melalui menu <span className="font-bold underline">Data Kamar</span>.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
