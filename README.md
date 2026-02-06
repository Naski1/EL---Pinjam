# 📚 EL - Pinjam: Perencanaan Website Peminjaman Buku - Versi Pesantren

## Ringkasan Proyek

| Aspek | Detail |
|-------|--------|
| **Nama Proyek** | EL - Pinjam |
| **Jenis** | Sistem Peminjaman Buku Perpustakaan Pesantren |
| **Lokasi Penggunaan** | Pesantren / Pondok Pesantren |
| **Target Pengguna** | Petugas Perpustakaan Pesantren |
| **Peminjam** | Santri (dengan data Asrama & Kamar) |

---

## 🎯 Karakteristik Khusus Pesantren

### Konteks Operasional
1. **Santri tidak memiliki HP** → Tidak ada self-service, semua proses dikelola petugas
2. **Santri tinggal di asrama** → Perlu tracking lokasi (Asrama & Kamar)
3. **Struktur organisasi pesantren** → Perlu data Asrama sebagai unit tempat tinggal
4. **Petugas perpustakaan sebagai operator utama** → Semua transaksi melalui petugas
5. **Kemungkinan denda** → Sistem denda tetap berjalan, dikelola petugas

### Perubahan Signifikan dari Versi Umum
- ❌ Tidak ada registrasi mandiri santri
- ❌ Tidak ada login untuk santri
- ❌ Tidak ada notifikasi ke santri (email/SMS/push)
- ❌ Tidak ada self-service peminjaman
- ✅ Semua proses melalui petugas perpustakaan
- ✅ Tracking lokasi santri (Asrama & Kamar)
- ✅ Manajemen data Asrama dan Kamar
- ✅ Sistem pencarian santri berdasarkan asrama/kamar

---

## 👥 Analisis Pengguna (User Persona)

### 1. Petugas Perpustakaan (Operator Utama)
**Peran:**
- Menginput data peminjaman santri
- Menginput data pengembalian
- Mencatat perpanjangan peminjaman
- Mengelola data santri, buku, dan perpustakaan
- Memproses pembayaran denda
- Mencetak laporan

**Kebutuhan:**
- Interface yang cepat dan efisien (banyak transaksi per hari)
- Pencarian santri yang mudah (berdasarkan nama/NIK/asrama/kamar)
- Proses peminjaman yang singkat (maksimal 2 menit per transaksi)
- Alert untuk buku yang jatuh tempo
- Laporan harian/mingguan/bulanan

### 2. Administrator (Pengelola Sistem)
**Peran:**
- Mengelola data master (Asrama, Kamar, Kategori Buku)
- Mengelola akun petugas perpustakaan
- Konfigurasi sistem (durasi pinjam, denda, dll)
- Backup dan restore data
- Melihat laporan keseluruhan

**Kebutuhan:**
- Dashboard ringkasan keseluruhan
- Manajemen user petugas
- Konfigurasi sistem yang fleksibel
- Export data untuk kebutuhan laporan ke pengasuh/kyai

### 3. Pengasuh/Kyai (Viewer/Report Only)
**Peran:**
- Melihat laporan perpustakaan
- Monitoring aktivitas santri
- Tidak melakukan transaksi

**Kebutuhan:**
- Akses view-only ke laporan
- Dashboard statistik sederhana
- Export laporan

---

## 🚀 Fitur Utama (Core Features)

### A. Manajemen Data Master

#### 1. Manajemen Asrama
- [x] Tambah/edit/hapus data Asrama
- [x] Kode Asrama (unik)
- [x] Nama Asrama
- [x] Kapasitas santri
- [x] Penanggung jawab asrama (ustadz/ustadzah)
- [x] Status (aktif/non-aktif)

#### 2. Manajemen Kamar
- [x] Tambah/edit/hapus data Kamar
- [x] Kode Kamar (unik per asrama)
- [x] FK ke Asrama
- [x] Nomor/Nama Kamar
- [x] Kapasitas tempat tidur
- [x] Jumlah penghuni saat ini
- [x] Status (penuh/tersedia)

#### 3. Manajemen Santri
- [x] Tambah/edit/hapus data Santri
- [x] NIS (Nomor Induk Santri) - unik
- [x] Nama Lengkap
- [x] Jenis Kelamin
- [x] FK ke Asrama
- [x] FK ke Kamar
- [x] Tanggal Masuk Pesantren
- [x] Nama Orang Tua/Wali
- [x] Nomor HP Wali (untuk kontak darurat)
- [x] Foto Santri (opsional)
- [x] Status (aktif/alumni/keluar)
- [x] Upload data massal via Excel/CSV

