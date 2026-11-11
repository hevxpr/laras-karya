"use server";

import { fetchLearningPath } from "@/lib/learning-path-db";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

// Data & action untuk halaman Jalur Belajar.
// - Pelatihan dibaca dari tabel courses (hanya yang is_published). Tanpa ?job= semua pelatihan tampil; dengan
//   ?job=<uuid lowongan> hanya pelatihan untuk skill teknis lowongan itu yang belum dimiliki user
//   (lib/learning-path-db.js; urutan pelatihan di lib/course-order.js, titik sambung engine rekomendasi).
// - Progres user disimpan di tabel user_course_progress. Memakai sesi user (bukan service role),
//   jadi dijaga RLS: user hanya membaca dan menulis progresnya sendiri.
// - Kotak "Target Posisi & Skill Gap" hanya tampil dengan ?job= (datanya dari lowongan sungguhan);
//   tanpa ?job= tidak ada target, jadi kotak itu disembunyikan. Pelatihan per skill butuh tabel course_skills terisi.

// Status di database (user_course_progress.status) -> status di halaman.
// "planned" = belum dimulai, jadi tidak dikirim ke halaman.
const DB_TO_UI = { in_progress: "enrolled", completed: "completed" };

async function currentUser() {
  if (!isSupabaseConfigured) return { supabase: null, user: null };
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  return { supabase, user: data?.user ?? null };
}

/**
 * Status tiap course milik user: { [courseId]: { status: "enrolled" | "completed" } }
 * - enrolled  : user sudah klik daftar / mulai di situs provider (in_progress di database)
 * - completed : user menekan "Sudah Selesai Diikuti"
 * Course yang tidak ada di objek ini = belum dimulai.
 */
function toProgress(rows) {
  const progress = {};
  for (const row of rows ?? []) {
    const status = DB_TO_UI[row.status];
    if (status) progress[row.course_id] = { status };
  }
  return progress;
}

/**
 * Ambil pelatihan + progres milik user.
 * @param {string | null} [jobParam] nilai ?job= dari URL: id (UUID) lowongan untuk memfilter pelatihan sesuai skill gap-nya
 */
export async function getLearningPath(jobParam = null) {
  const { supabase, user } = await currentUser();
  if (!supabase) throw new Error("Koneksi database belum dikonfigurasi.");
  // Skill gap dihitung dari skill milik user, jadi wajib masuk (halaman ini juga dijaga proxy).
  if (!user) throw new Error("Sesi Anda berakhir. Silakan masuk lagi.");

  const path = await fetchLearningPath(supabase, user, typeof jobParam === "string" ? jobParam : null);

  const { data: progressRows, error: progressError } = await supabase
    .from("user_course_progress")
    .select("course_id, status")
    .eq("user_id", user.id);
  if (progressError) {
    console.error("[getLearningPath] progress:", progressError.message);
    throw new Error("Progres belajar belum bisa dimuat. Coba lagi beberapa saat lagi.");
  }

  return {
    mode: path.mode,
    job: path.job,
    jobNotFound: path.jobNotFound,
    gap: path.gap,
    // Hanya mode lowongan yang punya target; mode semua pelatihan: null (kotak target disembunyikan).
    target:
      path.mode === "job"
        ? { position: path.job.title, company: path.job.company, ...path.gap.hero }
        : null,
    courses: path.courses,
    progress: toProgress(progressRows),
  };
}

async function requireUser() {
  const { supabase, user } = await currentUser();
  if (!user) throw new Error("Sesi Anda berakhir. Silakan masuk lagi.");
  return { supabase, user };
}

function failSave(step, error) {
  console.error(`[${step}]`, error?.message ?? error);
  return new Error("Progres belum tersimpan. Coba lagi beberapa saat lagi.");
}

/** Catat bahwa user mulai mengikuti course (status "Sedang diikuti"). Course yang sudah selesai tidak diturunkan. */
export async function startCourse(id) {
  const { supabase, user } = await requireUser();

  const { data: existing, error: readError } = await supabase
    .from("user_course_progress")
    .select("status")
    .eq("user_id", user.id)
    .eq("course_id", id)
    .maybeSingle();
  if (readError) throw failSave("startCourse", readError);
  if (existing?.status === "completed") return { id, status: "completed" };

  const { error } = await supabase
    .from("user_course_progress")
    .upsert({ user_id: user.id, course_id: id, status: "in_progress" }, { onConflict: "user_id,course_id" });
  if (error) throw failSave("startCourse", error);

  return { id, status: "enrolled" };
}

/** Tandai course selesai ("Sudah Selesai Diikuti"). */
export async function completeCourse(id) {
  const { supabase, user } = await requireUser();

  const { error } = await supabase.from("user_course_progress").upsert(
    { user_id: user.id, course_id: id, status: "completed", completed_at: new Date().toISOString() },
    { onConflict: "user_id,course_id" }
  );
  if (error) throw failSave("completeCourse", error);

  return { id, status: "completed" };
}
