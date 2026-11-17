"use server";

import { getCurrentCustomer } from "@/lib/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { MaskedAddress } from "@/lib/supabase/types";
import { maskAddress } from "@/lib/utils";
import { revalidatePath } from "next/cache";

export interface NewAddressInput {
  label: string;
  street: string;
  houseNumber: string;
  rtRw?: string;
  kelurahan?: string;
  kecamatan: string;
  city: string;
  detailNote?: string;
  isDefault?: boolean;
}

/**
 * Mengambil daftar alamat customer dengan format DISAMARKAN
 * Kolom sensitif (nomor rumah, RT/RW, patokan) TIDAK PERNAH dikirim ke client.
 */
export async function getCustomerMaskedAddresses(): Promise<MaskedAddress[]> {
  const current = await getCurrentCustomer();
  if (!current) return [];

  const adminClient = createAdminClient();

  const { data, error } = await adminClient
    .from("addresses")
    .select("id, label, street, kecamatan, is_default, full_address")
    .eq("customer_id", current.id)
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: true });

  if (error || !data) {
    console.error("Gagal mengambil alamat customer:", error);
    return [];
  }

  return (data as Array<{
    id: string;
    label: string;
    street: string | null;
    kecamatan: string | null;
    is_default: boolean;
    full_address: string;
  }>).map((addr) => ({
    id: addr.id,
    label: addr.label,
    maskedAddress: maskAddress({
      street: addr.street,
      kecamatan: addr.kecamatan,
      full_address: addr.full_address,
    }),
    isDefault: addr.is_default,
  }));
}

/**
 * Menambahkan alamat baru
 */
export async function addCustomerAddress(input: NewAddressInput): Promise<{ success: boolean; error?: string }> {
  const current = await getCurrentCustomer();
  if (!current) {
    return { success: false, error: "Silakan masuk terlebih dahulu." };
  }

  if (!input.street.trim() || !input.houseNumber.trim() || !input.kecamatan.trim() || !input.city.trim()) {
    return { success: false, error: "Jalan, nomor rumah, kecamatan, dan kota wajib diisi." };
  }

  const adminClient = createAdminClient();

  const fullAddress = `${input.street.trim()} No. ${input.houseNumber.trim()}${
    input.rtRw ? `, RT/RW ${input.rtRw.trim()}` : ""
  }${input.kelurahan ? `, Kel. ${input.kelurahan.trim()}` : ""}, Kec. ${input.kecamatan.trim()}, ${input.city.trim()}${
    input.detailNote ? ` (${input.detailNote.trim()})` : ""
  }`;

  // Jika isDefault = true, lepaskan default sebelumnya
  if (input.isDefault) {
    await adminClient
      .from("addresses")
      .update({ is_default: false })
      .eq("customer_id", current.id);
  }

  const { error } = await adminClient.from("addresses").insert({
    customer_id: current.id,
    label: input.label.trim() || "Rumah",
    street: input.street.trim(),
    house_number: input.houseNumber.trim(),
    rt_rw: input.rtRw?.trim() || null,
    kelurahan: input.kelurahan?.trim() || null,
    kecamatan: input.kecamatan.trim(),
    city: input.city.trim(),
    detail_note: input.detailNote?.trim() || null,
    full_address: fullAddress,
    is_default: !!input.isDefault,
  });

  if (error) {
    console.error("Gagal menambah alamat:", error);
    return { success: false, error: "Gagal menyimpan alamat baru." };
  }

  revalidatePath("/profil");
  revalidatePath("/pesan");
  return { success: true };
}

/**
 * Mengubah alamat yang sudah ada (mengisi ulang data alamat baru untuk keamanan)
 */
