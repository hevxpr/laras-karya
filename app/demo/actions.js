"use server";

import { signOutSilently } from "@/app/auth/session-actions";
import { clearHistory } from "@/lib/session";

/** Kembali jadi tamu (keluar dari Supabase dan hapus penanda riwayat). Dipanggil halaman /demo. */
export async function resetSession() {
  await signOutSilently();
  await clearHistory();
}
