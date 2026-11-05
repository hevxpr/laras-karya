import { createBrowserClient } from "@supabase/ssr";

import { SUPABASE_KEY, SUPABASE_URL } from "@/lib/supabase/env";

/** Klien Supabase untuk komponen client ("use client"). Sesi dibaca dari cookie. */
export function createClient() {
  return createBrowserClient(SUPABASE_URL, SUPABASE_KEY);
}
