"use server";

import { requireAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

export interface AdminOrderDetail {
  id: string;
  orderNumber: string;
  customerId: string;
  customerCode: string;
  customerName: string;
  customerWa: string;
  fullAddress: string;
  latitude: number | null;
  longitude: number | null;
  orderStatus: string;
  paymentMethod: string;
  paymentStatus: string;
  note: string | null;
  subtotal: number;
  deliveryFee: number;
  total: number;
  printCount: number;
  lastPrintedAt: string | null;
  createdAt: string;
  items: Array<{
    id: string;
    menuId: string | null;
    menuName: string;
    price: number;
    quantity: number;
    subtotal: number;
    note: string | null;
  }>;
}

export interface OrderFilterParams {
  date?: string;
  orderStatus?: string;
  paymentStatus?: string;
  searchQuery?: string;
}

/**
 * Mengambil daftar pesanan dengan filter dan pencarian
 * HANYA ADMIN yang mendapatkan alamat lengkap customer!
 */
export async function getAdminOrders(params: OrderFilterParams): Promise<AdminOrderDetail[]> {
  await requireAdmin();
  const adminClient = createAdminClient();

  const filterDate = params.date || new Date().toISOString().split("T")[0];

  let query = adminClient
    .from("orders")
    .select(`
      id,
      order_number,
      customer_id,
      address_snapshot,
      delivery_fee,
      subtotal,
      total,
      order_status,
      payment_method,
      payment_status,
      note,
      print_count,
      last_printed_at,
      created_at,
      customers (
        id,
        customer_code,
        name,
        wa_number
      ),
      order_items (
        id,
        menu_id,
        menu_name_snapshot,
        price_snapshot,
        quantity,
        note
      )
    `)
    .gte("created_at", `${filterDate}T00:00:00.000Z`)
    .lte("created_at", `${filterDate}T23:59:59.999Z`)
    .order("created_at", { ascending: false });

  if (params.orderStatus && params.orderStatus !== "all") {
    query = query.eq("order_status", params.orderStatus);
  }

  if (params.paymentStatus && params.paymentStatus !== "all") {
    query = query.eq("payment_status", params.paymentStatus);
  }

  const { data, error } = await query;
  if (error || !data) return [];

  let orders = ((data as unknown) as Array<{
    id: string;
    order_number: string;
    customer_id: string;
    address_snapshot: Record<string, unknown> | null;
    delivery_fee: number;
    subtotal: number;
    total: number;
    order_status: string;
    payment_method: string;
    payment_status: string;
    note: string | null;
    print_count: number;
    last_printed_at: string | null;
    created_at: string;
    customers: {
      id: string;
      customer_code: string;
      name: string;
      wa_number: string;
    } | null;
    order_items: Array<{
      id: string;
      menu_id: string | null;
      menu_name_snapshot: string;
      price_snapshot: number;
      quantity: number;
      note: string | null;
    }>;
  }>).map((o) => {
    const snap = (o.address_snapshot || {}) as {
      full_address?: string;
      street?: string;
      houseNumber?: string;
      house_number?: string;
      kecamatan?: string;
      city?: string;
      latitude?: number;
      longitude?: number;
    };
    const fullAddr =
      snap.full_address ||
      `${snap.street || ""} No. ${snap.houseNumber || snap.house_number || ""}, Kec. ${snap.kecamatan || ""}, ${snap.city || ""}`;

    return {
      id: o.id,
      orderNumber: o.order_number,
      customerId: o.customer_id,
      customerCode: o.customers?.customer_code || "DK-xxxx",
      customerName: o.customers?.name || "Pelanggan",
      customerWa: o.customers?.wa_number || "",
      fullAddress: fullAddr || "Alamat lengkap tidak tersedia",
      latitude: snap.latitude || null,
      longitude: snap.longitude || null,
      orderStatus: o.order_status,
      paymentMethod: o.payment_method,
      paymentStatus: o.payment_status,
      note: o.note,
      subtotal: o.subtotal,
      deliveryFee: o.delivery_fee,
      total: o.total,
      printCount: o.print_count || 0,
      lastPrintedAt: o.last_printed_at,
      createdAt: o.created_at,
      items: (o.order_items || []).map((it) => ({
        id: it.id,
        menuId: it.menu_id,
        menuName: it.menu_name_snapshot,
        price: it.price_snapshot,
        quantity: it.quantity,
        subtotal: it.price_snapshot * it.quantity,
        note: it.note,
      })),
    };
  });

  // Filter pencarian sisi server (nomor pesanan, nama, atau nomor WA)
  if (params.searchQuery && params.searchQuery.trim()) {
    const q = params.searchQuery.toLowerCase().trim();
    orders = orders.filter(
      (o) =>
        o.orderNumber.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q) ||
        o.customerWa.includes(q)
    );
  }

  return orders;
}

