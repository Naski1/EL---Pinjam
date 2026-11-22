import { useState, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';

import {
    Save as SaveIcon,
    ArrowLeft as ArrowLeftIcon,
    Image as ImageIconLucide,
    BookOpen as MenuBookIcon,
    Shapes as CategoryIcon,
    Package as InventoryIcon,
    Minus as RemoveIcon,
    Plus as AddIcon,
    Info as InfoIcon,
    DollarSign as DollarIcon // Using DollarSign or similar for Price
} from 'lucide-react';
import { bookAPI, categoryAPI } from '../api';

const API_Base_URL = 'http://localhost:8000'; // Hardcoded for preview, ideally from config

export default function AddBookPage() {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEditMode = Boolean(id);
    const fileInputRef = useRef(null);

    // State
    const [previewUrl, setPreviewUrl] = useState(null);
    const [coverFilename, setCoverFilename] = useState(null);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [stock, setStock] = useState(1);

    const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm({
        defaultValues: {
            status: 'available',
            total_stok: 1,
            harga: 0
        }
    });

    // Watch status for radio buttons
    const currentStatus = watch('status');

    // Fetch initial data (Categories & Book if edit)
    useEffect(() => {
        const initData = async () => {
            try {
                setFetching(true);
                // 1. Fetch Categories
                const catResponse = await categoryAPI.list();
                setCategories(catResponse.data.items || []);

                // 2. If Edit Mode, Fetch Book
                if (isEditMode) {
                    const bookResponse = await bookAPI.get(id);
                    const book = bookResponse.data;

                    // Populate form
                    reset({
                        judul: book.judul,
                        kode_buku: book.kode_buku,
                        isbn: book.isbn || '',
                        pengarang: book.pengarang || '',
                        penerbit: book.penerbit || '',
                        category_id: book.category_id || '',
                        tahun_terbit: book.tahun_terbit || '',
                        lokasi_rak: book.lokasi_rak || '',
                        harga: book.harga || 0,
                        status: book.status,
                    });

                    setStock(book.total_stok);
                    setCoverFilename(book.cover);
                    if (book.cover) {
                        setPreviewUrl(`${API_Base_URL}/uploads/${book.cover}`);
                    }
                }
            } catch (error) {
                console.error("Failed to load data", error);
                toast.error("Gagal memuat data");
                if (isEditMode) navigate('/buku');
            } finally {
                setFetching(false);
            }
        };
        initData();
    }, [id, isEditMode, navigate, reset]);

    // Handle stock changes
    const handleStockChange = (delta) => {
        const newStock = Math.max(0, stock + delta);
        setStock(newStock);
        setValue('total_stok', newStock);
    };

    const handleManualStockChange = (e) => {
        const val = parseInt(e.target.value);
        if (!isNaN(val) && val >= 0) {
            setStock(val);
            setValue('total_stok', val);
        } else if (e.target.value === '') {
            setStock(''); // Allow temporary empty string while typing
        }
    };

    // Handle file selection
    const handleFileSelect = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validation
        if (!file.type.startsWith('image/')) {
            toast.error('File harus berupa gambar');
            return;
        }
        if (file.size > 2 * 1024 * 1024) { // 2MB
            toast.error('Ukuran file maksimal 2MB');
            return;
        }

        // Preview
        const objectUrl = URL.createObjectURL(file);
        setPreviewUrl(objectUrl);

        // Upload
        const formData = new FormData();
        formData.append('file', file);

        try {
            setUploading(true);
            const response = await bookAPI.uploadCover(formData);
            setCoverFilename(response.data.filename);
            toast.success('Foto berhasil diupload');
        } catch (error) {
            console.error('Upload failed', error);
            toast.error('Gagal mengupload gambar');
            setPreviewUrl(null);
        } finally {
            setUploading(false);
        }
    };

    // Handle form submit
    const onSubmit = async (data) => {
        try {
            setLoading(true);
            const payload = {
                ...data,
                // Ensure number types
                tahun_terbit: data.tahun_terbit ? parseInt(data.tahun_terbit) : undefined,
                harga: data.harga ? parseInt(data.harga) : 0,
                total_stok: parseInt(stock) || 0,
                cover: coverFilename
            };

            if (isEditMode) {
                await bookAPI.update(id, payload);
                toast.success('Buku berhasil diperbarui!');
            } else {
                await bookAPI.create(payload);
                toast.success('Buku berhasil ditambahkan!');
            }
            navigate('/buku');
        } catch (error) {
            console.error('Save book failed', error);
            toast.error(error.response?.data?.detail || 'Gagal menyimpan buku');
        } finally {
            setLoading(false);
        }
    };

    if (fetching) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    return (
        <div className="flex-1 bg-gray-50/50 min-h-screen font-sans -mx-6 -mt-6 lg:-mx-10 lg:-mt-8 mb-6">
            {/* Header with negative margins to counteract dashboard padding */}
            <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/80 backdrop-blur-md">
                <div className="w-full px-6 lg:px-10 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/buku')}
                            className="p-2 rounded-full hover:bg-slate-100 transition-colors text-slate-500"
                        >
                            <ArrowLeftIcon size={24} />
                        </button>
                        <div>
                            <h1 className="text-xl font-bold tracking-tight text-slate-900">
                                {isEditMode ? 'Edit Data Buku' : 'Tambah Buku Baru'}
                            </h1>
                            <p className="text-sm text-slate-500 hidden sm:block">
                                {isEditMode ? 'Perbarui informasi buku yang sudah ada.' : 'Lengkapi data buku untuk menambah koleksi perpustakaan.'}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => navigate('/buku')}
                            className="px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition-all"
                        >
                            Kembali
                        </button>
                        <button
                            onClick={handleSubmit(onSubmit)}
                            disabled={loading || uploading}
                            className="px-6 py-2.5 text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 shadow-lg shadow-primary-600/20 rounded-lg transition-all flex items-center gap-2 disabled:opacity-50"
                        >
                            <SaveIcon size={20} />
                            {loading ? 'Menyimpan...' : 'Simpan Buku'}
                        </button>
                    </div>
                </div>
            </header>

            <main className="p-6 lg:p-10">
                <form onSubmit={handleSubmit(onSubmit)} className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Left Column - Image & Status */}
                    <div className="lg:col-span-4 space-y-6">
                        {/* Book Cover */}
                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">Sampul Buku</h3>
                            <div
                                className="relative group cursor-pointer"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <div className={`aspect-[3/4] w-full bg-slate-50 rounded-xl border-2 border-dashed ${previewUrl ? 'border-primary-500' : 'border-slate-300'} flex flex-col items-center justify-center p-6 text-center transition-all group-hover:border-primary-500/50 group-hover:bg-primary-50/5`}>
                                    {previewUrl ? (
                                        <img src={previewUrl} alt="Cover Preview" className="w-full h-full object-cover rounded-md" />
                                    ) : (
                                        <>
                                            <div className="w-16 h-16 bg-white rounded-full shadow-sm flex items-center justify-center mb-4 text-slate-400 group-hover:text-primary-600 transition-colors">
                                                <ImageIconLucide size={32} />
                                            </div>
                                            <p className="text-sm font-medium text-slate-700">Klik atau seret gambar ke sini</p>
                                            <p className="text-xs text-slate-400 mt-2">Format: JPG, PNG, WEBP (Maks. 2MB)</p>
                                        </>
                                    )}
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*"
                                        onChange={handleFileSelect}
                                        className="hidden"
                                    />
                                </div>
                                {uploading && (
                                    <div className="absolute inset-0 bg-white/50 flex items-center justify-center rounded-xl">
                                        <span className="text-sm font-bold text-primary-600">Uploading...</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Status */}
                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">Status Awal</h3>
                            <div className="space-y-3">
                                <label className={`flex items-center p-4 rounded-xl border cursor-pointer transition-all ${currentStatus === 'available' ? 'border-primary-600 bg-emerald-50/50 ring-1 ring-primary-600' : 'border-slate-200 hover:bg-slate-50'}`}>
                                    <input
                                        {...register('status')}
                                        type="radio"
                                        value="available"
                                        className="w-4 h-4 text-primary-600 focus:ring-primary-600 border-slate-300"
                                    />
                                    <div className="ml-3">
                                        <span className={`block text-sm font-semibold ${currentStatus === 'available' ? 'text-emerald-700' : 'text-slate-700'}`}>Tersedia</span>
                                        <span className={`block text-xs ${currentStatus === 'available' ? 'text-emerald-600/70' : 'text-slate-500'}`}>Buku dapat segera dipinjam</span>
                                    </div>
                                </label>
                                <label className={`flex items-center p-4 rounded-xl border cursor-pointer transition-all ${currentStatus === 'unavailable' ? 'border-amber-500 bg-amber-50/50 ring-1 ring-amber-500' : 'border-slate-200 hover:bg-slate-50'}`}>
                                    <input
                                        {...register('status')}
                                        type="radio"
                                        value="unavailable"
                                        className="w-4 h-4 text-amber-500 focus:ring-amber-500 border-slate-300"
                                    />
                                    <div className="ml-3">
                                        <span className={`block text-sm font-semibold ${currentStatus === 'unavailable' ? 'text-amber-700' : 'text-slate-700'}`}>Maintenance</span>
                                        <span className={`block text-xs ${currentStatus === 'unavailable' ? 'text-amber-600/70' : 'text-slate-500'}`}>Dalam perbaikan/sampul ulang</span>
                                    </div>
                                </label>
                                <label className={`flex items-center p-4 rounded-xl border cursor-pointer transition-all ${currentStatus === 'reference' ? 'border-blue-500 bg-blue-50/50 ring-1 ring-blue-500' : 'border-slate-200 hover:bg-slate-50'}`}>
                                    <input
                                        {...register('status')}
                                        type="radio"
                                        value="reference"
                                        className="w-4 h-4 text-blue-500 focus:ring-blue-500 border-slate-300"
                                    />
                                    <div className="ml-3">
                                        <span className={`block text-sm font-semibold ${currentStatus === 'reference' ? 'text-blue-700' : 'text-slate-700'}`}>Referensi Saja</span>
                                        <span className={`block text-xs ${currentStatus === 'reference' ? 'text-blue-600/70' : 'text-slate-500'}`}>Hanya untuk dibaca di tempat</span>
                                    </div>
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Form Data */}
                    <div className="lg:col-span-8 space-y-8">
                        {/* Basic Info */}
                        <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200">
                            <div className="flex items-center gap-3 mb-8">
                                <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center text-primary-600">
                                    <MenuBookIcon className="text-primary-600" size={24} />
                                </div>
                                <h2 className="text-lg font-bold text-slate-900">Informasi Dasar</h2>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">Judul Buku <span className="text-rose-500">*</span></label>
                                    <input
                                        {...register('judul', { required: 'Judul wajib diisi' })}
                                        className="w-full bg-slate-50 border-slate-200 rounded-xl focus:ring-primary-600 focus:border-primary-600 transition-all p-3"
                                        placeholder="Contoh: Ringkasan Shahih Bukhari"
                                        type="text"
                                    />
                                    {errors.judul && <p className="text-xs text-rose-500 mt-1">{errors.judul.message}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">Kode Buku <span className="text-rose-500">*</span></label>
                                    <input
                                        {...register('kode_buku', { required: 'Kode wajib diisi' })}
                                        className="w-full bg-slate-50 border-slate-200 rounded-xl focus:ring-primary-600 focus:border-primary-600 transition-all p-3"
                                        placeholder="BK-2024-001"
                                        type="text"
                                    />
                                    {errors.kode_buku && <p className="text-xs text-rose-500 mt-1">{errors.kode_buku.message}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">ISBN</label>
                                    <input
                                        {...register('isbn')}
                                        className="w-full bg-slate-50 border-slate-200 rounded-xl focus:ring-primary-600 focus:border-primary-600 transition-all p-3"
                                        placeholder="978-602-..."
                                        type="text"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">Pengarang</label>
                                    <input
                                        {...register('pengarang')}
                                        className="w-full bg-slate-50 border-slate-200 rounded-xl focus:ring-primary-600 focus:border-primary-600 transition-all p-3"
                                        placeholder="Nama penulis..."
                                        type="text"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">Penerbit</label>
                                    <input
                                        {...register('penerbit')}
                                        className="w-full bg-slate-50 border-slate-200 rounded-xl focus:ring-primary-600 focus:border-primary-600 transition-all p-3"
                                        placeholder="Nama penerbit..."
                                        type="text"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Classification */}
                        <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200">
                            <div className="flex items-center gap-3 mb-8">
                                <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center text-amber-600">
                                    <CategoryIcon className="text-amber-600" size={24} />
                                </div>
                                <h2 className="text-lg font-bold text-slate-900">Detail Klasifikasi</h2>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">Kategori</label>
                                    <select
                                        {...register('category_id')}
                                        className="w-full bg-slate-50 border-slate-200 rounded-xl focus:ring-primary-600 focus:border-primary-600 transition-all p-3"
                                    >
                                        <option value="">Pilih Kategori</option>
                                        {categories.map(cat => (
                                            <option key={cat.id} value={cat.id}>{cat.nama_kategori}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">Tahun Terbit</label>
                                    <input
                                        {...register('tahun_terbit')}
                                        className="w-full bg-slate-50 border-slate-200 rounded-xl focus:ring-primary-600 focus:border-primary-600 transition-all p-3"
                                        placeholder="2024"
                                        type="number"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">Lokasi Rak</label>
                                    <input
                                        {...register('lokasi_rak')}
                                        className="w-full bg-slate-50 border-slate-200 rounded-xl focus:ring-primary-600 focus:border-primary-600 transition-all p-3"
                                        placeholder="A-01-04"
                                        type="text"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Stock & Price Management */}
                        <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200">
                            <div className="flex items-center gap-3 mb-8">
                                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
                                    <InventoryIcon className="text-blue-600" size={24} />
                                </div>
                                <h2 className="text-lg font-bold text-slate-900">Manajemen Stok & Harga</h2>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="max-w-xs">
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">Jumlah Stok Tersedia</label>
                                    <div className="flex items-center">
                                        <button
                                            type="button"
                                            onClick={() => handleStockChange(-1)}
                                            className="w-12 h-12 flex items-center justify-center bg-slate-100 border border-r-0 border-slate-200 rounded-l-xl hover:bg-slate-200 transition-colors"
                                        >
                                            <RemoveIcon size={20} />
                                        </button>
                                        <input
                                            type="number"
                                            value={stock}
                                            onChange={handleManualStockChange}
                                            className="w-full h-12 text-center bg-white border-slate-200 focus:ring-0 focus:border-slate-200 text-lg font-bold"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => handleStockChange(1)}
                                            className="w-12 h-12 flex items-center justify-center bg-slate-100 border border-l-0 border-slate-200 rounded-r-xl hover:bg-slate-200 transition-colors"
                                        >
                                            <AddIcon size={20} />
                                        </button>
                                    </div>
                                    <p className="text-xs text-slate-500 mt-3 flex items-center gap-1">
                                        <InfoIcon size={14} />
                                        Stok akan ditambahkan ke database pusat.
                                    </p>
                                </div>

                                <div className="max-w-xs">
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">Harga Buku</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <span className="text-slate-500 font-semibold">Rp</span>
                                        </div>
                                        <input
                                            {...register('harga')}
                                            className="w-full pl-10 h-12 bg-slate-50 border-slate-200 rounded-xl focus:ring-primary-600 focus:border-primary-600 transition-all font-semibold"
                                            placeholder="0"
                                            type="number"
                                        />
                                    </div>
                                    <p className="text-xs text-slate-500 mt-3 flex items-center gap-1">
                                        <InfoIcon size={14} />
                                        Digunakan untuk denda ganti rugi.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </form>
            </main>
        </div>
    );
}
