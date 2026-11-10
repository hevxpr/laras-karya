import { createClient } from "@/lib/supabase/server";
import { MODE_LABEL, formatSalaryRange, todayWib } from "@/lib/job-detail-mapping";

/**
 * Daftar lowongan dari Supabase untuk halaman /jobs. Hanya untuk server.
 * Memakai sesi user dan kunci publik, jadi tetap di bawah RLS (hanya lowongan published yang terlihat).
 * Fungsi bantu (label pola kerja, teks gaji, tanggal WIB) dipakai bersama dengan halaman detail
 * lewat lib/job-detail-mapping.js, supaya tampilan di daftar dan di detail selalu sama.
 *
 * Semua lowongan published yang masih dibuka tampil (tanpa filter is_green_job).
 */

const COLUMNS =
  "id,title,company_name,sector,city,province,work_arrangement,employment_type,experience_level," +
  "salary_min,salary_max,deadline,published_at,benefits,job_skills(skill_code,is_required,skills(label))";

/** "renewable_energy" -> "Renewable Energy" (bila kode sektor tidak ada di tabel sectors). */
const humanize = (code) => String(code).replace(/[_-]+/g, " ").trim().replace(/\b\p{L}/gu, (c) => c.toUpperCase());

/** Timestamp ISO -> tanggal WIB "YYYY-MM-DD" (format yang dibaca formatDate di lib/job-catalog.js). */
const wibDate = (ts) => {
  const ms = Date.parse(ts ?? "");
  return Number.isNaN(ms) ? null : new Date(ms + 7 * 3600 * 1000).toISOString().slice(0, 10);
};

// true (wajib) lebih dulu, lalu belum ditentukan, lalu false (nilai tambah)
const requiredRank = (r) => (r === true ? 0 : r === false ? 2 : 1);

/** Baris tabel jobs (+ job_skills) -> bentuk yang dipakai kartu di /jobs. */
export function toCatalogJob(row, sectorLabels = {}) {
  const skills = (row.job_skills ?? [])
    .map((js) => {
      const rel = Array.isArray(js.skills) ? js.skills[0] : js.skills;
      return { name: rel?.label ?? humanize(js.skill_code), required: js.is_required };
    })
    .sort((a, b) => requiredRank(a.required) - requiredRank(b.required) || a.name.localeCompare(b.name, "id"))
    .map((s) => s.name);

  return {
    id: row.id,
    title: row.title,
    company: row.company_name,
    sector: sectorLabels[row.sector] ?? (row.sector ? humanize(row.sector) : "Lainnya"),
    city: row.city ?? row.province ?? null,
    mode: MODE_LABEL[row.work_arrangement] ?? null,
    salary: formatSalaryRange(row.salary_min, row.salary_max),
    salaryMin: Number(row.salary_min ?? row.salary_max ?? 0),
    employmentType: row.employment_type,
    experienceLevel: row.experience_level,
    postedAt: wibDate(row.published_at),
    deadline: row.deadline ? String(row.deadline).slice(0, 10) : null,
    skills,
    benefits: (row.benefits ?? []).map((b) => String(b ?? "").trim()).filter(Boolean),
  };
}

/**
 * Semua lowongan published yang masih dibuka (deadline kosong atau belum lewat), terbaru dulu.
 * Mengembalikan { jobs, error } supaya halaman bisa menampilkan pesan tanpa try/catch di sekitar
 * pembacaan cookies (aturan Cache Components).
 * @returns {Promise<{ jobs: object[], error: string|null }>}
 */
export async function fetchCatalogJobs() {
  const supabase = await createClient();
  const today = todayWib(); // dihitung setelah createClient (membaca cookies), aman untuk Cache Components

  const [jobsRes, sectorsRes] = await Promise.all([
    supabase
      .from("jobs")
      .select(COLUMNS)
      .eq("status", "published")
      .or(`deadline.is.null,deadline.gte.${today}`)
      .order("published_at", { ascending: false }),
    supabase.from("sectors").select("code,label"),
  ]);

  if (jobsRes.error) {
    console.error("[catalog] jobs:", jobsRes.error.message);
    return { jobs: [], error: "Lowongan belum bisa dimuat. Coba lagi beberapa saat lagi." };
  }
  // Label sektor pelengkap: bila gagal, kode sektor ditampilkan dalam bentuk yang dirapikan.
  if (sectorsRes.error) console.warn("[catalog] sectors:", sectorsRes.error.message);

  const sectorLabels = Object.fromEntries((sectorsRes.data ?? []).map((s) => [s.code, s.label]));
  return { jobs: (jobsRes.data ?? []).map((row) => toCatalogJob(row, sectorLabels)), error: null };
}
