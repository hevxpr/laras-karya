import { MODE_LABEL, formatSalaryRange, humanize, isJobOpen, todayWib } from "@/lib/job-detail-mapping";

/**
 * Baris tabel Supabase (saved_jobs + jobs, sectors, applications, job_recommendations)
 * -> bentuk kartu di /bookmarks (sama dengan lib/mock-saved-jobs.js, ditambah `applied`).
 * Fungsi murni tanpa akses database, supaya bisa diuji sendiri. Pengambilan datanya ada di lib/saved-jobs-db.js.
 */

/**
 * @param {{
 *   rows: Array<{ created_at: string, jobs: object | object[] | null }>,  baris saved_jobs dengan data jobs
 *   sectorLabels?: Record<string, string>,       sectors.code -> label
 *   appliedJobIds?: string[],                    applications.job_id milik user
 *   scores?: Record<string, number|string|null>, job_id -> job_recommendations.match_score
 *   today?: string,                              "YYYY-MM-DD" (WIB)
 * }} input
 */
export function buildSavedJobsFromRows({ rows = [], sectorLabels = {}, appliedJobIds = [], scores = {}, today = todayWib() }) {
  const applied = new Set(appliedJobIds);

  return rows
    .map((row) => ({ savedAt: row.created_at, job: Array.isArray(row.jobs) ? row.jobs[0] : row.jobs }))
    .filter((r) => r.job) // lowongan yang sudah tidak terlihat (ditutup/dihapus) dilewati
    .map(({ savedAt, job }) => {
      const score = scores[job.id] == null ? NaN : Number(scores[job.id]);
      const mode = MODE_LABEL[job.work_arrangement] ?? null;
      return {
        id: job.id,
        title: job.title,
        company: job.company_name,
        companyLogoUrl: job.company_logo_url ?? null,
        sector: sectorLabels[job.sector] ?? (job.sector ? humanize(job.sector) : "Lainnya"),
        mode,
        city: mode === "Remote" ? null : job.city ?? job.province ?? null,
        salary: formatSalaryRange(job.salary_min, job.salary_max),
        status: isJobOpen(job, today) ? "dibuka" : "ditutup",
        match: Number.isFinite(score) ? Math.max(0, Math.min(100, Math.round(score))) : null,
        savedAt: String(savedAt ?? ""),
        applied: applied.has(job.id),
      };
    })
    .sort((a, b) => b.savedAt.localeCompare(a.savedAt));
}