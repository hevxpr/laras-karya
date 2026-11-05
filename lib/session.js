import { cookies } from "next/headers";

import { HISTORY_COOKIE } from "@/lib/history-cookie";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

/**
 * Sesi pengguna dari Supabase Auth (pengganti lib/mock-session.js). Hanya untuk server.
 * getClaims() memverifikasi token, jadi aman dipakai untuk memutuskan akses.
 */
export async function getCurrentUser() {
  if (!isSupabaseConfigured) return null;
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims?.sub) return null;
  return { id: claims.sub, email: claims.email ?? null, name: claims.user_metadata?.full_name ?? null };
}

export async function hasSession() {
  return Boolean(await getCurrentUser());
}

/*
  Penanda demo "pengguna sudah punya riwayat" (lib/demo-history.js). Sengaja BUKAN httpOnly karena
  dibaca juga oleh komponen client. SEMENTARA, hapus bersama /demo saat data lamaran sudah dari database.
*/
export async function markHistory() {
  (await cookies()).set(HISTORY_COOKIE, "1", { path: "/", sameSite: "lax" });
}

export async function clearHistory() {
  (await cookies()).delete(HISTORY_COOKIE);
}
