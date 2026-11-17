# DK Catering - Platform Pemesanan Catering Harian & Dashboard Admin

Website pemesanan masakan harian DK Catering berbasis Next.js App Router, TypeScript (Strict), Tailwind CSS, dan Supabase. Dirancang khusus dengan estetika iOS modern, ramah orang tua, dashboard admin responsif, serta pencetakan struk thermal ESC/POS 58mm untuk Android (RawBT).

---

## 🚀 Persyaratan Sistem
- Node.js versi 18+ (Rekomendasi v20+)
- Akun Supabase (PostgreSQL, Storage, & Authentication)
- HP Android + Printer Bluetooth Thermal 58mm (Algoo / POS-58) + Aplikasi **RawBT**

---

## 🛠️ Konfigurasi Environment (`.env.local`)
Salin file `.env.example` menjadi `.env.local`:
```bash
cp .env.example .env.local
```
Sesuaikan nilai variabel berikut di `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
NEXT_PUBLIC_WA_NUMBER=6281234567890
NEXT_PUBLIC_STORE_NAME="DK Catering"

# Flag Simulasi Pengujian (Optional, default false)
NEXT_PUBLIC_USE_MOCK_DATA=false
```

---

## 🗄️ Urutan Migrasi Database ke Supabase

Jalankan script SQL berikut secara berurutan di menu **SQL Editor** Supabase Dashboard:

1. **Migrasi 001:** `supabase/migrations/001_initial_schema.sql` (Tabel dasar, sequence `DK-0001` & `DK-YYMMDD-001`, RLS publik).
2. **Migrasi 002:** `supabase/migrations/002_customer_auth_orders.sql` (Tabel sessions cookie 1 tahun, alamat detail, isolasi RLS pelanggan, transaksi atomik `create_order`).
3. **Migrasi 003:** `supabase/migrations/003_admin.sql` (Bucket storage `menu-photos`, fungsi atomik `cancel_order`, fungsi `get_cooking_recap`, kolom `print_count` dan `last_printed_at`).
4. **Data Awal (Seed):** `supabase/seed.sql` (15 master resep, jadwal hari ini, 3 pelanggan dummy).

---

## 👤 Cara Membuat Akun Admin Pertama
1. Buka dashboard Supabase Anda -> menu **Authentication** -> **Users**.
2. Klik tombol **Add user** -> pilih **Create user**.
3. Masukkan Email (contoh: `admin@dkcatering.com`) dan Password yang kuat. Pastikan *Auto Confirm User* dicentang.
4. Salin `User UID` yang terbentuk.
5. Buka menu **SQL Editor** dan jalankan perintah SQL berikut:
```sql
INSERT INTO admins (id, email, name)
VALUES (
  '<PASTE_USER_UID_DISINI>',
  'admin@dkcatering.com',
  'Admin Utama DK'
)
ON CONFLICT (id) DO NOTHING;
```
6. Akun siap digunakan untuk login di `/admin/login`.

---

## 🖨️ Panduan Cetak Struk Printer Thermal 58mm (Algoo + RawBT)

### 1. Pasang Printer & Aplikasi di Android
1. Nyalakan printer Bluetooth **Algoo 58mm**.
2. Di HP Android pengelola/admin, aktifkan Bluetooth dan pasangkan (*pair*) dengan printer (biasanya nama perangkat `MTP-2`, `RPP02N`, atau `POS-58`, PIN default: `0000` atau `1234`).
3. Buka **Google Play Store**, instal aplikasi **RawBT print service**.
4. Buka aplikasi RawBT:
   - Pilih jenis koneksi: **Bluetooth**.
   - Pilih printer Algoo yang sudah di-pair.
   - Pada pengaturan kertas, pastikan memilih **58 mm (32 characters)**.
   - Lakukan uji cetak (*Test Print*) dari aplikasi RawBT hingga berhasil keluar.

### 2. Cara Kerja Pencetakan di Dashboard Admin DK
- Admin menekan tombol **"Cetak RawBT"** pada daftar pesanan atau halaman rekap masak.
- Sistem secara otomatis meng-encode data pesanan ke dalam format ESC/POS 32 karakter dan memanggil skema URL `rawbt:base64,...`.
- Aplikasi RawBT langsung mencetak struk secara otomatis tanpa perlu input manual di aplikasi kasir lain.
- Setiap kali dicetak, sistem menambah hitungan `print_count` dan mencatat `last_printed_at`. Jika struk pernah dicetak sebelumnya, sistem meminta konfirmasi cetak ulang untuk menghindari duplikasi pesanan.

---

## 🧪 Cara Pengujian Tahap 3

1. **Jalankan Aplikasi:**
   ```bash
   npm run dev
   ```
2. **Uji Keamanan Akses Admin:**
   - Akses `/admin` tanpa login -> otomatis dialihkan ke `/admin/login`.
   - Coba akses data admin via cURL tanpa autentikasi admin: ditolak oleh middleware dan Server Actions.
3. **Uji Login Admin:**
   - Masukkan email dan password admin yang telah dibuat di Supabase Auth.
   - Berhasil masuk ke dashboard dengan ringkasan transaksi hari ini yang auto-refresh tiap 30 detik.
4. **Uji Menu Hari Ini & Master Menu:**
   - Buka `/admin/menu` -> Master Menu -> Tambah menu baru dan upload foto (otomatis terkompres di bawah 2MB dan tersimpan di bucket `menu-photos`).
   - Di tab Menu Harian, pilih tanggal dan tambahkan menu tersebut dengan kuota porsi. Menu langsung muncul di beranda customer `/`.
   - Coba tombol "Salin dari Hari Lain".
5. **Uji Pembatalan Pesanan (`cancel_order`):**
   - Pada `/admin/pesanan`, klik tombol **Batalkan** pada pesanan yang sedang aktif.
   - Periksa tabel `daily_menus`: kuota `sold` otomatis berkurang kembali sejumlah porsi pesanan yang dibatalkan.
6. **Uji Rekap Masak:**
   - Buka `/admin/rekap-masak`. Periksa apakah total porsi tiap menu cocok dengan seluruh pesanan aktif hari itu (pesanan yang berstatus batal tidak dihitung).
   - Catatan khusus pelanggan ("tanpa pedas", dsb) tampil besar dan jelas untuk tim masak malam/subuh.
7. **Uji Cetak Thermal 58mm:**
   - Buka `/admin/pengaturan` -> bagian printer -> klik **"Cetak Uji Coba (RawBT)"**.
   - Periksa apakah lebar teks 32 karakter tercetak rapi tanpa terpotong.
