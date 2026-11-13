import { isUuid } from "@/lib/is-uuid";
import { orderCourses } from "@/lib/course-order";
import { computeJobGap, skillTagFor, toHeroSkills } from "@/lib/learning-gap";

/**
 * Data halaman /learning-path. Hanya untuk server (dipanggil app/learning-path/actions.js).
 * Memakai sesi user (bukan service role), jadi tetap di bawah RLS.
 *
 * SATU PINTU DATA: semua pembentukan { courses, target, ... } ada di sini. Kalau nanti engine rekomendasi
 * atau fungsi skill_gap di database mengambil alih sebagian pekerjaan ini, cukup ganti isi
 * `loadCourseRanking` (urutan) atau `loadJobGap` (gap); halaman tidak perlu diubah.
 */

const COURSE_COLUMNS =
  "id, title, url, level, provider, category, duration_text, format, image_url, is_featured, sort_order";

// courses.format di database huruf kecil; tampilannya diberi huruf kapital di depan.
const FORMAT_LABELS = { online: "Online", hybrid: "Hybrid", offline: "Offline" };

const isHttpUrl = (url) => /^https?:\/\//i.test(String(url ?? ""));

/** Baris courses -> bentuk yang dipakai kartu pelatihan. `skillTag` menimpa label skill bawaan (courses.category). */
function toCourse(row, skillTag = row.category ?? null) {
  return {
    id: row.id,
    provider: row.provider ?? "",
    title: row.title,
    level: row.level ?? "Pemula",
    format: FORMAT_LABELS[row.format] ?? row.format ?? "Online",
    duration: row.duration_text ?? "",
    skillTag,
    popular: Boolean(row.is_featured),
    imageUrl: row.image_url ?? null,
    url: row.url,
  };
}

/**
 * TITIK SAMBUNG ENGINE (urutan pelatihan).
 * Kembalikan { [courseId]: skor } dari engine (skor lebih tinggi = tampil lebih dulu), atau null untuk
 * memakai urutan bawaan (lib/course-order.js). Course yang tidak punya skor otomatis di belakang.
 * Bila engine berupa API, bungkus dengan try/catch dan kembalikan null saat gagal atau lambat,
 * supaya halaman tidak ikut error.
 *
 * @param {{ userId: string, jobId: string | null, courseIds: string[] }} _input
 * @returns {Promise<Record<string, number> | null>}
 */
async function loadCourseRanking(_input) {
  return null;
}

function failed(step, error, message) {
  console.error(`[${step}]`, error?.message ?? error);
  return new Error(message);
}

/** Semua pelatihan published, urutan bawaan (perilaku halaman sebelum ada filter lowongan). */
async function fetchAllCourses(supabase, userId) {
  const { data, error } = await supabase.from("courses").select(COURSE_COLUMNS).eq("is_published", true);
  if (error) throw failed("learning-path courses", error, "Pelatihan belum bisa dimuat. Coba lagi beberapa saat lagi.");

  const ranking = await loadCourseRanking({ userId, jobId: null, courseIds: data.map((c) => c.id) });
  return orderCourses(data, ranking).map((row) => toCourse(row));
}

/**
 * Skill gap lowongan + pelatihan yang menutupnya.
 * @returns {Promise<null | { job, skills, missing, courses }>} null bila lowongan tidak ada / tidak terlihat oleh user
 */
async function fetchJobGapCourses(supabase, userId, jobId) {
  const [jobRes, skillsRes, ownedRes] = await Promise.all([
    supabase.from("jobs").select("id, title, company_name").eq("id", jobId).maybeSingle(),
    supabase.from("job_skills").select("skill_code, is_required, skills(label)").eq("job_id", jobId),
    supabase.from("user_skills").select("skill_code").eq("user_id", userId),
  ]);
  const msg = "Skill gap lowongan belum bisa dimuat. Coba lagi beberapa saat lagi.";
  if (jobRes.error) throw failed("learning-path job", jobRes.error, msg);
  if (!jobRes.data) return null;
  if (skillsRes.error) throw failed("learning-path job_skills", skillsRes.error, msg);
  if (ownedRes.error) throw failed("learning-path user_skills", ownedRes.error, msg);

  const { skills, missing } = computeJobGap(
    skillsRes.data ?? [],
    (ownedRes.data ?? []).map((r) => r.skill_code)
  );

  let courses = [];
  if (missing.length > 0) {
    const { data, error } = await supabase
      .from("course_skills")
      .select(`skill_code, courses!inner(${COURSE_COLUMNS}, is_published)`)
      .in("skill_code", missing.map((s) => s.code))
      .eq("courses.is_published", true);
    if (error) throw failed("learning-path course_skills", error, "Pelatihan belum bisa dimuat. Coba lagi beberapa saat lagi.");
    courses = groupCoursesForGap(data ?? [], missing);
  }

  return { job: jobRes.data, skills, missing, courses };
}

