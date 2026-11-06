"use server";

import { dbToProfile, profileToDb } from "@/lib/profile-mapping";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

/*
  Server Action halaman /profile: membaca dan menyimpan profil user yang sedang masuk.
  Memakai sesi user (bukan service role), jadi dijaga RLS: user hanya membaca/menulis datanya sendiri.
*/

async function currentUser() {
  if (!isSupabaseConfigured) return { supabase: null, user: null };
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  return { supabase, user: data?.user ?? null };
}

async function readProfile(supabase, user) {
  const [profile, educations, experiences, skills, assessment] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
    supabase.from("educations").select("*").eq("user_id", user.id),
    supabase.from("work_experiences").select("*").eq("user_id", user.id),
    supabase.from("user_skills").select("skill_code").eq("user_id", user.id),
    supabase
      .from("assessments")
      .select("answers")
      .eq("user_id", user.id)
      .eq("status", "completed")
      .order("completed_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);
  const failed = [profile, educations, experiences, skills].find((r) => r.error);
  if (failed) throw failed.error;
  return dbToProfile({
    email: user.email,
    profile: profile.data,
    educations: educations.data,
    experiences: experiences.data,
    skillCodes: skills.data.map((s) => s.skill_code),
    careerBreak: assessment.data?.answers?.step_1?.career_break ?? null,
  });
}

/** Profil user yang masuk dalam bentuk halaman /profile, atau null (tamu / Supabase belum dikonfigurasi). */
export async function loadMyProfile() {
  const { supabase, user } = await currentUser();
  if (!user) return null;
  try {
    return await readProfile(supabase, user);
  } catch (error) {
    console.error("[loadMyProfile]", error?.message ?? error);
    return null;
  }
}

/** Simpan seluruh isi halaman profil. Hasil: { ok: true, profile } | { ok: false, error } */
export async function saveMyProfile(draft) {
  const { supabase, user } = await currentUser();
  if (!user) return { ok: false, error: "Sesi Anda berakhir. Silakan masuk lagi." };
  if (!draft?.name?.trim()) return { ok: false, error: "Nama lengkap wajib diisi." };

  const { profile, educations, experiences, skillCodes } = profileToDb(draft);
  const fail = (step, error) => {
    console.error(`[saveMyProfile] ${step}:`, error?.message ?? error);
    return { ok: false, error: "Profil belum tersimpan. Coba lagi beberapa saat lagi." };
  };

  const { error: pErr } = await supabase.from("profiles").update(profile).eq("id", user.id);
  if (pErr) return fail("profiles", pErr);

  // Daftar baris (pendidikan / pengalaman): hapus yang dibuang, ubah yang ada, tambah yang baru.
  async function syncRows(table, rows) {
    const keep = rows.filter((r) => r.id).map((r) => r.id);
    let del = supabase.from(table).delete().eq("user_id", user.id);
    if (keep.length) del = del.not("id", "in", `(${keep.join(",")})`);
    const { error: dErr } = await del;
    if (dErr) return dErr;
    for (const { id, ...row } of rows.filter((r) => r.id)) {
      const { error } = await supabase.from(table).update(row).eq("id", id).eq("user_id", user.id);
      if (error) return error;
    }
    const added = rows.filter((r) => !r.id).map(({ id: _omit, ...row }) => ({ ...row, user_id: user.id }));
    if (added.length) {
      const { error } = await supabase.from(table).insert(added);
      if (error) return error;
    }
    return null;
  }
  const eduErr = await syncRows("educations", educations);
  if (eduErr) return fail("educations", eduErr);
  const expErr = await syncRows("work_experiences", experiences);
  if (expErr) return fail("work_experiences", expErr);

  // Keahlian: daftar di halaman profil adalah daftar lengkap milik user
  let delSkills = supabase.from("user_skills").delete().eq("user_id", user.id);
  if (skillCodes.length) delSkills = delSkills.not("skill_code", "in", `(${skillCodes.map((c) => `"${c}"`).join(",")})`);
  const { error: sDel } = await delSkills;
  if (sDel) return fail("user_skills", sDel);
  if (skillCodes.length) {
    const { error } = await supabase
      .from("user_skills")
      .upsert(skillCodes.map((skill_code) => ({ user_id: user.id, skill_code, source: "manual" })), {
        onConflict: "user_id,skill_code",
        ignoreDuplicates: true,
      });
    if (error) return fail("user_skills", error);
  }

  try {
    return { ok: true, profile: await readProfile(supabase, user) };
  } catch (error) {
    return fail("reload", error);
  }
}
