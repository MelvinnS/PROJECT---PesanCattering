"use server";

import { getCurrentCustomer } from "@/lib/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { maskAddress } from "@/lib/utils";
import { revalidatePath } from "next/cache";

export interface OrderItemInput {
  menu_id: string;
  quantity: number;
  note?: string;
}

export interface SubmitOrderResult {
  success: boolean;
  orderNumber?: string;
  orderId?: string;
  error?: string;
}

export interface MaskedOrderDetail {
  id: string;
  orderNumber: string;
  customerCode: string;
  customerName: string;
  maskedAddress: string;
  orderStatus: string;
  paymentMethod: string;
  paymentStatus: string;
  note: string | null;
  deliveryFee: number;
  subtotal: number;
  total: number;
  createdAt: string;
  items: Array<{
    id: string;
    menuName: string;
    price: number;
    quantity: number;
    subtotal: number;
    note: string | null;
  }>;
}

/**
 * Server action untuk submit pesanan baru menggunakan fungsi SQL atomik create_order
 */
export async function submitOrder(
  addressId: string,
  items: OrderItemInput[],
  note?: string
): Promise<SubmitOrderResult> {
  const current = await getCurrentCustomer();
  if (!current) {
    return { success: false, error: "Silakan masuk terlebih dahulu untuk memesan." };
  }

  if (!items || items.length === 0) {
    return { success: false, error: "Keranjang belanja masih kosong." };
  }

  const adminClient = createAdminClient();

  // Panggil RPC atomik create_order yang menjalankan SELECT ... FOR UPDATE
  const { data, error } = await adminClient.rpc("create_order", {
    p_customer_id: current.id,
    p_address_id: addressId,
    p_payment_method: "cash",
    p_note: note || null,
    p_items: items,
  });

  if (error) {
    console.error("Gagal membuat pesanan (RPC create_order):", error);
    return { success: false, error: error.message || "Gagal memproses pesanan." };
  }

  const result = data as {
    success: boolean;
    order_id: string;
    order_number: string;
    subtotal: number;
    total: number;
  };

  revalidatePath("/");
  revalidatePath("/profil");

  return {
    success: true,
    orderId: result.order_id,
    orderNumber: result.order_number,
  };
}

/**
 * Ambil detail pesanan dan verifikasi kepemilikan sesi customer
 * Alamat LENGKAP tetap disamarkan demi keamanan privasi.
 */
