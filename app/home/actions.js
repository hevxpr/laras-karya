"use server";

import { getCurrentUser } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";

/**
 * Tombol "Perbarui Rekomendasi" di Beranda: meminta database menghitung ulang rekomendasi user yang
 * sedang masuk (fungsi refresh_my_recommendations, hasilnya disimpan di job_recommendations).
 * Mengembalikan { ok, error } seperti action lain di repo ini; halaman memuat ulang datanya sendiri.
 */
export async function refreshRecommendations() {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Sesi Anda berakhir. Silakan masuk lagi." };

  const supabase = await createClient();
  const { error } = await supabase.rpc("refresh_my_recommendations");
  if (error) {
    console.error("[home] refresh_my_recommendations:", error.message);
    return { ok: false, error: "Rekomendasi belum bisa diperbarui. Coba lagi beberapa saat lagi." };
  }
  return { ok: true };
}
