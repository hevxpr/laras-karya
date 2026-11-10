"use server";

import { isUuid } from "@/lib/is-uuid";
import { createClient } from "@/lib/supabase/server";

/**
 * Simpan (saved = true) atau batalkan simpan (saved = false) satu lowongan untuk user yang sedang masuk.
 * Memakai sesi user, jadi tetap di bawah RLS: user hanya bisa mengubah baris saved_jobs miliknya sendiri.
 * Aman dipanggil berulang (menyimpan lowongan yang sudah tersimpan tidak membuat baris ganda).
 *
 * @param {string} jobId  UUID lowongan
 * @param {boolean} saved
 * @returns {Promise<{ ok: true } | { ok: false, error: "invalid" | "auth" | "db" }>}
 */
export async function setJobSaved(jobId, saved) {
  if (!isUuid(jobId) || typeof saved !== "boolean") return { ok: false, error: "invalid" };

  // Sama seperti Server Action lain di proyek ini (app/assessment/actions.js): user dibaca dari sesi Supabase.
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  const user = auth?.user;
  if (!user) return { ok: false, error: "auth" };

  const { error } = saved
    ? await supabase
        .from("saved_jobs")
        .upsert({ user_id: user.id, job_id: jobId }, { onConflict: "user_id,job_id", ignoreDuplicates: true })
    : await supabase.from("saved_jobs").delete().eq("user_id", user.id).eq("job_id", jobId);

  if (error) {
    console.error("[setJobSaved]", error.message);
    return { ok: false, error: "db" };
  }
  return { ok: true };
}