export async function getOrderDetail(orderNumber: string): Promise<MaskedOrderDetail | null> {
  const current = await getCurrentCustomer();
  if (!current) return null;

  const adminClient = createAdminClient();

  const { data: order, error } = await adminClient
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
      created_at,
      order_items (
        id,
        menu_name_snapshot,
        price_snapshot,
        quantity,
        note
      )
    `)
    .eq("order_number", orderNumber)
    .eq("customer_id", current.id)
    .maybeSingle();

  if (error || !order) {
    return null;
  }

  const addrSnap = order.address_snapshot as {
    street?: string;
    kecamatan?: string;
    full_address?: string;
  } | null;

  const maskedAddr = addrSnap
    ? maskAddress({
        street: addrSnap.street,
        kecamatan: addrSnap.kecamatan,
        full_address: addrSnap.full_address,
      })
    : "Alamat tidak tersedia";

  const rawItems = (order.order_items || []) as Array<{
    id: string;
    menu_name_snapshot: string;
    price_snapshot: number;
    quantity: number;
    note: string | null;
  }>;
  const items = rawItems.map((item) => ({
    id: item.id,
    menuName: item.menu_name_snapshot,
    price: item.price_snapshot,
    quantity: item.quantity,
    subtotal: item.price_snapshot * item.quantity,
    note: item.note,
  }));

  return {
    id: order.id,
    orderNumber: order.order_number,
    customerCode: current.customerCode,
    customerName: current.name,
    maskedAddress: maskedAddr,
    orderStatus: order.order_status,
    paymentMethod: order.payment_method,
    paymentStatus: order.payment_status,
    note: order.note,
    deliveryFee: order.delivery_fee,
    subtotal: order.subtotal,
    total: order.total,
    createdAt: order.created_at,
    items,
  };
}

export interface CustomerOrderSummary {
  id: string;
  orderNumber: string;
  total: number;
  orderStatus: string;
  createdAt: string;
  itemsCount: number;
  itemsSummary: string;
  items: Array<{
    menuId: string | null;
    menuName: string;
    quantity: number;
  }>;
}

/**
 * Mengambil riwayat pemesanan untuk halaman profil customer
 */
export async function getCustomerOrderHistory(): Promise<CustomerOrderSummary[]> {
  const current = await getCurrentCustomer();
  if (!current) return [];

  const adminClient = createAdminClient();

  const { data, error } = await adminClient
    .from("orders")
    .select(`
      id,
      order_number,
      total,
      order_status,
      created_at,
      order_items (
        menu_id,
        menu_name_snapshot,
        quantity
      )
    `)
    .eq("customer_id", current.id)
    .order("created_at", { ascending: false });

  if (error || !data) return [];

  return (data as Array<{
    id: string;
    order_number: string;
    total: number;
    order_status: string;
    created_at: string;
    order_items: Array<{
      menu_id: string | null;
      menu_name_snapshot: string;
      quantity: number;
    }>;
  }>).map((order) => {
    const rawItems = order.order_items || [];
    const itemsSummary = rawItems
      .map((it) => `${it.menu_name_snapshot} (${it.quantity})`)
      .join(", ");

    return {
      id: order.id,
      orderNumber: order.order_number,
      total: order.total,
      orderStatus: order.order_status,
      createdAt: order.created_at,
      itemsCount: rawItems.reduce((acc, cur) => acc + cur.quantity, 0),
      itemsSummary: itemsSummary || "Pesanan",
      items: rawItems.map((it) => ({
        menuId: it.menu_id,
        menuName: it.menu_name_snapshot,
        quantity: it.quantity,
      })),
    };
  });
}

/**
 * Memeriksa ketersediaan menu untuk fitur "Pesan seperti ini lagi"
 */
export async function checkReorderAvailability(
  items: Array<{ menuId: string | null; menuName: string; quantity: number }>
): Promise<{
  success: boolean;
  availableItems: Array<{
    dailyMenuId: string;
    menuId: string;
    name: string;
    price: number;
    quantity: number;
    remainingQuota: number;
    photoUrl?: string | null;
  }>;
  unavailableMessages: string[];
}> {
  const adminClient = createAdminClient();
  const today = new Date().toISOString().split("T")[0];

  const validMenuIds = items
    .map((i) => i.menuId)
    .filter((id): id is string => !!id);

  if (validMenuIds.length === 0) {
    return {
      success: false,
      availableItems: [],
      unavailableMessages: ["Menu dari riwayat ini sudah tidak tersedia."],
    };
  }

  // Cari daily_menus hari ini
  const { data: dailyData } = await adminClient
    .from("daily_menus")
    .select(`
      id,
      menu_id,
      quota,
      sold,
      is_available,
      menus (
        name,
        price,
        photo_url
      )
    `)
    .eq("menu_date", today)
    .in("menu_id", validMenuIds);

  const availableItems: Array<{
    dailyMenuId: string;
    menuId: string;
    name: string;
    price: number;
    quantity: number;
    remainingQuota: number;
    photoUrl?: string | null;
  }> = [];
  const unavailableMessages: string[] = [];

  for (const requested of items) {
    if (!requested.menuId) {
      unavailableMessages.push(`Menu "${requested.menuName}" sudah tidak aktif.`);
      continue;
    }

    const found = (dailyData as Array<{
      id: string;
      menu_id: string;
      quota: number;
      sold: number;
      is_available: boolean;
      menus: {
        name: string;
        price: number;
        photo_url?: string | null;
      } | null;
    }> | null)?.find((d) => d.menu_id === requested.menuId);
    if (!found || !found.is_available) {
      unavailableMessages.push(`"${requested.menuName}" tidak tersedia untuk menu hari ini.`);
      continue;
    }

    const remaining = found.quota - found.sold;
    if (remaining <= 0) {
      unavailableMessages.push(`"${requested.menuName}" sudah habis hari ini.`);
      continue;
    }

    const finalQty = Math.min(requested.quantity, remaining);
    if (finalQty < requested.quantity) {
      unavailableMessages.push(
        `"${requested.menuName}" hanya tersisa ${remaining} porsi (dimasukkan ${finalQty} porsi).`
      );
    }

    const m = found.menus as unknown as { name: string; price: number; photo_url?: string };

    availableItems.push({
      dailyMenuId: found.id,
      menuId: found.menu_id,
      name: m?.name || requested.menuName,
      price: m?.price || 0,
      quantity: finalQty,
      remainingQuota: remaining,
      photoUrl: m?.photo_url || null,
    });
  }

  return {
    success: availableItems.length > 0,
    availableItems,
    unavailableMessages,
  };
}
