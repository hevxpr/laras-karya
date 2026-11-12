import { JOBS } from "./mock-jobs";
import { HIGHLIGHT_BENEFITS } from "./job-catalog";

/**
 * Type definition via JSDoc (repo ini JavaScript, VS Code tetap memberi autocomplete).
 *
 * @typedef {"dimiliki"|"belum"} SkillStatus
 *
 * @typedef {Object} SkillItem
 * @property {string} id
 * @property {string} name
 * @property {SkillStatus} status   dimiliki = sudah dimiliki · belum = belum dimiliki
 * @property {string} [code]        kode skill (skills.code); hanya lowongan dari database
 * @property {boolean} [required]   true = wajib (teknis), false = nilai tambah (pendukung); hanya lowongan dari database
 * @property {number|null} [demand] jumlah lowongan published yang meminta skill ini (hanya skill yang belum dimiliki)
 * @property {{id: string, title: string, url: string, provider: string|null, level: string|null}[]} [courses]
 *           pelatihan untuk skill ini (hingga 2); undefined = belum diketahui, [] = belum ada pelatihan
 *
 * @typedef {Object} BenefitItem
 * @property {string} id
 * @property {string} label
 *
 * @typedef {Object} JobDetail
 * @property {string} id
 * @property {string} title
 * @property {string} company
 * @property {string} city              contoh "Jakarta"
 * @property {"Hybrid"|"Remote"|"On-site"} workMode
 * @property {string} address
 * @property {string} employmentType    contoh "Full-time"
 * @property {string} sector
 * @property {boolean} isOpen
 * @property {boolean} [isGreenJob]     lowongan hijau (jobs.is_green_job); hanya lowongan dari database
 * @property {{href: string, label: string}} [companyWebsite]  website perusahaan (jobs.company_website_url), sudah divalidasi http(s)
 * @property {string} source
 * @property {string} updatedAt         tanggal tampil, contoh "28 Sep 2026"
 * @property {number} matchPercent      0–100
 * @property {string} salary
 * @property {string} description
 * @property {string[]} requirements
 * @property {BenefitItem[]} benefits   benefit umum (sama untuk semua lowongan di data contoh)
 * @property {string[]} facilities  fasilitas ramah perempuan milik lowongan ini (nilai dari FACILITIES di lib/job-catalog.js)
 * @property {SkillItem[]} skills
 * @property {string[]} [perks]   benefit khas lowongan (tanpa benefit umum), dipakai untuk insight kecocokan
 */

/** @type {string[]} */
const REQUIREMENTS = [
  "Minimal lulusan S1 ilmu lingkungan, teknik lingkungan, atau bidang sosial terkait",
  "Pengalaman minimal 2 tahun dalam penyusunan laporan ESG atau audit keberlanjutan",
  "Memahami regulasi keberlanjutan lokal dan kerangka kerja internasional (GRI, TCFD)",
  "Mampu berkomunikasi dengan baik dalam bahasa Indonesia dan Inggris",
  "Bersedia bekerja sesuai pola kerja yang ditawarkan",
];

/** @type {BenefitItem[]} */
const BENEFITS = [
  { id: "b1", label: "BPJS Kesehatan & Ketenagakerjaan" },
  { id: "b2", label: "Tunjangan transportasi dan makan harian" },
  { id: "b4", label: "Pelatihan dan sertifikasi keberlanjutan" },
  { id: "b5", label: "Bonus kinerja tahunan" },
  { id: "b6", label: "Jenjang karier hingga Sustainability Manager" },
];

/** @type {SkillItem[]} */
const SKILLS = [
  { id: "s1", name: "Pelaporan ESG", status: "belum" },
  { id: "s2", name: "ESG Audit", status: "dimiliki" },
  { id: "s3", name: "Manajemen Proyek Hijau", status: "belum" },
  { id: "s4", name: "LEED Certification", status: "belum" },
  { id: "s5", name: "Regulasi Keberlanjutan", status: "dimiliki" },
];

const COMMON = {
  employmentType: "Full-time",
  source: "situs perusahaan",
  updatedAt: "28 Sep 2026",
  requirements: REQUIREMENTS,
  benefits: BENEFITS,
  facilities: [],
  skills: SKILLS,
};

/**
 * MOCK detail lowongan (nanti diganti query Supabase berdasarkan id).
 * id 1–3 sesuai kartu di Beranda.
 * @type {Record<string, JobDetail>}
 */
// Keahlian dan syarat khas untuk lowongan yang hanya terbuka dari Bookmark (id 13-15),
// supaya tidak memakai daftar keahlian ESG umum (COMMON). Status mengikuti keahlian di profil tokoh.
function skillBlock(pairs) {
  const skills = pairs.map(([name, status], i) => ({ id: `s${i + 1}`, name, status }));
  return {
    skills,
    requirements: [
      ...skills.map((s) => `Menguasai ${s.name}`),
      "Mampu berkomunikasi dengan baik dalam bahasa Indonesia dan Inggris",
      "Bersedia bekerja sesuai pola kerja yang ditawarkan",
    ],
  };
}

