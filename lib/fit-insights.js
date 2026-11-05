import { PROFILE } from "@/lib/profile-data";
import { DEMO_ASSESSMENT } from "@/lib/demo-persona";
import { SECTORS } from "@/lib/assessment-options";

/*
  Insight "Mengapa cocok untuk Anda", satu sumber untuk dua tempat:
    - kartu di /recommended-jobs  (MatchPanel, lewat buildReasons di lib/match-reasons.js)
    - banner di /recommended-jobs/[id]  (FitReasonBanner)

  Isinya spesifik: menyebut nama keahlian beserta bukti dari pengalaman pengguna, jujur
  soal yang belum cocok (sektor, pola kerja, lokasi), dan menutup dengan langkah belajar.
  SEMENTARA disusun dari data contoh (PROFILE + jawaban asesmen contoh). Saat pipeline AI
  tersambung, isi `text`/`detail` cukup diganti dari kolom reason dan breakdown
  (tabel job_recommendations) tanpa mengubah komponen tampilannya.
*/

const PREF = DEMO_ASSESSMENT.step_3;
const MODE_LABEL = { onsite: "On-site", hybrid: "Hybrid", remote: "Remote" };
const PREFERRED_MODE = MODE_LABEL[PREF.work_arrangement]; // "Hybrid"
const HOME_CITY = PROFILE.contact.location.split(",")[0].trim(); // "Jakarta"
const INTEREST_LABELS = PREF.interest_sectors.map(
  (code) => SECTORS.find((s) => s.value === code)?.label ?? code
);
const FRIENDLY_PERKS = ["return-to-work", "laktasi", "fleksibel", "penitipan", "cuti", "asuransi", "pelecehan", "mentoring"];

// Kata kunci untuk mencari bukti sebuah keahlian di deskripsi pengalaman kerja.
const EVIDENCE_KEYWORDS = {
  "Analisis Data": ["analisis data"],
  "Koordinasi Proyek": ["koordinasi proyek"],
  "ESG Audit": ["audit esg"],
};

const norm = (t) => String(t ?? "").trim().toLowerCase();
const joinList = (items) =>
  items.length <= 1 ? (items[0] ?? "") : `${items.slice(0, -1).join(", ")} dan ${items[items.length - 1]}`;

/** Bukti dari pengalaman pengguna untuk satu keahlian, atau null bila tidak ada di profil. */
function evidenceFor(skill) {
  const keys = EVIDENCE_KEYWORDS[skill] ?? [norm(skill)];
  const exp = PROFILE.experiences.find((e) => keys.some((k) => norm(e.description).includes(k)));
  if (exp) return `${skill}: sudah Anda terapkan sebagai ${exp.role} di ${exp.company}.`;
  if (PROFILE.skills.some((s) => norm(s.label) === norm(skill))) return `${skill}: tercantum di keahlian profil Anda.`;
  return null;
}

/**
 * @typedef {Object} FitInsight
 * @property {"skills"|"sector"|"work"|"perks"|"next"} id
 * @property {"good"|"note"|"next"} tone   good = sudah sesuai, note = perlu diperhatikan, next = langkah berikutnya
 * @property {string} text                 kalimat utama (singkat)
 * @property {string} [detail]             penjelasan/bukti (hanya ditampilkan di halaman detail)
 * @property {string} [href]
 * @property {string} [linkLabel]
 *
 * @param {{ sector?: string, mode?: string, city?: string, perks?: string[], owned?: string[], missing?: string[] }} input
 *   owned/missing: nama keahlian yang sudah/belum dimiliki; perks: benefit khas lowongan (teks)
 * @returns {FitInsight[]}
 */
export function buildFitInsights({ sector, mode, city, perks = [], owned = [], missing = [] }) {
  const total = owned.length + missing.length;
  const out = [];

  // 1. Keahlian, dengan bukti dari pengalaman
  if (owned.length) {
    const shown = joinList(owned.slice(0, 3)) + (owned.length > 3 ? " dan lainnya" : "");
    out.push({
      id: "skills",
      tone: "good",
      text:
        owned.length === total
          ? `Seluruh ${total} keahlian yang diminta sudah Anda kuasai: ${shown}`
          : `${owned.length} dari ${total} keahlian yang diminta sudah Anda kuasai: ${shown}`,
      detail: owned.slice(0, 2).map(evidenceFor).filter(Boolean).join(" "),
    });
  } else if (total) {
    out.push({
      id: "skills",
      tone: "note",
      text: "Belum ada keahlian yang diminta yang tercantum di profil Anda",
      detail: "Posisi ini cocok sebagai target jangka menengah: tambah keahlian yang diminta lewat pelatihan.",
    });
  }

  // 2. Sektor
  if (sector) {
    const hit = INTEREST_LABELS.some(
      (l) => norm(l).startsWith(norm(sector)) || norm(sector).startsWith(norm(l))
    );
    out.push(
      hit
        ? { id: "sector", tone: "good", text: `Sektor ${sector} sesuai bidang yang Anda minati` }
        : {
            id: "sector",
            tone: "note",
            text: `Sektor ${sector} di luar bidang yang Anda pilih (${joinList(INTEREST_LABELS)})`,
          }
    );
  }

  // 3. Pola kerja dan lokasi
  if (mode) {
    const remote = mode === "Remote";
    const sameCity = norm(city) === norm(HOME_CITY);
    const modeOk = mode === PREFERRED_MODE;
    const place = remote ? "" : ` di ${city}`;
    if (modeOk && (remote || sameCity)) {
      out.push({ id: "work", tone: "good", text: `Pola kerja ${mode}${place} sesuai preferensi dan domisili Anda` });
    } else if (modeOk) {
      out.push({
        id: "work",
        tone: "note",
        text: `Pola kerja ${mode} sesuai preferensi Anda, tetapi berlokasi di ${city} (domisili Anda: ${HOME_CITY})`,
      });
    } else {
      const tail = remote
        ? `, tetapi bisa dikerjakan dari ${HOME_CITY}`
        : sameCity
          ? ""
          : `; lokasi di luar domisili Anda (${HOME_CITY})`;
      out.push({
        id: "work",
        tone: "note",
        text: `Pola kerja ${mode}${place} berbeda dari preferensi Anda (${PREFERRED_MODE})${tail}`,
      });
    }
  }

  // 4. Benefit ramah perempuan
  const friendly = perks.filter((p) => FRIENDLY_PERKS.some((k) => norm(p).includes(k)));
  if (friendly.length) {
    out.push({ id: "perks", tone: "good", text: `Perusahaan menyediakan ${joinList(friendly.map(norm))}` });
  }

  // 5. Langkah berikutnya
  if (missing.length) {
    out.push({
      id: "next",
      tone: "next",
      text: `Prioritas belajar: ${missing[0]}${missing.length > 1 ? ` dan ${missing.length - 1} keahlian lain` : ""}`,
      href: "/learning-path",
      linkLabel: "Lihat pelatihan terkait",
    });
  }
  return out;
}
