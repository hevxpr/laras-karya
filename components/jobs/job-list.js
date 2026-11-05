"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { SearchX, Sparkles } from "lucide-react";
import { JOBS } from "@/lib/mock-jobs";
import { hasApplied } from "@/lib/applications-data";
import { useHistoryStage } from "@/lib/demo-history";
import { getOpenJobsAppliedLast } from "@/lib/job-ordering";
import { FeaturedJobCard, JobCard } from "./job-card";
import { FacilityFilter } from "./facility-filter";
import { FACILITIES, hasAllFacilities } from "@/lib/job-catalog";
import Pagination from "./pagination";
import { EmptyState } from "@/components/ui/empty-state";
import { SearchBar } from "@/components/ui/search-bar";
import { jobSearchFields, matchesQuery, replaceQueryParam } from "@/lib/search";

const PAGE_SIZE = 6; // jumlah kartu "Rekomendasi lainnya" per halaman

const MODES = [
  { label: "Semua", value: "semua" },
  { label: "WFO", value: "On-site" },
  { label: "Hybrid", value: "Hybrid" },
  { label: "Remote", value: "Remote" },
];

// Sementara. Nanti recommended_jobs() di database yang menyaring ini.
// Aturan urutan ada di lib/job-ordering.js (sama dengan Beranda). Akun baru belum punya lamaran,
// jadi tidak ada lowongan yang dipindah ke belakang (lib/demo-history.js).
const NO_APPLICATIONS = () => false;

