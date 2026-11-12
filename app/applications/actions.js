"use server";

import { revalidatePath } from "next/cache";

import { loadMyProfile } from "@/app/profile/data-actions";
import { buildProfileSnapshot } from "@/lib/applicant-mapping";
import { isUuid } from "@/lib/is-uuid";
import { todayWib } from "@/lib/job-detail-mapping";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

const MAX_LETTER = 5000;

/** Kolom belum ada di database (migrasi SQL belum dijalankan): PostgREST PGRST204 atau Postgres 42703. */
function isMissingNewColumn(error) {
  return (
    error?.code === "PGRST204" ||
    error?.code === "42703" ||
    (/profile_snapshot|terms_accepted_at/.test(error?.message ?? "") && /column/i.test(error?.message ?? ""))
  );
}

/**
 * Kirim lamaran: simpan satu baris ke tabel applications untuk user yang sedang masuk.
 * Memakai sesi user (bukan service role), jadi dijaga RLS applications_insert_own:
 * user_id harus sama dengan user yang masuk dan current_status harus "diproses" (tampil "Dilamar").
 * Melamar dua kali dicegah database lewat UNIQUE (user_id, job_id) -> kode error 23505.
 *
 * Yang disimpan bersama lamaran:
 *  - cover_letter        surat lamaran (wajib berisi)
 *  - terms_accepted_at   waktu pengguna menyetujui pernyataan (diisi server saat termsAccepted === true)
 *  - profile_snapshot    salinan profil saat melamar, disusun di server dari database (bukan dari browser)
 * Kolom baru itu dibuat oleh sql/migrasi_applications_persiapan_lamaran.sql. Bila migrasinya belum dijalankan,
 * lamaran tetap tersimpan tanpa kolom itu (peringatan di log server) supaya alur tidak putus.
 *
 * Hasil: { ok: true } | { ok: false, error: "auth" | "invalid" | "terms" | "letter" | "notfound" | "closed" | "duplicate" | "db" }
 *
 * Belum disimpan: file CV/portfolio (belum ada bucket Storage), jadi resume_url dan portfolio_url dibiarkan kosong.
 *
 * @param {{ jobId: string, coverLetter?: string, termsAccepted?: boolean }} input
 */
export async function submitApplication({ jobId, coverLetter, termsAccepted } = {}) {
  if (!isSupabaseConfigured) return { ok: false, error: "auth" };
  if (!isUuid(jobId)) return { ok: false, error: "invalid" };
  if (termsAccepted !== true) return { ok: false, error: "terms" };
  const letter = String(coverLetter ?? "").trim().slice(0, MAX_LETTER);
  if (!letter) return { ok: false, error: "letter" };

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

  // Snapshot dari profil di database. Bila profil gagal dibaca, tetap kirim snapshot minimal (nama dan email akun).
  const profile = await loadMyProfile();
  const snapshot = buildProfileSnapshot(profile, { name: user.user_metadata?.full_name, email: user.email });

  const base = { user_id: user.id, job_id: jobId, cover_letter: letter, current_status: "diproses" };
  const full = { ...base, profile_snapshot: snapshot, terms_accepted_at: new Date().toISOString() };

  let { error } = await supabase.from("applications").insert(full);
  if (error && isMissingNewColumn(error)) {
    console.warn("[submitApplication] kolom profile_snapshot/terms_accepted_at belum ada; jalankan migrasi SQL. Menyimpan tanpa kolom itu.");
    ({ error } = await supabase.from("applications").insert(base));
  }

  if (error) {
    if (error.code === "23505") return { ok: false, error: "duplicate" }; // sudah pernah melamar
    if (error.code === "23514") return { ok: false, error: "letter" }; // CHECK: surat tidak boleh kosong
    console.error("[submitApplication] applications:", error.message);
    return { ok: false, error: "db" };
  }

  // Semua halaman yang menampilkan status lamaran (detail, daftar, Beranda, Lamaran Saya) dibaca ulang.
  revalidatePath("/", "layout");
  return { ok: true };
}
