import { connection } from "next/server";

import { buildApplicationsFromRows } from "@/lib/applications-mapping";
import { createClient } from "@/lib/supabase/server";

/**
 * Lamaran milik user dari Supabase untuk /applications (Lacak Lamaran) dan Beranda. Hanya untuk server.
 * Memakai sesi user (bukan service role), jadi dijaga RLS applications_select: user hanya membaca lamarannya sendiri.
 *
 * Status lamaran (applications.current_status): diproses | interview | diterima | ditolak.
 * "Dilamar" di UI = "diproses" di database (nilai awal yang diwajibkan policy applications_insert_own).
 *
 * @param {{ id: string }} user user yang sedang masuk (dari getCurrentUser)
 * @returns {Promise<{ applications: import("@/lib/applications-data").Application[], error: string|null }>}
 */
export async function fetchMyApplications(user) {
  await connection();
  const supabase = await createClient();

  const [appsRes, sectorsRes] = await Promise.all([
    supabase
      .from("applications")
      .select("id,job_id,current_status,applied_at,jobs(title,company_name,sector)")
      .eq("user_id", user.id)
      .order("applied_at", { ascending: false }),
    supabase.from("sectors").select("code,label"),
  ]);

  if (appsRes.error) {
    console.error("[applications] applications:", appsRes.error.message);
    return { applications: [], error: "Lamaran belum bisa dimuat. Coba lagi beberapa saat lagi." };
  }
  // Label sektor hanya pelengkap: bila gagal, kode sektor diubah jadi teks biasa.
  if (sectorsRes.error) console.warn("[applications] sectors:", sectorsRes.error.message);

  const sectorLabels = Object.fromEntries((sectorsRes.data ?? []).map((s) => [s.code, s.label]));
  return { applications: buildApplicationsFromRows({ rows: appsRes.data ?? [], sectorLabels }), error: null };
}
