import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Menggabungkan className dengan Tailwind merge & clsx
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format angka ke format mata uang Rupiah
 * Contoh: 25000 -> "Rp 25.000"
 */
export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format tanggal ke bahasa Indonesia
 * Contoh: "Senin, 16 November 2026"
 */
export function formatTanggalIndonesia(date: Date = new Date()): string {
  return new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  }).format(date);
}

/**
 * Normalisasi nomor WhatsApp ke standar Indonesia (62xxxxxxxxxx)
 * Menerima format: "0812-345 678", "+62 812...", "62812..."
 * Validasi 10-15 digit dan berawalan 62 setelah dinormalisasi
 */
export function normalizeWaNumber(input: string): { success: true; waNumber: string } | { success: false; error: string } {
  if (!input) {
    return { success: false, error: "Nomor WhatsApp wajib diisi." };
  }

  // Hapus semua karakter selain angka
  let cleaned = input.replace(/\D/g, "");

  // Konversi format awalan
  if (cleaned.startsWith("0")) {
    cleaned = "62" + cleaned.slice(1);
  } else if (cleaned.startsWith("8")) {
    cleaned = "62" + cleaned;
  }

  // Validasi: harus diawali 62 dan memiliki panjang 10-15 digit
  if (!cleaned.startsWith("62")) {
    return {
      success: false,
      error: "Nomor WA tidak valid, contoh: 0812 3456 7890",
    };
  }

  if (cleaned.length < 10 || cleaned.length > 15) {
    return {
      success: false,
      error: "Nomor WA tidak valid, contoh: 0812 3456 7890",
    };
  }

  return { success: true, waNumber: cleaned };
}

export interface MaskableAddress {
  street?: string | null;
  kecamatan?: string | null;
  full_address?: string | null;
}

/**
 * Menyamarkan alamat lengkap untuk privasi customer
 * Format: "{street}, No. ••, {kecamatan}" (contoh: "Jl. Melati No. ••, Lowokwaru")
 * RT/RW, patokan, dan nomor rumah asli TIDAK pernah ditampilkan.
 */
export function maskAddress(address: MaskableAddress): string {
  if (address.street && address.kecamatan) {
    return `${address.street} No. ••, ${address.kecamatan}`;
  }

  // Fallback regex jika hanya ada full_address string
  if (address.full_address) {
    // Cari pola "No. xx" atau angka dan ganti dengan "No. ••"
    const replaced = address.full_address.replace(/no\.?\s*\d+/gi, "No. ••");
    // Ambil bagian jalan dan kecamatan saja jika ada koma
    const parts = replaced.split(",").map((p) => p.trim());
    if (parts.length >= 2) {
      return `${parts[0]} No. ••, ${parts[1]}`;
    }
    return replaced;
  }

  return "Alamat tersimpan (No. ••)";
}
