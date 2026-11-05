import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { SUPABASE_KEY, SUPABASE_URL } from "@/lib/supabase/env";

/**
 * Klien Supabase untuk server: Server Component, Server Action, dan Route Handler.
 * Buat baru di setiap pemanggilan (jangan disimpan di variabel global).
 */
export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(SUPABASE_URL, SUPABASE_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) cookieStore.set(name, value, options);
        } catch {
          // Server Component tidak boleh menulis cookie; proxy.js yang menyegarkan sesi.
        }
      },
    },
  });
}