/**
 * Baris course_skills -> daftar course unik (baris courses) + `taught`: nama skill gap yang diajarkannya.
 * Hanya course dengan tautan http(s) yang dipakai (sama dengan lib/skill-gap-data.js).
 */
function groupCoursesForGap(rows, missing) {
  const nameByCode = new Map(missing.map((s) => [s.code, s.name]));
  const order = new Map(missing.map((s, i) => [s.code, i]));
  const byId = new Map();

  for (const row of rows) {
    const course = Array.isArray(row?.courses) ? row.courses[0] : row?.courses;
    if (!course?.id || !course.title || !isHttpUrl(course.url) || course.is_published === false) continue;
    if (!nameByCode.has(row.skill_code)) continue;
    const entry = byId.get(course.id) ?? { row: course, codes: new Set() };
    entry.codes.add(row.skill_code);
    byId.set(course.id, entry);
  }

  return [...byId.values()].map(({ row, codes }) => ({
    row,
    taught: [...codes].sort((a, b) => order.get(a) - order.get(b)).map((code) => nameByCode.get(code)),
  }));
}

/**
 * Data untuk halaman. Tanpa `jobId` (atau bukan UUID): semua pelatihan. Dengan `jobId`: hanya pelatihan
 * untuk skill teknis lowongan itu yang belum dimiliki user.
 *
 * @param {object} supabase  klien Supabase sesi user
 * @param {{ id: string }} user
 * @param {string | null | undefined} jobParam  nilai ?job= dari URL (belum divalidasi)
 * @returns {Promise<{
 *   mode: "all" | "job",
 *   job: { id: string, title: string, company: string } | null,
 *   jobNotFound: boolean,
 *   gap: { total: number, missing: number, uncovered: string[], hero: object } | null,
 *   courses: object[],
 * }>}
 */
export async function fetchLearningPath(supabase, user, jobParam) {
  const jobId = isUuid(jobParam) ? jobParam : null;
  // ?job= yang diisi tetapi bukan UUID (mis. id contoh "1") dianggap tidak ditemukan.
  const invalidJob = Boolean(jobParam) && !jobId;

  if (!jobId) {
    return { mode: "all", job: null, jobNotFound: invalidJob, gap: null, courses: await fetchAllCourses(supabase, user.id) };
  }

  const result = await fetchJobGapCourses(supabase, user.id, jobId);
  if (!result) {
    return { mode: "all", job: null, jobNotFound: true, gap: null, courses: await fetchAllCourses(supabase, user.id) };
  }

  const { job, skills, missing, courses: grouped } = result;
  const ranking = await loadCourseRanking({ userId: user.id, jobId, courseIds: grouped.map((g) => g.row.id) });
  const ordered = orderCourses(
    grouped.map((g) => g.row),
    ranking
  );
  const taughtById = new Map(grouped.map((g) => [g.row.id, g.taught]));
  const courses = ordered.map((row) => toCourse(row, skillTagFor(taughtById.get(row.id))));

  const covered = new Set(grouped.flatMap((g) => g.taught));
  return {
    mode: "job",
    job: { id: job.id, title: job.title, company: job.company_name ?? "" },
    jobNotFound: false,
    gap: {
      total: skills.length,
      missing: missing.length,
      // Skill yang belum punya pelatihan di Laras Karya (course_skills kosong): ditampilkan sebagai catatan.
      uncovered: missing.filter((s) => !covered.has(s.name)).map((s) => s.name),
      hero: toHeroSkills(skills),
    },
    courses,
  };
}
