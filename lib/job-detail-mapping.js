import { FACILITIES } from "@/lib/job-catalog";
import { groupSkillsByStatus } from "@/lib/job-detail-data";

/**
 * Baris tabel Supabase (jobs, job_skills, skills, sectors, user_skills, job_recommendations, profiles)
 * -> bentuk JobDetail yang dipakai komponen di /recommended-jobs/[id].
 * Fungsi murni tanpa akses database, supaya bisa diuji sendiri. Pengambilan datanya ada di lib/job-detail-db.js.
 */

export { isUuid } from "@/lib/is-uuid";

export const MODE_LABEL = { onsite: "On-site", hybrid: "Hybrid", remote: "Remote" };
const TYPE_LABEL = { full_time: "Full-time", part_time: "Part-time", contract: "Kontrak", internship: "Magang" };
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
const FACILITY_VALUES = FACILITIES.map((f) => f.value);

/** Tanggal hari ini menurut WIB, bentuk "YYYY-MM-DD" (dibandingkan dengan jobs.deadline). */
export function todayWib(nowMs = Date.now()) {
  return new Date(nowMs + 7 * 3600 * 1000).toISOString().slice(0, 10);
}

/** "2026-09-28" atau timestamp ISO -> "28 Sep 2026". Kosong bila tidak valid. */
export function formatDateId(value) {
  if (!value) return "";
  const text = String(value);
  let y, m, d;
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    [y, m, d] = text.split("-").map(Number);
  } else {
    const ms = Date.parse(text);
    if (Number.isNaN(ms)) return "";
    const wib = new Date(ms + 7 * 3600 * 1000); // timestamptz -> tanggal WIB
    y = wib.getUTCFullYear();
    m = wib.getUTCMonth() + 1;
    d = wib.getUTCDate();
  }
  return MONTHS[m - 1] ? `${d} ${MONTHS[m - 1]} ${y}` : "";
}

const rupiah = (n) => `Rp ${String(Math.round(Number(n))).replace(/\B(?=(\d{3})+(?!\d))/g, ".")}`;

/** salary_min / salary_max -> teks gaji. Kolom kosong = tidak dicantumkan. */
export function formatSalaryRange(min, max) {
  const hasMin = min != null && Number(min) > 0;
  const hasMax = max != null && Number(max) > 0;
  if (hasMin && hasMax) return min === max ? `${rupiah(min)} per bulan` : `${rupiah(min)} - ${rupiah(max)} per bulan`;
  if (hasMin) return `Mulai dari ${rupiah(min)} per bulan`;
  if (hasMax) return `Hingga ${rupiah(max)} per bulan`;
  return "Gaji tidak dicantumkan";
}

/** Teks persyaratan (satu baris = satu syarat, boleh berawalan -, •, * atau nomor) -> daftar. */
export function splitRequirements(text) {
  const lines = String(text ?? "")
    .split(/\r?\n/)
    .map((line) => line.replace(/^\s*(?:[-•*·]|\d+[.)])\s*/, "").trim())
    .filter((line) => line.length >= 3);
  return [...new Set(lines)];
}

export const humanize = (code) =>
  String(code ?? "")
    .replace(/[_-]+/g, " ")
    .trim()
    .replace(/\b\p{L}/gu, (c) => c.toUpperCase());

/** Lowongan dibuka bila published dan deadline (jika ada) belum lewat. today = "YYYY-MM-DD" (WIB). */
export const isJobOpen = (job, today) =>
  job.status === "published" && (!job.deadline || String(job.deadline).slice(0, 10) >= today);

const capitalize = (text) => (text ? text[0].toUpperCase() + text.slice(1) : text);

// true (wajib) lebih dulu, lalu belum ditentukan, lalu false (nilai tambah)
const requiredRank = (r) => (r === true ? 0 : r === false ? 2 : 1);

