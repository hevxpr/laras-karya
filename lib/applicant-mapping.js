/**
 * Data pelamar untuk halaman persiapan lamaran dan snapshot profil yang disimpan bersama lamaran.
 * Fungsi murni (tanpa akses database), jadi mudah diuji. Sumbernya bentuk profil UI dari lib/profile-mapping.js
 * (dbToProfile), yaitu hasil loadMyProfile() di app/profile/data-actions.js.
 *
 * @typedef {Object} Applicant
 * @property {string} name
 * @property {string} phone
 * @property {{ title: string, company: string, period: string } | null} lastJob   pengalaman terbaru
 * @property {{ degree: string, school: string } | null} education                 pendidikan terbaru
 * @property {string[]} skills                                                     label keahlian
 * @property {boolean} complete   true bila telepon, pengalaman, dan pendidikan sudah terisi
 */

const text = (v) => String(v ?? "").trim();
const cut = (v, n) => text(v).slice(0, n);

/**
 * Profil UI (dbToProfile) -> data pelamar untuk formulir. Profil null (gagal dibaca) tetap menghasilkan
 * formulir yang bisa dipakai: nama diambil dari akun, bagian lain kosong dan ditandai "belum diisi".
 * @param {object|null} profile
 * @param {{ name?: string|null, email?: string|null }|null} [user]
 * @returns {Applicant}
 */
export function toApplicant(profile, user = null) {
  const exp = profile?.experiences?.[0];
  const edu = profile?.education?.[0];
  const name = text(profile?.name) || text(user?.name) || text(user?.email).split("@")[0] || "Pelamar";
  const phone = text(profile?.contact?.phone);
  const lastJob = exp && (text(exp.role) || text(exp.company))
    ? { title: text(exp.role), company: text(exp.company), period: text(exp.period) }
    : null;
  const education = edu && (text(edu.degree) || text(edu.school))
    ? { degree: text(edu.degree), school: text(edu.school) }
    : null;
  return {
    name,
    phone,
    lastJob,
    education,
    skills: (profile?.skills ?? []).map((s) => text(s.label)).filter(Boolean),
    complete: Boolean(phone && lastJob && education),
  };
}

/**
 * Draf surat lamaran dari data nyata pelamar. Bagian yang datanya kosong dilewati, jadi surat tidak pernah
 * memuat "undefined" atau kalimat kosong. Pengguna tetap bisa menyunting drafnya.
 * @param {{ title: string, company: string }} job
 * @param {Applicant} a
 * @returns {string}
 */
export function buildCoverLetter(job, a) {
  const background = [];
  if (a.education?.degree) {
    background.push(`latar belakang pendidikan ${a.education.degree}${a.education.school ? ` dari ${a.education.school}` : ""}`);
  } else if (a.education?.school) {
    background.push(`latar belakang pendidikan di ${a.education.school}`);
  }
  if (a.lastJob?.title) {
    background.push(`pengalaman sebagai ${a.lastJob.title}${a.lastJob.company ? ` di ${a.lastJob.company}` : ""}`);
  }

  const opening = `Melalui surat ini saya mengekspresikan ketertarikan untuk posisi ${job.title} di ${job.company}.`;
  const fit = background.length
    ? `Dengan ${background.join(" serta ")}, saya yakin dapat memberikan kontribusi terhadap target keberlanjutan perusahaan Anda.`
    : "Saya siap belajar dan memberikan kontribusi terhadap target keberlanjutan perusahaan Anda.";
  const skills = a.skills.length ? `Keahlian yang saya miliki antara lain ${a.skills.slice(0, 5).join(", ")}.` : "";

  return ["Dengan hormat,", [opening, fit, skills].filter(Boolean).join(" "), `Hormat saya,\n${a.name}`].join("\n\n");
}

/**
 * Salinan profil saat melamar -> applications.profile_snapshot (jsonb, harus berupa objek).
 * Disusun di SERVER dari profil yang dibaca dari database, bukan dari kiriman browser, supaya isinya tepercaya.
 * Panjang tiap bagian dibatasi agar baris tidak membengkak.
 * @param {object|null} profile  hasil loadMyProfile()
 * @param {{ name?: string|null, email?: string|null }|null} user
 * @param {Date} [now]
 */
export function buildProfileSnapshot(profile, user = null, now = new Date()) {
  const p = profile ?? {};
  return {
    version: 1,
    captured_at: now.toISOString(),
    name: text(p.name) || text(user?.name) || null,
    email: text(p.contact?.email) || text(user?.email) || null,
    phone: text(p.contact?.phone) || null,
    location: text(p.contact?.location) || null,
    headline: cut(p.headline, 200) || null,
    experience_level: text(p.experienceLevel) || null,
    experiences: (p.experiences ?? []).slice(0, 10).map((e) => ({
      role: cut(e.role, 150), company: cut(e.company, 150), period: cut(e.period, 80), description: cut(e.description, 500),
    })),
    education: (p.education ?? []).slice(0, 5).map((e) => ({
      degree: cut(e.degree, 150), school: cut(e.school, 150), period: cut(e.period, 40), gpa: cut(e.gpa, 40),
    })),
    skills: (p.skills ?? []).slice(0, 40).map((s) => cut(s.label, 80)).filter(Boolean),
    certifications: (p.certifications ?? []).slice(0, 10).map((c) => ({ name: cut(c.name, 150), issuer: cut(c.issuer, 150), year: c.year ?? null })),
    languages: (p.languages ?? []).slice(0, 10).map((l) => ({ name: cut(l.name, 60), level: cut(l.level, 40) })),
  };
}