export async function updateCustomerAddress(
  addressId: string,
  input: NewAddressInput
): Promise<{ success: boolean; error?: string }> {
  const current = await getCurrentCustomer();
  if (!current) return { success: false, error: "Sesi telah berakhir." };

  if (!input.street.trim() || !input.houseNumber.trim() || !input.kecamatan.trim() || !input.city.trim()) {
    return { success: false, error: "Jalan, nomor rumah, kecamatan, dan kota wajib diisi." };
  }

  const adminClient = createAdminClient();

  const fullAddress = `${input.street.trim()} No. ${input.houseNumber.trim()}${
    input.rtRw ? `, RT/RW ${input.rtRw.trim()}` : ""
  }${input.kelurahan ? `, Kel. ${input.kelurahan.trim()}` : ""}, Kec. ${input.kecamatan.trim()}, ${input.city.trim()}${
    input.detailNote ? ` (${input.detailNote.trim()})` : ""
  }`;

  if (input.isDefault) {
    await adminClient
      .from("addresses")
      .update({ is_default: false })
      .eq("customer_id", current.id);
  }

  const { error } = await adminClient
    .from("addresses")
    .update({
      label: input.label.trim() || "Rumah",
      street: input.street.trim(),
      house_number: input.houseNumber.trim(),
      rt_rw: input.rtRw?.trim() || null,
      kelurahan: input.kelurahan?.trim() || null,
      kecamatan: input.kecamatan.trim(),
      city: input.city.trim(),
      detail_note: input.detailNote?.trim() || null,
      full_address: fullAddress,
      is_default: input.isDefault !== undefined ? input.isDefault : undefined,
    })
    .eq("id", addressId)
    .eq("customer_id", current.id);

  if (error) {
    return { success: false, error: "Gagal memperbarui alamat." };
  }

  revalidatePath("/profil");
  revalidatePath("/pesan");
  return { success: true };
}

/**
 * Jadikan satu alamat sebagai alamat utama
 */
export async function setDefaultAddress(addressId: string): Promise<{ success: boolean; error?: string }> {
  const current = await getCurrentCustomer();
  if (!current) return { success: false, error: "Sesi telah berakhir." };

  const adminClient = createAdminClient();

  // Reset default
  await adminClient
    .from("addresses")
    .update({ is_default: false })
    .eq("customer_id", current.id);

  // Set alamat terpilih sebagai default
  const { error } = await adminClient
    .from("addresses")
    .update({ is_default: true })
    .eq("id", addressId)
    .eq("customer_id", current.id);

  if (error) {
    return { success: false, error: "Gagal menjadikan alamat utama." };
  }

  revalidatePath("/profil");
  revalidatePath("/pesan");
  return { success: true };
}

/**
 * Hapus alamat (tidak boleh menghapus jika alamat terakhir)
 */
export async function deleteCustomerAddress(addressId: string): Promise<{ success: boolean; error?: string }> {
  const current = await getCurrentCustomer();
  if (!current) return { success: false, error: "Sesi telah berakhir." };

  const adminClient = createAdminClient();

  // Hitung jumlah alamat
  const { count, error: countError } = await adminClient
    .from("addresses")
    .select("id", { count: "exact", head: true })
    .eq("customer_id", current.id);

  if (countError || count === null || count <= 1) {
    return { success: false, error: "Anda tidak dapat menghapus alamat terakhir. Minimal miliki 1 alamat." };
  }

  // Hapus alamat
  const { error } = await adminClient
    .from("addresses")
    .delete()
    .eq("id", addressId)
    .eq("customer_id", current.id);

  if (error) {
    return { success: false, error: "Gagal menghapus alamat." };
  }

  // Jika yang dihapus default, jadikan alamat pertama yang tersisa sebagai default
  const { data: remaining } = await adminClient
    .from("addresses")
    .select("id, is_default")
    .eq("customer_id", current.id)
    .limit(1);

  if (remaining && remaining.length > 0 && !remaining[0].is_default) {
    await adminClient
      .from("addresses")
      .update({ is_default: true })
      .eq("id", remaining[0].id);
  }

  revalidatePath("/profil");
  revalidatePath("/pesan");
  return { success: true };
}
