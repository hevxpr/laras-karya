import { connection } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { todayWib } from "@/lib/job-detail-mapping";

/**
 * Saran pelatihan di Beranda (bagian "Pelatihan untuk Menutup Skill Gap Anda"). Hanya untuk server.
 * Semua query memakai sesi user yang sedang masuk, jadi tetap di bawah RLS.
 *
 * Cara menyusun saran (dari rekomendasi lowongan user):
 * 1) Ambil lowongan rekomendasi user (job_recommendations) yang masih published dan belum lewat deadline.
 * 2) Hitung skill lowongan-lowongan itu yang BELUM dimiliki user (user_skills) = skill gap.
 *    Urutan prioritas sama dengan lib/skill-gap-data.js: skill wajib (job_skills.is_required) dulu,
 *    lalu yang diminta paling banyak lowongan cocok, lalu nama.
 * 3) Skill gap teratas yang punya pelatihan (course_skills, courses published) jadi "skill utama".
 *    Tiga pelatihan diambil dari skill utama dulu, lalu dilengkapi dari skill gap berikutnya.
 */

const FORMAT_LABELS = { online: "Online", hybrid: "Hybrid", offline: "Offline" };
const isHttpUrl = (url) => /^https?:\/\//i.test(String(url ?? ""));
const one = (rel) => (Array.isArray(rel) ? rel[0] : rel);

const COURSE_COLUMNS =
  "id,title,url,provider,level,duration_text,format,image_url,is_featured,sort_order,is_published";

/** Pelatihan urut: unggulan dulu, lalu sort_order, lalu judul. */
const byCourseOrder = (a, b) =>
  Number(Boolean(b.is_featured)) - Number(Boolean(a.is_featured)) ||
  (a.sort_order ?? 0) - (b.sort_order ?? 0) ||
  String(a.title).localeCompare(String(b.title), "id");

/**
 * Menghitung skill gap dari baris job_skills milik lowongan rekomendasi.
 * @param {Array} rows baris job_skills (dengan skills(label) dan jobs(status, deadline))
 * @param {Set<string>} owned kode skill yang sudah dimiliki user
 * @param {string} today "YYYY-MM-DD" (WIB)
 * @returns {Array<{ code: string, label: string, demand: number, required: number }>} sudah berurutan prioritas
 */
export function rankSkillGaps(rows, owned, today) {
  const stats = new Map();
  for (const row of rows ?? []) {
    const code = row?.skill_code;
    const job = one(row?.jobs);
    if (!code || !row.job_id || owned.has(code)) continue;
    if (!job || job.status !== "published" || (job.deadline && String(job.deadline) < today)) continue;
    if (!stats.has(code)) stats.set(code, { code, label: one(row.skills)?.label ?? code, jobs: new Set(), required: new Set() });
    const s = stats.get(code);
    s.jobs.add(row.job_id);
    if (row.is_required === true) s.required.add(row.job_id);
  }
  return [...stats.values()]
    .map((s) => ({ code: s.code, label: s.label, demand: s.jobs.size, required: s.required.size }))
    .sort(
      (a, b) =>
        Number(b.required > 0) - Number(a.required > 0) ||
        b.demand - a.demand ||
        a.label.localeCompare(b.label, "id"),
    );
}

/**
 * Memilih hingga `limit` pelatihan: dari skill gap teratas dulu, tanpa pelatihan ganda.
 * @param {Array<{ code: string, label: string }>} ranked skill gap berurutan prioritas
 * @param {Array} courseRows baris course_skills (dengan courses)
 * @returns {{ focus: object|null, picks: Array<{ course: object, skillLabel: string }> }}
 *   `focus` = skill gap teratas yang punya pelatihan
 */
export function pickCourses(ranked, courseRows, limit = 3) {
  const bySkill = new Map();
  for (const row of courseRows ?? []) {
    const course = one(row?.courses);
    if (!course?.id || !course.title || !isHttpUrl(course.url) || course.is_published === false) continue;
    if (!bySkill.has(row.skill_code)) bySkill.set(row.skill_code, new Map());
    bySkill.get(row.skill_code).set(course.id, course);
  }

  let focus = null;
  const picks = [];
  const used = new Set();
  for (const skill of ranked) {
    const courses = [...(bySkill.get(skill.code)?.values() ?? [])].sort(byCourseOrder);
    if (courses.length === 0) continue;
    focus ??= skill;
    for (const course of courses) {
      if (picks.length >= limit) break;
      if (used.has(course.id)) continue;
      used.add(course.id);
      picks.push({ course, skillLabel: skill.label });
    }
    if (picks.length >= limit) break;
  }
  return { focus, picks };
}

