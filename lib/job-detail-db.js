import { createClient } from "@/lib/supabase/server";
import { buildJobDetailFromRows, todayWib } from "@/lib/job-detail-mapping";

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

  const [jobRes, skillsRes, ownedRes, recRes, profileRes] = await Promise.all([
    supabase.from("jobs").select(JOB_COLUMNS).eq("id", id).maybeSingle(),
    supabase.from("job_skills").select("skill_code,is_required,skills(label)").eq("job_id", id),
    supabase.from("user_skills").select("skill_code").eq("user_id", user.id),
    supabase.from("job_recommendations").select("match_score").eq("user_id", user.id).eq("job_id", id).maybeSingle(),
    supabase.from("profiles").select("city,work_arrangement_pref,interest_sectors").eq("id", user.id).maybeSingle(),
  ]);

  if (jobRes.error) throw failed("lowongan", jobRes.error);
  if (!jobRes.data) return null;
  if (skillsRes.error) throw failed("keahlian lowongan", skillsRes.error);
  if (ownedRes.error) throw failed("keahlian pengguna", ownedRes.error);
  // Skor dan profil pelengkap: bila gagal, halaman tetap tampil (skor "belum dihitung").
  if (recRes.error) console.warn("[job-detail] job_recommendations:", recRes.error.message);
  if (profileRes.error) console.warn("[job-detail] profiles:", profileRes.error.message);

  const job = jobRes.data;
  const profile = profileRes.data ?? null;

  // Label sektor untuk lowongan dan untuk minat user
  const codes = [...new Set([job.sector, ...(profile?.interest_sectors ?? [])].filter(Boolean))];
  let sectorLabels = {};
  if (codes.length) {
    const { data, error } = await supabase.from("sectors").select("code,label").in("code", codes);
    if (error) console.warn("[job-detail] sectors:", error.message);
    sectorLabels = Object.fromEntries((data ?? []).map((s) => [s.code, s.label]));
  }

  return buildJobDetailFromRows({
    job,
    sectorLabels,
    skillRows: skillsRes.data ?? [],
    ownedCodes: (ownedRes.data ?? []).map((r) => r.skill_code),
    matchScore: recRes.data?.match_score ?? null,
    profile,
    today: todayWib(), // dihitung setelah akses data, aman untuk Cache Components
  });
}