#### 4. Manajemen Buku
- [x] Tambah/edit/hapus data Buku
- [x] Kode Buku (unik)
- [x] ISBN
- [x] Judul Buku
- [x] Penulis
- [x] Penerbit
- [x] Tahun Terbit
- [x] Kategori/Genre
- [x] Lokasi Rak
- [x] Jumlah Stok
- [x] Stok Tersedia
- [x] Cover Buku (gambar)
- [x] Upload massal via Excel/CSV
- [x] Generate barcode/label

#### 5. Manajemen Kategori Buku
- [x] Tambah/edit/hapus kategori
- [x] Kode Kategori
- [x] Nama Kategori
- [x] Deskripsi

---

### B. Proses Peminjaman (Dikelola Petugas)

#### 1. Form Peminjaman Baru
- [x] Pencarian santri (by NIS/nama/asrama/kamar)
- [x] Auto-fill data santri setelah dipilih
- [x] Scan barcode buku atau pencarian manual
- [x] Multiple buku dalam satu peminjaman
- [x] Auto-set tanggal pinjam (hari ini)
- [x] Auto-set tanggal kembali (sesuai konfigurasi)
- [x] Cek stok tersedia real-time
- [x] Cek batas maksimal peminjaman per santri
- [x] Konfirmasi sebelum submit
- [x] Cetak bukti peminjaman (struk/kartu)

#### 2. Batasan Peminjaman (Konfigurasi)
- [x] Maksimal jumlah buku per santri (default: 2-3 buku)
- [x] Durasi peminjaman (default: 7-14 hari)
- [x] Tidak bisa pinjam jika ada denda yang belum lunas
- [x] Tidak bisa pinjam jika masih ada buku overdue

---

### C. Proses Pengembalian (Dikelola Petugas)

#### 1. Form Pengembalian
- [x] Pencarian peminjaman aktif (by NIS santri/nama)
- [x] Tampilkan semua buku yang dipinjam santri
- [x] Checkbox untuk pilih buku yang dikembalikan
- [x] Auto-kalkulasi denda jika terlambat
- [x] Input kondisi buku saat dikembalikan (baik/rusak/hilang)
- [x] Catatan kerusakan (jika ada)
- [x] Proses pembayaran denda (tunai/non-tunai)
- [x] Cetak bukti pengembalian

#### 2. Perhitungan Denda
- [x] Denda per hari keterlambatan (konfigurasi)
- [x] Denda khusus untuk buku hilang (harga buku + denda admin)
- [x] Denda kerusakan (sesuai tingkat kerusakan)
- [x] Riwayat pembayaran denda

---

### D. Perpanjangan Peminjaman

#### 1. Form Perpanjangan
- [x] Pencarian peminjaman aktif
- [x] Cek eligibility (tidak ada antrian, tidak overdue)
- [x] Update tanggal jatuh tempo baru
- [x] Batas maksimal perpanjangan (konfigurasi)
- [x] Riwayat perpanjangan

---

### E. Dashboard & Monitoring

#### 1. Dashboard Petugas
- [x] Statistik hari ini:
  - Total peminjaman hari ini
  - Total pengembalian hari ini
  - Total denda terkumpul hari ini
- [x] Alert penting:
  - Buku yang harus dikembalikan hari ini
  - Buku yang overdue (terlambat)
  - Santri dengan denda belum lunas
- [x] Peminjaman aktif (real-time)
- [x] Buku populer (minggu ini/bulan ini)
- [x] Santri aktif meminjam

#### 2. Pencarian & Tracking
- [x] Pencarian santri (by NIS, nama, asrama, kamar)
- [x] Pencarian buku (by kode, judul, penulis, kategori)
- [x] Pencarian peminjaman aktif
- [x] Filter berdasarkan asrama/kamar

---

### F. Laporan

#### 1. Laporan Peminjaman
- [x] Laporan harian (per tanggal)
- [x] Laporan periode (tanggal mulai - selesai)
- [x] Laporan per asrama
- [x] Laporan per santri
- [x] Laporan per kategori buku
- [x] Export Excel/PDF

