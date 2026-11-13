import Link from "next/link";
import { ArrowRight, ChevronRight } from "lucide-react";

import { CompanyAvatar } from "@/components/ui/company-avatar";
import { MOCK_APPLICATIONS, STATUS_CONFIG } from "@/lib/applications-data";

/* Warna chip status mengikuti kartu statistik di halaman Lamaran. */
const STATUS_TONE = {
  diproses: "bg-blue-50 text-blue-700",
  interview: "bg-violet-50 text-violet-700",
  diterima: "bg-emerald-50 text-emerald-700",
  ditolak: "bg-red-50 text-red-700",
};

/* Satu kalimat "apa yang perlu dilakukan" per status. */
const NEXT_STEP = {
  diproses: "Menunggu kabar dari perusahaan",
  interview: "Siapkan diri untuk interview",
  diterima: "Tinjau penawaran kerja",
  ditolak: "Coba lowongan lain yang cocok",
};

/**
 * Ringkasan status lamaran terbaru. Server component, tanpa state.
 * `applications`: lamaran user dari database (lib/applications-db.js); tanpa itu dipakai data contoh.
 * @param {{ applications?: import("@/lib/applications-data").Application[] }} props
 */
export function RecentApplications({ applications = MOCK_APPLICATIONS }) {
  // Tiga lamaran terbaru, diurutkan dari tanggal paling baru.
  const LATEST = [...applications].sort((a, b) => b.appliedAt.localeCompare(a.appliedAt)).slice(0, 3);

  return (
    <section aria-labelledby="applications-title" className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2
          id="applications-title"
          className="text-base font-bold text-ink md:text-lg"
        >
          Status Lamaran Terbaru
        </h2>
        <Link
          href="/applications"
          className="inline-flex min-h-11 items-center gap-1 text-xs font-bold text-brand hover:underline md:min-h-0"
        >
          Lihat Semua Lamaran{" "}
          <ArrowRight className="size-3.5" aria-hidden="true" />
        </Link>
      </div>

      {LATEST.length === 0 && (
        <p className="rounded-xl border border-dashed border-line bg-white p-6 text-center text-sm text-ink/70">
          Belum ada lamaran. Mulai dari rekomendasi lowongan di atas.
        </p>
      )}

      <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-white shadow-sm empty:hidden">
        {LATEST.map((a) => {
          const { label, icon: Icon } = STATUS_CONFIG[a.status];
          return (
            <li key={a.id}>
              <Link
                href="/applications"
                className="flex items-center gap-3 p-4 transition-colors hover:bg-surface"
              >
                <CompanyAvatar
                  company={a.company}
                  sector={a.sector}
                  logoUrl={a.companyLogoUrl}
                  className="h-10 w-10 text-sm"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[15px] font-bold text-ink">
                    {a.title}
                  </p>
                  <p className="truncate text-xs text-ink/70">
                    {a.company} • {NEXT_STEP[a.status]}
                  </p>
                </div>
                <span
                  className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_TONE[a.status]}`}
                >
                  <Icon className="size-3" aria-hidden="true" />
                  {label}
                </span>
                <ChevronRight
                  className="size-4 shrink-0 text-ink/40"
                  aria-hidden="true"
                />
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