function FilterGroup({ label, options, value, onChange }) {
  return (
    <div
      role="group"
      aria-label={label}
      className="flex flex-wrap items-center gap-2"
    >
      <span className="mr-1 text-sm font-semibold text-ink">{label}</span>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          aria-pressed={value === o.value}
          onClick={() => onChange(o.value)}
          className={`min-h-11 rounded-full border px-5 text-sm font-semibold transition ${
            value === o.value
              ? "border-brand bg-brand text-white"
              : "border-slate-200 bg-white text-ink hover:border-brand"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function SectionTitle({ children, titleRef }) {
  return (
    <h2
      ref={titleRef}
      className="flex scroll-mt-24 items-center gap-2 text-xl font-bold text-ink"
    >
      <Sparkles className="h-5 w-5 text-brand" aria-hidden /> {children}
    </h2>
  );
}

/** Membaca ?q= dari URL (mis. dari pencarian di Beranda). Dibungkus <Suspense> di halaman. */
export function JobListFromUrl() {
  const initialQuery = useSearchParams().get("q") ?? "";
  return <JobList initialQuery={initialQuery} />;
}

export default function JobList({ initialQuery = "" }) {
  const stage = useHistoryStage();
  const history = stage === "riwayat";
  const openJobs = useMemo(
    () => getOpenJobsAppliedLast(JOBS, history ? hasApplied : NO_APPLICATIONS),
    [history],
  );
  const [mode, setMode] = useState("semua");
  const [facilities, setFacilities] = useState([]);
  const [query, setQuery] = useState(initialQuery);
  const [page, setPage] = useState(1);
  const othersRef = useRef(null);
  const urlTimer = useRef(null);
  useEffect(() => () => clearTimeout(urlTimer.current), []);

  // Lolos pola kerja dan pencarian (dasar untuk angka di chip fasilitas). Urutan skor/lamaran tidak berubah:
  // filter hanya menyaring, jadi kartu utama = lowongan paling atas yang masih lolos.
  const baseJobs = useMemo(
    () => openJobs.filter((j) => (mode === "semua" || j.mode === mode) && matchesQuery(jobSearchFields(j), query)),
    [openJobs, mode, query],
  );
  const filtered = useMemo(() => baseJobs.filter((j) => hasAllFacilities(j, facilities)), [baseJobs, facilities]);
  const facilityCounts = useMemo(
    () =>
      Object.fromEntries(
        FACILITIES.map((f) => [f.value, baseJobs.filter((j) => hasAllFacilities(j, [...new Set([...facilities, f.value])])).length]),
      ),
    [baseJobs, facilities],
  );
  const searching = query.trim().length > 0;

  const [top, ...rest] = filtered;
  const totalPages = Math.max(1, Math.ceil(rest.length / PAGE_SIZE));
  const current = Math.min(page, totalPages);
  const visible = rest.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);
  const shown = (top ? 1 : 0) + visible.length;

  function changeMode(v) {
    setMode(v);
    setPage(1);
  }
  function changeQuery(v) {
    setQuery(v);
    setPage(1);
    // Simpan ke URL (?q=) agar hasil tetap sama saat halaman dimuat ulang atau dibagikan
    clearTimeout(urlTimer.current);
    urlTimer.current = setTimeout(() => replaceQueryParam(v), 300);
  }
  function toggleFacility(value) {
    setFacilities((list) => (list.includes(value) ? list.filter((v) => v !== value) : [...list, value]));
    setPage(1);
  }
  function clearFacilities() {
    setFacilities([]);
    setPage(1);
  }
  function resetFilters() {
    setMode("semua");
    setFacilities([]);
    changeQuery("");
  }
  function changePage(p) {
    setPage(p);
    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    othersRef.current?.scrollIntoView({
      behavior: reduce ? "auto" : "smooth",
      block: "start",
    });
  }

  // Tunggu tahap pengguna diketahui supaya kartu utama tidak berganti sesaat setelah tampil.
  if (stage === "pending") return <div className="mt-6 min-h-[60vh]" aria-busy="true" />;

  return (
    <div className="mt-6">
      <SearchBar
        label="Cari lowongan"
        placeholder="Cari posisi, perusahaan, kota, skill, atau fasilitas"
        value={query}
        onChange={changeQuery}
        className="mb-4 max-w-xl"
      />
      <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
        <FilterGroup
          label="Pola kerja"
          options={MODES}
          value={mode}
          onChange={changeMode}
        />

        <p aria-live="polite" className="text-sm text-slate-600">
          Menampilkan {shown} dari {filtered.length} lowongan{" "}
          {searching ? <>yang cocok dengan “{query.trim()}”</> : "yang masih dibuka"}
        </p>
      </div>

      <FacilityFilter
        selected={facilities}
        counts={facilityCounts}
        onToggle={toggleFacility}
        onClear={clearFacilities}
        fadeClass="from-surface"
      />

      {top ? (
        <>
          <div className="mt-6">
            <FeaturedJobCard job={top} selectedFacilities={facilities} />
          </div>

          {visible.length > 0 && (
            <div className="mt-10">
              <SectionTitle titleRef={othersRef}>
                Rekomendasi lainnya
              </SectionTitle>
              <div className="mt-4 grid items-stretch gap-5 md:grid-cols-2">
                {visible.map((job) => (
                  <JobCard key={job.id} job={job} selectedFacilities={facilities} />
                ))}
              </div>
              <Pagination
                page={current}
                totalPages={totalPages}
                onChange={changePage}
              />
            </div>
          )}
        </>
      ) : (
        <EmptyState
          icon={SearchX}
          title={
            searching
              ? `Tidak ada lowongan untuk “${query.trim()}”`
              : "Belum ada lowongan yang cocok dengan filter ini"
          }
          text={
            searching
              ? "Coba kata lain, misalnya nama posisi, kota, atau skill, atau ganti pola kerja."
              : facilities.length > 1
                ? "Coba kurangi fasilitas yang dipilih, atau ganti pola kerja."
                : "Coba ganti pola kerja atau fasilitas untuk melihat rekomendasi lain."
          }
        >
          <button
            type="button"
            onClick={resetFilters}
            className="rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand/90"
          >
            {searching ? "Hapus pencarian & filter" : "Reset filter"}
          </button>
        </EmptyState>
      )}
    </div>
  );
}
