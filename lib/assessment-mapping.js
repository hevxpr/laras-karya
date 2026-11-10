import { toCareerPath } from "@/lib/assessment-options";
import { SKILLS_CATALOG } from "@/lib/skills-catalog";

/**
 * Jawaban asesmen (bentuk context/assessment-store.js) -> baris database Supabase.
 * Fungsi murni: dipakai Server Action app/assessment/actions.js dan bisa diuji tanpa database.
 *
 *   step_1 -> profiles.career_path, assessments.consent_at
 *   step_2 -> profiles.province / city / open_to_relocate / certifications, educations
 *   step_3 -> profiles.work_arrangement_pref / interest_sectors / experience_level, user_skills
 *   semua  -> assessments.answers (arsip lengkap, termasuk cerita pengalaman)
 */

const CODE_BY_LABEL = new Map(SKILLS_CATALOG.map((s) => [s.label.toLowerCase(), s.code]));
const LABEL_BY_CODE = new Map(SKILLS_CATALOG.map((s) => [s.code, s.label]));

/** Label keahlian di form -> kode tabel skills. Label yang tidak dikenal dibuang. */
export function skillCodesFromLabels(labels = []) {
  const codes = labels.map((l) => CODE_BY_LABEL.get(String(l).trim().toLowerCase())).filter(Boolean);
  return [...new Set(codes)];
}

export function skillLabelsFromCodes(codes = []) {
  return codes.map((c) => LABEL_BY_CODE.get(c)).filter(Boolean);
}

/**
 * Kolom profiles yang diisi dari asesmen (full_name sudah diisi saat daftar).
 * Bio diisi dari cerita pengalaman (langkah 2) HANYA bila bio di profil masih kosong,
 * supaya bio yang sudah ditulis/diubah user di halaman profil tidak tertimpa.
 */
export function toProfileUpdate(answers, { currentBio = null } = {}) {
  const { step_1: s1, step_2: s2, step_3: s3 } = answers;
  const story = String(s2.experience_story ?? "").trim();
  const fillBio = story && !String(currentBio ?? "").trim();
  return {
    ...(fillBio ? { bio: story } : {}),
    career_path: toCareerPath(s1.career_situation),
    province: s2.province || null,
    city: s2.city?.trim() || null,
    open_to_relocate: Boolean(s2.open_to_relocate),
    certifications: (s2.certifications ?? [])
      .map((c) => ({ name: String(c.name ?? "").trim(), issuer: String(c.issuer ?? "").trim() }))
      .filter((c) => c.name),
    work_arrangement_pref: s3.work_arrangement || null,
    interest_sectors: [...new Set(s3.interest_sectors ?? [])],
    experience_level: s3.experience_level || null,
    assessment_step: 4,
  };
}

/** Baris educations dari langkah 2. */
export function toEducationRow(answers) {
  const e = answers.step_2.education ?? {};
  return {
    institution: String(e.institution ?? "").trim(),
    degree_level: e.degree_level || null,
    major: String(e.major ?? "").trim() || null,
  };
}

/** Isi assessments.answers: arsip jawaban (persetujuan dicatat terpisah di consent_at). */
export function toAssessmentAnswers(answers) {
  const { step_1: s1, step_2: s2, step_3: s3 } = answers;
  return {
    version: 1,
    step_1: { career_situation: s1.career_situation, career_break: s1.career_break ?? null },
    step_2: { ...s2, experience_story: String(s2.experience_story ?? "").trim() },
    step_3: { ...s3, skill_codes: skillCodesFromLabels(s3.skills) },
  };
}

/** Kebalikannya: arsip di database -> bentuk store, untuk mengisi ulang form saat user kembali. */
export function fromAssessmentAnswers(saved) {
  if (!saved?.step_1 || !saved?.step_2 || !saved?.step_3) return null;
  const { skill_codes: codes, ...s3 } = saved.step_3;
  return {
    step: 4,
    step_1: { ...saved.step_1, consent: true },
    step_2: saved.step_2,
    step_3: { ...s3, skills: codes ? skillLabelsFromCodes(codes) : s3.skills ?? [] },
  };
}

/** Sidik jari jawaban, supaya jawaban yang sama tidak disimpan dua kali. */
export function answersKey(answers) {
  const { step_1, step_2, step_3 } = answers;
  return JSON.stringify([step_1, step_2, step_3]);
}
