/**
 * Skill gap satu lowongan untuk /learning-path?job=<id>.
 * Fungsi murni (tanpa database): dipakai app/learning-path/actions.js untuk mengolah hasil query.
 *
 * Definisi gap SAMA dengan kartu "Kecocokan Profil" di halaman lowongan (lib/job-detail-mapping.js
 * dan lib/skill-groups.js): hanya keterampilan teknis yang dihitung, yaitu job_skills.is_required
 * bukan false (is_required kosong dianggap wajib). Jadi jumlah skill di tombol "Lihat Pelatihan"
 * di halaman lowongan selalu sama dengan isi halaman pelatihan.
 */

/** Paling banyak berapa skill yang dirinci di kotak "Skill Gap Teridentifikasi" (sisanya jadi "+N lainnya"). */
export const MAX_HERO_SKILLS = 6;

const humanize = (code) => {
  const text = String(code ?? "").replace(/[-_]+/g, " ").trim();
  return text ? text.charAt(0).toUpperCase() + text.slice(1) : "";
};

const labelOf = (row) => {
  const rel = Array.isArray(row.skills) ? row.skills[0] : row.skills;
  return rel?.label ?? humanize(row.skill_code);
};

/**
 * @param {Array<{ skill_code: string, is_required?: boolean|null, skills?: {label: string}|{label: string}[]|null }>} skillRows  baris job_skills
 * @param {string[]} ownedCodes  user_skills.skill_code milik user
 * @returns {{ skills: Array<{code: string, name: string, owned: boolean}>, missing: Array<{code: string, name: string, owned: boolean}> }}
 *   skills: semua keterampilan teknis lowongan (yang belum dimiliki lebih dulu, lalu urut nama)
 *   missing: hanya yang belum dimiliki user
 */
export function computeJobGap(skillRows = [], ownedCodes = []) {
  const owned = new Set(ownedCodes);
  const seen = new Set();
  const skills = [];

  for (const row of skillRows ?? []) {
    if (!row?.skill_code || seen.has(row.skill_code)) continue;
    if (row.is_required === false) continue; // skill pendukung: tidak masuk gap
    seen.add(row.skill_code);
    skills.push({ code: row.skill_code, name: labelOf(row), owned: owned.has(row.skill_code) });
  }

  skills.sort((a, b) => Number(a.owned) - Number(b.owned) || a.name.localeCompare(b.name, "id"));
  return { skills, missing: skills.filter((s) => !s.owned) };
}

/**
 * Bentuk untuk kotak "Skill Gap Teridentifikasi" (yang belum dimiliki lebih dulu).
 * @returns {{ skillGaps: Array<{skill: string, status: string, tone: "red"|"green"}>, moreSkills: number }}
 */
export function toHeroSkills(skills = [], limit = MAX_HERO_SKILLS) {
  return {
    skillGaps: skills.slice(0, limit).map((s) => ({
      skill: s.name,
      status: s.owned ? "Sudah baik" : "Belum dikuasai",
      tone: s.owned ? "green" : "red",
    })),
    moreSkills: Math.max(0, skills.length - limit),
  };
}

/**
 * Label skill pada kartu pelatihan: skill gap pertama yang diajarkan course ini, plus "+N" bila lebih dari satu.
 * @param {string[]} names nama skill gap yang diajarkan course (urut prioritas)
 */
export function skillTagFor(names = []) {
  if (names.length === 0) return null;
  return names.length === 1 ? names[0] : `${names[0]} +${names.length - 1}`;
}