#### 2. Laporan Pengembalian
- [x] Laporan pengembalian tepat waktu
- [x] Laporan pengembalian terlambat
- [x] Laporan denda terkumpul

#### 3. Laporan Stok Buku
- [x] Daftar seluruh buku
- [x] Buku yang sering dipinjam
- [x] Buku yang jarang dipinjam
- [x] Buku yang hilang/rusak

#### 4. Laporan Santri
- [x] Daftar seluruh santri per asrama
- [x] Santri aktif meminjam
- [x] Santri dengan denda
- [x] Santri yang belum pernah meminjam

---

### G. Pengaturan Sistem

- [x] Durasi peminjaman default
- [x] Maksimal buku per santri
- [x] Maksimal perpanjangan
- [x] Nominal denda per hari
- [x] Template struk/cetakan
- [x] Backup database
- [x] Manajemen akun petugas

---

## 🗄️ Struktur Database (Versi Pesantren)

### Entity Relationship Diagram (ERD)

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│     asramas     │     │     kamars      │     │     santris     │
├─────────────────┤     ├─────────────────┤     ├─────────────────┤
│ PK asrama_id    │◄────┤ PK kamar_id     │◄────┤ PK santri_id    │
│    kode_asrama  │     │ FK asrama_id    │     │    nis          │
│    nama_asrama  │     │    kode_kamar   │     │    nama_lengkap │
│    kapasitas    │     │    nama_kamar   │     │    jenis_kelamin│
│    penanggung_jawab│   kapasitas       │     │ FK kamar_id     │
│    status       │     │    jumlah_penghuni│   FK asrama_id    │
│    created_at   │     │    status       │     │    tgl_masuk    │
└─────────────────┘     │    created_at   │     │    nama_wali    │
                        └─────────────────┘     │    no_hp_wali   │
                                                │    foto         │
                                                │    status       │
                                                │    created_at   │
                                                └────────┬────────┘
                                                         │
                                                         │
┌─────────────────┐     ┌─────────────────┐              │
│   categories    │     │     books       │              │
├─────────────────┤     ├─────────────────┤              │
│ PK category_id  │◄────┤ PK book_id      │              │
│    kode_kategori│     │    kode_buku    │              │
│    nama_kategori│     │    isbn         │              │
│    deskripsi    │     │    judul        │              │
└─────────────────┘     │    penulis      │              │
                        │    penerbit     │              │
                        │    tahun_terbit │              │
                        │ FK category_id  │              │
                        │    lokasi_rak   │              │
                        │    total_stok   │              │
                        │    stok_tersedia│              │
                        │    cover        │              │
                        │    created_at   │              │
                        └────────┬────────┘              │
                                 │                       │
                                 │              ┌────────┘
                                 │              │
                        ┌────────▼────────┐     │
                        │   borrowings    │◄────┘
                        ├─────────────────┤
                        │ PK borrow_id    │
                        │ FK santri_id    │
                        │ FK book_id      │
                        │    borrow_date  │
                        │    due_date     │
                        │    return_date  │
                        │    status       │
                        │    fine_amount  │
                        │    fine_paid    │
                        │    condition    │
                        │    notes        │
                        │ FK petugas_id   │
                        │    created_at   │
                        └─────────────────┘

┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  fine_payments  │     │    petugas      │     │    settings     │
├─────────────────┤     ├─────────────────┤     ├─────────────────┤
│ PK payment_id   │     │ PK petugas_id   │     │ PK setting_id   │
│ FK borrow_id    │     │    username     │     │    key          │
│    amount       │     │    password     │     │    value        │
│    payment_date │     │    nama_lengkap │     │    description  │
│    payment_type │     │    role         │     └─────────────────┘
│ FK petugas_id   │     │    status       │
│    created_at   │     │    created_at   │
└─────────────────┘     └─────────────────┘

