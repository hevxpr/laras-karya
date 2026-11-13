import { SECTORS } from "@/lib/assessment-options";
import { toCareerLabel } from "@/lib/career-label";
import { SKILLS_CATALOG } from "@/lib/skills-catalog";

/**
 * Halaman /profile <-> database Supabase. Fungsi murni (bisa diuji tanpa database).
 *
 * Bentuk UI = bentuk lib/profile-data.js (PROFILE), yang dipakai app/profile/page.js.
 * Tabel: profiles, educations, work_experiences, user_skills (+ email dari akun Supabase Auth).
 */

/* ---------- Kamus kode <-> label ---------- */

const EXPERIENCE = [
  ["entry", "Fresh Graduate (0–1 tahun)"],
  ["junior", "Junior (1–3 tahun)"],
  ["mid", "Menengah (3–5 tahun)"],
  ["senior", "Senior (5–8 tahun)"],
  ["senior", "Ahli / Lead (8+ tahun)"], // database hanya punya 4 tingkat
];
const ARRANGEMENT = [
  ["onsite", "WFO"],
  ["hybrid", "Hybrid"],
  ["remote", "Remote"],
];
const CAREER = [
  ["switch_or_return", "Berpindah karier"],
  ["switch_or_return", "Kembali bekerja setelah jeda karier"],
  ["practical_experience", "Belajar dari pengalaman praktik"],
  ["fresh_start", "Lulusan baru atau mulai dari nol"],
];
const DEGREE = { sma: "SMA/SMK", d3: "D3", s1: "S1", s2: "S2", s3: "S3" };
const DEGREE_IN = { sma: "sma", smk: "sma", d3: "d3", d4: "s1", s1: "s1", s2: "s2", s3: "s3" };
const LANGUAGE_LEVELS = {
  Native: { percent: 100, tone: "brand" },
  Profesional: { percent: 80, tone: "blue" },
  Menengah: { percent: 55, tone: "neutral" },
  Dasar: { percent: 30, tone: "amber" },
};
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
const MONTH_IN = { jan: 1, feb: 2, mar: 3, apr: 4, mei: 5, may: 5, jun: 6, jul: 7, agu: 8, ags: 8, aug: 8, sep: 9, okt: 10, oct: 10, nov: 11, des: 12, dec: 12 };

const toLabel = (pairs, code) => pairs.find(([c]) => c === code)?.[1] ?? "";
const toCode = (pairs, label) => pairs.find(([, l]) => l === label)?.[0] ?? null;
const SKILL_LABEL = new Map(SKILLS_CATALOG.map((s) => [s.code, s.label]));
const SKILL_CODE = new Map(SKILLS_CATALOG.map((s) => [s.label.toLowerCase(), s.code]));

export function initialsOf(name) {
  return String(name ?? "").split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join("") || "?";
}

/* ---------- Periode teks bebas <-> kolom tanggal/tahun ---------- */

/** "Jan 2022 — Sekarang" / "2020 - 2022" -> { start_date, end_date, is_current }. Bagian yang tak terbaca = null. */
export function parseWorkPeriod(text = "") {
  const t = String(text).toLowerCase();
  const found = [...t.matchAll(/(?:([a-z]{3})[a-z]*\.?\s+)?(\d{4})/g)].map((m) => ({
    month: MONTH_IN[m[1]] ?? 1,
    year: Number(m[2]),
  }));
  const iso = (d) => (d ? `${d.year}-${String(d.month).padStart(2, "0")}-01` : null);
  const isCurrent = /sekarang|saat ini|kini|present|now/.test(t);
  return { start_date: iso(found[0]), end_date: isCurrent ? null : iso(found[1]), is_current: isCurrent };
}

/** Kebalikannya, mis. "Jan 2022 — Sekarang (2 tahun 3 bulan)". today hanya untuk pengujian. */
export function formatWorkPeriod({ start_date: startRaw, end_date: endRaw, is_current: current }, today = new Date()) {
  // Supabase mengirim tanggal sebagai teks "YYYY-MM-DD"; terima juga objek Date.
  const asText = (v) => (v instanceof Date ? v.toISOString().slice(0, 10) : v ? String(v) : null);
  const start = asText(startRaw);
  const end = asText(endRaw);
  if (!start) return "";
  const [sy, sm] = start.split("-").map(Number);
  const fmt = (y, m) => `${MONTHS[m - 1]} ${y}`;
  let ey, em;
  if (current) [ey, em] = [today.getFullYear(), today.getMonth() + 1];
  else if (end) [ey, em] = end.split("-").map(Number);
  const range = `${fmt(sy, sm)} — ${current ? "Sekarang" : end ? fmt(ey, em) : "?"}`;
  if (!ey) return range;
  const months = (ey - sy) * 12 + (em - sm) + 1;
  const y = Math.floor(months / 12), m = months % 12;
  const dur = [y && `${y} tahun`, m && `${m} bulan`].filter(Boolean).join(" ");
  return dur ? `${range} (${dur})` : range;
}

/* ---------- Database -> UI ---------- */

/** Persen kelengkapan + teks "Tersisa: ...", dihitung dari isi profil sungguhan. */
export function completenessOf(p) {
  const parts = [
    ["lengkapi nama dan posisi", 10, p.name && p.headline],
    ["tulis bio", 10, p.bio],
    ["lengkapi kontak", 10, p.contact.phone && p.contact.location],
    ["isi preferensi karier", 15, p.workArrangement && p.industries.length && p.experienceLevel],
    ["tambah pengalaman kerja", 15, p.experiences.length],
    ["tambah pendidikan", 15, p.education.length],
    ["tambah keahlian", 15, p.skills.length],
    ["tambah sertifikasi", 5, p.certifications.length],
    ["tambah bahasa", 5, p.languages.length],
  ];
  const missing = parts.filter(([, , done]) => !done);
  const completeness = 100 - missing.reduce((s, [, w]) => s + w, 0);
  const remaining = missing.length ? `Tersisa: ${missing.map(([l, w]) => `${l} (${w}%)`).join(", ")}` : "";
  return { completeness, remaining, missing: missing.map(([label, weight]) => ({ label, weight })) };
}

