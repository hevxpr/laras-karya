import { connection } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { buildFitInsights } from "@/lib/fit-insights";
import { MODE_LABEL, formatSalaryRange, todayWib } from "@/lib/job-detail-mapping";

/**
 * Daftar rekomendasi lowongan dari Supabase untuk /recommended-jobs dan Beranda (/home). Hanya untuk server.
 * Semua query memakai sesi user yang sedang masuk, jadi tetap di bawah RLS (lowongan published,
 * serta rekomendasi, keahlian, dan profil milik user sendiri).
 *
 * Sumber skor: tabel job_recommendations (hasil refresh_my_recommendations), angka yang sama dengan
 * yang dibaca halaman detail. Hanya lowongan yang punya skor untuk user ini yang tampil, diurutkan
 * dari skor tertinggi. Lowongan yang sudah lewat deadline tidak ditampilkan.
 */

const JOB_COLUMNS =
  "id,title,company_name,sector,description,city,province,work_arrangement,salary_min,salary_max," +
  "deadline,published_at,benefits,job_skills(skill_code,is_required,skills(label))";

/** "renewable_energy" -> "Renewable Energy" (bila kode sektor tidak ada di tabel sectors). */
const humanize = (code) => String(code).replace(/[_-]+/g, " ").trim().replace(/\b\p{L}/gu, (c) => c.toUpperCase());

// Wajib (true atau kosong) lebih dulu, lalu nilai tambah (false). Kosong dianggap wajib, sama dengan database.
const requiredRank = (r) => (r === false ? 1 : 0);

/** Deskripsi panjang dari database -> ringkasan satu paragraf untuk kartu. */
export function excerpt(text, max = 220) {
  const flat = String(text ?? "")
    .replace(/[•·●▪◦]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!flat) return "Deskripsi lowongan belum tersedia.";
  if (flat.length <= max) return flat;
  const cut = flat.slice(0, max);
  const space = cut.lastIndexOf(" ");
  return `${cut.slice(0, space > max / 2 ? space : max).trim()}…`;
}

/**
 * Satu lowongan + skor user -> bentuk yang dipakai FeaturedJobCard / JobCard / MatchPanel.
 * @param {object} row baris jobs (dengan job_skills)
 * @param {{ score: number, owned: Set<string>, sectorLabels: Record<string,string>, viewer: object }} ctx
 */
export function toRecommendedJob(row, { score, owned, sectorLabels, viewer }) {
  const skills = (row.job_skills ?? [])
    .map((js) => {
      const rel = Array.isArray(js.skills) ? js.skills[0] : js.skills;
      return { code: js.skill_code, name: rel?.label ?? humanize(js.skill_code), required: js.is_required };
    })
    .sort((a, b) => requiredRank(a.required) - requiredRank(b.required) || a.name.localeCompare(b.name, "id"));
  const ownedNames = skills.filter((s) => owned.has(s.code)).map((s) => s.name);
  const missingNames = skills.filter((s) => !owned.has(s.code)).map((s) => s.name);

  const sector = sectorLabels[row.sector] ?? (row.sector ? humanize(row.sector) : "Lainnya");
  const city = row.city ?? row.province ?? null;
  const mode = MODE_LABEL[row.work_arrangement] ?? null;
  const benefits = (row.benefits ?? []).map((b) => String(b ?? "").trim()).filter(Boolean);

  // "Mengapa cocok": hanya poin yang benar-benar sesuai, dihitung dari profil user ini (viewer).
  const reasons = buildFitInsights({
    sector,
    mode: mode === "Remote" || city ? mode : null,
    city: city ?? "",
    perks: benefits.map((b) => b.toLowerCase()),
    owned: ownedNames,
    missing: missingNames,
    viewer,
  })
    .filter((i) => i.tone === "good")
    .map((i) => i.text);

  return {
    id: row.id,
    title: row.title,
    company: row.company_name,
    sector,
    city,
    mode,
    salary: formatSalaryRange(row.salary_min, row.salary_max),
    status: "dibuka",
    match: Math.max(0, Math.min(100, Math.round(score))),
    description: excerpt(row.description),
    benefits,
    skills: skills.map((s) => s.name),
    gaps: missingNames.map((name) => [name, "belum"]),
    reasons,
  };
}

async function loadRecommendationScores(supabase, userId) {
  const { data, error } = await supabase
    .from("job_recommendations")
    .select("job_id,match_score")
    .eq("user_id", userId);
  return { rows: data ?? [], error };
}

