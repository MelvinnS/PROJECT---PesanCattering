"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { logoutAdminAction } from "@/actions/admin-auth";
import {
  LayoutDashboard,
  Utensils,
  ShoppingBag,
  ChefHat,
  Users,
  Settings,
  LogOut,
  Menu,
  X,
  Store,
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
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Jika di halaman login, tampilkan langsung tanpa sidebar
  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  const handleLogout = async () => {
    if (confirm("Keluar dari sesi administrator?")) {
      await logoutAdminAction();
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F5F7] flex flex-col md:flex-row text-charcoal">
      {/* HEADER MOBILE (HP) */}
      <header className="md:hidden bg-charcoal text-white px-4 py-3.5 flex items-center justify-between sticky top-0 z-40 shadow-md">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-accent text-charcoal font-black flex items-center justify-center text-xs">
            DK
          </div>
          <span className="font-black text-base tracking-tight">Admin DK</span>
        </div>
        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-1.5 rounded-lg text-charcoal-300 hover:text-white hover:bg-charcoal-800"
          aria-label="Menu"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </header>

      {/* DROPDOWN MENU MOBILE */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-charcoal text-white border-b border-charcoal-800 px-4 py-3 space-y-1.5 sticky top-[57px] z-30 shadow-lg animate-in slide-in-from-top-2">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                  isActive
                    ? "bg-accent text-charcoal"
                    : "text-charcoal-300 hover:bg-charcoal-800 hover:text-white"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.name}</span>
              </Link>
            );
          })}
          <div className="pt-2 border-t border-charcoal-800 flex justify-between">
            <Link
              href="/"
              className="text-xs text-charcoal-300 hover:text-white flex items-center gap-1.5 py-1"
            >
              <Store className="w-3.5 h-3.5" />
              <span>Lihat Toko</span>
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1.5 py-1"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Keluar</span>
            </button>
          </div>
        </div>
      )}

      {/* SIDEBAR DESKTOP */}
      <aside className="hidden md:flex w-64 bg-charcoal text-white flex-col shrink-0 min-h-screen sticky top-0 shadow-xl">
        <div className="p-5 border-b border-charcoal-800 flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full bg-accent text-charcoal font-black flex items-center justify-center text-sm shadow-sm">
            DK
          </div>
          <div>
            <h2 className="font-black text-lg tracking-tight leading-none">DK Catering</h2>
            <span className="text-[11px] text-accent-light font-semibold">Admin Panel</span>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1.5">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-3.5 py-3 rounded-2xl text-sm font-bold transition-all ${
                  isActive
                    ? "bg-accent text-charcoal shadow-sm"
                    : "text-charcoal-300 hover:bg-charcoal-800 hover:text-white"
                }`}
              >
                <Icon className="w-5 h-5 shrink-0" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-charcoal-800 space-y-2">
          <Link
            href="/"
            target="_blank"
            className="flex items-center gap-2.5 text-xs text-charcoal-400 hover:text-white px-3 py-2 rounded-xl hover:bg-charcoal-800 transition-colors"
          >
            <Store className="w-4 h-4" />
            <span>Lihat Website Customer</span>
          </Link>

          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 text-xs font-bold text-red-400 hover:text-red-300 px-3 py-2 rounded-xl hover:bg-charcoal-800 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Keluar Akun Admin</span>
          </button>
        </div>
      </aside>

      {/* KONTEN UTAMA */}
      <main className="flex-1 p-4 sm:p-6 md:p-8 flex flex-col max-w-7xl w-full mx-auto">
        {children}
      </main>
    </div>
  );
}
