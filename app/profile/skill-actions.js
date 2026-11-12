"use server";

import { skillLabelsFromCodes } from "@/lib/assessment-mapping";
import { extractSkillCodes, MAX_CERT_SKILLS } from "@/lib/gemini-skills";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

/*
  Server Action halaman /profile: saran keahlian dari nama sertifikat (Gemini).
  Hanya untuk user yang sudah masuk (berbeda dengan asesmen yang boleh diisi tamu), dan tidak menulis
  apa pun ke database: hasilnya hanya saran, user memilih dulu lalu menyimpannya lewat tombol Simpan Perubahan.
  TODO: tambahkan pembatasan frekuensi (rate limit) per user sebelum rilis publik, karena tiap panggilan berbiaya.
*/

const NAME_MAX = 200;
const ISSUER_MAX = 120;

// Hilangkan tanda < > supaya teks user tidak bisa menutup tag <sertifikat> di prompt.
const clean = (value, max) => String(value ?? "").replace(/[<>]/g, " ").replace(/\s+/g, " ").trim().slice(0, max);

/**
 * Hasil: { ok: true, labels } | { ok: false, error: "auth" | "invalid" | "unavailable" | "ai" }
 * `labels` = nama keahlian dari katalog `skills`, sama dengan yang dipakai dropdown Tambah Skill.
 */
export async function suggestSkillsFromCertificate({ name, issuer } = {}) {
  if (!isSupabaseConfigured) return { ok: false, error: "unavailable" };
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data?.user) return { ok: false, error: "auth" };

  const cleanName = clean(name, NAME_MAX);
  const cleanIssuer = clean(issuer, ISSUER_MAX);
  if (cleanName.length < 3) return { ok: false, error: "invalid" };
  if (!process.env.GEMINI_API_KEY) return { ok: false, error: "unavailable" };

  try {
    const codes = await extractSkillCodes(`Nama: ${cleanName}\nPenerbit: ${cleanIssuer || "-"}`, {
      kind: "certificate",
    });
    return { ok: true, labels: skillLabelsFromCodes(codes).slice(0, MAX_CERT_SKILLS) };
  } catch (error) {
    console.error("[suggestSkillsFromCertificate]", error?.message ?? error);
    return { ok: false, error: "ai" };
  }
}
