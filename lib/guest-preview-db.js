import { connection } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { MODE_LABEL, formatSalaryRange, humanize } from "@/lib/job-detail-mapping";
import { excerpt } from "@/lib/recommended-jobs-db";

/**
 * Pratinjau rekomendasi untuk tamu (belum masuk) di /recommended-jobs. Hanya untuk server.
 * Sumbernya fungsi database public.guest_jobs_preview (supabase/guest_jobs_preview.sql), yang hanya
 * mengembalikan satu lowongan utuh plus sektor dan pola kerja untuk kartu buram. Tabel jobs tidak
 * dibuka untuk anon, dan tamu tidak punya skor kecocokan (match = null).
 */

const TEASER_COUNT = 4;

/**
 * Respons fungsi database -> bentuk yang dipakai GuestPreview. Fungsi murni, bisa diuji sendiri.
 * @param {{ total?: number, top?: object|null, teaser?: object[] }|null} raw
 * @returns {{ total: number, top: object|null, teaser: Array<{ sector: string, mode: string|null }> }}
 */
export function toGuestPreview(raw) {
  const total = Number(raw?.total) || 0;
  const row = raw?.top ?? null;

  const labelOf = (item) => item?.sector_label ?? (item?.sector ? humanize(item.sector) : "Lainnya");

  const top = row
    ? {
        id: row.id,
        title: row.title,
        company: row.company_name,
        companyLogoUrl: row.company_logo_url ?? null,
        sector: labelOf(row),
        city: row.city ?? row.province ?? null,
        mode: MODE_LABEL[row.work_arrangement] ?? null,
        salary: formatSalaryRange(row.salary_min, row.salary_max),
        status: "dibuka",
        match: null, // tamu belum punya skor
        description: excerpt(row.description),
        benefits: (row.benefits ?? []).map((b) => String(b ?? "").trim()).filter(Boolean),
        skills: row.skills ?? [],
        gaps: [],
        reasons: [],
      }
    : null;

  const teaser = (raw?.teaser ?? []).map((t) => ({ sector: labelOf(t), mode: MODE_LABEL[t.work_arrangement] ?? null }));
  return { total, top, teaser };
}

/** @returns {Promise<{ preview: ReturnType<typeof toGuestPreview>|null, error: string|null }>} */
export async function fetchGuestPreview() {
  await connection();
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("guest_jobs_preview", { p_teaser: TEASER_COUNT });
  if (error) {
    console.error("[guest-preview] guest_jobs_preview:", error.message);
    return { preview: null, error: "Pratinjau lowongan belum bisa dimuat. Coba lagi beberapa saat lagi." };
  }
  return { preview: toGuestPreview(data), error: null };
}
