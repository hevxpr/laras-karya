import { connection } from "next/server";

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
  "salary_min,salary_max,deadline,published_at,benefits,company_logo_url,company_website_url," +
  "job_skills(skill_code,is_required,skills(label))";

/** "renewable_energy" -> "Renewable Energy" (bila kode sektor tidak ada di tabel sectors). */
const humanize = (code) => String(code).replace(/[_-]+/g, " ").trim().replace(/\b\p{L}/gu, (c) => c.toUpperCase());

/** Timestamp ISO -> tanggal WIB "YYYY-MM-DD" (format yang dibaca formatDate di lib/job-catalog.js). */
const wibDate = (ts) => {
  const ms = Date.parse(ts ?? "");
  return Number.isNaN(ms) ? null : new Date(ms + 7 * 3600 * 1000).toISOString().slice(0, 10);
};

/** Hanya alamat http(s) yang dipakai (logo dan situs perusahaan); selain itu dianggap kosong. */
const httpOrNull = (url) => (/^https?:\/\//i.test(String(url ?? "").trim()) ? String(url).trim() : null);

/** Selisih hari antara dua tanggal "YYYY-MM-DD" (a - b). Tanpa Date.now, jadi aman untuk Cache Components. */
const dayDiff = (a, b) => Math.round((Date.parse(`${a}T00:00:00Z`) - Date.parse(`${b}T00:00:00Z`)) / 86400000);

// true (wajib) lebih dulu, lalu belum ditentukan, lalu false (nilai tambah)
const requiredRank = (r) => (r === true ? 0 : r === false ? 2 : 1);

/**
 * Baris tabel jobs (+ job_skills) -> bentuk yang dipakai kartu di /jobs.
 * `today` ("YYYY-MM-DD", WIB) dipakai untuk lencana "Baru" (diposting 7 hari terakhir) dan sisa hari sebelum
 * deadline (daysLeft); tanpa `today`, keduanya dilewati.
 */
export function toCatalogJob(row, sectorLabels = {}, today = null) {
  const skills = (row.job_skills ?? [])
    .map((js) => {
      const rel = Array.isArray(js.skills) ? js.skills[0] : js.skills;
      return { name: rel?.label ?? humanize(js.skill_code), required: js.is_required };
    })
    .sort((a, b) => requiredRank(a.required) - requiredRank(b.required) || a.name.localeCompare(b.name, "id"))
    .map((s) => s.name);

  const postedAt = wibDate(row.published_at);
  const deadline = row.deadline ? String(row.deadline).slice(0, 10) : null;

  return {
    id: row.id,
    title: row.title,
    company: row.company_name,
    companyLogoUrl: httpOrNull(row.company_logo_url),
    companyWebsiteUrl: httpOrNull(row.company_website_url),
    sector: sectorLabels[row.sector] ?? (row.sector ? humanize(row.sector) : "Lainnya"),
    city: row.city ?? row.province ?? null,
    mode: MODE_LABEL[row.work_arrangement] ?? null,
    salary: formatSalaryRange(row.salary_min, row.salary_max),
    salaryMin: Number(row.salary_min ?? row.salary_max ?? 0),
    employmentType: row.employment_type,
    experienceLevel: row.experience_level,
    postedAt,
    deadline,
    isNew: Boolean(today && postedAt && dayDiff(today, postedAt) >= 0 && dayDiff(today, postedAt) <= 7),
    daysLeft: today && deadline ? Math.max(0, dayDiff(deadline, today)) : null,
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
  // Daftar ini memakai "hari ini" (Date.now) dan sesi user, jadi harus dirender per permintaan.
  // connection() WAJIB dipanggil lebih dulu, sebelum createClient() dan todayWib(); kalau tidak,
  // Next.js (cacheComponents) melapor "unstable value Date.now() while prerendering".
  await connection();
  const supabase = await createClient();
  const today = todayWib();

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
  return { jobs: (jobsRes.data ?? []).map((row) => toCatalogJob(row, sectorLabels, today)), error: null };
}

// ---------------------------------------------------------------------------
// Pratinjau "lowongan hijau" di halaman awal (/). Publik: tanpa login, jadi hanya memakai akses anon.
// ---------------------------------------------------------------------------

const PREVIEW_COLUMNS =
  "id,title,company_name,company_logo_url,sector,city,province,work_arrangement,salary_min,salary_max,is_green_job,published_at";

/**
 * Memilih lowongan untuk pratinjau dari daftar yang sudah diurutkan terbaru dulu: lowongan hijau
 * lebih dulu dan beda sektor (supaya "berbagai sektor"), lalu sisa hijau, lalu lowongan lain.
 */
export function pickPreviewJobs(rows, limit = 6) {
  const picked = [];
  const used = new Set();
  const take = (row) => {
    picked.push(row);
    used.add(row.id);
  };
  const green = rows.filter((r) => r.is_green_job);
  const sectors = new Set();
  for (const r of green) {
    if (picked.length >= limit) break;
    if (!sectors.has(r.sector)) {
      sectors.add(r.sector);
      take(r);
    }
  }
  for (const r of green) if (picked.length < limit && !used.has(r.id)) take(r);
  for (const r of rows) if (picked.length < limit && !used.has(r.id)) take(r);
  return picked;
}

/** 6000000 -> "6", 7500000 -> "7,5" */
const juta = (n) => Number((n / 1_000_000).toFixed(1)).toLocaleString("id-ID");

/** Gaji singkat untuk kartu kecil: "Rp 6–8 juta/bln"; kosong -> teks pengganti yang sama dengan daftar. */
function salaryShort(min, max) {
  if (min && max) return min === max ? `Rp ${juta(min)} juta/bln` : `Rp ${juta(min)}–${juta(max)} juta/bln`;
  if (min) return `Mulai Rp ${juta(min)} juta/bln`;
  if (max) return `Hingga Rp ${juta(max)} juta/bln`;
  return formatSalaryRange(null, null);
}

/** Baris tabel jobs -> bentuk kartu pratinjau di halaman awal. */
export function toPreviewJob(row, sectorLabels = {}) {
  const city = row.city ?? row.province ?? null;
  const mode = MODE_LABEL[row.work_arrangement] ?? null;
  return {
    id: row.id,
    tag: sectorLabels[row.sector] ?? (row.sector ? humanize(row.sector) : "Lainnya"),
    title: row.title,
    company: row.company_name,
    logoUrl: row.company_logo_url ?? null,
    place: mode === "Remote" ? "Remote" : [city, mode].filter(Boolean).join(" · ") || "Lokasi tidak dicantumkan",
    salary: salaryShort(row.salary_min, row.salary_max),
  };
}

/**
 * Enam lowongan untuk pratinjau di halaman awal (published, belum lewat deadline).
 * @returns {Promise<{ jobs: object[], error: string|null }>}
 */
export async function fetchLandingJobs(limit = 6) {
  await connection(); // memakai "hari ini": harus dirender per permintaan, connection() paling awal
  const supabase = await createClient();
  const today = todayWib();

  const [jobsRes, sectorsRes] = await Promise.all([
    supabase
      .from("jobs")
      .select(PREVIEW_COLUMNS)
      .eq("status", "published")
      .or(`deadline.is.null,deadline.gte.${today}`)
      .order("published_at", { ascending: false })
      .limit(200),
    supabase.from("sectors").select("code,label"),
  ]);

  if (jobsRes.error) {
    console.error("[landing] jobs:", jobsRes.error.message);
    return { jobs: [], error: "Pratinjau lowongan belum bisa dimuat." };
  }
  if (sectorsRes.error) console.warn("[landing] sectors:", sectorsRes.error.message);

  const sectorLabels = Object.fromEntries((sectorsRes.data ?? []).map((s) => [s.code, s.label]));
  const jobs = pickPreviewJobs(jobsRes.data ?? [], limit).map((row) => toPreviewJob(row, sectorLabels));
  return { jobs, error: null };
}