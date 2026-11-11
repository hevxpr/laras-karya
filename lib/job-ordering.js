import { hasApplied } from "@/lib/applications-data";

/**
 * Urutan rekomendasi: hanya lowongan yang dibuka, yang belum dilamar di depan,
 * yang sudah dilamar di belakang. Urutan skor tetap terjaga di tiap kelompok.
 * Dipakai oleh /home dan /recommended-jobs agar aturannya sama.
 * @template {{ id: string|number, status: string }} T
 * @param {T[]} jobs
 * @param {(id: string|number, job: T) => boolean} [isApplied] penentu "sudah dilamar" (bawaan: data contoh)
 * @returns {T[]}
 */
export function getOpenJobsAppliedLast(jobs, isApplied = hasApplied) {
  return jobs
    .filter((j) => j.status === "dibuka")
    .sort((a, b) => Number(isApplied(a.id, a)) - Number(isApplied(b.id, b)));
}