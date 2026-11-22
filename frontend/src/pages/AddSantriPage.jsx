import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
    Save,
    Camera,
    Info,
    Badge,
    Building2,
    Contact,
    Loader2,
    User,
    UploadCloud,
    ArrowLeft
} from 'lucide-react';
import toast from 'react-hot-toast';
import { santriAPI, asramaAPI, kamarAPI } from '../api';

const santriSchema = z.object({
    nis: z.string().min(3, 'NIS minimal 3 karakter').max(20),
    nama_lengkap: z.string().min(2, 'Nama minimal 2 karakter').max(100),
    jenis_kelamin: z.enum(['L', 'P'], { required_error: 'Pilih jenis kelamin' }),
    asrama_id: z.string().min(1, 'Pilih asrama'),
    kamar_id: z.string().min(1, 'Pilih kamar'),
    kelas: z.string().optional(),
    nama_wali: z.string().optional(),
    no_hp_wali: z.string().optional(),
    alamat: z.string().optional(),
    foto: z.string().optional().nullable(),
    status: z.enum(['active', 'inactive', 'graduated']).default('active'),
});

export default function AddSantriPage() {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEditMode = Boolean(id);
    const [asramas, setAsramas] = useState([]);
    const [kamars, setKamars] = useState([]);
    const [photoPreview, setPhotoPreview] = useState(null);
    const [isDragging, setIsDragging] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const fileInputRef = useRef(null);
    const hasInitialized = useRef(false);

    const {
        register,
        handleSubmit,
        watch,
        setValue,
        reset,
        formState: { errors, isSubmitting },
    } = useForm({
        resolver: zodResolver(santriSchema),
        defaultValues: {
            status: 'active',
            jenis_kelamin: '',
        },
    });

    const watchAsrama = watch('asrama_id');

    // Initialization logic
    useEffect(() => {
        const initData = async () => {
            if (hasInitialized.current) return;
            hasInitialized.current = true;

            try {
                setIsLoading(true);
                // 1. Fetch Asramas
                const asramaRes = await asramaAPI.list({ status: 'active' });
                setAsramas(asramaRes.data.items || []);

                // 2. If Edit Mode, Fetch Santri
                if (isEditMode) {
                    const santriRes = await santriAPI.get(id);
                    const santri = santriRes.data;

                    // 2a. Fetch Kamars for this santri's asrama immediately
                    if (santri.asrama_id) {
                        const kamarRes = await kamarAPI.list({ asrama_id: santri.asrama_id });
                        setKamars(kamarRes.data.items || []);
                    }

                    // 2b. Populate Form
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
                        foto: santri.foto,
                        status: santri.status,
                    });

                    // 2c. Set Photo Preview
                    if (santri.foto) {
                        setPhotoPreview(santri.foto.startsWith('http') ? santri.foto : `http://localhost:8000/uploads/${santri.foto}`);
                    }
                }
            } catch (error) {
                console.error('Failed to init data', error);
                toast.error('Gagal memuat data');
                if (isEditMode) navigate('/santri');
            } finally {
                setIsLoading(false);
            }
        };

        initData();
    }, [id, isEditMode, navigate, reset]);

    // Fetch kamars when asrama changes (User Action)
    // Only trigger if we are NOT loading initial data to avoid race condition with initData
    useEffect(() => {
        const fetchKamars = async () => {
            if (!watchAsrama || isLoading) return;

            try {
                const response = await kamarAPI.list({ asrama_id: watchAsrama });
                setKamars(response.data.items || []);
            } catch (error) {
                console.error('Failed to fetch kamars');
            }
        };

        if (!isLoading && hasInitialized.current) {
            fetchKamars();
        }
    }, [watchAsrama, isLoading]);


    // Handle File Upload logic
    const handleFileChange = async (file) => {
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            toast.error('File harus berupa gambar');
            return;
        }
        if (file.size > 2 * 1024 * 1024) { // 2MB
            toast.error('Ukuran file maksimal 2MB');
            return;
        }

        // Preview local
        const reader = new FileReader();
        reader.onloadend = () => {
            setPhotoPreview(reader.result);
        };
        reader.readAsDataURL(file);

        // Upload ke backend
        const formData = new FormData();
        formData.append('file', file);

        try {
            const toastId = toast.loading('Mengupload foto...');
            const response = await santriAPI.uploadPhoto(formData);
            setValue('foto', response.data.filename);
            toast.dismiss(toastId);
            toast.success('Foto berhasil diupload');
        } catch (error) {
            toast.dismiss();
            toast.error('Gagal mengupload foto');
            setPhotoPreview(null);
        }
    };

    const onDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        const files = e.dataTransfer.files;
        if (files && files.length > 0) {
            handleFileChange(files[0]);
        }
    };

    const onDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const onDragLeave = (e) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const onSubmit = async (data) => {
        try {
            const payload = {
                ...data,
                asrama_id: data.asrama_id ? parseInt(data.asrama_id) : null,
                kamar_id: data.kamar_id ? parseInt(data.kamar_id) : null,
            };

            if (isEditMode) {
                await santriAPI.update(id, payload);
                toast.success('Data santri berhasil diperbarui');
            } else {
                await santriAPI.create(payload);
                toast.success('Santri berhasil ditambahkan');
            }
            navigate('/santri');
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.detail || 'Gagal menyimpan data santri');
        }
    };

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center bg-slate-50">
                <Loader2 size={48} className="animate-spin text-emerald-600" />
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col min-h-screen bg-slate-50/50 font-sans -mx-6 -mt-6 lg:-mx-10 lg:-mt-8 mb-6">
            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col h-full">
                {/* Header */}
                <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-6 lg:px-10 sticky top-0 z-30 shadow-sm/50">
                    <div className="flex items-center gap-4">
                        <button
                            type="button"
                            onClick={() => navigate('/santri')}
                            className="p-2 rounded-full hover:bg-slate-100 text-slate-500 transition-colors"
                        >
                            <ArrowLeft size={24} />
                        </button>
                        <div>
                            <nav className="flex text-xs text-slate-400 space-x-2 mb-1">
                                <span className="hover:text-emerald-600 cursor-pointer" onClick={() => navigate('/santri')}>Data Santri</span>
                                <span>/</span>
                                <span className="text-slate-600 font-medium">{isEditMode ? 'Edit Data' : 'Tambah Baru'}</span>
                            </nav>
                            <h2 className="text-xl font-bold text-slate-800">{isEditMode ? 'Edit Data Santri' : 'Tambah Santri Baru'}</h2>
                        </div>
                    </div>
                    <div className="flex items-center space-x-3">
                        <button
                            type="button"
                            onClick={() => navigate('/santri')}
                            className="px-5 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="px-5 py-2 text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-lg shadow-emerald-600/20 transition-all flex items-center space-x-2 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? (
                                <Loader2 size={18} className="animate-spin" />
                            ) : (
                                <Save size={18} />
                            )}
                            <span>{isEditMode ? 'Simpan Perubahan' : 'Simpan Data Santri'}</span>
                        </button>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto p-6 lg:p-10">
                    <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                        {/* Left Column: Photo Upload */}
                        <div className="lg:col-span-4">
                            <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm text-center">
                                <h3 className="text-lg font-bold mb-6 flex items-center justify-center text-slate-800">
                                    <Camera className="text-emerald-600 mr-2" size={20} />
                                    Foto Profil
                                </h3>

                                <div
                                    className={`relative group cursor-pointer transition-all ${isDragging ? 'scale-105 ring-2 ring-emerald-500 ring-offset-2' : ''}`}
                                    onDrop={onDrop}
                                    onDragOver={onDragOver}
                                    onDragLeave={onDragLeave}
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <div className={`w-full aspect-square bg-slate-50 border-2 border-dashed ${isDragging ? 'border-emerald-500 bg-emerald-50' : 'border-slate-300'} rounded-2xl flex flex-col items-center justify-center transition-all group-hover:border-emerald-500 group-hover:bg-emerald-50/50 overflow-hidden relative`}>
                                        {photoPreview ? (
                                            <>
                                                <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <p className="text-white font-bold text-sm">Ganti Foto</p>
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4 text-slate-400 group-hover:text-emerald-500 transition-colors">
                                                    <User size={32} />
                                                </div>
                                                <div className="text-sm text-slate-500 px-4">
                                                    <span className="text-emerald-600 font-bold block mb-1">Klik untuk unggah</span>
                                                    atau seret foto kesini
                                                </div>
                                                <p className="text-xs text-slate-400 mt-2">PNG, JPG (Maks. 2MB)</p>
                                            </>
                                        )}
                                    </div>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={(e) => handleFileChange(e.target.files[0])}
                                    />
                                </div>

                                <div className="mt-8 space-y-4">
                                    <div className="flex items-start space-x-3 text-left bg-blue-50 p-4 rounded-xl border border-blue-100">
                                        <Info className="text-blue-600 shrink-0 mt-0.5" size={18} />
                                        <p className="text-xs text-blue-700 leading-relaxed font-medium">
                                            Gunakan foto formal dengan latar belakang polos untuk memudahkan identifikasi petugas perpustakaan.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right Column: Forms */}
                        <div className="lg:col-span-8 space-y-6">
                            {/* Identity Section */}
                            <section className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm">
                                <div className="flex items-center space-x-2 mb-6 text-emerald-600">
                                    <Badge size={24} />
                                    <h3 className="text-lg font-bold text-slate-800">Informasi Identitas</h3>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-slate-700 flex items-center">
                                            NIS <span className="text-rose-500 ml-1">*</span>
                                        </label>
                                        <input
                                            {...register('nis')}
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all placeholder:text-slate-400 font-medium"
                                            placeholder="Masukkan nomor induk santri"
                                        />
                                        {errors.nis && <p className="text-xs text-rose-500 font-medium">{errors.nis.message}</p>}
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-slate-700 flex items-center">
                                            Jenis Kelamin <span className="text-rose-500 ml-1">*</span>
                                        </label>
                                        <select
                                            {...register('jenis_kelamin')}
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all font-medium cursor-pointer"
                                        >
                                            <option value="">Pilih Jenis Kelamin</option>
                                            <option value="L">Laki-laki</option>
                                            <option value="P">Perempuan</option>
                                        </select>
                                        {errors.jenis_kelamin && <p className="text-xs text-rose-500 font-medium">{errors.jenis_kelamin.message}</p>}
                                    </div>
                                    <div className="md:col-span-2 space-y-2">
                                        <label className="text-sm font-bold text-slate-700 flex items-center">
                                            Nama Lengkap <span className="text-rose-500 ml-1">*</span>
                                        </label>
                                        <input
                                            {...register('nama_lengkap')}
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all placeholder:text-slate-400 font-medium"
                                            placeholder="Masukkan nama lengkap sesuai ijazah"
                                        />
                                        {errors.nama_lengkap && <p className="text-xs text-rose-500 font-medium">{errors.nama_lengkap.message}</p>}
                                    </div>
                                </div>
                            </section>

                            {/* Academic & Asrama Section */}
                            <section className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm">
                                <div className="flex items-center space-x-2 mb-6 text-emerald-600">
                                    <Building2 size={24} />
                                    <h3 className="text-lg font-bold text-slate-800">Informasi Akademik & Asrama</h3>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-slate-700">Kelas</label>
                                        <input
                                            {...register('kelas')}
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all placeholder:text-slate-400 font-medium"
                                            placeholder="Contoh: VII A"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-slate-700">Asrama <span className="text-rose-500 ml-1">*</span></label>
                                        <select
                                            {...register('asrama_id')}
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all font-medium cursor-pointer"
                                        >
                                            <option value="">Pilih Asrama</option>
                                            {asramas.map((asrama) => (
                                                <option key={asrama.id} value={asrama.id}>{asrama.nama_asrama}</option>
                                            ))}
                                        </select>
                                        {errors.asrama_id && <p className="text-xs text-rose-500 font-medium">{errors.asrama_id.message}</p>}
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-slate-700">Kamar <span className="text-rose-500 ml-1">*</span></label>
                                        <select
                                            {...register('kamar_id')}
                                            disabled={!watchAsrama}
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all font-medium cursor-pointer disabled:bg-slate-100 disabled:text-slate-400"
                                        >
                                            <option value="">Pilih Kamar</option>
                                            {kamars.map((kamar) => (
                                                <option key={kamar.id} value={kamar.id}>{kamar.nama_kamar}</option>
                                            ))}
                                        </select>
                                        {errors.kamar_id && <p className="text-xs text-rose-500 font-medium">{errors.kamar_id.message}</p>}
                                    </div>
                                    {isEditMode && (
                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-slate-700">Status</label>
                                            <select
                                                {...register('status')}
                                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all font-medium cursor-pointer"
                                            >
                                                <option value="active">Aktif</option>
                                                <option value="inactive">Non-Aktif</option>
                                                <option value="graduated">Lulus</option>
                                            </select>
                                        </div>
                                    )}
                                </div>
                            </section>

                            {/* Contact Section */}
                            <section className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm">
                                <div className="flex items-center space-x-2 mb-6 text-emerald-600">
                                    <Contact size={24} />
                                    <h3 className="text-lg font-bold text-slate-800">Informasi Kontak</h3>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-slate-700">Nama Orang Tua / Wali</label>
                                        <input
                                            {...register('nama_wali')}
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all placeholder:text-slate-400 font-medium"
                                            placeholder="Nama lengkap wali"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-slate-700">No. HP Wali</label>
                                        <div className="relative">
                                            <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-500 font-bold">+62</span>
                                            <input
                                                {...register('no_hp_wali')}
                                                className="w-full pl-14 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all placeholder:text-slate-400 font-medium"
                                                placeholder="8xxxxxxxxxx"
                                            />
                                        </div>
                                    </div>
                                    <div className="md:col-span-2 space-y-2">
                                        <label className="text-sm font-bold text-slate-700">Alamat Lengkap</label>
                                        <textarea
                                            {...register('alamat')}
                                            rows="3"
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all placeholder:text-slate-400 font-medium resize-none"
                                            placeholder="Masukkan alamat sesuai KTP/domisili"
                                        />
                                    </div>
                                </div>
                            </section>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
}