┌─────────────────┐
│   renewals      │
├─────────────────┤
│ PK renewal_id   │
│ FK borrow_id    │
│    old_due_date │
│    new_due_date │
│ FK petugas_id   │
│    created_at   │
└─────────────────┘
```

### Detail Tabel

#### 1. asramas
| Field | Type | Deskripsi |
|-------|------|-----------|
| asrama_id | UUID | Primary key |
| kode_asrama | VARCHAR(10) | Kode unik asrama (contoh: ASR01) |
| nama_asrama | VARCHAR(100) | Nama asrama (contoh: Asrama Putra A) |
| kapasitas | INT | Kapasitas maksimal santri |
| penanggung_jawab | VARCHAR(100) | Nama ustadz/ustadzah penanggung jawab |
| status | ENUM | active, inactive |
| created_at | TIMESTAMP | Waktu pembuatan |

#### 2. kamars
| Field | Type | Deskripsi |
|-------|------|-----------|
| kamar_id | UUID | Primary key |
| asrama_id | UUID | FK ke asramas |
| kode_kamar | VARCHAR(10) | Kode kamar (contoh: K001) |
| nama_kamar | VARCHAR(50) | Nama kamar (contoh: Kamar 1) |
| kapasitas | INT | Kapasitas tempat tidur |
| jumlah_penghuni | INT | Jumlah santri saat ini |
| status | ENUM | available, full |
| created_at | TIMESTAMP | Waktu pembuatan |

#### 3. santris
| Field | Type | Deskripsi |
|-------|------|-----------|
| santri_id | UUID | Primary key |
| nis | VARCHAR(20) | Nomor Induk Santri (unik) |
| nama_lengkap | VARCHAR(100) | Nama lengkap santri |
| jenis_kelamin | ENUM | Laki-laki, Perempuan |
| kamar_id | UUID | FK ke kamars |
| asrama_id | UUID | FK ke asramas (redundant untuk query cepat) |
| tanggal_masuk | DATE | Tanggal masuk pesantren |
| nama_wali | VARCHAR(100) | Nama orang tua/wali |
| no_hp_wali | VARCHAR(20) | Nomor HP wali |
| foto | VARCHAR(255) | URL foto santri |
| status | ENUM | active, alumni, keluar |
| created_at | TIMESTAMP | Waktu pembuatan |
| updated_at | TIMESTAMP | Waktu update terakhir |

#### 4. books
| Field | Type | Deskripsi |
|-------|------|-----------|
| book_id | UUID | Primary key |
| kode_buku | VARCHAR(20) | Kode unik buku perpustakaan |
| isbn | VARCHAR(20) | Nomor ISBN |
| judul | VARCHAR(255) | Judul buku |
| penulis | VARCHAR(255) | Nama penulis |
| penerbit | VARCHAR(100) | Nama penerbit |
| tahun_terbit | INT | Tahun terbit |
| category_id | UUID | FK ke categories |
| lokasi_rak | VARCHAR(50) | Lokasi penyimpanan |
| total_stok | INT | Total jumlah buku |
| stok_tersedia | INT | Stok yang tersedia dipinjam |
| cover | VARCHAR(255) | URL gambar cover |
| status | ENUM | available, damaged, lost |
| created_at | TIMESTAMP | Waktu pembuatan |

#### 5. categories
| Field | Type | Deskripsi |
|-------|------|-----------|
| category_id | UUID | Primary key |
| kode_kategori | VARCHAR(10) | Kode kategori |
| nama_kategori | VARCHAR(100) | Nama kategori (Fiksi, Agama, dll) |
| deskripsi | TEXT | Deskripsi kategori |

#### 6. borrowings
| Field | Type | Deskripsi |
|-------|------|-----------|
| borrow_id | UUID | Primary key |
| santri_id | UUID | FK ke santris |
| book_id | UUID | FK ke books |
| borrow_date | DATE | Tanggal peminjaman |
| due_date | DATE | Tanggal jatuh tempo |
| return_date | DATE | Tanggal pengembalian (null jika belum) |
| status | ENUM | borrowed, returned, overdue, lost |
| fine_amount | DECIMAL | Jumlah denda |
| fine_paid | BOOLEAN | Status pembayaran denda |
| condition_return | ENUM | good, damaged, lost |
| notes | TEXT | Catatan |
| petugas_id | UUID | FK ke petugas (yang memproses) |
| created_at | TIMESTAMP | Waktu pembuatan |

#### 7. petugas
| Field | Type | Deskripsi |
|-------|------|-----------|
| petugas_id | UUID | Primary key |
| username | VARCHAR(50) | Username login (unik) |
| password | VARCHAR(255) | Hash password |
| nama_lengkap | VARCHAR(100) | Nama lengkap petugas |
| role | ENUM | admin, petugas |
| status | ENUM | active, inactive |
| last_login | TIMESTAMP | Login terakhir |
| created_at | TIMESTAMP | Waktu pembuatan |

#### 8. fine_payments
| Field | Type | Deskripsi |
|-------|------|-----------|
| payment_id | UUID | Primary key |
| borrow_id | UUID | FK ke borrowings |
| amount | DECIMAL | Jumlah yang dibayar |
| payment_date | TIMESTAMP | Waktu pembayaran |
| payment_type | ENUM | cash, transfer |
| petugas_id | UUID | FK ke petugas (yang menerima) |
| created_at | TIMESTAMP | Waktu pembuatan |

#### 9. renewals
| Field | Type | Deskripsi |
|-------|------|-----------|
| renewal_id | UUID | Primary key |
| borrow_id | UUID | FK ke borrowings |
| old_due_date | DATE | Tanggal jatuh tempo lama |
| new_due_date | DATE | Tanggal jatuh tempo baru |
| petugas_id | UUID | FK ke petugas |
| created_at | TIMESTAMP | Waktu perpanjangan |

#### 10. settings
| Field | Type | Deskripsi |
|-------|------|-----------|
| setting_id | UUID | Primary key |
| key | VARCHAR(50) | Nama setting |
| value | TEXT | Nilai setting |
| description | TEXT | Deskripsi |

**Contoh Settings:**
- `durasi_pinjam`: 7 (hari)
- `maksimal_buku`: 3 (buku)
- `maksimal_perpanjangan`: 2 (kali)
- `denda_per_hari`: 1000 (rupiah)
- `denda_hilang_multiplier`: 2 (x harga buku)

---

## 🎨 Desain UI/UX (Versi Pesantren)

### Design System

#### Color Palette
```
Primary:    #059669 (Hijau - Islami, Tenang)
Secondary:  #0D9488 (Teal - Professional)
Accent:     #F59E0B (Amber - Warning, Due Soon)
Danger:     #DC2626 (Merah - Overdue, Error)
Success:    #16A34A (Hijau Muda - Success)
Neutral:    #6B7280 (Abu-abu - Text)
Background: #F0FDF4 (Hijau sangat muda)
Surface:    #FFFFFF (Putih - Cards)
```

#### Typography
```
Heading:    Inter (Modern, Clean)
Body:       Inter (Readable)
Arabic:     Scheherazade New (Untuk teks Arab)
```

### Wireframe Halaman Utama

#### 1. Dashboard Petugas (Halaman Utama)
```
┌─────────────────────────────────────────────────────────┐
│  [Logo EL-Pinjam]                    [👤 Petugas] [🚪] │
├─────────────────────────────────────────────────────────┤
│  [Sidebar]                    │                         │
│                               │  📊 Dashboard Hari Ini  │
│  📊 Dashboard                 │  ┌─────┐ ┌─────┐ ┌─────┐│
│  📋 Peminjaman Baru           │  │  15 │ │  12 │ │ 25K ││
│  📥 Pengembalian              │  │Pinjam│ │Kembali│ │Denda││
│  🔄 Perpanjangan              │  └─────┘ └─────┘ └─────┘│
│  👤 Data Santri               │                         │
│  📚 Data Buku                 │  ⚠️ Alert Hari Ini      │
│  🏠 Data Asrama               │  ┌─────────────────────┐│
│  📊 Laporan                   │  │ 5 Buku Jatuh Tempo  ││
│  ⚙️ Pengaturan                │  │ 3 Buku Overdue      ││
│                               │  │ 8 Santri Berdenda   ││
│                               │  └─────────────────────┘│
│                               │                         │
│                               │  🔍 Pencarian Cepat     │
│                               │  [Cari NIS/Nama Santri] │
│                               │                         │
│                               │  📚 Peminjaman Aktif    │
│                               │  ┌─────────────────────┐│
│                               │  │ NIS: 2024001        ││
│                               │  │ Ahmad Fauzi         ││
│                               │  │ Asrama: Putra A     ││
│                               │  │ Kamar: K-05         ││
│                               │  │ Buku: 2 buku        ││
│                               │  │ Jatuh Tempo: 3 hari ││
│                               │  └─────────────────────┘│
└─────────────────────────────────────────────────────────┘
```

#### 2. Form Peminjaman Baru
```
┌─────────────────────────────────────────────────────────┐
│  📋 Peminjaman Baru                                     │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  🔍 Cari Santri                                         │
│  [Masukkan NIS atau Nama Santri...              ] [Cari]│
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │ Hasil Pencarian:                                 │   │
│  │ ┌─────────────────────────────────────────────┐ │   │
│  │ │ NIS: 2024001                                │ │   │
│  │ │ Nama: Ahmad Fauzi                           │ │   │
│  │ │ Asrama: Putra A                             │ │   │
│  │ │ Kamar: K-05                                 │ │   │
│  │ │ Status: Aktif                               │ │   │
│  │ │ [✓ Pilih Santri Ini]                        │ │   │
│  │ └─────────────────────────────────────────────┘ │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  📚 Daftar Buku yang Dipinjam:                          │
│  ┌─────────────────────────────────────────────────┐   │
│  │ #  Kode Buku  Judul                    Aksi     │   │
│  │ 1  BKU001     Filosofi Teras          [Hapus]   │   │
│  │ 2  BKU045     Atomic Habits           [Hapus]   │   │
│  │                                                 │   │
│  │ [+ Tambah Buku Lain]                            │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  📅 Tanggal Pinjam: 06 Feb 2025 (Hari Ini)             │
│  📅 Jatuh Tempo:    13 Feb 2025 (7 hari)               │
│                                                         │
│  [Batal]                              [✓ Proses Pinjam] │
└─────────────────────────────────────────────────────────┘
```

#### 3. Form Pengembalian
```
┌─────────────────────────────────────────────────────────┐
│  📥 Pengembalian Buku                                   │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  🔍 Cari Santri / Scan Barcode                          │
│  [Masukkan NIS atau scan barcode...             ] [Cari]│
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │ Data Santri: Ahmad Fauzi (NIS: 2024001)         │   │
│  │ Asrama: Putra A | Kamar: K-05                   │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  📚 Buku yang Sedang Dipinjam:                          │
│  ┌─────────────────────────────────────────────────┐   │
│  │ ☑  Kode    Judul           Jatuh Tempo  Denda   │   │
│  │ ☑  BKU001  Filosofi Teras  13 Feb 2025  -       │   │
│  │ ☐  BKU045  Atomic Habits   10 Feb 2025  Rp3.000 │   │
│  │                                                 │   │
│  │ Total Denda: Rp3.000                            │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  💰 Pembayaran Denda:                                   │
│  [✓ Tunai] [  Transfer  ]                              │
│                                                         │
│  📝 Kondisi Buku: [Baik  ▼]                            │
│  Catatan: [                                    ]        │
│                                                         │
│  [Batal]                           [✓ Proses Kembali]   │
└─────────────────────────────────────────────────────────┘
```

#### 4. Data Santri (List View)
```
┌─────────────────────────────────────────────────────────┐
│  👤 Data Santri                              [+ Tambah] │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Filter: [Semua Asrama ▼] [Semua Kamar ▼] [Aktif ▼]    │
│                                                         │
│  🔍 Cari: [NIS, Nama, atau Kamar...             ]      │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │ NIS      Nama           Asrama    Kamar  Status │   │
│  │ ─────────────────────────────────────────────── │   │
│  │ 2024001  Ahmad Fauzi    Putra A   K-05   Aktif  │   │
│  │ 2024002  Budi Santoso   Putra A   K-05   Aktif  │   │
│  │ 2024003  Candra Wijaya  Putra B   K-12   Aktif  │   │
│  │ 2024004  Dedi Pratama   Putra B   K-12   Aktif  │   │
│  │ ...                                             │   │
│  │                                                 │   │
│  │ [< Prev] [1 2 3 4 5] [Next >]                   │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  📊 Ringkasan: Total: 250 santri | Putra: 150 | Putri: 100│
└─────────────────────────────────────────────────────────┘
```

#### 5. Laporan Peminjaman
```
┌─────────────────────────────────────────────────────────┐
│  📊 Laporan Peminjaman                       [Export ▼] │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Periode: [01/02/2025] s/d [06/02/2025]    [Tampilkan] │
│                                                         │
│  Filter: [Semua Asrama ▼] [Semua Status ▼]             │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │ Tanggal    NIS      Nama         Buku   Status  │   │
│  │ ─────────────────────────────────────────────── │   │
│  │ 06/02/2025 2024001  Ahmad Fauzi  2 buku Dipinjam│   │
│  │ 06/02/2025 2024002  Budi Santoso 1 buku Dipinjam│   │
│  │ 05/02/2025 2024003  Candra Wijaya 3 buku Kembali│   │
│  │ ...                                             │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  📈 Statistik Periode Ini:                              │
│  Total Peminjaman: 45 | Total Pengembalian: 38 | Denda: Rp125.000│
└─────────────────────────────────────────────────────────┘
```

---

## 📋 User Flow (Operasional Petugas)

### Flow Peminjaman Baru
```
┌─────────────┐
│   Login     │
│   Petugas   │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Dashboard │
└──────┬──────┘
       │
       ├──► Klik "Peminjaman Baru"
       │
       ▼
