"use server";

import { headers } from "next/headers";
import { normalizeWaNumber } from "@/lib/utils";
import { checkRateLimit } from "@/lib/rate-limit";
import { createAdminClient } from "@/lib/supabase/admin";
import { createCustomerSession, getCurrentCustomer, logout } from "@/lib/session";
import { revalidatePath } from "next/cache";

export interface CheckWaResult {
  success: boolean;
  isRegistered?: boolean;
  name?: string;
  waNumber?: string;
  error?: string;
}

export interface RegisterInput {
  waNumber: string;
  name: string;
  street: string;
  houseNumber: string;
  rtRw?: string;
  kelurahan?: string;
  kecamatan: string;
  city: string;
  detailNote?: string;
}

/**
 * Langkah 1: Cek nomor WA
 * Jika sudah terdaftar -> langsung buat sesi dan login (tanpa OTP).
 * Jika belum terdaftar -> kembalikan flag isRegistered = false agar diarahkan ke form pendaftaran.
 */
export async function checkOrLoginWa(rawWaNumber: string): Promise<CheckWaResult> {
  const headerList = headers();
  const clientIp = headerList.get("x-forwarded-for")?.split(",")[0] || "127.0.0.1";

  // Batasi percobaan masuk (10 percobaan per 10 menit per IP)
  const rateLimit = checkRateLimit(`login_${clientIp}`);
  if (!rateLimit.allowed) {
    return {
      success: false,
      error: `Terlalu banyak percobaan. Silakan coba lagi dalam ${rateLimit.retryAfterMinutes} menit.`,
    };
  }

  const norm = normalizeWaNumber(rawWaNumber);
  if (!norm.success) {
    return { success: false, error: norm.error };
  }

  const adminClient = createAdminClient();

  // Cari customer berdasarkan nomor WA
  const { data: customer, error } = await adminClient
    .from("customers")
    .select("id, customer_code, name, wa_number")
    .eq("wa_number", norm.waNumber)
    .maybeSingle();

  if (error) {
    console.error("Error cek customer:", error);
    return { success: false, error: "Terjadi kesalahan saat memeriksa akun." };
  }

  if (customer) {
    // SUDAH TERDAFTAR: Buat sesi langsung
    await createCustomerSession(customer.id);
    revalidatePath("/", "layout");
    return {
      success: true,
      isRegistered: true,
      name: customer.name,
      waNumber: customer.wa_number,
    };
  }

  // BELUM TERDAFTAR: Lanjut ke pengisian nama dan alamat
  return {
    success: true,
    isRegistered: false,
    waNumber: norm.waNumber,
  };
}

/**
 * Langkah 2: Pendaftaran Customer Baru + Alamat Pertama
 */
export async function registerCustomer(input: RegisterInput): Promise<{ success: boolean; error?: string }> {
  const norm = normalizeWaNumber(input.waNumber);
  if (!norm.success) {
    return { success: false, error: norm.error };
  }

  if (!input.name.trim()) {
    return { success: false, error: "Nama lengkap wajib diisi." };
  }
  if (!input.street.trim() || !input.houseNumber.trim() || !input.kecamatan.trim() || !input.city.trim()) {
    return { success: false, error: "Nama jalan, nomor rumah, kecamatan, dan kota wajib diisi." };
  }

  const adminClient = createAdminClient();

  // 1. Buat Customer (customer_code otomatis via trigger)
  const { data: customer, error: custError } = await adminClient
    .from("customers")
    .insert({
      name: input.name.trim(),
      wa_number: norm.waNumber,
      customer_code: "", // Akan digenerate trigger generate_customer_code
    })
    .select("id")
    .single();

  if (custError) {
    if (custError.code === "23505") { // Unique violation
      return { success: false, error: "Nomor WhatsApp ini sudah terdaftar." };
    }
    console.error("Gagal membuat customer:", custError);
    return { success: false, error: "Gagal membuat akun pelanggan." };
  }

  // Gabungkan ke full_address lengkap di server
  const fullAddress = `${input.street.trim()} No. ${input.houseNumber.trim()}${
    input.rtRw ? `, RT/RW ${input.rtRw.trim()}` : ""
  }${input.kelurahan ? `, Kel. ${input.kelurahan.trim()}` : ""}, Kec. ${input.kecamatan.trim()}, ${input.city.trim()}${
    input.detailNote ? ` (${input.detailNote.trim()})` : ""
  }`;

  // 2. Simpan Alamat Utama (is_default = true)
  const { error: addrError } = await adminClient.from("addresses").insert({
    customer_id: customer.id,
    label: "Rumah",
    street: input.street.trim(),
    house_number: input.houseNumber.trim(),
    rt_rw: input.rtRw?.trim() || null,
    kelurahan: input.kelurahan?.trim() || null,
    kecamatan: input.kecamatan.trim(),
    city: input.city.trim(),
    detail_note: input.detailNote?.trim() || null,
    full_address: fullAddress,
    is_default: true,
  });

  if (addrError) {
    console.error("Gagal menyimpan alamat awal:", addrError);
  }

  // 3. Buat sesi customer
  await createCustomerSession(customer.id);
  revalidatePath("/", "layout");

  return { success: true };
}

/**
 * Server action untuk logout
 */
export async function logoutAction() {
  await logout();
  revalidatePath("/", "layout");
}

/**
 * Server action untuk mengubah Nama atau No WA
 */
export async function updateCustomerProfile(name: string, rawWaNumber: string): Promise<{ success: boolean; error?: string }> {
  const current = await getCurrentCustomer();
  if (!current) {
    return { success: false, error: "Sesi telah berakhir. Silakan masuk kembali." };
  }

  const norm = normalizeWaNumber(rawWaNumber);
  if (!norm.success) {
    return { success: false, error: norm.error };
  }

  if (!name.trim()) {
    return { success: false, error: "Nama tidak boleh kosong." };
  }

  const adminClient = createAdminClient();

  const { error } = await adminClient
    .from("customers")
    .update({
      name: name.trim(),
      wa_number: norm.waNumber,
    })
    .eq("id", current.id);

  if (error) {
    if (error.code === "23505") {
      return { success: false, error: "Nomor WhatsApp tersebut sudah digunakan oleh pelanggan lain." };
    }
    return { success: false, error: "Gagal memperbarui profil." };
  }

  revalidatePath("/profil");
  return { success: true };
}
