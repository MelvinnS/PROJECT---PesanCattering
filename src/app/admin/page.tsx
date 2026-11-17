"use client";

import { useEffect, useState, useCallback } from "react";
import { getAdminDashboardStats, DashboardStats } from "@/actions/admin-dashboard";
import { formatRupiah, formatTanggalIndonesia } from "@/lib/utils";
import {
  ShoppingBag,
  Utensils,
  DollarSign,
  AlertTriangle,
  Clock,
  ArrowRight,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchStats = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const data = await getAdminDashboardStats();
      setStats(data);
      setLastRefreshed(new Date());
    } catch (err) {
      console.error("Gagal memuat stats dashboard:", err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // Auto-refresh data tiap 30 detik
  useEffect(() => {
    fetchStats();
    const interval = setInterval(() => {
      fetchStats();
    }, 30000); // 30 detik

    return () => clearInterval(interval);
  }, [fetchStats]);

  return (
    <div className="space-y-6">
      {/* HEADER DASHBOARD */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-charcoal tracking-tight">
            Dashboard Hari Ini
          </h1>
          <p className="text-xs sm:text-sm text-charcoal-500 mt-0.5">
            {formatTanggalIndonesia(new Date())} &bull; Pembaruan otomatis tiap 30 detik
          </p>
        </div>

        <button
          type="button"
          onClick={() => fetchStats()}
          disabled={isRefreshing}
          className="self-start sm:self-auto flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-charcoal-200 text-xs font-bold text-charcoal hover:bg-charcoal-100 shadow-xs active:scale-95 transition-all"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-accent-hover" : ""}`} />
          <span>Segarkan ({lastRefreshed.toLocaleTimeString("id-ID")})</span>
        </button>
      </div>

      {/* 4 KARTU STATISTIK RINGKASAN */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Pesanan */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-charcoal-100 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-charcoal-400 uppercase tracking-wider">
              Pesanan
            </span>
            <div className="w-8 h-8 rounded-full bg-accent/20 text-charcoal flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl sm:text-3xl font-black text-charcoal">
              {loading ? "..." : stats?.todayOrderCount || 0}
            </p>
            <span className="text-[11px] text-charcoal-400">Total pesanan masuk</span>
          </div>
        </div>

        {/* Total Porsi */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-charcoal-100 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-charcoal-400 uppercase tracking-wider">
              Total Porsi
            </span>
            <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <Utensils className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl sm:text-3xl font-black text-charcoal">
              {loading ? "..." : stats?.todayPortionCount || 0}
            </p>
            <span className="text-[11px] text-charcoal-400">Porsi masakan siap kirim</span>
          </div>
        </div>

        {/* Pendapatan */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-charcoal-100 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-charcoal-400 uppercase tracking-wider">
              Pendapatan
            </span>
            <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-xl sm:text-2xl font-black text-charcoal truncate">
              {loading ? "..." : formatRupiah(stats?.todayRevenue || 0)}
            </p>
            <span className="text-[11px] text-charcoal-400">Omset pesanan hari ini</span>
          </div>
        </div>

        {/* Belum Lunas */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-charcoal-100 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-charcoal-400 uppercase tracking-wider">
              Belum Lunas
            </span>
            <div className="w-8 h-8 rounded-full bg-red-100 text-red-700 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl sm:text-3xl font-black text-red-600">
              {loading ? "..." : stats?.unpaidCount || 0}
            </p>
            <span className="text-[11px] text-charcoal-400">Pesanan belum dibayar</span>
          </div>
        </div>
      </div>

      {/* PERINGATAN MENU MENIPIS (SISA <= 5) */}
      {stats && stats.lowStockMenus.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 space-y-2">
          <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
            <AlertTriangle className="w-4 h-4 text-accent-hover shrink-0" />
            <span>Peringatan Kuota Porsi Menipis / Habis</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 pt-1">
            {stats.lowStockMenus.map((m) => (
              <div
                key={m.dailyMenuId}
                className="bg-white p-2.5 rounded-xl border border-amber-200/80 flex items-center justify-between text-xs"
              >
                <span className="font-bold text-charcoal truncate max-w-[150px]">
                  {m.menuName}
                </span>
                <span
                  className={`font-black px-2 py-0.5 rounded-full ${
                    m.remaining === 0
                      ? "bg-red-100 text-red-700"
                      : "bg-amber-100 text-amber-800"
                  }`}
                >
                  {m.remaining === 0 ? "Habis" : `Sisa ${m.remaining}`}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5 PESANAN TERBARU */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-charcoal-100 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-charcoal-100 pb-3">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-accent-hover" />
            <h2 className="text-lg font-black text-charcoal">Pesanan Terbaru</h2>
          </div>
          <Link
            href="/admin/pesanan"
            className="text-xs font-bold text-accent-hover hover:underline flex items-center gap-1"
          >
            <span>Semua Pesanan</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="py-8 text-center text-charcoal-400 text-sm">
            Memuat data pesanan...
          </div>
        ) : !stats || stats.recentOrders.length === 0 ? (
          <div className="py-8 text-center text-charcoal-400 text-sm">
            Belum ada pesanan masuk hari ini.
          </div>
        ) : (
          <div className="divide-y divide-charcoal-100">
            {stats.recentOrders.map((order) => (
              <div
                key={order.id}
                className="py-3 flex items-center justify-between gap-3 text-xs sm:text-sm"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-accent-hover">
                      {order.orderNumber}
                    </span>
                    <span className="text-charcoal-400">&bull;</span>
                    <span className="font-semibold text-charcoal">
                      {order.customerName}
                    </span>
                  </div>
                  <p className="text-charcoal-500 text-xs">
                    {order.portions} porsi &bull; {new Date(order.createdAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })} WIB
                  </p>
                </div>

                <div className="text-right space-y-1 shrink-0">
                  <span className="font-black text-charcoal block">
                    {formatRupiah(order.total)}
                  </span>
                  <div className="flex items-center justify-end gap-1.5">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                        order.paymentStatus === "lunas"
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {order.paymentStatus}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-charcoal-100 text-charcoal uppercase">
                      {order.orderStatus}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
