"use server";

import { requireAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export interface AdminCustomerItem {
  id: string;
  customerCode: string;
  name: string;
  waNumber: string;
  createdAt: string;
  orderCount: number;
  totalSpent: number;
  fullAddress: string;
}

export interface AdminCustomerDetail extends AdminCustomerItem {
  addresses: Array<{
    id: string;
    label: string;
    fullAddress: string;
    isDefault: boolean;
  }>;
  recentOrders: Array<{
    id: string;
    orderNumber: string;
    total: number;
    orderStatus: string;
    paymentStatus: string;
    createdAt: string;
  }>;
}

/**
 * Mengambil daftar pelanggan dengan total belanja dan jumlah order
 */
export async function getAdminCustomers(searchQuery?: string): Promise<AdminCustomerItem[]> {
  await requireAdmin();
  const adminClient = createAdminClient();

  let query = adminClient
    .from("customers")
    .select(`
      id,
      customer_code,
      name,
      wa_number,
      created_at,
      addresses (
        full_address,
        is_default
      ),
      orders (
        id,
        total,
        order_status
      )
    `)
    .order("created_at", { ascending: false });

  if (searchQuery && searchQuery.trim()) {
    const q = searchQuery.trim();
    query = query.or(`name.ilike.%${q}%,wa_number.ilike.%${q}%,customer_code.ilike.%${q}%`);
  }

  const { data, error } = await query;
  if (error || !data) return [];

  return ((data as unknown) as Array<{
    id: string;
    customer_code: string;
    name: string;
    wa_number: string;
    created_at: string;
    addresses: Array<{ full_address: string; is_default: boolean }> | null;
    orders: Array<{ id: string; total: number; order_status: string }> | null;
  }>).map((c) => {
    const validOrders = (c.orders || []).filter((o) => o.order_status !== "batal");
    const totalSpent = validOrders.reduce((sum, o) => sum + (o.total || 0), 0);
    const defaultAddr = c.addresses?.find((a) => a.is_default) || c.addresses?.[0];

    return {
      id: c.id,
      customerCode: c.customer_code,
      name: c.name,
      waNumber: c.wa_number,
      createdAt: c.created_at,
      orderCount: validOrders.length,
      totalSpent,
      fullAddress: defaultAddr?.full_address || "Alamat belum tersimpan",
    };
  });
}

/**
 * Mengambil detail pelanggan lengkap untuk modal/halaman admin
 */
export async function getAdminCustomerDetail(customerId: string): Promise<AdminCustomerDetail | null> {
  await requireAdmin();
  const adminClient = createAdminClient();

  const { data, error } = await adminClient
    .from("customers")
    .select(`
      id,
      customer_code,
      name,
      wa_number,
      created_at,
      addresses (
        id,
        label,
        full_address,
        is_default
      ),
      orders (
        id,
        order_number,
        total,
        order_status,
        payment_status,
        created_at
      )
    `)
    .eq("id", customerId)
    .single();

  if (error || !data) return null;

  const c = data as unknown as {
    id: string;
    customer_code: string;
    name: string;
    wa_number: string;
    created_at: string;
    addresses: Array<{
      id: string;
      label: string;
      full_address: string;
      is_default: boolean;
    }> | null;
    orders: Array<{
      id: string;
      order_number: string;
      total: number;
      order_status: string;
      payment_status: string;
      created_at: string;
    }> | null;
  };

  const validOrders = (c.orders || []).filter((o) => o.order_status !== "batal");
  const totalSpent = validOrders.reduce((sum, o) => sum + (o.total || 0), 0);
  const defaultAddr = c.addresses?.find((a) => a.is_default) || c.addresses?.[0];

  return {
    id: c.id,
    customerCode: c.customer_code,
    name: c.name,
    waNumber: c.wa_number,
    createdAt: c.created_at,
    orderCount: validOrders.length,
    totalSpent,
    fullAddress: defaultAddr?.full_address || "Alamat belum tersimpan",
    addresses: (c.addresses || []).map((a) => ({
      id: a.id,
      label: a.label,
      fullAddress: a.full_address,
      isDefault: a.is_default,
    })),
    recentOrders: (c.orders || [])
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 10)
      .map((o) => ({
        id: o.id,
        orderNumber: o.order_number,
        total: o.total,
        orderStatus: o.order_status,
        paymentStatus: o.payment_status,
        createdAt: o.created_at,
      })),
  };
}