┌─────────────┐
│  Cari Santri│◄──── Input NIS/Nama
│  (Pilih)    │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Scan/Input │◄──── Scan barcode buku
│  Kode Buku  │      atau cari manual
└──────┬──────┘
       │
       ├──► Tambah buku lagi? ──► Ya ──► Scan buku lagi
       │                           Tidak
       ▼                           ▼
┌─────────────┐            ┌─────────────┐
│  Konfirmasi │            │  Konfirmasi │
│  Peminjaman │            │  Peminjaman │
└──────┬──────┘            └──────┬──────┘
       │                          │
       ▼                          ▼
┌─────────────┐            ┌─────────────┐
│  Cetak      │            │  Simpan ke  │
│  Struk      │            │  Database   │
└─────────────┘            └─────────────┘
```

### Flow Pengembalian
```
┌─────────────┐
│   Login     │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Klik      │
│  Pengembalian│
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Cari Santri│◄──── Input NIS/Scan
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Tampilkan  │
│  Buku Aktif │
└──────┬──────┘
       │
       ├──► Pilih buku yang dikembalikan (checkbox)
       │
       ▼
┌─────────────┐
│  Auto-cek   │
│  Keterlambatan│
└──────┬──────┘
       │
       ├──► Ada denda? ──► Ya ──► Input pembayaran
       │                    Tidak
       ▼                    ▼