/** Isi bersama untuk /recommended-jobs dan Beranda. Dipanggil setelah connection() dan createClient(). */
async function buildRecommended(supabase, user) {
  const today = todayWib();

  const [jobsRes, scoresRes, ownedRes, profileRes, sectorsRes, appsRes] = await Promise.all([
    supabase
      .from("jobs")
      .select(JOB_COLUMNS)
      .eq("status", "published")
      .or(`deadline.is.null,deadline.gte.${today}`),
    loadRecommendationScores(supabase, user.id),
    supabase.from("user_skills").select("skill_code").eq("user_id", user.id),
    supabase.from("profiles").select("city,work_arrangement_pref,interest_sectors").eq("id", user.id).maybeSingle(),
    supabase.from("sectors").select("code,label"),
    supabase.from("applications").select("job_id").eq("user_id", user.id),
  ]);

  if (jobsRes.error || scoresRes.error) {
    console.error("[recommended] jobs/job_recommendations:", (jobsRes.error ?? scoresRes.error).message);
    return { jobs: [], error: "Rekomendasi belum bisa dimuat. Coba lagi beberapa saat lagi." };
  }
  // Pelengkap: bila gagal dibaca, rekomendasi tetap tampil (hanya keterangan kecocokannya berkurang).
  if (ownedRes.error) console.warn("[recommended] user_skills:", ownedRes.error.message);
  if (profileRes.error) console.warn("[recommended] profiles:", profileRes.error.message);
  if (sectorsRes.error) console.warn("[recommended] sectors:", sectorsRes.error.message);
  if (appsRes.error) console.warn("[recommended] applications:", appsRes.error.message);
  const appliedIds = new Set((appsRes.data ?? []).map((r) => r.job_id));

  // Belum ada skor sama sekali = rekomendasi belum pernah dihitung. Minta database menghitungnya
  // sekali (refresh_my_recommendations), lalu baca ulang. Bila gagal, daftar kosong yang tampil.
  let scoreRows = scoresRes.rows;
  if (scoreRows.length === 0) {
    const { error: refreshError } = await supabase.rpc("refresh_my_recommendations");
    if (refreshError) {
      console.warn("[recommended] refresh_my_recommendations:", refreshError.message);
    } else {
      const again = await loadRecommendationScores(supabase, user.id);
      if (again.error) console.warn("[recommended] job_recommendations (ulang):", again.error.message);
      else scoreRows = again.rows;
    }
  }

  const scores = new Map(scoreRows.map((r) => [r.job_id, Number(r.match_score)]).filter(([, s]) => Number.isFinite(s)));
  const sectorLabels = Object.fromEntries((sectorsRes.data ?? []).map((s) => [s.code, s.label]));
  const profile = profileRes.data ?? null;
  const viewer = {
    homeCity: profile?.city?.trim() || null,
    preferredMode: MODE_LABEL[profile?.work_arrangement_pref] ?? null,
    interestLabels: (profile?.interest_sectors ?? []).map((code) => sectorLabels[code]).filter(Boolean),
  };
  const owned = new Set((ownedRes.data ?? []).map((r) => r.skill_code));

  const jobs = (jobsRes.data ?? [])
    .filter((row) => scores.has(row.id))
    .map((row) => ({ row, job: toRecommendedJob(row, { score: scores.get(row.id), owned, sectorLabels, viewer }) }))
    .sort(
      (a, b) =>
        scores.get(b.row.id) - scores.get(a.row.id) ||
        String(b.row.published_at ?? "").localeCompare(String(a.row.published_at ?? "")) ||
        a.job.title.localeCompare(b.job.title, "id"),
    )
    .map((x) => ({ ...x.job, applied: appliedIds.has(x.row.id) }));

  return { jobs, error: null };
}

/**
 * Daftar rekomendasi lengkap untuk /recommended-jobs.
 * @param {{ id: string }} user user yang sedang masuk (dari getCurrentUser)
 * @returns {Promise<{ jobs: object[], error: string|null }>}
 */
export async function fetchRecommendedJobs(user) {
  // Memakai "hari ini" dan sesi user: harus dirender per permintaan, connection() paling awal.
  await connection();
  const supabase = await createClient();
  return buildRecommended(supabase, user);
}

const capitalize = (t) => (t ? t.charAt(0).toUpperCase() + t.slice(1) : null);

/** Lowongan (bentuk /recommended-jobs) -> bentuk kartu Beranda (components/home/job-card.jsx). */
function toHomeJob(job, applied) {
  return {
    id: String(job.id),
    title: job.title,
    company: job.company,
    sector: job.sector,
    matchPercent: job.match,
    workMode:
      job.mode === "Remote" ? "Remote" : [job.mode, job.city].filter(Boolean).join(" • ") || "Lokasi tidak dicantumkan",
    salary: job.salary.replace(" per bulan", "/bln"),
    isOpen: true,
    applied,
    skills: job.skills.slice(0, 2),
    benefit: capitalize(job.benefits[0]),
  };
}

/**
 * Data lowongan untuk Beranda: jumlah lowongan cocok dan tiga kartu teratas. Sumbernya sama dengan
 * /recommended-jobs. Lowongan yang sudah dilamar (tabel applications) dipindah ke belakang; urutan skor
 * tetap terjaga di tiap kelompok.
 * @param {{ id: string }} user user yang sedang masuk (dari getCurrentUser)
 * @returns {Promise<{ matchedJobs: number, jobs: object[], error: string|null }>}
 */
export async function fetchHomeRecommendations(user) {
  await connection();
  const supabase = await createClient();
  const rec = await buildRecommended(supabase, user);
  if (rec.error) return { matchedJobs: 0, jobs: [], error: rec.error };

  // job.applied sudah diisi buildRecommended (tabel applications)
  const ordered = [...rec.jobs].sort((a, b) => Number(a.applied) - Number(b.applied));
  return {
    matchedJobs: ordered.length,
    jobs: ordered.slice(0, 3).map((j) => toHomeJob(j, j.applied)),
    error: null,
  };
}
