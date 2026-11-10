"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ChevronDown, MapPin, SearchX, SlidersHorizontal, Sparkles } from "lucide-react";

import { CatalogJobCard } from "@/components/jobs/catalog-job-card";
import { FacilityFilter } from "@/components/jobs/facility-filter";
import Pagination from "@/components/jobs/pagination";
import { EmptyState } from "@/components/ui/empty-state";
import { SearchBar } from "@/components/ui/search-bar";
import {
  EMPLOYMENT_TYPES,
  EXPERIENCE_LEVELS,
  FACILITIES,
  SORT_OPTIONS,
  getFilterOptions,
  hasAllFacilities,
  sortJobs,
} from "@/lib/job-catalog";
import { LOGIN_PATH, REGISTER_PATH } from "@/lib/routes";
import { jobSearchFields, matchesQuery, replaceQueryParam } from "@/lib/search";

const PAGE_SIZE = 6;
const ALL = "";
const EMPTY_FILTERS = { sector: ALL, mode: ALL, city: ALL, facilities: [], experience: ALL, type: ALL };

function FilterSelect({ id, label, value, onChange, options, allLabel, icon: Icon }) {
  return (
    <div className="min-w-0">
      <label htmlFor={id} className="mb-1 flex items-center gap-1 text-xs font-semibold text-slate-600">
        {Icon ? <Icon className="h-3.5 w-3.5 text-brand" aria-hidden /> : null}
        {label}
      </label>
      <div className="relative">
        <select
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`h-11 w-full appearance-none rounded-xl border bg-white pl-3 pr-9 text-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20 ${
            value ? "border-brand font-semibold text-brand" : "border-slate-200 text-ink"
          }`}
        >
          {allLabel ? <option value={ALL}>{allLabel}</option> : null}
          {options.map((o) => {
            const v = typeof o === "string" ? o : o.value;
            return (
              <option key={v} value={v}>
                {typeof o === "string" ? o : o.label}
              </option>
            );
          })}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" aria-hidden />
      </div>
    </div>
  );
}

/**
 * Pemilih kota di baris utama, sejajar kotak pencarian (pasangan "apa" + "di mana").
 * Tinggi dan bentuk sama dengan kotak pencarian; label tetap ada untuk pembaca layar.
 */
function CityPicker({ value, onChange, cities }) {
  return (
    <div className="relative min-w-0 flex-1 sm:w-56 sm:flex-none">
      <label htmlFor="f-city" className="sr-only">
        Kota
      </label>
      <MapPin
        className={`pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 ${value ? "text-brand" : "text-slate-500"}`}
        aria-hidden
      />
      <select
        id="f-city"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`min-h-12 w-full appearance-none rounded-full border bg-white pl-10 pr-10 text-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20 ${
          value ? "border-brand font-semibold text-brand" : "border-slate-200 text-ink"
        }`}
      >
        <option value={ALL}>Semua kota</option>
        {cities.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" aria-hidden />
    </div>
  );
}

/** Ajakan asesmen: menggantikan halaman "cicipan" lama. */
function AssessmentInvite() {
  return (
    <section className="mt-6 flex flex-col gap-4 rounded-2xl border border-brand/20 bg-brand-light p-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-ai">
          <Sparkles className="h-5 w-5" aria-hidden />
        </span>
        <div>
          <p className="font-bold text-ink">Ingin tahu lowongan mana yang paling cocok untuk Anda?</p>
          <p className="mt-0.5 text-sm text-slate-700">
            Isi asesmen singkat, lalu lihat skor kecocokan dan keahlian yang perlu dikembangkan.
          </p>
        </div>
      </div>
      <div className="flex shrink-0 flex-wrap gap-2">
        <Link
          href={REGISTER_PATH}
          className="rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand/90"
        >
          Daftar &amp; isi asesmen
        </Link>
        <Link
          href={LOGIN_PATH}
          className="rounded-full border border-brand bg-white px-5 py-2.5 text-sm font-semibold text-brand transition hover:bg-brand-light"
        >
          Masuk
        </Link>
      </div>
    </section>
  );
}

/** Membaca ?q= dari URL; dibungkus <Suspense> di halaman. */
export function JobCatalogFromUrl({ jobs }) {
  return <JobCatalog jobs={jobs} initialQuery={useSearchParams().get("q") ?? ""} />;
}