export function dbToProfile({ email, profile: r, educations = [], experiences = [], skillCodes = [], careerBreak = null }) {
  const name = r?.full_name || String(email ?? "").split("@")[0] || "Akun";
  const ui = {
    name,
    initials: initialsOf(name),
    headline: r?.headline ?? "",
    status: toCareerLabel(r?.career_path, careerBreak),
    bio: r?.bio ?? "",
    experienceLevel: toLabel(EXPERIENCE, r?.experience_level),
    workArrangement: toLabel(ARRANGEMENT, r?.work_arrangement_pref),
    industries: (r?.interest_sectors ?? []).map((c) => SECTORS.find((s) => s.value === c)?.label).filter(Boolean),
    contact: {
      email: email ?? "",
      phone: r?.phone ?? "",
      location: [r?.city, r?.province].filter(Boolean).join(", "),
      linkedin: r?.linkedin_url ?? "",
    },
    experiences: [...experiences]
      .sort((a, b) => Number(b.is_current) - Number(a.is_current) || String(b.start_date).localeCompare(String(a.start_date)))
      .map((e) => ({ id: e.id, role: e.job_title, company: e.company_name, period: formatWorkPeriod(e), description: e.description ?? "" })),
    education: [...educations]
      .sort((a, b) => (b.end_year ?? 0) - (a.end_year ?? 0))
      .map((e) => ({
        id: e.id,
        degree: [DEGREE[e.degree_level], e.major].filter(Boolean).join(" "),
        school: e.institution,
        period: [e.start_year, e.end_year].filter(Boolean).join(" — "),
        gpa: e.gpa != null ? `IPK: ${Number(e.gpa).toFixed(2)} / 4.00` : "",
      })),
    certifications: (r?.certifications ?? []).map((c, i) => ({ id: `cert-${i + 1}`, name: c.name ?? "", issuer: c.issuer ?? "", year: c.year ?? "" })),
    skills: skillCodes.map((code, i) => ({ id: code, label: SKILL_LABEL.get(code) ?? code, highlight: i < 4 })),
    languages: (r?.languages ?? []).map((l, i) => ({ id: `lang-${i + 1}`, name: l.name, level: l.level, ...(LANGUAGE_LEVELS[l.level] ?? LANGUAGE_LEVELS.Profesional) })),
  };
  return { ...ui, ...completenessOf(ui) };
}

/* ---------- UI -> Database ---------- */

const isUuid = (id) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(id));

export function parseDegree(text = "") {
  const m = String(text).trim().match(/^(sma|smk|d3|d4|s1|s2|s3)\b\s*(.*)$/i);
  if (!m) return { degree_level: null, major: String(text).trim() || null };
  return { degree_level: DEGREE_IN[m[1].toLowerCase()], major: m[2].trim() || null };
}

export function profileToDb(ui) {
  const comma = ui.contact.location.lastIndexOf(",");
  const city = (comma === -1 ? ui.contact.location : ui.contact.location.slice(0, comma)).trim();
  const province = comma === -1 ? "" : ui.contact.location.slice(comma + 1).trim();
  const careerPath = toCode(CAREER, ui.status);
  const profile = {
    full_name: ui.name.trim(),
    headline: ui.headline?.trim() || null,
    bio: ui.bio?.trim() || null,
    phone: ui.contact.phone?.trim() || null,
    city: city || null,
    province: province || null,
    linkedin_url: ui.contact.linkedin?.trim() || null,
    experience_level: toCode(EXPERIENCE, ui.experienceLevel),
    work_arrangement_pref: toCode(ARRANGEMENT, ui.workArrangement),
    interest_sectors: ui.industries.map((l) => SECTORS.find((s) => s.label === l)?.value).filter(Boolean),
    certifications: ui.certifications.map((c) => ({ name: c.name, issuer: c.issuer, ...(c.year ? { year: String(c.year) } : {}) })),
    languages: ui.languages.map((l) => ({ name: l.name, level: l.level })),
    ...(careerPath ? { career_path: careerPath } : {}), // status teks bebas yang tidak dikenal tidak mengubah jalur karier
  };
  const educations = ui.education.map((e) => {
    const years = [...String(e.period ?? "").matchAll(/\d{4}/g)].map((m) => Number(m[0]));
    const gpa = String(e.gpa ?? "").replace(",", ".").match(/\d+(\.\d+)?/);
    return {
      id: isUuid(e.id) ? e.id : null,
      institution: e.school.trim(),
      ...parseDegree(e.degree),
      start_year: years[0] ?? null,
      end_year: years[1] ?? null,
      gpa: gpa ? Number(gpa[0]) : null,
    };
  });
  const experiences = ui.experiences.map((e) => ({
    id: isUuid(e.id) ? e.id : null,
    job_title: e.role.trim(),
    company_name: e.company.trim(),
    description: e.description?.trim() || null,
    ...parseWorkPeriod(e.period),
  }));
  const skillCodes = [...new Set(ui.skills.map((s) => SKILL_CODE.get(s.label.toLowerCase())).filter(Boolean))];
  return { profile, educations, experiences, skillCodes };
}
