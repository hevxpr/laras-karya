"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";

import { StatusBadge } from "@/components/ui/status-badge";
import { FILTER_OPTIONS, formatDate } from "@/lib/applications-data";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 6;

/*
  Baris riwayat
  Mobile : bertumpuk · Tablet : judul · tanggal · status · detail (sektor disembunyikan, sesuai Figma tablet)
  Desktop: judul · sektor · tanggal · status · detail
  Baris "Ditolak" diredupkan lewat warna teks (kontras tetap ≥ 4,5:1); badge status tidak diredupkan.
*/
/** @param {{ application: import("@/lib/applications-data").Application }} props */
function ApplicationRow({ application: a }) {
  const dimmed = a.status === "ditolak";

  return (
    <li className="flex flex-col gap-2.5 rounded-lg border border-line bg-surface px-4 py-3 md:flex-row md:items-center md:gap-4">
      <div className="min-w-0 md:flex-1">
        <p className={cn("truncate text-sm font-bold", dimmed ? "text-ink/70" : "text-ink")}>{a.title}</p>
        <p className="truncate text-[11px] text-ink/70">{a.company}</p>
      </div>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 md:contents">
        <span className="inline-flex items-center whitespace-nowrap rounded-full bg-mint px-2.5 py-0.5 text-[11px] font-semibold text-brand md:hidden xl:inline-flex xl:w-fit">
          {a.sector}
        </span>
        <time dateTime={a.appliedAt} className="text-xs text-ink/75 md:w-[88px]">
          {formatDate(a.appliedAt)}
        </time>
        <span className="md:flex md:w-[84px]">
          <StatusBadge status={a.status} />
        </span>
        <Link
          href={`/recommended-jobs/${a.jobId}`}
          className="ml-auto inline-flex min-h-11 items-center text-xs font-bold text-brand underline underline-offset-2 md:ml-0 md:min-h-0 md:w-[80px] md:justify-end"
        >
          Lihat Detail
        </Link>
      </div>
    </li>
  );
}

const PAGE_BTN =
  "grid size-11 place-items-center rounded-md border text-xs font-semibold transition-colors md:size-8 disabled:cursor-not-allowed disabled:opacity-40";

/** @param {{ page: number, totalPages: number, onPageChange: (page: number) => void }} props */
function Pagination({ page, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;
  return (
    <nav aria-label="Pagination" className="flex items-center gap-1.5">
      {page > 1 && (
        <button type="button" aria-label="Halaman sebelumnya" onClick={() => onPageChange(page - 1)} className={cn(PAGE_BTN, "border-line bg-white text-ink hover:bg-surface")}>
          <ChevronLeft className="size-4" />
        </button>
      )}
      {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
        <button
          key={p}
          type="button"
          aria-label={`Halaman ${p}`}
          aria-current={p === page ? "page" : undefined}
          onClick={() => onPageChange(p)}
          className={cn(PAGE_BTN, p === page ? "border-brand bg-brand text-white" : "border-line bg-white text-ink hover:bg-surface")}
        >
          {p}
        </button>
      ))}
      <button
        type="button"
        aria-label="Halaman berikutnya"
        disabled={page === totalPages}
        onClick={() => onPageChange(page + 1)}
        className={cn(PAGE_BTN, "border-line bg-white text-ink hover:bg-surface")}
      >
        <ChevronRight className="size-4" />
      </button>
    </nav>
  );
}

/**
 * Riwayat lamaran: filter status, pagination, simulasi loading.
 * ⬇️ DITAMBAH: filter bisa dikendalikan dari luar (kartu statistik) lewat `filter` + `onFilterChange`;
 * tanpa keduanya, komponen memakai state filter sendiri seperti sebelumnya.
 * @param {{ applications: import("@/lib/applications-data").Application[],
 *           filter?: string, onFilterChange?: (value: string) => void }} props
 */
// ⬇️ DIUBAH: tambah props filter & onFilterChange
export function ApplicationHistory({ applications, filter: filterProp, onFilterChange }) {
  // ⬇️ DIUBAH: filter datang dari luar (kartu statistik) atau dari state sendiri
  const [internalFilter, setInternalFilter] = useState("semua");
  const filter = filterProp ?? internalFilter;
  const setFilter = onFilterChange ?? setInternalFilter;
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  // ⬇️ DIUBAH: satu efek yang mengakhiri loading (menggantikan tiga setTimeout terpisah).
  // Simulasi fetch, hapus saat data dari Supabase.
  useEffect(() => {
    if (!isLoading) return;
    const t = setTimeout(() => setIsLoading(false), 350);
    return () => clearTimeout(t);
  }, [isLoading]);

  // ⬇️ DITAMBAH: saat filter berubah (dari dropdown ATAU dari kartu statistik), kembali ke halaman 1 dan tampilkan loading
  const [prevFilter, setPrevFilter] = useState(filter);
  if (filter !== prevFilter) {
    setPrevFilter(filter);
    setPage(1);
    setIsLoading(true);
  }

  // ⬇️ DIUBAH: reset halaman & loading sekarang ditangani blok di atas
  const handleFilterChange = (val) => {
    setFilter(val);
  };

  // ⬇️ DIUBAH: timer loading ditangani efek di atas
  const handlePageChange = (p) => {
    setPage(p);
    setIsLoading(true);
  };

  const filtered = useMemo(
    () => (filter === "semua" ? applications : applications.filter((a) => a.status === filter)),
    [applications, filter]
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const visible = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <section aria-labelledby="history-title" className="rounded-2xl border border-line bg-white p-4 shadow-sm md:p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 id="history-title" className="text-[15px] font-bold text-ink">
          Riwayat Lamaran
        </h2>

        <div className="relative">
          <label htmlFor="status-filter" className="sr-only">
            Filter status lamaran
          </label>
          <select
            id="status-filter"
            value={filter}
            onChange={(e) => handleFilterChange(e.target.value)}
            className="min-h-11 cursor-pointer appearance-none rounded-full border border-line bg-white py-1.5 pl-3.5 pr-8 text-[11px] font-semibold text-ink md:min-h-8"
          >
            {FILTER_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-3.5 -translate-y-1/2 text-ink/70" aria-hidden="true" />
        </div>
      </div>

      {isLoading ? (
        <ul className="space-y-2.5" role="status" aria-label="Memuat riwayat lamaran">
          {Array.from({ length: PAGE_SIZE }, (_, i) => (
            <li key={i} className="h-[58px] animate-pulse rounded-lg bg-surface" />
          ))}
        </ul>
      ) : visible.length === 0 ? (
        <p className="rounded-lg bg-surface px-4 py-10 text-center text-sm text-ink/70">
          {applications.length === 0 ? (
            <>
              Belum ada lamaran.{" "}
              <Link href="/recommended-jobs" className="font-semibold text-brand underline underline-offset-2">
                Lihat rekomendasi lowongan
              </Link>
              .
            </>
          ) : (
            "Belum ada lamaran dengan status ini."
          )}
        </p>
      ) : (
        <ul className="space-y-2.5">
          {visible.map((a) => (
            <ApplicationRow key={a.id} application={a} />
          ))}
        </ul>
      )}

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-[11px] text-ink/70" aria-live="polite">
          Menampilkan {visible.length} dari {filtered.length} lamaran
        </p>
        <Pagination page={page} totalPages={totalPages} onPageChange={handlePageChange} />
      </div>
    </section>
  );
}