export default function JobCatalog({ jobs = [], initialQuery = "" }) {
  const [query, setQuery] = useState(initialQuery);
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const listRef = useRef(null);
  const urlTimer = useRef(null);
  useEffect(() => () => clearTimeout(urlTimer.current), []);
  const { sectors, cities, modes } = useMemo(() => getFilterOptions(jobs), [jobs]);

  // Lowongan yang lolos pencarian dan semua filter kecuali fasilitas (dasar untuk angka di chip fasilitas).
  const baseJobs = useMemo(
    () =>
      jobs.filter(
        (j) =>
          matchesQuery(jobSearchFields(j), query) &&
          (!filters.sector || j.sector === filters.sector) &&
          (!filters.mode || j.mode === filters.mode) &&
          (!filters.city || j.city === filters.city) &&
          (!filters.experience || j.experienceLevel === filters.experience) &&
          (!filters.type || j.employmentType === filters.type),
      ),
    [jobs, query, filters.sector, filters.mode, filters.city, filters.experience, filters.type],
  );

  const results = useMemo(
    () => sortJobs(baseJobs.filter((j) => hasAllFacilities(j, filters.facilities)), sort),
    [baseJobs, filters.facilities, sort],
  );

  const facilityCounts = useMemo(
    () =>
      Object.fromEntries(
        FACILITIES.map((f) => [
          f.value,
          baseJobs.filter((j) => hasAllFacilities(j, [...new Set([...filters.facilities, f.value])])).length,
        ]),
      ),
    [baseJobs, filters.facilities],
  );

  // Filter pilihan tunggal + satu per fasilitas terpilih.
  const activeFilters = Object.entries(filters).filter(([key, value]) => key !== "facilities" && value).length + filters.facilities.length;
  // Badge pada tombol Filter (mobile) hanya menghitung filter di dalam panelnya; kota dan fasilitas selalu terlihat di luar panel.
  const panelFilters = Object.entries(filters).filter(([key, value]) => key !== "city" && key !== "facilities" && value).length;
  const searching = query.trim().length > 0;
  const totalPages = Math.max(1, Math.ceil(results.length / PAGE_SIZE));
  const shown = results.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function changeQuery(value) {
    setQuery(value);
    setPage(1);
    clearTimeout(urlTimer.current);
    urlTimer.current = setTimeout(() => replaceQueryParam(value), 300);
  }
  const changeFilter = (key) => (value) => {
    setFilters((f) => ({ ...f, [key]: value }));
    setPage(1);
  };
  const toggleFacility = (value) => {
    setFilters((f) => ({
      ...f,
      facilities: f.facilities.includes(value) ? f.facilities.filter((v) => v !== value) : [...f.facilities, value],
    }));
    setPage(1);
  };
  const clearFacilities = () => {
    setFilters((f) => ({ ...f, facilities: [] }));
    setPage(1);
  };
  function resetAll() {
    setFilters(EMPTY_FILTERS);
    changeQuery("");
  }
  function changePage(p) {
    setPage(p);
    listRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div>
      <AssessmentInvite />

      <section aria-label="Cari dan saring lowongan" className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <SearchBar
            label="Cari lowongan"
            placeholder="Cari posisi, perusahaan, kota, skill, atau fasilitas"
            value={query}
            onChange={changeQuery}
            className="flex-1"
          />
          <div className="flex items-center gap-3">
            <CityPicker value={filters.city} onChange={changeFilter("city")} cities={cities} />
            <button
              type="button"
              onClick={() => setShowFilters((v) => !v)}
              aria-expanded={showFilters}
              aria-controls="job-filters"
              className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-full border border-slate-200 px-5 text-sm font-semibold text-ink transition hover:border-brand sm:hidden"
            >
              <SlidersHorizontal className="h-4 w-4" aria-hidden /> Filter
              {panelFilters > 0 ? (
                <span className="grid h-5 min-w-5 place-items-center rounded-full bg-brand px-1.5 text-xs text-white">{panelFilters}</span>
              ) : null}
            </button>
          </div>
        </div>

        <div
          id="job-filters"
          className={`mt-4 grid grid-cols-2 gap-3 md:grid-cols-4 ${showFilters ? "" : "max-sm:hidden"}`}
        >
          <FilterSelect id="f-sector" label="Sektor" value={filters.sector} onChange={changeFilter("sector")} options={sectors} allLabel="Semua sektor" />
          <FilterSelect id="f-mode" label="Pola kerja" value={filters.mode} onChange={changeFilter("mode")} options={modes} allLabel="Semua pola" />
          <FilterSelect id="f-exp" label="Pengalaman" value={filters.experience} onChange={changeFilter("experience")} options={EXPERIENCE_LEVELS} allLabel="Semua tingkat" />
          <FilterSelect id="f-type" label="Jenis pekerjaan" value={filters.type} onChange={changeFilter("type")} options={EMPLOYMENT_TYPES} allLabel="Semua jenis" />
        </div>

        <FacilityFilter selected={filters.facilities} counts={facilityCounts} onToggle={toggleFacility} onClear={clearFacilities} />
      </section>

      <div ref={listRef} className="mt-6 flex scroll-mt-24 flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-ink">Semua Lowongan</h2>
          <p aria-live="polite" className="mt-0.5 text-sm text-slate-600">
            {results.length} lowongan{searching ? <> cocok dengan “{query.trim()}”</> : " masih dibuka"}
            {activeFilters > 0 ? ` · ${activeFilters} filter aktif` : ""}
            {(activeFilters > 0 || searching) && (
              <>
                {" · "}
                <button type="button" onClick={resetAll} className="font-semibold text-brand hover:underline">
                  Hapus semua
                </button>
              </>
            )}
          </p>
        </div>
        <div className="w-48">
          <FilterSelect id="f-sort" label="Urutkan" value={sort} onChange={(v) => { setSort(v); setPage(1); }} options={SORT_OPTIONS} />
        </div>
      </div>

      {results.length === 0 ? (
        <EmptyState
          icon={SearchX}
          title={searching ? `Tidak ada lowongan untuk “${query.trim()}”` : "Belum ada lowongan dengan filter ini"}
          text={filters.facilities.length > 1 ? "Coba kurangi fasilitas yang dipilih, atau pilih semua kota dan semua pola kerja." : "Coba kata lain atau kurangi filter, misalnya pilih semua kota atau semua pola kerja."}
        >
          <button
            type="button"
            onClick={resetAll}
            className="rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand/90"
          >
            Hapus pencarian &amp; filter
          </button>
        </EmptyState>
      ) : (
        <>
          <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {shown.map((job) => (
              <CatalogJobCard key={job.id} job={job} selectedFacilities={filters.facilities} />
            ))}
          </div>
          <Pagination page={page} totalPages={totalPages} onChange={changePage} />
        </>
      )}
    </div>
  );
}
