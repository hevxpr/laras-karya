"use server";

import {
  fromAssessmentAnswers,
  skillCodesFromLabels,
  skillLabelsFromCodes,
  toAssessmentAnswers,
  toEducationRow,
  toProfileUpdate,
} from "@/lib/assessment-mapping";
import { LIMITS, SKILL_OPTIONS } from "@/lib/assessment-options";
import { isValid, validateStep1, validateStep2, validateStep3 } from "@/lib/assessment-validation";
import { extractSkillCodes } from "@/lib/gemini-skills";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

/**
 * Simpan jawaban asesmen ke profil user yang sedang masuk.
 * Semua penulisan memakai sesi user (bukan service role), jadi dijaga RLS: user hanya menulis datanya sendiri.
 * Hasil: { ok: true } | { ok: false, error: "auth" | "invalid" | "db", detail? }
 */
export async function saveAssessment(answers) {
  if (!isSupabaseConfigured) return { ok: false, error: "auth" };
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  const user = auth?.user;
  if (!user) return { ok: false, error: "auth" }; // tamu: jawaban tetap di browser sampai daftar/masuk

  // Validasi ulang di server: jangan percaya data dari browser
  if (
    !answers?.step_1 || !answers?.step_2 || !answers?.step_3 ||
    !isValid(validateStep1(answers.step_1)) ||
    !isValid(validateStep2(answers.step_2)) ||
    !isValid(validateStep3(answers.step_3, SKILL_OPTIONS))
  ) {
    return { ok: false, error: "invalid" };
  }

  const fail = (step, error) => {
    console.error(`[saveAssessment] ${step}:`, error?.message ?? error);
    return { ok: false, error: "db", detail: step };
  };

  // 1) Profil (bio diisi dari cerita pengalaman bila masih kosong)
  const { data: current, error: bioReadError } = await supabase.from("profiles").select("bio").eq("id", user.id).maybeSingle();
  if (bioReadError) return fail("profiles", bioReadError);
  const { error: profileError } = await supabase
    .from("profiles")
    .update(toProfileUpdate(answers, { currentBio: current?.bio }))
    .eq("id", user.id);
  if (profileError) return fail("profiles", profileError);

  // 2) Pendidikan: perbarui baris yang sama (institusi + jenjang), atau tambah baris baru
  const edu = toEducationRow(answers);
  const { data: existing, error: eduReadError } = await supabase
    .from("educations")
    .select("id, institution, degree_level")
    .eq("user_id", user.id);
  if (eduReadError) return fail("educations", eduReadError);
  const same = existing.find(
    (e) => e.institution.trim().toLowerCase() === edu.institution.toLowerCase() && e.degree_level === edu.degree_level,
  );
  const { error: eduError } = same
    ? await supabase.from("educations").update({ major: edu.major }).eq("id", same.id)
    : await supabase.from("educations").insert({ ...edu, user_id: user.id });
  if (eduError) return fail("educations", eduError);

  // 3) Keahlian: hanya kode yang memang ada di tabel skills; ganti daftar keahlian "manual" milik user
  const wanted = skillCodesFromLabels(answers.step_3.skills);
  const { data: known, error: skillReadError } = await supabase.from("skills").select("code").in("code", wanted);
  if (skillReadError) return fail("skills", skillReadError);
  const codes = known.map((s) => s.code);
  const { error: delError } = await supabase
    .from("user_skills")
    .delete()
    .eq("user_id", user.id)
    .eq("source", "manual")
    .not("skill_code", "in", `(${codes.map((c) => `"${c}"`).join(",") || '""'})`);
  if (delError) return fail("user_skills", delError);
  if (codes.length) {
    const { error: insError } = await supabase
      .from("user_skills")
      .upsert(codes.map((skill_code) => ({ user_id: user.id, skill_code, source: "manual" })), {
        onConflict: "user_id,skill_code",
        ignoreDuplicates: true,
      });
    if (insError) return fail("user_skills", insError);
  }

  // 4) Arsip asesmen
  const now = new Date().toISOString();
  const { error: assessError } = await supabase.from("assessments").insert({
    user_id: user.id,
    status: "completed",
    answers: toAssessmentAnswers(answers),
    consent_at: now,
    completed_at: now,
  });
  if (assessError) return fail("assessments", assessError);

  return { ok: true, skippedSkills: wanted.length - codes.length };
}

/** Jawaban asesmen terakhir milik user yang masuk (untuk mengisi ulang form), atau null. */
export async function loadMyAssessment() {
  if (!isSupabaseConfigured) return null;
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth?.user) return null;
  const { data } = await supabase
    .from("assessments")
    .select("answers")
    .eq("user_id", auth.user.id)
    .eq("status", "completed")
    .order("completed_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return fromAssessmentAnswers(data?.answers);
}

/**
 * Saran keahlian dari cerita pengalaman (langkah 2), ditampilkan di langkah 3.
 * Boleh dipanggil tamu (asesmen bisa diisi sebelum daftar), jadi panjang cerita dibatasi sama seperti form.
 * TODO: tambahkan pembatasan frekuensi (rate limit) per IP/user sebelum rilis publik, karena tiap panggilan berbiaya.
 * Hasil: { ok: true, labels } | { ok: false, error: "invalid" | "unavailable" | "ai" }
 */
export async function suggestSkillsFromStory(story) {
  const text = String(story ?? "").trim();
  if (text.length < LIMITS.storyMin || text.length > LIMITS.storyMax) return { ok: false, error: "invalid" };
  if (!process.env.GEMINI_API_KEY) return { ok: false, error: "unavailable" };
  try {
    const codes = await extractSkillCodes(text);
    console.info(`[suggestSkillsFromStory] ${codes.length} keahlian:`, codes.join(", ") || "(kosong)");
    return { ok: true, labels: skillLabelsFromCodes(codes) };
  } catch (error) {
    console.error("[suggestSkillsFromStory]", error?.message ?? error);
    return { ok: false, error: "ai" };
  }
}
