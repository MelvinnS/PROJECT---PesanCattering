"use server";

import { requireAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

export interface MasterMenuItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  photoUrl: string | null;
  isActive: boolean;
}

export interface AdminDailyMenuItem {
  id: string;
  menuDate: string;
  menuId: string;
  menuName: string;
  menuPrice: number;
  photoUrl: string | null;
  quota: number;
  sold: number;
  isAvailable: boolean;
}

/**
 * Mengambil semua master menu
 */
export async function getMasterMenus(): Promise<MasterMenuItem[]> {
  await requireAdmin();
  const adminClient = createAdminClient();

  const { data, error } = await adminClient
    .from("menus")
    .select("id, name, description, price, photo_url, is_active")
    .order("name", { ascending: true });

  if (error || !data) return [];

  return (data as Array<{
    id: string;
    name: string;
    description: string | null;
    price: number;
    photo_url: string | null;
    is_active: boolean;
  }>).map((m) => ({
    id: m.id,
    name: m.name,
    description: m.description,
    price: m.price,
    photoUrl: m.photo_url,
    isActive: m.is_active,
  }));
}

/**
 * Tambah atau ubah master menu
 */
export async function saveMasterMenu(data: {
  id?: string;
  name: string;
  description?: string;
  price: number;
  photoUrl?: string;
  isActive: boolean;
}): Promise<{ success: boolean; error?: string }> {
  await requireAdmin();
  const adminClient = createAdminClient();

  if (!data.name.trim()) return { success: false, error: "Nama menu wajib diisi." };
  if (data.price < 0) return { success: false, error: "Harga tidak boleh negatif." };

  if (data.id) {
    const { error } = await adminClient
      .from("menus")
      .update({
        name: data.name.trim(),
        description: data.description?.trim() || null,
        price: data.price,
        photo_url: data.photoUrl || null,
        is_active: data.isActive,
        updated_at: new Date().toISOString(),
      })
      .eq("id", data.id);

    if (error) return { success: false, error: "Gagal memperbarui menu." };
  } else {
    const { error } = await adminClient.from("menus").insert({
      name: data.name.trim(),
      description: data.description?.trim() || null,
      price: data.price,
      photo_url: data.photoUrl || null,
      is_active: data.isActive,
    });

    if (error) return { success: false, error: "Gagal menambahkan menu baru." };
  }

  revalidatePath("/", "layout");
  revalidatePath("/admin/menu");
  return { success: true };
}

/**
 * Mengambil menu harian pada tanggal tertentu
 */
export async function getDailyMenusByDate(dateStr: string): Promise<AdminDailyMenuItem[]> {
  await requireAdmin();
  const adminClient = createAdminClient();

  const { data, error } = await adminClient
    .from("daily_menus")
    .select(`
      id,
      menu_date,
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
    .eq("menu_date", dateStr);

  if (error || !data) return [];

  return ((data as unknown) as Array<{
    id: string;
    menu_date: string;
    menu_id: string;
    quota: number;
    sold: number;
    is_available: boolean;
    menus: {
      name: string;
      price: number;
      photo_url: string | null;
    } | null;
  }>).map((dm) => ({
    id: dm.id,
    menuDate: dm.menu_date,
    menuId: dm.menu_id,
    menuName: dm.menus?.name || "Menu",
    menuPrice: dm.menus?.price || 0,
    photoUrl: dm.menus?.photo_url || null,
    quota: dm.quota,
    sold: dm.sold,
    isAvailable: dm.is_available,
  }));
}

/**
 * Tambah menu ke daily_menus
 */
export async function addMenuToDate(
  dateStr: string,
  menuId: string,
  quota: number
): Promise<{ success: boolean; error?: string }> {
  await requireAdmin();
  const adminClient = createAdminClient();

  if (quota <= 0) return { success: false, error: "Kuota minimal 1 porsi." };

  const { error } = await adminClient.from("daily_menus").insert({
    menu_date: dateStr,
    menu_id: menuId,
    quota,
    sold: 0,
    is_available: true,
  });

  if (error) {
    if (error.code === "23505") {
      return { success: false, error: "Menu ini sudah ada di tanggal tersebut." };
    }
    return { success: false, error: "Gagal menambahkan menu ke tanggal terpilih." };
  }

  revalidatePath("/", "layout");
  revalidatePath("/admin/menu");
  return { success: true };
}

/**
 * Ubah kuota atau status aktif daily_menu
 */
export async function updateDailyMenu(
  dailyMenuId: string,
  quota: number,
  isAvailable: boolean
): Promise<{ success: boolean; error?: string }> {
  await requireAdmin();
  const adminClient = createAdminClient();

  const { error } = await adminClient
    .from("daily_menus")
    .update({
      quota,
      is_available: isAvailable,
      updated_at: new Date().toISOString(),
    })
    .eq("id", dailyMenuId);

  if (error) return { success: false, error: "Gagal memperbarui menu harian." };

  revalidatePath("/", "layout");
  revalidatePath("/admin/menu");
  return { success: true };
}

/**
 * Hapus menu dari daily_menus (tidak boleh jika sudah ada yang memesan)
 */
export async function deleteDailyMenu(dailyMenuId: string): Promise<{ success: boolean; error?: string }> {
  await requireAdmin();
  const adminClient = createAdminClient();

  // Cek porsi sold
  const { data: dm } = await adminClient
    .from("daily_menus")
    .select("sold")
    .eq("id", dailyMenuId)
    .single();

  if (dm && dm.sold > 0) {
    return {
      success: false,
      error: `Tidak bisa menghapus menu ini karena sudah ada pesanan (${dm.sold} porsi). Nonaktifkan menu jika ingin menyembunyikannya.`,
    };
  }

  const { error } = await adminClient
    .from("daily_menus")
    .delete()
    .eq("id", dailyMenuId);

  if (error) return { success: false, error: "Gagal menghapus menu." };

  revalidatePath("/", "layout");
  revalidatePath("/admin/menu");
  return { success: true };
}

/**
 * Salin semua menu dan kuota dari tanggal lain ke tanggal target
 */
export async function copyDailyMenusFromDate(
  sourceDate: string,
  targetDate: string
): Promise<{ success: boolean; count?: number; error?: string }> {
  await requireAdmin();
  const adminClient = createAdminClient();

  const { data: sourceMenus, error: fetchError } = await adminClient
    .from("daily_menus")
    .select("menu_id, quota, is_available")
    .eq("menu_date", sourceDate);

  if (fetchError || !sourceMenus || sourceMenus.length === 0) {
    return { success: false, error: "Tidak ada menu pada tanggal sumber yang dipilih." };
  }

  // Masukkan satu per satu atau upsert ke targetDate
  let copied = 0;
  for (const item of sourceMenus) {
    const { error } = await adminClient.from("daily_menus").upsert(
      {
        menu_date: targetDate,
        menu_id: item.menu_id,
        quota: item.quota,
        sold: 0,
        is_available: item.is_available,
      },
      { onConflict: "menu_date,menu_id" }
    );
    if (!error) copied++;
  }

  revalidatePath("/", "layout");
  revalidatePath("/admin/menu");
  return { success: true, count: copied };
}
