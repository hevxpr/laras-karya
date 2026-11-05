"use server";

import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

/** Keluar tanpa pindah halaman (dipakai /demo untuk kembali menjadi tamu). */
export async function signOutSilently() {
  if (!isSupabaseConfigured) return;
  const supabase = await createClient();
  await supabase.auth.signOut();
}
