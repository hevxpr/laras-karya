/**
 * Data dan urutan skill gap untuk /recommended-jobs/[id].
 * Fungsi murni (tanpa akses database): dipakai lib/job-detail-db.js untuk mengolah hasil query,
 * dan komponen kartu skill gap untuk mengurutkan tampilan.
 */

const isHttpUrl = (url) => /^https?:\/\//i.test(String(url ?? ""));

/** Ada pelatihan untuk skill ini? `courses` undefined = belum diketahui (query gagal atau data contoh). */
export const hasCourse = (skill) => Array.isArray(skill?.courses) && skill.courses.length > 0;

/**
 * Urutan prioritas skill gap (sama dengan aturan di dokumentasi database):
 * 1) wajib dulu, lalu nilai tambah  2) paling banyak diminta lowongan lain
 * 3) yang sudah punya pelatihan  4) nama (supaya urutan stabil).
 * `required` kosong dianggap wajib.
 */
export function sortGap(skills = []) {
  return [...skills].sort(
    (a, b) =>
      Number(a.required === false) - Number(b.required === false) ||
      (b.demand ?? 0) - (a.demand ?? 0) ||
      Number(hasCourse(b)) - Number(hasCourse(a)) ||
      String(a.name).localeCompare(String(b.name), "id"),
  );
}

/** Baris job_skills (lowongan published) -> { kode_skill: jumlah lowongan berbeda yang memintanya }. */
export function countDemand(rows = []) {
  const jobsBySkill = {};
  for (const row of rows) {
    if (!row?.skill_code || !row?.job_id) continue;
    (jobsBySkill[row.skill_code] ??= new Set()).add(row.job_id);
  }
  return Object.fromEntries(Object.entries(jobsBySkill).map(([code, jobs]) => [code, jobs.size]));
}

/**
 * Baris course_skills (dengan data courses) -> { kode_skill: [hingga `perSkill` pelatihan] }.
 * Setiap kode di `codes` selalu ada di hasil ([] bila tidak ada pelatihan). Urutan pelatihan:
 * unggulan (is_featured) dulu, lalu sort_order, lalu judul. Hanya tautan http(s) yang dipakai.
 */
export function groupCourses(rows = [], codes = [], perSkill = 2) {
  const bySkill = Object.fromEntries(codes.map((code) => [code, new Map()]));
  for (const row of rows) {
    const course = Array.isArray(row?.courses) ? row.courses[0] : row?.courses;
    if (!course?.id || !course.title || !isHttpUrl(course.url) || course.is_published === false) continue;
    if (!bySkill[row.skill_code]) continue;
    bySkill[row.skill_code].set(course.id, course);
  }
  return Object.fromEntries(
    Object.entries(bySkill).map(([code, courses]) => [
      code,
      [...courses.values()]
        .sort(
          (a, b) =>
            Number(Boolean(b.is_featured)) - Number(Boolean(a.is_featured)) ||
            (a.sort_order ?? 0) - (b.sort_order ?? 0) ||
            String(a.title).localeCompare(String(b.title), "id"),
        )
        .slice(0, perSkill)
        .map((c) => ({ id: c.id, title: c.title, url: c.url, provider: c.provider ?? null, level: c.level ?? null })),
    ]),
  );
}