export const MOCK_JOB_DETAILS = {
  1: {
    ...COMMON,
    id: "1",
    title: "Sustainability Officer",
    company: "PT Hijau Lestari",
    city: "Jakarta",
    workMode: "Hybrid",
    address: "Jakarta, DKI Jakarta",
    sector: "Energi Terbarukan",
    isOpen: true,
    matchPercent: 83,
    salary: "Rp 10.000.000 - Rp 12.000.000 per bulan",
    description:
      "PT Hijau Lestari sedang mencari Sustainability Officer untuk memimpin inisiatif keberlanjutan, menyusun laporan keberlanjutan tahunan, dan memastikan kepatuhan terhadap standar ESG nasional.",
  },
  2: {
    ...COMMON,
    id: "2",
    title: "Green Building Consultant",
    company: "EcoVerde Indonesia",
    city: "Seluruh Indonesia",
    workMode: "Remote",
    address: "Jakarta Selatan, DKI Jakarta",
    sector: "Bangunan Hijau",
    isOpen: true,
    matchPercent: 53,
    salary: "Rp 8.000.000 - Rp 11.000.000 per bulan",
    description:
      "EcoVerde Indonesia mencari Green Building Consultant untuk mendampingi klien dalam perencanaan bangunan hijau, penilaian sertifikasi, dan efisiensi energi gedung.",
  },
  3: {
    ...COMMON,
    id: "3",
    title: "Environmental Analyst",
    company: "Yayasan Bumi Kita",
    city: "Bandung",
    workMode: "On-site",
    address: "Bandung, Jawa Barat",
    sector: "Konservasi",
    isOpen: false,
    matchPercent: 63,
    salary: "Rp 7.000.000 - Rp 9.000.000 per bulan",
    description:
      "Yayasan Bumi Kita mencari Environmental Analyst untuk menganalisis data lingkungan, memantau program konservasi, dan menyusun rekomendasi kebijakan berbasis data.",
  },
  13: {
    ...COMMON,
    id: "13",
    title: "Waste Management Specialist",
    company: "PT Daur Hijau",
    city: "Surabaya",
    workMode: "On-site",
    address: "Surabaya, Jawa Timur",
    sector: "Pengelolaan Limbah",
    isOpen: true,
    matchPercent: 45,
    salary: "Rp 8.000.000 - Rp 10.000.000 per bulan",
    description:
      "PT Daur Hijau mencari Waste Management Specialist untuk mengelola program pengurangan dan daur ulang limbah.",
    ...skillBlock([["Pengelolaan Limbah", "dimiliki"], ["Penanganan Limbah B3", "belum"], ["Audit Lingkungan", "belum"]]),
  },
  14: {
    ...COMMON,
    id: "14",
    title: "Agroforestry Field Coordinator",
    company: "Lembaga Tani Lestari",
    city: "Bogor",
    workMode: "On-site",
    address: "Bogor, Jawa Barat",
    sector: "Pertanian Berkelanjutan",
    isOpen: true,
    matchPercent: 45,
    salary: "Rp 6.000.000 - Rp 8.000.000 per bulan",
    description:
      "Lembaga Tani Lestari mencari Agroforestry Field Coordinator untuk mendampingi petani dalam praktik wanatani.",
    ...skillBlock([["Koordinasi Proyek", "dimiliki"], ["Agroforestri", "belum"], ["Pemetaan GIS", "belum"]]),
  },
  15: {
    ...COMMON,
    id: "15",
    title: "Carbon Accounting Analyst",
    company: "GreenMetrics Co.",
    city: "Seluruh Indonesia",
    workMode: "Remote",
    address: "Jakarta, DKI Jakarta",
    sector: "Emisi Karbon",
    isOpen: false,
    matchPercent: 55,
    salary: "Rp 9.000.000 - Rp 13.000.000 per bulan",
    description:
      "GreenMetrics Co. mencari Carbon Accounting Analyst untuk menghitung dan melaporkan emisi karbon perusahaan klien.",
    ...skillBlock([["Analisis Data", "dimiliki"], ["Microsoft Excel", "dimiliki"], ["Carbon Accounting", "belum"]]),
  },
};

// "Rp 6–8 juta/bulan" → "Rp 6.000.000 - Rp 8.000.000 per bulan"
function formatSalary(text) {
  const m = text.match(/Rp\s*(\d+)\s*[–-]\s*(\d+)\s*juta/);
  return m ? `Rp ${m[1]}.000.000 - Rp ${m[2]}.000.000 per bulan` : text;
}

