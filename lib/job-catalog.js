import { JOBS } from "@/lib/mock-jobs";

/**
 * Data untuk halaman /jobs (daftar semua lowongan, tanpa skor kecocokan).
 *
 * SEMENTARA: lib/mock-jobs.js belum punya tanggal, jenis pekerjaan, dan tingkat pengalaman,
 * jadi dilengkapi di sini per id lowongan agar file data milik tim tidak perlu diubah.
 * Nanti diganti query Supabase:
 *   select ... from jobs where status = 'published' and is_green and (deadline is null or deadline >= current_date)
 * dengan kolom published_at, deadline, employment_type, experience_level, salary_min.
 */
const EXTRA = {
  1: { postedAt: "2026-10-20", deadline: "2026-11-30", employmentType: "full_time", experienceLevel: "mid" },
  2: { postedAt: "2026-10-18", deadline: "2026-12-15", employmentType: "contract", experienceLevel: "junior" },
  4: { postedAt: "2026-10-24", deadline: "2026-11-10", employmentType: "full_time", experienceLevel: "entry" },
  5: { postedAt: "2026-10-12", deadline: "2026-12-20", employmentType: "full_time", experienceLevel: "mid" },
  6: { postedAt: "2026-10-22", deadline: "2026-11-25", employmentType: "full_time", experienceLevel: "junior" },
  7: { postedAt: "2026-10-08", deadline: "2027-01-10", employmentType: "contract", experienceLevel: "senior" },
  9: { postedAt: "2026-10-25", deadline: "2026-12-05", employmentType: "full_time", experienceLevel: "mid" },
  10: { postedAt: "2026-10-15", deadline: "2026-11-15", employmentType: "part_time", experienceLevel: "junior" },
  12: { postedAt: "2026-10-21", deadline: "2026-12-31", employmentType: "internship", experienceLevel: "entry" },
};

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

/** Benefit yang penting bagi perempuan pencari kerja: ditonjolkan di kartu. */
export const HIGHLIGHT_BENEFITS = ["jam kerja fleksibel", "fasilitas laktasi", "program return-to-work", "penitipan anak"];

/** "Rp 10–12 juta/bulan" -> 10000000 (batas bawah), untuk mengurutkan gaji. */
function salaryMin(text) {
  const match = String(text ?? "").match(/(\d+(?:[.,]\d+)?)/);
  return match ? Number(match[1].replace(",", ".")) * 1_000_000 : 0;
}

export const CATALOG_JOBS = JOBS.filter((job) => job.status === "dibuka").map((job) => ({
  ...job,
  ...EXTRA[job.id],
  salaryMin: salaryMin(job.salary),
}));

const unique = (values) => [...new Set(values.filter(Boolean))].sort((a, b) => a.localeCompare(b, "id"));
export const SECTOR_OPTIONS = unique(CATALOG_JOBS.map((j) => j.sector));
export const CITY_OPTIONS = unique(CATALOG_JOBS.map((j) => j.city));
export const MODE_OPTIONS = ["On-site", "Hybrid", "Remote"].filter((m) => CATALOG_JOBS.some((j) => j.mode === m));

/** Apakah lowongan mencantumkan fasilitas ini (nilai dari HIGHLIGHT_BENEFITS, huruf kecil). */
export const hasFacility = (job, facility) => (job.benefits ?? []).some((b) => b.toLowerCase() === facility);

/**
 * Pilihan filter "Fasilitas pendukung": benefit unggulan (HIGHLIGHT_BENEFITS) yang dimiliki minimal satu
 * lowongan dibuka, supaya tidak ada pilihan yang pasti menghasilkan nol lowongan.
 */
export const FACILITY_OPTIONS = HIGHLIGHT_BENEFITS.filter((f) => CATALOG_JOBS.some((j) => hasFacility(j, f))).map((f) => ({
  value: f,
  label: f.charAt(0).toUpperCase() + f.slice(1),
}));

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
