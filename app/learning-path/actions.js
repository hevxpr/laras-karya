"use server";

import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

// Data & action untuk halaman Jalur Belajar.
// - Pelatihan dibaca dari tabel courses (hanya yang is_published).
// - Progres user disimpan di tabel user_course_progress. Memakai sesi user (bukan service role),
//   jadi dijaga RLS: user hanya membaca dan menulis progresnya sendiri.
// - Target posisi & skill gap MASIH contoh (mock) di bawah. Nanti diganti dari lowongan target user
//   + fungsi skill_gap di database; pelatihan per skill butuh tabel course_skills terisi.

// Target = lowongan demo "Sustainability Officer, PT Hijau Lestari" (lib/mock-jobs.js, id 1), supaya
// ceritanya nyambung dengan halaman rekomendasi. Skill gap sama dengan gap lowongan itu:
// Pelaporan ESG dan Regulasi Keberlanjutan belum dikuasai; Analisis Data dan Koordinasi Proyek sudah.
// Kalau kedua skill gap terpenuhi, skor kecocokan lowongan ini naik dari 83 ke 95.
const LEARNING_TARGET = {
  position: "Sustainability Officer",
  company: "PT Hijau Lestari",
  skillGaps: [
    { skill: "Pelaporan ESG", status: "Belum dikuasai", tone: "red" },
    { skill: "Regulasi Keberlanjutan", status: "Belum dikuasai", tone: "red" },
    { skill: "Analisis Data", status: "Sudah baik", tone: "green" },
    { skill: "Koordinasi Proyek", status: "Sudah baik", tone: "green" },
  ],
};

// Semua level digabung dalam satu daftar (tanpa langkah). Urutan: unggulan lebih dulu, lalu sort_order,
// lalu level (Pemula -> Menengah -> Lanjutan), lalu judul.
const LEVEL_ORDER = ["Pemula", "Menengah", "Lanjutan"];
const levelRank = (level) => {
  const i = LEVEL_ORDER.indexOf(level);
  return i === -1 ? 0 : i; // level kosong / tak dikenal diperlakukan seperti Pemula
};

// courses.format di database huruf kecil; tampilannya diberi huruf kapital di depan.
const FORMAT_LABELS = { online: "Online", hybrid: "Hybrid", offline: "Offline" };

// Status di database (user_course_progress.status) -> status di halaman.
// "planned" = belum dimulai, jadi tidak dikirim ke halaman.
const DB_TO_UI = { in_progress: "enrolled", completed: "completed" };

async function currentUser() {
  if (!isSupabaseConfigured) return { supabase: null, user: null };
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  return { supabase, user: data?.user ?? null };
}

function toCourse(row) {
  return {
    id: row.id,
    provider: row.provider ?? "",
    title: row.title,
    level: row.level ?? "Pemula",
    format: FORMAT_LABELS[row.format] ?? row.format ?? "Online",
    duration: row.duration_text ?? "",
    skillTag: row.category ?? null,
    popular: row.is_featured,
    imageUrl: row.image_url ?? null,
    url: row.url,
  };
}

function toCourses(rows) {
  return [...rows]
    .sort(
      (x, y) =>
        Number(y.is_featured) - Number(x.is_featured) ||
        (x.sort_order ?? 0) - (y.sort_order ?? 0) ||
        levelRank(x.level) - levelRank(y.level) ||
        x.title.localeCompare(y.title, "id")
    )
    .map(toCourse);
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

/** Ambil target posisi, langkah + course, dan status course milik user. */
export async function getLearningPath() {
  const { supabase, user } = await currentUser();
  if (!supabase) throw new Error("Koneksi database belum dikonfigurasi.");

  const { data: courses, error } = await supabase
    .from("courses")
    .select("id, title, url, level, provider, category, duration_text, format, image_url, is_featured, sort_order")
    .eq("is_published", true)
    .order("is_featured", { ascending: false })
    .order("sort_order", { ascending: true })
    .order("title", { ascending: true });
  if (error) {
    console.error("[getLearningPath] courses:", error.message);
    throw new Error("Pelatihan belum bisa dimuat. Coba lagi beberapa saat lagi.");
  }

  let progressRows = [];
  if (user) {
    const { data, error: progressError } = await supabase
      .from("user_course_progress")
      .select("course_id, status")
      .eq("user_id", user.id);
    if (progressError) {
      console.error("[getLearningPath] progress:", progressError.message);
      throw new Error("Progres belajar belum bisa dimuat. Coba lagi beberapa saat lagi.");
    }
    progressRows = data;
  }

  return {
    target: LEARNING_TARGET,
    courses: toCourses(courses),
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
