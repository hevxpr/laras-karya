import Link from "next/link";
import { Check, Lock } from "lucide-react";

import { FeaturedJobCard, JobCard } from "@/components/jobs/job-card";

/*
  Pratinjau hasil untuk TAMU (belum masuk): rekomendasi teratas tampil utuh, sisanya diburamkan,
  lalu pengguna diajak mendaftar. Urutan murni berdasarkan skor: tamu belum punya lamaran, jadi aturan
  "sudah dilamar di belakang" (lib/job-ordering.js) sengaja tidak dipakai di sini; yang tampil adalah
  lowongan paling cocok sungguhan.

  - VISIBLE: jumlah lowongan yang tampil utuh (kartu utama sudah memuat skor, alasan, dan skill gap).
  - BLURRED: jumlah kartu yang diburamkan; tidak perlu semua supaya halaman tidak panjang.
  Bagian buram diberi aria-hidden + inert: tidak bisa difokus, diklik, atau dibaca pembaca layar.
  DATA KARTU TERKUNCI: yang dikirim ke browser hanya bahan "umpan" (sektor, pola kerja, skor), bukan
  judul, perusahaan, gaji, lokasi, atau keahlian asli (lihat lockedStub). Jadi meski blur dihapus lewat
  DevTools, yang terlihat hanya kartu contoh. Satu kartu utuh (VISIBLE) memang sengaja terbuka.
  DATA: dibaca di server dari fungsi database guest_jobs_preview (lib/guest-preview-db.js) dan dikirim lewat props:
  { total, top, teaser: [{ sector, mode }] }. Tamu tidak punya skor kecocokan, jadi tidak ada angka % di sini;
  skor, alasan, dan skill gap baru muncul setelah masuk.
*/
const VISIBLE = 1;
const BLURRED = 4;
// Setelah daftar/masuk langsung ke daftar rekomendasi penuh. Pada akun baru (mode demo) daftar itu belum
// menampilkan lamaran; catatan "Beberapa minggu kemudian" muncul saat Beranda/Lamaran/Bookmark dibuka
// (components/demo/history-gate.jsx).
const NEXT = "/recommended-jobs";

// Isi kartu contoh untuk bagian terkunci (sengaja generik).
const STUB_TITLES = ["Spesialis Keberlanjutan", "Koordinator Program Hijau", "Analis Dampak Lingkungan", "Konsultan Energi Bersih"];
const STUB_COMPANIES = ["Perusahaan Mitra", "Lembaga Mitra", "Perusahaan Hijau", "Mitra Laras Karya"];

/** Kartu terkunci: hanya sektor, pola kerja, dan skor yang asli; sisanya contoh. */
function lockedStub(job, i) {
  return {
    id: `terkunci-${i}`,
    title: STUB_TITLES[i % STUB_TITLES.length],
    company: STUB_COMPANIES[i % STUB_COMPANIES.length],
    sector: job.sector,
    mode: job.mode,
    match: null,
    city: "Indonesia",
    salary: "Rp •• – •• juta/bulan",
    status: "dibuka",
    skills: ["Keahlian 1", "Keahlian 2", "Keahlian 3"],
    gaps: [["Keahlian 3", "belum"]],
    benefits: [],
  };
}

const BENEFITS = [
  "Hasil asesmen Anda tersimpan di profil",
  "Alasan kecocokan dan skill gap tiap lowongan",
  "Lamar langsung dari satu tempat",
];

/**
 * @param {{ preview: { total: number, top: object|null, teaser: Array<{ sector: string, mode: string|null }> } }} props
 */
export function GuestPreview({ preview }) {
  const { total, top, teaser } = preview;
  const shown = top ? [top] : [];
  const locked = teaser.slice(0, BLURRED);
  const hiddenCount = Math.max(0, total - VISIBLE);

  if (!top) {
    return (
      <p className="mt-6 rounded-2xl border border-line bg-white p-5 text-sm text-slate-600">
        Belum ada lowongan hijau yang dibuka saat ini. Daftar gratis agar Anda mendapat kabar saat rekomendasi tersedia.
      </p>
    );
  }

  return (
    <div className="mt-6">
      <p className="text-sm text-slate-600">
        Saat ini ada <strong className="font-bold text-ink">{total} lowongan hijau</strong> yang dibuka.{" "}
        {VISIBLE} ditampilkan di bawah{hiddenCount > 0 ? `, ${hiddenCount} lainnya terbuka setelah Anda mendaftar` : ""}.
        Skor kecocokan dihitung setelah Anda masuk.
      </p>

      {shown.map((job) => (
        <div key={job.id} className="mt-6">
          <FeaturedJobCard job={job} hideApplied guest />
        </div>
      ))}

      {locked.length > 0 && (
        <section aria-labelledby="gate-title" className="relative mt-8">
          <div
            aria-hidden="true"
            inert
            className="pointer-events-none grid select-none items-stretch gap-5 opacity-90 blur-[5px] md:grid-cols-2"
          >
            {locked.map((item, i) => (
              <JobCard key={`terkunci-${i}`} job={lockedStub(item, i)} />
            ))}
          </div>

          <div className="absolute inset-0 flex items-start justify-center px-2 pt-4 md:items-center md:pt-0">
            <div className="w-full max-w-md rounded-2xl border border-line bg-white p-6 text-center shadow-lg">
              <span className="mx-auto grid size-11 place-items-center rounded-full bg-brand-light text-brand">
                <Lock className="size-5" aria-hidden="true" />
              </span>
              <h2 id="gate-title" className="mt-3 text-xl font-bold text-ink">
                Lihat {hiddenCount} lowongan hijau lainnya
              </h2>
              <p className="mt-1.5 text-sm text-ink/80">
                Daftar gratis untuk membuka semua rekomendasi.
              </p>
              <ul className="mt-4 space-y-2 text-left text-sm text-ink">
                {BENEFITS.map((b) => (
                  <li key={b} className="flex items-start gap-2">
                    <Check className="mt-0.5 size-4 shrink-0 text-brand" strokeWidth={3} aria-hidden="true" />
                    {b}
                  </li>
                ))}
              </ul>
              <Link
                href={`/register?next=${encodeURIComponent(NEXT)}`}
                className="mt-5 inline-flex h-12 w-full items-center justify-center rounded-xl bg-brand text-base font-bold text-white transition-colors hover:bg-brand/90"
              >
                Daftar Gratis
              </Link>
              <p className="mt-3 text-sm text-ink">
                Sudah punya akun?{" "}
                <Link
                  href={`/login?next=${encodeURIComponent(NEXT)}`}
                  className="font-bold text-brand hover:underline"
                >
                  Masuk
                </Link>
              </p>
              <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-subtle">
                <Lock className="size-3.5" aria-hidden="true" />
                Data Anda dilindungi dan tidak dibagikan tanpa izin.
              </p>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