/** Pelatihan database -> bentuk kartu Beranda (components/home/course-card.jsx). */
function toHomeCourse({ course, skillLabel }, isPrimary) {
  return {
    id: course.id,
    provider: course.provider ?? "Udemy",
    title: course.title,
    level: course.level ?? "Pemula",
    duration: course.duration_text ?? "",
    mode: FORMAT_LABELS[course.format] ?? "Online",
    focusSkill: skillLabel,
    image: course.image_url ?? null,
    isPopular: Boolean(course.is_featured),
    isPrimary,
  };
}

/**
 * @param {{ id: string }} user user yang sedang masuk (dari getCurrentUser)
 * @returns {Promise<{
 *   alert: { skill: string, gapCount: number } | null,
 *   courses: object[],
 *   note: string | null,
 *   error: string | null,
 * }>} `note` = penjelasan bila belum ada saran (belum ada rekomendasi, tidak ada skill gap, atau belum ada pelatihan)
 */
export async function fetchHomeCourses(user) {
  // Memakai "hari ini" dan sesi user: harus dirender per permintaan, connection() paling awal.
  await connection();
  const supabase = await createClient();
  const today = todayWib();

  const [recRes, ownedRes] = await Promise.all([
    supabase.from("job_recommendations").select("job_id").eq("user_id", user.id),
    supabase.from("user_skills").select("skill_code").eq("user_id", user.id),
  ]);
  if (recRes.error || ownedRes.error) {
    console.error("[home-courses] rekomendasi/keahlian:", (recRes.error ?? ownedRes.error).message);
    return { alert: null, courses: [], note: null, error: "Saran pelatihan belum bisa dimuat. Coba lagi beberapa saat lagi." };
  }

  const jobIds = [...new Set((recRes.data ?? []).map((r) => r.job_id))];
  if (jobIds.length === 0) {
    return { alert: null, courses: [], note: "Belum ada rekomendasi pelatihan. Selesaikan asesmen karier, lalu tekan Perbarui Rekomendasi di atas.", error: null };
  }

  const gapsRes = await supabase
    .from("job_skills")
    .select("job_id,skill_code,is_required,skills(label),jobs!inner(status,deadline)")
    .in("job_id", jobIds)
    .eq("jobs.status", "published");
  if (gapsRes.error) {
    console.error("[home-courses] job_skills:", gapsRes.error.message);
    return { alert: null, courses: [], note: null, error: "Saran pelatihan belum bisa dimuat. Coba lagi beberapa saat lagi." };
  }

  const owned = new Set((ownedRes.data ?? []).map((r) => r.skill_code));
  const ranked = rankSkillGaps(gapsRes.data, owned, today);
  if (ranked.length === 0) {
    return { alert: null, courses: [], note: "Keahlian Anda sudah memenuhi lowongan yang cocok. Belum ada skill gap yang perlu ditutup.", error: null };
  }

  const coursesRes = await supabase
    .from("course_skills")
    .select(`skill_code,courses!inner(${COURSE_COLUMNS})`)
    .in("skill_code", ranked.map((s) => s.code))
    .eq("courses.is_published", true);
  if (coursesRes.error) {
    console.error("[home-courses] course_skills:", coursesRes.error.message);
    return { alert: null, courses: [], note: null, error: "Saran pelatihan belum bisa dimuat. Coba lagi beberapa saat lagi." };
  }

  const { focus, picks } = pickCourses(ranked, coursesRes.data);
  if (!focus) {
    const top = ranked[0];
    return {
      alert: { skill: top.label, gapCount: top.demand },
      courses: [],
      note: "Pelatihan untuk skill ini belum tersedia. Kami akan menambahkannya.",
      error: null,
    };
  }
  return {
    alert: { skill: focus.label, gapCount: focus.demand },
    courses: picks.map((pick, i) => toHomeCourse(pick, i === 0)),
    note: null,
    error: null,
  };
}