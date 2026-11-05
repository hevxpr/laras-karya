"use server";

import { redirect } from "next/navigation";

import { clearHistory } from "@/lib/session";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

/** Keluar: hapus sesi Supabase dan penanda demo, lalu kembali ke landing page. */
export async function signOut() {
  if (isSupabaseConfigured) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }
  await clearHistory();
  redirect("/");
}
