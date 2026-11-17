# DK Catering - Platform Pemesanan Catering Harian

Website pemesanan masakan harian DK Catering berbasis Next.js App Router, TypeScript (Strict), Tailwind CSS, dan Supabase. Dirancang khusus dengan estetika iOS modern dan sangat ramah untuk orang tua (*senior-friendly*).

---

## 🚀 Persyaratan Sistem
- Node.js versi 18+ (Rekomendasi v20+)
- Akun Supabase (PostgreSQL & Storage)

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
```
> **Catatan Keamanan (PENTING):** `SUPABASE_SERVICE_ROLE_KEY` hanya berjalan di lingkungan server (*Server Actions*). Kunci ini **tidak pernah terekspos** ke browser pelanggan.

---

## 🗄️ Urutan Migrasi Database ke Supabase

Jalankan script SQL berikut secara berurutan di menu **SQL Editor** Supabase Dashboard Anda:

1. **Migrasi Tahap 1:** `supabase/migrations/001_initial_schema.sql`  
   - Membuat tabel master `menus`, `daily_menus`, `customers`, `addresses`, `orders`, `order_items`, `payments`, `settings`, `admins`.
   - Membuat sequence dan trigger format kode pelanggan (`DK-0001`) dan nomor pesanan (`DK-YYMMDD-001`).

2. **Migrasi Tahap 2:** `supabase/migrations/002_customer_auth_orders.sql`  
   - Menambahkan tabel `sessions` (token hash SHA-256 untuk cookie 1 tahun).
   - Menambahkan kolom rincian `addresses` (`street`, `house_number`, `rt_rw`, `kelurahan`, `kecamatan`, `city`, `detail_note`) serta partial unique index agar hanya 1 alamat yang menjadi default (`is_default = true`).
   - Memperketat Row Level Security (RLS) sehingga tabel data customer **sama sekali tidak bisa dibaca/ditulis oleh role `anon`**.
   - Menambahkan fungsi transaksi atomik `create_order` yang mengunci baris `daily_menus` (`SELECT ... FOR UPDATE`) untuk mencegah *race-condition* saat kuota diperebutkan secara bersamaan.

3. **Data Awal (Seed):** `supabase/seed.sql`  
   - Memasukkan master 15 masakan rumahan Indonesia, jadwal porsi menu hari ini, dan data dummy awal.

---

## 🔒 Uji Keamanan RLS (Memastikan Anon Key Ditolak)
Anda dapat memverifikasi bahwa tabel pelanggan terlindungi dari akses anonim dengan menjalankan cURL berikut:
```bash
curl -X GET "https://<PROJECT-ID>.supabase.co/rest/v1/customers?select=*" \
  -H "apikey: <ANON_KEY>" \
  -H "Authorization: Bearer <ANON_KEY>"
```
**Hasil yang diharapkan:** Mengembalikan array kosong `[]` atau kode error `401/403 Permission Denied`. Ini membuktikan bahwa pelanggan tidak bisa mencuri data pelanggan lain lewat REST API publik Supabase.

---

## 🧪 Cara Menguji Fitur Tahap 2

### 1. Menjalankan Aplikasi
```bash
npm run dev
```
Buka browser di `http://localhost:3000` (mode tampilan mobile 375px - 430px).

### 2. Skenario Uji Pelanggan Baru:
1. Di beranda, pilih salah satu menu lalu tekan tombol **+ Tambah**.
2. Klik tombol hitam **"Pesan Sekarang"** di floating cart bagian bawah.
3. Anda akan otomatis dialihkan ke `/masuk?next=/pesan`.
4. Masukkan nomor WhatsApp baru (misal: `0857 1234 5678`). Tekan **Lanjut**.
5. Sistem mendeteksi nomor belum terdaftar dan menampilkan form pendaftaran. Masukkan Nama Lengkap dan rincian Alamat (Jalan, No Rumah, Kecamatan, Kota). Tekan **Daftar & Lanjut**.
6. Anda langsung dialihkan ke `/pesan`. Alamat tampil **disamarkan** (contoh: *Jl. Melati No. ••, Lowokwaru*).
7. Pilih metode **Tunai ke Kurir**, lalu tekan **Lanjut Pesan Sekarang**.
8. Anda akan tiba di halaman `/pesanan/DK-YYMMDD-xxx` ("Pesanan Sedang Diproses") dengan ID Pelanggan unik Anda (`DK-xxxx`).

### 3. Skenario Uji Pelanggan Lama (Auto-Login & Cookie Sesi):
1. Buka tab incognito atau browser baru, buka `/masuk`.
2. Masukkan nomor WhatsApp yang sudah pernah terdaftar di atas.
3. Tekan **Lanjut**. Sistem langsung mengenali Anda, menampilkan pesan sapaan *"Selamat datang kembali, [Nama]"*, dan otomatis login tanpa perlu OTP.
4. Refresh atau tutup dan buka kembali browser; sesi tetap aktif selama 1 tahun melalui cookie `dk_session`.

### 4. Skenario Uji Transaksi Atomik (2 Pesanan Bersamaan untuk Kuota Terakhir):
Fungsi `create_order` pada migrasi `002_customer_auth_orders.sql` menggunakan klausa PostgreSQL `FOR UPDATE`:
```sql
SELECT * INTO v_daily_menu FROM daily_menus WHERE menu_date = v_today AND menu_id = v_item.menu_id FOR UPDATE;
```
**Cara Menguji:**
1. Atur sisa kuota menu tertentu menjadi 1 porsi di tabel `daily_menus` (`quota = 10, sold = 9`).
2. Buka dua jendela browser yang berbeda dengan akun pelanggan berbeda. Masukkan menu tersebut masing-masing 1 porsi ke keranjang.
3. Tekan tombol **"Lanjut Pesan Sekarang"** pada kedua jendela secara hampir bersamaan.
4. **Hasil:** Pesanan pertama akan berhasil dan mengupdate `sold` menjadi 10. Transaksi pesanan kedua yang mengantre akan membaca `sold = 10` dan otomatis di-abort (rollback), menampilkan pesan ramah: *"Maaf, sisa porsi untuk [Nama Menu] hanya tersisa 0 porsi."*

### 5. Skenario Uji Privasi Alamat:
1. Buka Developer Tools browser (F12) -> tab **Network**.
2. Masuk ke halaman `/pesan` atau `/profil`.
3. Periksa semua respons HTML dan JSON yang diterima client.
4. **Hasil:** Data alamat lengkap (nomor rumah asli, patokan kurir, RT/RW) **tidak pernah dikirim** dalam payload; yang dikirimkan hanyalah string disamarkan seperti *"Jl. Melati No. ••, Lowokwaru"*.
