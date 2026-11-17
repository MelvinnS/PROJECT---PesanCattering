"use server";

import { requireAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export interface DashboardStats {
  todayOrderCount: number;
  todayPortionCount: number;
  todayRevenue: number;
  unpaidCount: number;
  recentOrders: Array<{
    id: string;
    orderNumber: string;
    customerName: string;
    total: number;
    orderStatus: string;
    paymentStatus: string;
    createdAt: string;
    portions: number;
  }>;
  lowStockMenus: Array<{
    dailyMenuId: string;
    menuName: string;
    quota: number;
    sold: number;
    remaining: number;
  }>;
}

/**
 * Mengambil ringkasan statistik dashboard admin untuk hari ini
 */
export async function getAdminDashboardStats(): Promise<DashboardStats> {
  await requireAdmin();

  const adminClient = createAdminClient();
  const today = new Date().toISOString().split("T")[0];

  // 1. Ambil pesanan hari ini (tidak batal)
  const { data: todayOrders, error: orderError } = await adminClient
    .from("orders")
    .select(`
      id,
      order_number,
      total,
      order_status,
      payment_status,
      created_at,
      customer_id,
      customers (name),
      order_items (quantity)
    `)
    .gte("created_at", `${today}T00:00:00.000Z`)
    .lte("created_at", `${today}T23:59:59.999Z`)
    .order("created_at", { ascending: false });

  if (orderError) {
    console.error("Gagal mengambil pesanan hari ini:", orderError);
  }

  const allOrders = ((todayOrders || []) as unknown as Array<{
    id: string;
    order_number: string;
    total: number;
    order_status: string;
    payment_status: string;
    created_at: string;
    customers: { name: string } | null;
    order_items: Array<{ quantity: number }>;
  }>);

  const validOrders = allOrders.filter((o) => o.order_status !== "batal");

  const todayOrderCount = validOrders.length;
  const todayRevenue = validOrders.reduce((sum, o) => sum + (o.total || 0), 0);
  const unpaidCount = validOrders.filter((o) => o.payment_status === "belum_bayar").length;
  const todayPortionCount = validOrders.reduce((sum, o) => {
    const p = o.order_items?.reduce((pSum, it) => pSum + (it.quantity || 0), 0) || 0;
    return sum + p;
  }, 0);

  // 5 pesanan terbaru
  const recentOrders = allOrders.slice(0, 5).map((o) => ({
    id: o.id,
    orderNumber: o.order_number,
    customerName: o.customers?.name || "Pelanggan",
    total: o.total,
    orderStatus: o.order_status,
    paymentStatus: o.payment_status,
    createdAt: o.created_at,
    portions: o.order_items?.reduce((pSum, it) => pSum + (it.quantity || 0), 0) || 0,
  }));

  // 2. Ambil menu hari ini yang kuotanya hampir habis (sisa <= 5)
  const { data: dailyMenus } = await adminClient
    .from("daily_menus")
    .select(`
      id,
      quota,
      sold,
      is_available,
      menus (name)
    `)
    .eq("menu_date", today)
    .eq("is_available", true);

  const lowStockMenus = (((dailyMenus || []) as unknown) as Array<{
    id: string;
    quota: number;
    sold: number;
    is_available: boolean;
    menus: { name: string } | null;
  }>)
    .map((dm) => ({
      dailyMenuId: dm.id,
      menuName: dm.menus?.name || "Menu",
      quota: dm.quota,
      sold: dm.sold,
      remaining: Math.max(0, dm.quota - dm.sold),
    }))
    .filter((dm) => dm.remaining <= 5)
    .sort((a, b) => a.remaining - b.remaining);

  return {
    todayOrderCount,
    todayPortionCount,
    todayRevenue,
    unpaidCount,
    recentOrders,
    lowStockMenus,
  };
}
