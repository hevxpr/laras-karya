import { createClient } from "@/lib/supabase/server";
import { buildJobDetailFromRows, todayWib } from "@/lib/job-detail-mapping";
import { countDemand, groupCourses } from "@/lib/skill-gap-data";

/**
 * Detail lowongan dari Supabase untuk /recommended-jobs/[id]. Hanya untuk server.
 * Semua query memakai sesi user yang sedang masuk, jadi tetap di bawah RLS
 * (user hanya melihat lowongan published, dan hanya rekomendasi serta keahlian miliknya).
 */

const JOB_COLUMNS =
  "id,title,company_name,sector,description,requirements,benefits,employment_type,work_arrangement," +
  "city,province,address,salary_min,salary_max,deadline,status,updated_at,verified_at,source_origin";

function failed(what, error) {
  return new Error(`Gagal membaca ${what} dari Supabase: ${error.message}`);
}

/**
 * @param {string} id        UUID lowongan
 * @param {{ id: string }} user  user yang sedang masuk (dari getCurrentUser)
 * @returns {Promise<import("@/lib/job-detail-data").JobDetail | null>} null bila lowongan tidak ada / tidak terlihat
 */
export async function fetchJobDetail(id, user) {
  const supabase = await createClient();

  const [jobRes, skillsRes, ownedRes, recRes, profileRes, savedRes, appliedRes] = await Promise.all([
    supabase.from("jobs").select(JOB_COLUMNS).eq("id", id).maybeSingle(),
    supabase.from("job_skills").select("skill_code,is_required,skills(label)").eq("job_id", id),
    supabase.from("user_skills").select("skill_code").eq("user_id", user.id),
    supabase.from("job_recommendations").select("match_score").eq("user_id", user.id).eq("job_id", id).maybeSingle(),
    supabase.from("profiles").select("city,work_arrangement_pref,interest_sectors").eq("id", user.id).maybeSingle(),
    supabase.from("saved_jobs").select("job_id").eq("user_id", user.id).eq("job_id", id).maybeSingle(),
    supabase.from("applications").select("id").eq("user_id", user.id).eq("job_id", id).maybeSingle(),
  ]);

  if (jobRes.error) throw failed("lowongan", jobRes.error);
  if (!jobRes.data) return null;
  if (skillsRes.error) throw failed("keahlian lowongan", skillsRes.error);
  if (ownedRes.error) throw failed("keahlian pengguna", ownedRes.error);
  // Skor dan profil pelengkap: bila gagal, halaman tetap tampil (skor "belum dihitung").
  if (recRes.error) console.warn("[job-detail] job_recommendations:", recRes.error.message);
  if (profileRes.error) console.warn("[job-detail] profiles:", profileRes.error.message);
  if (savedRes.error) console.warn("[job-detail] saved_jobs:", savedRes.error.message);
  if (appliedRes.error) console.warn("[job-detail] applications:", appliedRes.error.message);

  const job = jobRes.data;
  const profile = profileRes.data ?? null;

  const skillRows = skillsRes.data ?? [];
  const ownedCodes = (ownedRes.data ?? []).map((r) => r.skill_code);
  const ownedSet = new Set(ownedCodes);
  // Skill lowongan yang belum dimiliki user: hanya ini yang perlu info permintaan dan pelatihan.
  const missingCodes = [...new Set(skillRows.map((r) => r.skill_code).filter((code) => !ownedSet.has(code)))];

  // Label sektor (lowongan dan minat user), permintaan skill, dan pelatihan: tiga query bebas, jalan bersamaan.
  const sectorCodes = [...new Set([job.sector, ...(profile?.interest_sectors ?? [])].filter(Boolean))];
  const nothing = { data: [], error: null };
  const [sectorsRes, demandRes, coursesRes] = await Promise.all([
    sectorCodes.length ? supabase.from("sectors").select("code,label").in("code", sectorCodes) : nothing,
    // Berapa lowongan published yang meminta skill ini (termasuk lowongan ini).
    missingCodes.length
      ? supabase
          .from("job_skills")
          .select("skill_code,job_id,jobs!inner(status)")
          .in("skill_code", missingCodes)
          .eq("jobs.status", "published")
      : nothing,
    // Pelatihan yang mengajarkan skill itu (course_skills), hanya yang published.
    missingCodes.length
      ? supabase
          .from("course_skills")
          .select("skill_code,courses!inner(id,title,url,provider,level,is_featured,sort_order,is_published)")
          .in("skill_code", missingCodes)
          .eq("courses.is_published", true)
      : nothing,
  ]);

  // Semuanya pelengkap: bila gagal dibaca, halaman tetap tampil tanpa info itu.
  if (sectorsRes.error) console.warn("[job-detail] sectors:", sectorsRes.error.message);
  if (demandRes.error) console.warn("[job-detail] job_skills (permintaan):", demandRes.error.message);
  if (coursesRes.error) console.warn("[job-detail] course_skills:", coursesRes.error.message);

  const sectorLabels = Object.fromEntries((sectorsRes.data ?? []).map((s) => [s.code, s.label]));
  const demandByCode = demandRes.error ? null : countDemand(demandRes.data);
  const coursesByCode = coursesRes.error ? null : groupCourses(coursesRes.data, missingCodes);

  return buildJobDetailFromRows({
    job,
    sectorLabels,
    skillRows,
    ownedCodes,
    matchScore: recRes.data?.match_score ?? null,
    demandByCode,
    coursesByCode,
    profile,
    saved: Boolean(savedRes.data),
    applied: Boolean(appliedRes.data),
    today: todayWib(), // dihitung setelah akses data, aman untuk Cache Components
  });
}