┌─────────────┐      ┌─────────────┐
│  Proses     │      │  Proses     │
│  Kembali    │      │  Kembali    │
└──────┬──────┘      └──────┬──────┘
       │                    │
       ▼                    ▼
┌─────────────┐      ┌─────────────┐
│  Cetak      │      │  Cetak      │
│  Bukti      │      │  Bukti      │
└─────────────┘      └─────────────┘
```

---

## 🛠️ Tech Stack (Versi Pesantren)

### Frontend
| Komponen | Teknologi | Alasan |
|----------|-----------|--------|
| Framework | React.js | Interactive, Single Page App |
| Styling | Tailwind CSS | Cepat, utility-first |
| UI Components | shadcn/ui | Modern, accessible |
| State Management | Zustand | Simple, lightweight |
| Icons | Lucide React | Clean, modern |
| Forms | React Hook Form | Performance, validation |
| Tables | TanStack Table | Powerful data tables |
| Export | xlsx, jspdf | Export Excel & PDF |

### Backend
| Komponen | Teknologi | Alasan |
|----------|-----------|--------|
| Runtime | Node.js | JavaScript ecosystem |
| Framework | Express.js | Simple, proven |
| Database | PostgreSQL | Reliable, relational |
| ORM | Prisma | Type-safe, migrations |
| Auth | JWT + bcrypt | Secure, stateless |
| Barcode | bwip-js | Generate barcode |
| Export | node-xlsx, puppeteer | Server-side export |

### Infrastructure
| Komponen | Teknologi |
|----------|-----------|
| Hosting | VPS (DigitalOcean/AWS) |
| Database | PostgreSQL di VPS |
| Backup | Cron job + cloud storage |
| Printer | Thermal printer support |
| Barcode Scanner | USB barcode scanner |

---

## 📅 Timeline Pengembangan (Versi Pesantren)

### Fase 1: Foundation (Minggu 1-2)
**Minggu 1: Setup & Data Master**
- [ ] Setup project & database
- [ ] Autentikasi petugas
- [ ] CRUD Asrama
- [ ] CRUD Kamar
- [ ] CRUD Kategori Buku

**Minggu 2: Data Santri & Buku**
- [ ] CRUD Santri (dengan upload massal)
- [ ] CRUD Buku (dengan upload massal)
- [ ] Generate barcode buku
- [ ] Pencarian santri & buku

**Deliverable:** Data master lengkap bisa dikelola

---

### Fase 2: Core Transaction (Minggu 3-4)
**Minggu 3: Peminjaman System**
- [ ] Form peminjaman baru
- [ ] Scan barcode integration
- [ ] Multiple buku per peminjaman
- [ ] Cetak struk peminjaman
- [ ] Validasi batas peminjaman

**Minggu 4: Pengembalian & Denda**
- [ ] Form pengembalian
- [ ] Auto-kalkulasi denda
- [ ] Pembayaran denda
- [ ] Cetak bukti pengembalian
- [ ] Form perpanjangan

**Deliverable:** Sistem peminjaman & pengembalian berfungsi

---

### Fase 3: Dashboard & Laporan (Minggu 5-6)
**Minggu 5: Dashboard & Monitoring**
- [ ] Dashboard petugas
- [ ] Alert jatuh tempo & overdue
- [ ] Peminjaman aktif real-time
- [ ] Pencarian & filter advanced

**Minggu 6: Laporan**
- [ ] Laporan peminjaman
- [ ] Laporan pengembalian
- [ ] Laporan denda
- [ ] Laporan per asrama
- [ ] Export Excel/PDF

**Deliverable:** Laporan lengkap bisa di-generate

---

### Fase 4: Polish & Deploy (Minggu 7)
**Minggu 7: Testing & Deployment**
- [ ] Testing seluruh fitur
- [ ] Optimasi performance
- [ ] Training petugas
- [ ] Deployment production
- [ ] Dokumentasi user manual

**Deliverable:** Sistem production-ready

---

## 📊 Total Estimasi

| Fase | Durasi | Deliverable |
|------|--------|-------------|
| Foundation | 2 minggu | Data master system |
| Core Transaction | 2 minggu | Peminjaman & pengembalian |
| Dashboard & Laporan | 2 minggu | Reporting system |
| Polish & Deploy | 1 minggu | Production ready |
| **Total** | **7 minggu** | **MVP Complete** |

---

## 💰 Estimasi Biaya (Versi Pesantren)

### Development Cost
| Item | Estimasi |
|------|----------|
| Fullstack Developer | Rp 12-20 juta/bulan |
| UI/UX Designer | Rp 6-10 juta/bulan |
| **Total (2 bulan)** | **Rp 36-60 juta** |

### Infrastructure Cost (Bulanan)
| Item | Estimasi |
|------|----------|
| VPS (2GB RAM) | Rp 200rb - 400rb |
| Domain + SSL | Rp 150rb - 300rb/tahun |
| Backup Storage | Rp 50rb - 100rb |
| **Total/Bulan** | **Rp 400rb - 800rb** |

### Hardware (One-time)
| Item | Estimasi |
|------|----------|
| Barcode Scanner | Rp 300rb - 800rb |
| Thermal Printer | Rp 500rb - 1.5jt |
| **Total Hardware** | **Rp 800rb - 2.3jt** |

---

## 🔒 Keamanan & Backup

### Security Checklist
- [x] Enkripsi password (bcrypt)
- [x] JWT dengan expiry
- [x] Role-based access control
- [x] Input validation & sanitization
- [x] SQL injection prevention
- [x] Session timeout
- [x] Audit log semua transaksi

### Backup Strategy
- [x] Backup database otomatis harian
- [x] Backup ke cloud storage (Google Drive/AWS S3)
- [x] Retention policy (30 hari)
- [x] Restore procedure documented

---

## 📋 Checklist Pra-Launch

### Data Preparation
- [ ] Input data asrama & kamar
- [ ] Input data santri (dari Excel)
- [ ] Input data buku (dari Excel)
- [ ] Generate barcode untuk semua buku
- [ ] Setup akun petugas

### Testing
- [ ] Test peminjaman lengkap
- [ ] Test pengembalian dengan denda
- [ ] Test perpanjangan
- [ ] Test laporan & export
- [ ] Test backup & restore

### Training
- [ ] Training petugas perpustakaan
- [ ] Sediakan user manual
- [ ] Sediakan quick reference card

---

## 📞 Kontak & Support

**Tim Pengembangan:**
- Project Manager: [Nama]
- Developer: [Nama]
- Designer: [Nama]

**Pihak Pesantren:**
- Penanggung Jawab: [Nama]
- Koordinator Perpustakaan: [Nama]

---

*Dokumen ini disesuaikan untuk konteks Pesantren*
*Versi: 2.0 - Pesantren Edition*
*Update: 6 Februari 2024*
