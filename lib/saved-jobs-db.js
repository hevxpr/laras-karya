import { createClient } from "@/lib/supabase/server";
import { todayWib } from "@/lib/job-detail-mapping";
import { buildSavedJobsFromRows } from "@/lib/saved-jobs-mapping";

/**
 * Lowongan tersimpan milik user dari Supabase untuk /bookmarks. Hanya untuk server.
 * Memakai sesi user, jadi tetap di bawah RLS (user hanya melihat saved_jobs, applications, dan
 * job_recommendations miliknya, serta lowongan published).
 */

const JOB_COLUMNS =
  "id,title,company_name,sector,work_arrangement,city,province,salary_min,salary_max,status,deadline";

/**
 * @param {{ id: string }} user  user yang sedang masuk (dari getCurrentUser)
 * @returns {Promise<ReturnType<typeof buildSavedJobsFromRows>>}
 */
export async function fetchSavedJobs(user) {
  const supabase = await createClient();

  const { data: rows, error } = await supabase
    .from("saved_jobs")
    .select(`created_at,jobs(${JOB_COLUMNS})`)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });
  if (error) throw new Error(`Gagal membaca lowongan tersimpan dari Supabase: ${error.message}`);

  const jobs = (rows ?? []).map((r) => (Array.isArray(r.jobs) ? r.jobs[0] : r.jobs)).filter(Boolean);
  if (jobs.length === 0) return [];

  const jobIds = jobs.map((j) => j.id);
  const sectorCodes = [...new Set(jobs.map((j) => j.sector).filter(Boolean))];

  // Pelengkap: bila salah satu gagal, daftar tetap tampil (tanpa label sektor / lencana / skor).
  const [sectorsRes, appliedRes, scoresRes] = await Promise.all([
    sectorCodes.length
      ? supabase.from("sectors").select("code,label").in("code", sectorCodes)
      : Promise.resolve({ data: [], error: null }),
    supabase.from("applications").select("job_id").eq("user_id", user.id).in("job_id", jobIds),
    supabase.from("job_recommendations").select("job_id,match_score").eq("user_id", user.id).in("job_id", jobIds),
  ]);
  for (const [name, res] of [["sectors", sectorsRes], ["applications", appliedRes], ["job_recommendations", scoresRes]]) {
    if (res.error) console.warn(`[saved-jobs] ${name}:`, res.error.message);
  }

  return buildSavedJobsFromRows({
    rows,
    sectorLabels: Object.fromEntries((sectorsRes.data ?? []).map((s) => [s.code, s.label])),
    appliedJobIds: (appliedRes.data ?? []).map((a) => a.job_id),
    scores: Object.fromEntries((scoresRes.data ?? []).map((r) => [r.job_id, r.match_score])),
    today: todayWib(), // dihitung setelah akses data, aman untuk Cache Components
  });
}
