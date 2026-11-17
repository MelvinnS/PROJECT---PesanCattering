"use server";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";

export interface AdminLoginResult {
  success: boolean;
  error?: string;
}

/**
 * Login admin dengan Email + Password via Supabase Auth
 * Memvalidasi apakah user terdaftar di tabel `admins`.
 */
export async function loginAdminAction(formData: FormData): Promise<AdminLoginResult> {
  const email = (formData.get("email") as string)?.trim();
  const password = (formData.get("password") as string)?.trim();

  if (!email || !password) {
    return { success: false, error: "Email dan kata sandi wajib diisi." };
  }

  const cookieStore = cookies();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return { success: false, error: "Konfigurasi server belum lengkap." };
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, options) {
        cookieStore.set({ name, value, ...options });
      },
      remove(name: string, options) {
        cookieStore.set({ name, value: "", ...options });
      },
    },
  });

  // Login ke Supabase Auth
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.user) {
    return { success: false, error: "Email atau kata sandi tidak sesuai." };
  }

  // Verifikasi ke tabel `admins`
  const adminClient = createAdminClient();
  const { data: adminRecord, error: adminError } = await adminClient
    .from("admins")
    .select("id, name")
    .eq("id", data.user.id)
    .maybeSingle();

  if (adminError || !adminRecord) {
    // Pengguna terdaftar di auth tapi bukan admin -> tolak dan logout
    await supabase.auth.signOut();
    return { success: false, error: "Akses ditolak: Akun Anda tidak memiliki hak akses administrator." };
  }

  return { success: true };
}

/**
 * Logout admin
 */
export async function logoutAdminAction() {
  const cookieStore = cookies();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (supabaseUrl && supabaseAnonKey) {
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name: string, options) {
          cookieStore.set({ name, value: "", ...options });
        },
      },
    });
    await supabase.auth.signOut();
  }

  redirect("/admin/login");
}
