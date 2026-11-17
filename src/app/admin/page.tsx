export default function AdminPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-charcoal">Dashboard Admin</h1>
        <p className="text-charcoal-500 text-sm mt-1">
          Panel kendali operasional pemesanan DK Catering.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-charcoal-100 shadow-sm">
          <p className="text-xs font-semibold text-charcoal-400 uppercase tracking-wider">
            Total Menu Hari Ini
          </p>
          <p className="text-3xl font-black text-charcoal mt-2">15</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-charcoal-100 shadow-sm">
          <p className="text-xs font-semibold text-charcoal-400 uppercase tracking-wider">
            Target Pesanan
          </p>
          <p className="text-3xl font-black text-charcoal mt-2">40 - 50</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-charcoal-100 shadow-sm">
          <p className="text-xs font-semibold text-charcoal-400 uppercase tracking-wider">
            Pelanggan Terdaftar
          </p>
          <p className="text-3xl font-black text-charcoal mt-2">± 800</p>
        </div>
      </div>

      <div className="bg-white p-8 rounded-card border border-charcoal-100 shadow-sm text-center">
        <h2 className="text-lg font-bold text-charcoal">
          Fitur Pengelolaan Admin Belum Diaktifkan
        </h2>
        <p className="text-charcoal-500 text-sm mt-1 max-w-md mx-auto">
          Sidebar navigasi (Dashboard, Menu Hari Ini, Pesanan, Rekap Masak, Pelanggan, Pengaturan) telah disiapkan dan siap dihubungkan pada tahap selanjutnya.
        </p>
      </div>
    </div>
  );
}