// ALAMAT CONTOH (dummy), dikunci per id lowongan. Ganti dengan data asli saat backend siap.
const ALAMAT_CONTOH = {
  1: "Jl. Kemang Raya No. 18, Mampang Prapatan, Jakarta Selatan, DKI Jakarta 12730",
  2: "Jl. Wijaya I No. 7, Kebayoran Baru, Jakarta Selatan, DKI Jakarta 12160",
  3: "Jl. Dipati Ukur No. 25, Coblong, Kota Bandung, Jawa Barat 40132",
  4: "Jl. Raya Darmo No. 112, Wonokromo, Kota Surabaya, Jawa Timur 60265",
  5: "Jl. Pajajaran No. 64, Baranangsiang, Kota Bogor, Jawa Barat 16143",
  6: "Jl. Pandanaran No. 31, Mugassari, Semarang Selatan, Jawa Tengah 50249",
  7: "Jl. Riau No. 40, Bandung Wetan, Kota Bandung, Jawa Barat 40115",
  8: "Jl. Cikini Raya No. 12, Menteng, Jakarta Pusat, DKI Jakarta 10330",
  9: "Jl. Pengayoman No. 21, Panakkukang, Kota Makassar, Sulawesi Selatan 90231",
  10: "Jl. Kaliurang Km 5,5 No. 14, Caturtunggal, Sleman, DI Yogyakarta 55281",
  11: "Jl. Jenderal Sudirman No. 73, Klandasan Ilir, Balikpapan, Kalimantan Timur 76112",
  12: "Jl. Setiabudi Tengah No. 9, Setiabudi, Jakarta Selatan, DKI Jakarta 12910",
  13: "Jl. Ngagel Jaya Selatan No. 40, Gubeng, Kota Surabaya, Jawa Timur 60283",
  14: "Jl. Raya Dramaga Km 7, Dramaga, Kabupaten Bogor, Jawa Barat 16680",
  15: "Jl. Tebet Raya No. 55, Tebet, Jakarta Selatan, DKI Jakarta 12810",
};

// Menyusun detail lowongan dari satu entri di lib/mock-jobs.js
function buildDetailFromJob(job) {
  const gapLevel = Object.fromEntries(job.gaps ?? []); // contoh: { AMDAL: "sedang" }

  return {
    ...COMMON,
    id: String(job.id),
    title: job.title,
    company: job.company,
    city: job.city,
    workMode: job.mode,
    address: job.city,
    sector: job.sector,
    isOpen: job.status === "dibuka",
    matchPercent: job.match,
    salary: formatSalary(job.salary),
    description: job.description,
    requirements: [
      ...job.skills.map((s) => `Menguasai ${s}`),
      "Mampu berkomunikasi dengan baik dalam bahasa Indonesia dan Inggris",
      "Bersedia bekerja sesuai pola kerja yang ditawarkan",
    ],
    benefits: BENEFITS,
    facilities: (job.benefits ?? []).filter((b) => HIGHLIGHT_BENEFITS.includes(b)),
    perks: job.benefits ?? [],
    skills: job.skills.map((name, i) => ({
      id: `js${i}`,
      name,
      // ada di daftar gaps = belum dimiliki; selain itu sudah dimiliki
      status: gapLevel[name] ? "belum" : "dimiliki",
    })),
  };
}

/**
 * Ambil detail lowongan. Prioritas: susun dari lib/mock-jobs.js, supaya keahlian dan
 * skill gap di halaman detail sama dengan di kartu rekomendasi. Data detail tulisan tangan
 * (MOCK_JOB_DETAILS) hanya dipakai untuk id yang tidak ada di daftar lowongan.
 * Id yang sama sekali tidak dikenal memakai lowongan 1 (sementara).
 * @param {string} id
 * @returns {JobDetail}
 */
/**
 * Kelompokkan keahlian: yang sudah dimiliki di atas, baru yang belum (tidak selang-seling).
 * Urutan asli dijaga di dalam tiap kelompok, jadi teks turunan seperti
 * "Prioritas belajar" (keahlian pertama yang belum dimiliki) tidak berubah.
 * @param {SkillItem[]} skills
 * @returns {SkillItem[]}
 */
export function groupSkillsByStatus(skills) {
  return [
    ...skills.filter((s) => s.status === "dimiliki"),
    ...skills.filter((s) => s.status !== "dimiliki"),
  ];
}

export function getJobDetail(id) {
  const job = JOBS.find((j) => String(j.id) === String(id));
  const detail = job ? buildDetailFromJob(job) : (MOCK_JOB_DETAILS[id] ?? MOCK_JOB_DETAILS[1]);
  // Alamat contoh (dummy) supaya bagian Lokasi Perusahaan tampil lengkap.
  return { ...detail, skills: groupSkillsByStatus(detail.skills), address: ALAMAT_CONTOH[detail.id] ?? detail.address };
}

/** Jumlah keterampilan yang belum dimiliki. @param {SkillItem[]} skills */
export function countMissingSkills(skills) {
  return skills.filter((s) => s.status !== "dimiliki").length;
}
