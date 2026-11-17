import Link from "next/link";
import {
  LayoutDashboard,
  Utensils,
  ShoppingBag,
  ChefHat,
  Users,
  Settings,
  ArrowLeft,
} from "lucide-react";

const navigationItems = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { name: "Menu Hari Ini", href: "/admin/menu", icon: Utensils },
  { name: "Pesanan", href: "/admin/pesanan", icon: ShoppingBag },
  { name: "Rekap Masak", href: "/admin/rekap-masak", icon: ChefHat },
  { name: "Pelanggan", href: "/admin/pelanggan", icon: Users },
  { name: "Pengaturan", href: "/admin/pengaturan", icon: Settings },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#F4F5F7] flex flex-col md:flex-row text-charcoal">
      {/* Sidebar Admin */}
      <aside className="w-full md:w-64 bg-charcoal text-white flex flex-col shrink-0">
        <div className="p-5 border-b border-charcoal-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-accent text-charcoal font-black flex items-center justify-center text-sm">
              DK
            </div>
            <span className="font-bold text-lg tracking-tight">Admin DK</span>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navigationItems.map((item, index) => {
            const Icon = item.icon;
            const isActive = index === 0;
            return (
              <div
                key={item.name}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors cursor-not-allowed ${
                  isActive
                    ? "bg-accent text-charcoal font-bold"
                    : "text-charcoal-300 hover:bg-charcoal-800"
                }`}
                title="Fitur admin akan aktif di tahap berikutnya"
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.name}</span>
                {index > 0 && (
                  <span className="ml-auto text-[10px] bg-charcoal-800 text-charcoal-400 px-1.5 py-0.5 rounded">
                    Tahap 2
                  </span>
                )}
              </div>
            );
          })}
        </nav>

        <div className="p-4 border-t border-charcoal-800">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm text-charcoal-300 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Beranda</span>
          </Link>
        </div>
      </aside>

      {/* Konten Utama Admin */}
      <main className="flex-1 p-6 md:p-8 flex flex-col">{children}</main>
    </div>
  );
}
