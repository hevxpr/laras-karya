"use server";

import { revalidatePath } from "next/cache";

import { isUuid } from "@/lib/is-uuid";
import { todayWib } from "@/lib/job-detail-mapping";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

const MAX_LETTER = 5000;

/**
 * Kirim lamaran: simpan satu baris ke tabel applications untuk user yang sedang masuk.
 * Memakai sesi user (bukan service role), jadi dijaga RLS applications_insert_own:
 * user_id harus sama dengan user yang masuk dan current_status harus "diproses" (tampil "Dilamar").
 * Melamar dua kali dicegah database lewat UNIQUE (user_id, job_id) -> kode error 23505.
 *
 * Hasil: { ok: true } | { ok: false, error: "auth" | "invalid" | "notfound" | "closed" | "duplicate" | "db" }
 *
 * Belum disimpan: file CV/portfolio (belum ada bucket Storage), jadi resume_url dan portfolio_url dibiarkan kosong.
 *
 * @param {{ jobId: string, coverLetter?: string }} input
 */
export async function submitApplication({ jobId, coverLetter } = {}) {
  if (!isSupabaseConfigured) return { ok: false, error: "auth" };
  if (!isUuid(jobId)) return { ok: false, error: "invalid" };

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  const user = auth?.user;
  if (!user) return { ok: false, error: "auth" };

  // Validasi ulang di server: jangan percaya data dari browser (lowongan harus masih dibuka).
  const { data: job, error: jobError } = await supabase
    .from("jobs")
    .select("id,status,deadline")
    .eq("id", jobId)
    .maybeSingle();
  if (jobError) {
    console.error("[submitApplication] jobs:", jobError.message);
    return { ok: false, error: "db" };
  }
  if (!job) return { ok: false, error: "notfound" };
  const open = job.status === "published" && (!job.deadline || String(job.deadline).slice(0, 10) >= todayWib());
  if (!open) return { ok: false, error: "closed" };

  const { error } = await supabase.from("applications").insert({
    user_id: user.id,
    job_id: jobId,
    // Tidak pernah null: aman juga bila kolom ini nanti dijadikan NOT NULL.
    cover_letter: String(coverLetter ?? "").trim().slice(0, MAX_LETTER),
    current_status: "diproses",
  });

  if (error) {
    if (error.code === "23505") return { ok: false, error: "duplicate" }; // sudah pernah melamar
    console.error("[submitApplication] applications:", error.message);
    return { ok: false, error: "db" };
  }

  // Semua halaman yang menampilkan status lamaran (detail, daftar, Beranda, Lamaran Saya) dibaca ulang.
  revalidatePath("/", "layout");
  return { ok: true };
}
