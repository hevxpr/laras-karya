/**
 * Konstanta dan fungsi bantu untuk halaman /jobs (daftar semua lowongan, tanpa skor kecocokan).
 *
 * Data lowongan DIAMBIL dari Supabase lewat lib/job-catalog-db.js (fetchCatalogJobs) di server, lalu dikirim
 * ke komponen client sebagai props. File ini sengaja tidak memanggil database karena dipakai juga
 * oleh komponen client.
 */

export const EMPLOYMENT_TYPES = [
  { value: "full_time", label: "Penuh waktu" },
  { value: "part_time", label: "Paruh waktu" },
  { value: "contract", label: "Kontrak" },
  { value: "internship", label: "Magang" },
];

export const EXPERIENCE_LEVELS = [
  { value: "entry", label: "Entry (<1 tahun)" },
  { value: "junior", label: "Junior (1–3 tahun)" },
  { value: "mid", label: "Mid (3–6 tahun)" },
  { value: "senior", label: "Senior (>6 tahun)" },
];

export const SORT_OPTIONS = [
  { value: "newest", label: "Terbaru" },
  { value: "deadline", label: "Deadline terdekat" },
  { value: "salary", label: "Gaji tertinggi" },
];

/**
 * Fasilitas ramah perempuan: dipakai untuk filter di /jobs dan lencana di kartu.
 * value = teks persis di job.benefits (lib/mock-jobs.js, huruf kecil); label = teks tampilan.
 * Urutan = urutan chip: kebutuhan ibu bekerja lebih dulu (saran mentor: ruang laktasi, cuti, penitipan anak).
 * Nanti dari tabel katalog benefit di Supabase; cukup ganti isi daftar ini.
 */
export const FACILITIES = [
  { value: "ruang laktasi", label: "Ruang laktasi" },
  { value: "penitipan anak", label: "Penitipan anak" },
  { value: "cuti melahirkan & parental", label: "Cuti melahirkan & parental" },
  { value: "jam kerja fleksibel", label: "Jam kerja fleksibel" },
  { value: "program return-to-work", label: "Program return-to-work" },
  { value: "asuransi kesehatan keluarga", label: "Asuransi kesehatan keluarga" },
  { value: "kebijakan anti-pelecehan", label: "Kebijakan anti-pelecehan" },
  { value: "mentoring karier perempuan", label: "Mentoring karier perempuan" },
];

/** Benefit yang ditonjolkan di kartu lowongan. */
export const HIGHLIGHT_BENEFITS = FACILITIES.map((f) => f.value);

const unique = (values) => [...new Set(values.filter(Boolean))].sort((a, b) => a.localeCompare(b, "id"));
const MODES = ["On-site", "Hybrid", "Remote"];

/** Pilihan filter sektor, kota, dan pola kerja yang benar-benar ada di data lowongan. */
export function getFilterOptions(jobs) {
  return {
    sectors: unique(jobs.map((j) => j.sector)),
    cities: unique(jobs.map((j) => j.city)),
    modes: MODES.filter((m) => jobs.some((j) => j.mode === m)),
  };
}

/** Label tampilan sebuah fasilitas (kembali ke teks aslinya bila tidak ada di daftar). */
export const facilityLabel = (value) => FACILITIES.find((f) => f.value === value)?.label ?? value;

/** Lowongan harus menyediakan SEMUA fasilitas yang dipilih (daftar kosong = tidak menyaring). */
export const hasAllFacilities = (job, facilities) => {
  const own = (job.benefits ?? []).map((b) => b.toLowerCase());
  return facilities.every((f) => own.includes(f));
};

const label = (list, value) => list.find((o) => o.value === value)?.label ?? value;
export const employmentLabel = (value) => label(EMPLOYMENT_TYPES, value);
export const experienceLabel = (value) => label(EXPERIENCE_LEVELS, value);

/** "2026-11-30" -> "30 Nov 2026" (tanpa jam, agar sama di server dan browser) */
export function formatDate(iso) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-").map(Number);
  const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
  return `${d} ${months[m - 1]} ${y}`;
}

export function sortJobs(jobs, sort) {
  const list = [...jobs];
  if (sort === "deadline") return list.sort((a, b) => (a.deadline ?? "9999").localeCompare(b.deadline ?? "9999"));
  if (sort === "salary") return list.sort((a, b) => b.salaryMin - a.salaryMin);
  return list.sort((a, b) => (b.postedAt ?? "").localeCompare(a.postedAt ?? ""));
}