/**
 * Ubah status operasional pesanan (baru, dimasak, dikirim, selesai)
 */
export async function updateOrderStatus(
  orderId: string,
  newStatus: "baru" | "dimasak" | "dikirim" | "selesai"
): Promise<{ success: boolean; error?: string }> {
  await requireAdmin();
  const adminClient = createAdminClient();

  const { error } = await adminClient
    .from("orders")
    .update({ order_status: newStatus, updated_at: new Date().toISOString() })
    .eq("id", orderId);

  if (error) return { success: false, error: "Gagal memperbarui status pesanan." };

  revalidatePath("/admin/pesanan");
  revalidatePath("/admin");
  return { success: true };
}

/**
 * Tandai pembayaran pesanan menjadi "Lunas"
 */
export async function markOrderPaid(orderId: string): Promise<{ success: boolean; error?: string }> {
  await requireAdmin();
  const adminClient = createAdminClient();

  const { error } = await adminClient
    .from("orders")
    .update({ payment_status: "lunas", updated_at: new Date().toISOString() })
    .eq("id", orderId);

  if (error) return { success: false, error: "Gagal menandai lunas." };

  revalidatePath("/admin/pesanan");
  revalidatePath("/admin");
  return { success: true };
}

/**
 * Membatalkan pesanan lewat fungsi SQL atomik cancel_order (mengembalikan kuota sold)
 */
export async function cancelOrderAction(orderId: string): Promise<{ success: boolean; error?: string }> {
  await requireAdmin();
  const adminClient = createAdminClient();

  const { data, error } = await adminClient.rpc("cancel_order", {
    p_order_id: orderId,
  });

  if (error) {
    return { success: false, error: error.message || "Gagal membatalkan pesanan." };
  }

  const res = data as { success: boolean; message: string };
  if (!res.success) {
    return { success: false, error: res.message };
  }

  revalidatePath("/admin/pesanan");
  revalidatePath("/admin");
  revalidatePath("/admin/menu");
  revalidatePath("/");
  return { success: true };
}

/**
 * Aksi massal: Tandai beberapa pesanan menjadi Dimasak atau Dikirim sekaligus
 */
export async function batchUpdateOrderStatus(
  orderIds: string[],
  newStatus: "dimasak" | "dikirim"
): Promise<{ success: boolean; error?: string }> {
  await requireAdmin();
  if (!orderIds || orderIds.length === 0) return { success: true };

  const adminClient = createAdminClient();

  const { error } = await adminClient
    .from("orders")
    .update({ order_status: newStatus, updated_at: new Date().toISOString() })
    .in("id", orderIds)
    .neq("order_status", "batal");

  if (error) return { success: false, error: "Gagal memperbarui status massal." };

  revalidatePath("/admin/pesanan");
  revalidatePath("/admin");
  return { success: true };
}

/**
 * Catat aktivitas cetak struk (menambah print_count & last_printed_at)
 */
export async function recordOrderPrint(orderId: string): Promise<{ success: boolean; printCount: number }> {
  await requireAdmin();
  const adminClient = createAdminClient();

  const { data: current } = await adminClient
    .from("orders")
    .select("print_count")
    .eq("id", orderId)
    .single();

  const newCount = (current?.print_count || 0) + 1;

  await adminClient
    .from("orders")
    .update({
      print_count: newCount,
      last_printed_at: new Date().toISOString(),
    })
    .eq("id", orderId);

  return { success: true, printCount: newCount };
}
