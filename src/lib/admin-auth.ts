import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";

export interface AdminUser {
  id: string;
  email: string;
  name: string;
}

/**
 * Verifikasi apakah request saat ini berasal dari user yang login di Supabase Auth
 * DAN terdaftar di tabel `admins`.
 */
export async function getAuthenticatedAdmin(): Promise<AdminUser | null> {
  const cookieStore = cookies();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) return null;

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set() {},
      remove() {},
    },
  });

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return null;

  // Verifikasi ke tabel admins memakai service role
  const adminClient = createAdminClient();
  const { data: adminRecord, error: adminError } = await adminClient
    .from("admins")
    .select("id, email, name")
    .eq("id", user.id)
    .maybeSingle();

  if (adminError || !adminRecord) {
    return null;
  }

  return {
    id: adminRecord.id,
    email: adminRecord.email,
    name: adminRecord.name,
  };
}

/**
 * Helper untuk Server Action yang membutuhkan hak akses Admin.
 * Melempar error ramah jika verifikasi gagal.
 */
export async function requireAdmin(): Promise<AdminUser> {
  const admin = await getAuthenticatedAdmin();
  if (!admin) {
    throw new Error("Akses ditolak: Anda harus login sebagai admin.");
  }
  return admin;
}