/**
 * @param {{
 *   job: object,                                   baris tabel jobs
 *   sectorLabels?: Record<string, string>,         sectors.code -> label (sektor lowongan dan minat user)
 *   skillRows?: Array<{skill_code: string, is_required: boolean|null, skills?: {label: string}|{label: string}[]|null}>,
 *   ownedCodes?: string[],                         user_skills.skill_code milik user
 *   matchScore?: number|string|null,               job_recommendations.match_score; null = belum dihitung
 *   demandByCode?: Record<string, number>|null,    kode skill -> jumlah lowongan published yang memintanya (null = tidak diketahui)
 *   coursesByCode?: Record<string, object[]>|null, kode skill -> pelatihan (hingga 2); null = tidak diketahui
 *   profile?: object|null,                         baris profiles (city, work_arrangement_pref, interest_sectors)
 *   saved?: boolean,                               true bila lowongan ini ada di saved_jobs milik user
 *   today?: string,                                "YYYY-MM-DD" (WIB)
 * }} input
 * @returns {import("@/lib/job-detail-data").JobDetail}
 */
export function buildJobDetailFromRows({
  job,
  sectorLabels = {},
  skillRows = [],
  ownedCodes = [],
  matchScore = null,
  demandByCode = null,
  coursesByCode = null,
  profile = null,
  saved = false,
  today = todayWib(),
}) {
  const owned = new Set(ownedCodes);

  const skills = skillRows
    .map((row) => {
      const rel = Array.isArray(row.skills) ? row.skills[0] : row.skills;
      const code = row.skill_code;
      const isOwned = owned.has(code);
      return {
        id: `s-${code}`,
        code,
        name: rel?.label ?? humanize(code),
        status: isOwned ? "dimiliki" : "belum",
        // is_required kosong dianggap wajib (aturan database untuk skor dan skill gap).
        required: row.is_required !== false,
        // Hanya untuk skill yang belum dimiliki: jumlah lowongan yang memintanya dan pelatihan yang tersedia.
        // courses undefined = belum diketahui (beda dengan [] = memang belum ada pelatihan).
        demand: isOwned ? null : (demandByCode?.[code] ?? null),
        courses: isOwned || !coursesByCode ? undefined : (coursesByCode[code] ?? []),
      };
    })
    .sort((a, b) => requiredRank(a.required) - requiredRank(b.required) || a.name.localeCompare(b.name, "id"));

  // Benefit: yang termasuk fasilitas ramah perempuan dipisah; sisanya jadi "Benefit umum"
  const benefitTexts = (job.benefits ?? []).map((b) => String(b ?? "").trim()).filter(Boolean);
  const lower = benefitTexts.map((b) => b.toLowerCase());
  const facilities = FACILITY_VALUES.filter((f) => lower.includes(f));
  const benefits = benefitTexts
    .filter((b) => !FACILITY_VALUES.includes(b.toLowerCase()))
    .map((label, i) => ({ id: `b${i}`, label: capitalize(label) }));

  const requirements = splitRequirements(job.requirements);
  const requiredNames = skills.filter((s) => s.required === true).map((s) => s.name);
  const score = matchScore == null ? NaN : Number(matchScore);

  return {
    id: job.id,
    title: job.title,
    company: job.company_name,
    city: job.city ?? job.province ?? "",
    workMode: MODE_LABEL[job.work_arrangement],
    address: job.address || [job.city, job.province].filter(Boolean).join(", ") || undefined,
    employmentType: TYPE_LABEL[job.employment_type] ?? "Full-time",
    sector: sectorLabels[job.sector] ?? (job.sector ? humanize(job.sector) : "Lainnya"),
    isOpen: isJobOpen(job, today),
    saved: Boolean(saved),
    source: job.source_origin || "sumber lowongan",
    updatedAt: formatDateId(job.verified_at ?? job.updated_at),
    matchPercent: Number.isFinite(score) ? Math.max(0, Math.min(100, Math.round(score))) : null,
    salary: formatSalaryRange(job.salary_min, job.salary_max),
    description: job.description?.trim() || "Deskripsi lowongan belum tersedia.",
    requirements: requirements.length
      ? requirements
      : requiredNames.length
        ? requiredNames.map((name) => `Menguasai ${name}`)
        : ["Persyaratan belum dicantumkan."],
    benefits,
    facilities,
    perks: lower,
    skills: groupSkillsByStatus(skills),
    // Data pengguna untuk teks "Mengapa cocok" (lib/fit-insights.js). Tanpa ini, insight memakai tokoh contoh.
    viewer: {
      homeCity: profile?.city?.trim() || null,
      preferredMode: MODE_LABEL[profile?.work_arrangement_pref] ?? null,
      interestLabels: (profile?.interest_sectors ?? []).map((code) => sectorLabels[code]).filter(Boolean),
    },
  };
}
