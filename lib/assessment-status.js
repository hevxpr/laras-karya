import { createClient } from "@/lib/supabase/server";

/**
 * Apakah user sudah menyelesaikan asesmen karier? Dibaca dari tabel assessments (status "completed"),
 * sumber yang sama dengan loadMyAssessment() di app/assessment/actions.js. Hanya untuk server.
 * Panggil setelah getCurrentUser() (yang sudah menandai render ini dinamis, aturan Cache Components).
 *
 * @param {{ id: string }} user user yang sedang masuk (dari getCurrentUser)
 * @returns {Promise<boolean | null>} true / false, atau null bila gagal dibaca. Pemanggil menganggap
 *   null sebagai "sudah" supaya tampilan lama tetap dipakai, daripada menampilkan ajakan yang keliru.
 */
export async function hasCompletedAssessment(user) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("assessments")
    .select("status")
    .eq("user_id", user.id)
    .eq("status", "completed")
    .limit(1);
  if (error) {
    console.warn("[assessment-status] assessments:", error.message);
    return null;
  }
  return (data ?? []).length > 0;
}
