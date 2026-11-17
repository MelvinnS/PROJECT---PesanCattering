import { createClient } from "@supabase/supabase-js";

/**
 * Supabase client dengan hak akses penuh (Service Role Key)
 * HANYA digunakan di lingkungan server (Server Actions / Route Handlers)
 * TIDAK PERNAH terekspos ke browser / Client Components.
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceRoleKey || serviceRoleKey.includes("your-service-role")) {
    console.warn("PERINGATAN: SUPABASE_SERVICE_ROLE_KEY belum diisi di .env.local!");
  }

  return createClient(
    supabaseUrl,
    serviceRoleKey || "service-role-placeholder",
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  );
}
