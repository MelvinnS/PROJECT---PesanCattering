import crypto from "crypto";
import { cookies, headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { CustomerSessionData } from "@/lib/supabase/types";

export const SESSION_COOKIE_NAME = "dk_session";
const ONE_YEAR_SECONDS = 365 * 24 * 60 * 60;

/**
 * Hash token 32 byte dengan SHA-256 menjadi 64-character hex string
 */
export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

/**
 * Buat sesi baru untuk customer dan set cookie jangka panjang (1 tahun)
 */
export async function createCustomerSession(customerId: string): Promise<string> {
  const token = crypto.randomBytes(32).toString("hex");
  const tokenHash = hashToken(token);

  const headerList = headers();
  const userAgent = headerList.get("user-agent") || "Unknown Device";

  const adminClient = createAdminClient();

  const expiresAt = new Date(Date.now() + ONE_YEAR_SECONDS * 1000).toISOString();

  // Simpan token_hash di tabel sessions
  const { error } = await adminClient.from("sessions").insert({
    customer_id: customerId,
    token_hash: tokenHash,
    device_info: userAgent.slice(0, 255),
    expires_at: expiresAt,
  });

  if (error) {
    console.error("Gagal membuat sesi customer:", error);
    throw new Error("Gagal menyimpan sesi login.");
  }

  // Set HTTP-only Cookie
  const isProduction = process.env.NODE_ENV === "production";
  cookies().set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    path: "/",
    maxAge: ONE_YEAR_SECONDS,
  });

  return token;
}

/**
 * Ambil customer yang sedang login dari cookie dk_session.
 * Memperbarui last_used_at secara otomatis jika sesi valid.
 */
export async function getCurrentCustomer(): Promise<CustomerSessionData | null> {
  try {
    const token = cookies().get(SESSION_COOKIE_NAME)?.value;
    if (!token) return null;

    const tokenHash = hashToken(token);
    const adminClient = createAdminClient();

    // Query sesi yang valid dan belum expired
    const { data: sessionData, error } = await adminClient
      .from("sessions")
      .select(`
        id,
        customer_id,
        expires_at,
        customer:customer_id (
          id,
          customer_code,
          name,
          wa_number
        )
      `)
      .eq("token_hash", tokenHash)
      .maybeSingle();

    if (error || !sessionData || !sessionData.customer) {
      return null;
    }

    // Periksa tanggal kedaluwarsa
    if (new Date(sessionData.expires_at) < new Date()) {
      return null;
    }

    // Perbarui last_used_at di background
    adminClient
      .from("sessions")
      .update({ last_used_at: new Date().toISOString() })
      .eq("id", sessionData.id)
      .then();

    const c = sessionData.customer as unknown as {
      id: string;
      customer_code: string;
      name: string;
      wa_number: string;
    };

    return {
      id: c.id,
      customerCode: c.customer_code,
      name: c.name,
      waNumber: c.wa_number,
    };
  } catch (err: unknown) {
    if (typeof err === "object" && err !== null && "digest" in err && (err as { digest: string }).digest === "DYNAMIC_SERVER_USAGE") {
      throw err;
    }
    console.error("Error di getCurrentCustomer:", err);
    return null;
  }
}

/**
 * Hapus sesi dari database dan bersihkan cookie
 */
export async function logout(): Promise<void> {
  try {
    const token = cookies().get(SESSION_COOKIE_NAME)?.value;
    if (token) {
      const tokenHash = hashToken(token);
      const adminClient = createAdminClient();
      await adminClient.from("sessions").delete().eq("token_hash", tokenHash);
    }
  } catch (err) {
    console.error("Gagal menghapus sesi database:", err);
  } finally {
    cookies().delete(SESSION_COOKIE_NAME);
  }
}
