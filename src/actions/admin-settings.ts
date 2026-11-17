"use server";

import { requireAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

export interface StoreSettings {
  store_name: string;
  order_cutoff_time: string;
  kitchen_lat: string;
  kitchen_lng: string;
  delivery_fee_per_km: string;
  support_wa_number: string;
}

/**
 * Mengambil semua settings
 */
export async function getStoreSettings(): Promise<StoreSettings> {
  await requireAdmin();
  const adminClient = createAdminClient();

  const { data } = await adminClient.from("settings").select("key, value");

  const settingsMap: Record<string, string> = {};
  (data || []).forEach((row) => {
    settingsMap[row.key] = row.value;
  });

  return {
    store_name: settingsMap["store_name"] || "DK Catering",
    order_cutoff_time: settingsMap["order_cutoff_time"] || "09:00",
    kitchen_lat: settingsMap["kitchen_lat"] || "-7.9666204",
    kitchen_lng: settingsMap["kitchen_lng"] || "112.6326321",
    delivery_fee_per_km: settingsMap["delivery_fee_per_km"] || "3000",
    support_wa_number: settingsMap["support_wa_number"] || "628991004545",
  };
}

/**
 * Memperbarui pengaturan toko (hanya menyimpan nilai di tabel settings)
 */
export async function updateStoreSettings(
  newSettings: Partial<StoreSettings>
): Promise<{ success: boolean; error?: string }> {
  await requireAdmin();
  const adminClient = createAdminClient();

  for (const [key, val] of Object.entries(newSettings)) {
    if (val !== undefined) {
      await adminClient.from("settings").upsert(
        {
          key,
          value: String(val).trim(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: "key" }
      );
    }
  }

  revalidatePath("/", "layout");
  revalidatePath("/admin/pengaturan");
  return { success: true };
}
