"use server";

import { requireAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateCookingRecapEscpos, createRawbtUrl } from "@/lib/escpos";
import { formatTanggalIndonesia } from "@/lib/utils";

export interface CookingRecapItem {
  menuId: string | null;
  menuName: string;
  totalPortions: number;
  notes: Array<{
    order_number: string;
    quantity: number;
    item_note: string | null;
    order_note: string | null;
  }>;
}

/**
 * Mengambil data rekap masak per tanggal
 */
export async function getCookingRecapData(dateStr: string): Promise<{
  date: string;
  dateFormatted: string;
  items: CookingRecapItem[];
  totalPortions: number;
  specialNotes: Array<{ orderNumber: string; note: string }>;
  rawbtUrl: string;
}> {
  await requireAdmin();
  const adminClient = createAdminClient();

  const { data, error } = await adminClient.rpc("get_cooking_recap", {
    p_date: dateStr,
  });

  if (error || !data) {
    console.error("Gagal memuat rekap masak:", error);
    return {
      date: dateStr,
      dateFormatted: formatTanggalIndonesia(new Date(dateStr)),
      items: [],
      totalPortions: 0,
      specialNotes: [],
      rawbtUrl: "",
    };
  }

  const items = (data as Array<{
    menu_id: string | null;
    menu_name: string;
    total_portions: number;
    notes: unknown;
  }>).map((r) => ({
    menuId: r.menu_id,
    menuName: r.menu_name,
    totalPortions: Number(r.total_portions),
    notes: (Array.isArray(r.notes) ? r.notes : []) as Array<{
      order_number: string;
      quantity: number;
      item_note: string | null;
      order_note: string | null;
    }>,
  }));

  const totalPortions = items.reduce((sum, it) => sum + it.totalPortions, 0);

  // Kumpulkan catatan khusus unik
  const specialNotes: Array<{ orderNumber: string; note: string }> = [];
  const seenOrders = new Set<string>();

  items.forEach((item) => {
    item.notes.forEach((n) => {
      if (seenOrders.has(n.order_number)) return;
      seenOrders.add(n.order_number);

      const noteParts: string[] = [];
      if (n.order_note) noteParts.push(n.order_note);
      if (n.item_note) noteParts.push(n.item_note);

      if (noteParts.length > 0) {
        specialNotes.push({
          orderNumber: n.order_number,
          note: noteParts.join("; "),
        });
      }
    });
  });

  const dateFormatted = formatTanggalIndonesia(new Date(dateStr));

  // Buat string ESC/POS dan link RawBT
  const escpos = generateCookingRecapEscpos(
    dateFormatted,
    items.map((i) => ({ menuName: i.menuName, totalPortions: i.totalPortions })),
    specialNotes
  );
  const rawbtUrl = createRawbtUrl(escpos);

  return {
    date: dateStr,
    dateFormatted,
    items,
    totalPortions,
    specialNotes,
    rawbtUrl,
  };
}
