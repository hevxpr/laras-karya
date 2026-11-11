import { todayWib } from "@/lib/job-detail-mapping";

/**
 * Baris tabel applications (+ jobs, sectors) -> bentuk Application yang dipakai halaman Lamaran Saya
 * dan Beranda (lihat typedef di lib/applications-data.js). Fungsi murni, tanpa akses database.
 */

const STATUSES = ["diproses", "interview", "diterima", "ditolak"];

const humanize = (code) =>
  String(code ?? "")
    .replace(/[_-]+/g, " ")
    .trim()
    .replace(/\b\p{L}/gu, (c) => c.toUpperCase());

/**
 * @param {{
 *   rows?: Array<{
 *     id: string, job_id: string, current_status: string, applied_at: string,
 *     jobs?: { title: string, company_name: string, sector: string|null } | null
 *   }>,
 *   sectorLabels?: Record<string, string>,
 * }} input
 * @returns {import("@/lib/applications-data").Application[]} terbaru di atas
 */
export function buildApplicationsFromRows({ rows = [], sectorLabels = {} }) {
  return rows
    .map((row) => {
      // Relasi to-one bisa datang sebagai objek atau array tergantung bentuk query.
      const job = Array.isArray(row.jobs) ? row.jobs[0] : row.jobs;
      return {
        id: row.id,
        jobId: row.job_id,
        // Lowongan yang sudah ditutup/ditarik tidak lagi terbaca (RLS jobs hanya menampilkan yang published).
        title: job?.title ?? "Lowongan tidak lagi tersedia",
        company: job?.company_name ?? "-",
        sector: job?.sector ? (sectorLabels[job.sector] ?? humanize(job.sector)) : "Lainnya",
        // Tanggal menurut WIB, bentuk "YYYY-MM-DD" (formatDate() di applications-data memerlukan ini).
        appliedAt: todayWib(Date.parse(row.applied_at)),
        status: STATUSES.includes(row.current_status) ? row.current_status : "diproses",
      };
    })
    .sort((a, b) => b.appliedAt.localeCompare(a.appliedAt));
}
