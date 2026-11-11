"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowRight,
  BookOpen,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Compass,
  ExternalLink,
  SearchX,
  Sparkle,
  Sparkles,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { SearchBar } from "@/components/ui/search-bar";
import { courseSearchFields, matchesQuery, replaceQueryParam } from "@/lib/search";
import { cn } from "@/lib/utils";

import { completeCourse, getLearningPath, startCourse } from "./actions";

const GAP_DOT = {
  red: "bg-red-500",
  amber: "bg-amber-400",
  green: "bg-lime-500",
};

const GAP_TEXT = {
  red: "text-red-300",
  amber: "text-amber-300",
  green: "text-lime-300",
};

const LEVEL_BADGE = {
  Pemula: "bg-brand-light text-brand",
  Menengah: "bg-amber-100 text-amber-700",
  Lanjutan: "bg-red-100 text-red-700",
};

function LoadingView() {
  return (
    <main className="flex min-h-[70vh] items-center justify-center px-6">
      <p className="animate-pulse text-muted-foreground">Memuat jalur belajar...</p>
    </main>
  );
}

/** ?q= dibaca dari URL (mis. dari pencarian di Beranda); useSearchParams wajib di dalam <Suspense>. */
function LearningPathFromUrl() {
  const initialQuery = useSearchParams().get("q") ?? "";
  return <LearningPathContent initialQuery={initialQuery} />;
}

export default function LearningPathPage() {
  return (
    <Suspense fallback={<LoadingView />}>
      <LearningPathFromUrl />
    </Suspense>
  );
}

const PAGE_SIZE = 9; // 3 kolom x 3 baris
// Tombol "Daftar" membuka beranda Udemy; tombol "Lanjutkan Belajar" membuka tautan course (courses.url).
const UDEMY_URL = "https://www.udemy.com/";
const LEVEL_ORDER = ["Pemula", "Menengah", "Lanjutan"];

/** Nomor halaman yang ditampilkan: semua bila sedikit, kalau banyak dipendekkan dengan "…". */
function pageItems(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const items = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  if (start > 2) items.push("…");
  for (let n = start; n <= end; n += 1) items.push(n);
  if (end < total - 1) items.push("…");
  items.push(total);
  return items;
}

/**
 * Gambar sampul course (courses.image_url, 240x135 = rasio 16:9). Kotak gambar mengikuti rasio itu
 * (aspect-video) supaya gambar tidak terpotong. Bila kosong atau gagal dimuat, tampil placeholder.
 */
function CourseImage({ src }) {
  const [failed, setFailed] = useState(false);

  return (
    <div className="relative aspect-video w-full overflow-hidden bg-brand-light">
      {src && !failed ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt=""
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          onError={() => setFailed(true)}
          className="absolute inset-0 size-full object-cover"
        />
      ) : (
        <span className="absolute inset-0 grid place-items-center text-brand/40">
          <BookOpen className="size-10" aria-hidden="true" />
        </span>
      )}
    </div>
  );
}

/** Pilihan level di samping kotak pencarian. */
function LevelSelect({ value, onChange, options }) {
  return (
    <div className="relative">
      <label htmlFor="level-filter" className="sr-only">
        Filter level pelatihan
      </label>
      <select
        id="level-filter"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "min-h-12 appearance-none rounded-full border bg-white pl-4 pr-10 text-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20",
          value ? "border-brand font-semibold text-brand" : "border-slate-200 text-ink"
        )}
      >
        <option value="">Semua level</option>
        {options.map(({ level, count }) => (
          <option key={level} value={level}>
            {level} ({count})
          </option>
        ))}
      </select>
      <ChevronDown
        className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-slate-500"
        aria-hidden="true"
      />
    </div>
  );
}

function Pagination({ page, totalPages, onChange }) {
  const base = "grid size-11 place-items-center rounded-full border text-sm font-semibold transition-colors";
  return (
    <nav aria-label="Halaman pelatihan" className="mt-8 flex flex-wrap items-center justify-center gap-2">
      <button
        type="button"
        onClick={() => onChange(page - 1)}
        disabled={page === 1}
        aria-label="Halaman sebelumnya"
        className={cn(base, "border-line text-ink hover:bg-brand-light disabled:cursor-not-allowed disabled:opacity-40")}
      >
        <ChevronLeft className="size-4" aria-hidden="true" />
      </button>

      {pageItems(page, totalPages).map((item, i) =>
        item === "…" ? (
          <span key={`gap-${i}`} aria-hidden="true" className="px-1 text-ink/60">
            …
          </span>
        ) : (
          <button
            key={item}
            type="button"
            onClick={() => onChange(item)}
            aria-label={`Halaman ${item}`}
            aria-current={item === page ? "page" : undefined}
            className={cn(
              base,
              item === page ? "border-brand bg-brand text-white" : "border-line text-ink hover:bg-brand-light"
            )}
          >
            {item}
          </button>
        )
      )}

      <button
        type="button"
        onClick={() => onChange(page + 1)}
        disabled={page === totalPages}
        aria-label="Halaman berikutnya"
        className={cn(base, "border-line text-ink hover:bg-brand-light disabled:cursor-not-allowed disabled:opacity-40")}
      >
        <ChevronRight className="size-4" aria-hidden="true" />
      </button>
    </nav>
  );
}

function CourseCard({ course, status, onStart, onComplete }) {
  return (
    <article className="flex flex-col overflow-hidden rounded-2xl border border-line bg-white">
      <CourseImage src={course.imageUrl} />

      <div className="flex flex-1 flex-col p-6">
        <header className="flex items-center justify-between gap-3">
          <p className="flex min-w-0 items-center gap-2.5 text-sm text-ink/80">
            <span className="grid size-7 shrink-0 place-items-center rounded-md bg-brand-light text-brand">
              <BookOpen className="size-4" aria-hidden="true" />
            </span>
            <span className="truncate">{course.provider}</span>
          </p>

          {status === "completed" ? (
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-brand px-2.5 py-1 text-xs font-bold text-white">
              <Check className="size-3" aria-hidden="true" />
              Selesai
            </span>
          ) : status === "enrolled" ? (
            <span className="shrink-0 rounded-full bg-brand-light px-2.5 py-1 text-xs font-bold text-brand">
              Sedang diikuti
            </span>
          ) : (
            course.popular && (
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-accent-light px-2.5 py-1 text-xs font-bold text-accent">
                <Sparkle className="size-3 fill-current" aria-hidden="true" />
                Paling Populer
              </span>
            )
          )}
        </header>

        <h4 className="mt-5 min-h-12 text-lg font-bold leading-snug text-ink">{course.title}</h4>

        <div className="mt-5 flex flex-wrap gap-2">
          <span className={cn("rounded-full px-2.5 py-1 text-xs font-bold", LEVEL_BADGE[course.level])}>
            {course.level}
          </span>
          <span className="rounded-full border border-line px-2.5 py-1 text-xs font-medium text-ink/80">
            {course.format}
          </span>
        </div>

        <div className="mt-5 flex min-h-8 flex-wrap items-center justify-between gap-x-3 gap-y-2 border-t border-line pt-4 text-sm text-ink/80">
          <span className="inline-flex items-center gap-2">
            <Clock className="size-4" aria-hidden="true" />
            {course.duration}
          </span>

          {course.skillTag && (
            <span className="rounded-md border border-accent px-2 py-0.5 text-xs font-medium text-accent">
              {course.skillTag}
            </span>
          )}
        </div>

        <div className="mt-auto pt-5">
          {status === "completed" ? (
            <p className="flex h-12 items-center justify-center gap-2 rounded-full bg-brand-light text-sm font-bold text-brand">
              <Check className="size-4" aria-hidden="true" />
              Selesai
            </p>
          ) : status === "enrolled" ? (
            <div className="space-y-2">
              <Button
                href={course.url}
                target="_blank"
                rel="noopener noreferrer"
                size="lg"
                className="w-full bg-brand hover:bg-brand/90"
              >
                Lanjutkan Belajar di Udemy
                <ExternalLink className="size-4" aria-hidden="true" />
              </Button>
              <Button
                size="sm"
                variant="muted"
                className="w-full inline-flex min-h-11 items-center gap-1.5 border-brand px-3.5 text-xs font-semibold text-brand transition-colors hover:bg-brand-light disabled:opacity-70 md:min-h-8"
                onClick={() => onComplete(course.id)}
              >
                Sudah Selesai Diikuti
              </Button>
            </div>
          ) : (
            <Button
              href={UDEMY_URL}
              target="_blank"
              rel="noopener noreferrer"
              size="lg"
              className="w-full bg-brand hover:bg-brand/90"
              onClick={() => onStart(course.id)}
            >
              Daftar di Udemy
              <ExternalLink className="size-4" aria-hidden="true" />
            </Button>
          )}
        </div>
      </div>
    </article>
  );
}

function LearningPathContent({ initialQuery = "" }) {
  const [query, setQuery] = useState(initialQuery);
  const urlTimer = useRef(null);
  useEffect(() => () => clearTimeout(urlTimer.current), []);
  const [target, setTarget] = useState(null);
  const [courses, setCourses] = useState([]);
  const [progress, setProgress] = useState({});
  const [level, setLevel] = useState("");
  const [page, setPage] = useState(1);
  const listRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");

  const isCompleted = (courseId) => progress[courseId]?.status === "completed";

  // Semua level digabung dalam satu daftar. Pencarian dan pilihan level hanya menyaring TAMPILAN;
  // progres tetap dihitung dari semua course.
  const searching = query.trim().length > 0;
  const levelOptions = LEVEL_ORDER.map((name) => ({
    level: name,
    count: courses.filter((course) => course.level === name).length,
  })).filter((option) => option.count > 0);
  const filtered = courses.filter(
    (course) =>
      (!level || course.level === level) && matchesQuery(courseSearchFields(course), query)
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const firstIndex = (currentPage - 1) * PAGE_SIZE;
  const pageCourses = filtered.slice(firstIndex, firstIndex + PAGE_SIZE);

  const changeQuery = (value) => {
    setQuery(value);
    setPage(1);
    clearTimeout(urlTimer.current);
    urlTimer.current = setTimeout(() => replaceQueryParam(value), 300);
  };

  const changeLevel = (value) => {
    setLevel(value);
    setPage(1);
  };

  const resetFilters = () => {
    changeQuery("");
    setLevel("");
  };

  // Pindah halaman, lalu gulir ke awal daftar supaya kartu pertama langsung terlihat.
  const goToPage = (next) => {
    setPage(next);
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    listRef.current?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
  };

  const totalCourses = courses.length;
  const completedCourses = courses.filter((course) => isCompleted(course.id)).length;
  const percent = totalCourses ? Math.round((completedCourses / totalCourses) * 100) : 0;

  useEffect(() => {
    getLearningPath()
      .then((data) => {
        setTarget(data.target);
        setCourses(data.courses);
        setProgress(data.progress);
        setLoading(false);
      })
      .catch((error) => {
        setError(error.message);
        setLoading(false);
      });
  }, []);

  // Dipanggil saat user klik "Daftar": catat sebagai "Sedang diikuti".
  // Pendaftaran sebenarnya terjadi di situs provider (tab baru).
  const handleStart = (courseId) => {
    setActionError("");

    startCourse(courseId)
      .then(({ status }) =>
        setProgress((prev) => ({ ...prev, [courseId]: { status } }))
      )
      .catch((error) => setActionError(error.message));
  };

  const handleComplete = (courseId) => {
    setActionError("");

    completeCourse(courseId)
      .then(({ status }) =>
        setProgress((prev) => ({ ...prev, [courseId]: { status } }))
      )
      .catch((error) => setActionError(error.message));
  };

  if (error) {
    return (
      <main className="flex min-h-[70vh] items-center justify-center px-6">
        <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-6 text-center">
          <h2 className="font-semibold text-destructive">
            Terjadi kesalahan
          </h2>

          <p className="mt-2 text-sm text-destructive/80">{error}</p>
        </div>
      </main>
    );
  }

  if (loading) {
    return <LoadingView />;
  }

  return (
    <section className="relative">
      <div className="bg-grid bg-radial-fade absolute inset-0 -z-10" />

      <div className="mx-auto max-w-[1200px] px-4 pb-16 pt-6 md:px-6 md:pt-8 xl:px-8">
        <nav aria-label="Breadcrumb" className="text-sm text-ink/70">
          <ol className="flex flex-wrap items-center gap-1.5">
            <li>
              <Link href="/home" className="hover:text-brand">
                Beranda
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li>
              <Link href="/learning-path" className="hover:text-brand">
                Pelatihan
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li aria-current="page">Jalur Belajar</li>
          </ol>
        </nav>

        <div className="mt-4 max-w-3xl">
          <h1 className="text-3xl font-bold tracking-tight text-brand md:text-4xl">
            Jalur Belajar &amp; Pelatihan untuk Menutup Skill Gap
          </h1>
          <p className="mt-4 text-muted-foreground">
            Rekomendasi pelatihan yang dipersonalisasi berdasarkan analisis AI
            terhadap profil Anda.
          </p>
        </div>

        <div className="mt-10 space-y-8">
          {/* Target posisi & skill gap */}
          <section
            aria-label="Target posisi dan skill gap"
            className="grid gap-8 rounded-3xl bg-brand px-6 py-8 text-white md:grid-cols-[1fr_auto_1fr] md:items-center md:px-10"
          >
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-white/90">
                Target Posisi
              </p>
              <h2 className="mt-2 text-3xl font-bold">{target.position}</h2>
              <p className="mt-1 text-base text-white/85">{target.company}</p>
            </div>

            <div
              className="hidden h-24 w-px bg-white/20 md:block"
              aria-hidden="true"
            />

            <div className="md:pr-2">
              <div className="flex items-start justify-between gap-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-white/90">
                  Skill Gap Teridentifikasi
                </p>
                <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-accent-light px-3 py-1 text-xs font-bold text-accent">
                  <Sparkle className="size-3 fill-current" aria-hidden="true" />
                  Dianalisis oleh AI
                </span>
              </div>

              <ul className="mt-3 space-y-2">
                {target.skillGaps.map(({ skill, status, tone }) => (
                  <li key={skill} className="flex items-center gap-3 text-sm">
                    <span
                      className={cn("size-2.5 shrink-0 rounded-full", GAP_DOT[tone])}
                      aria-hidden="true"
                    />
                    <span>
                      <span className="font-semibold">{skill}</span>
                      <span className={cn("ml-1.5", GAP_TEXT[tone])}>
                        — {status}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          {/* Jalur belajar + course */}
          <section
            aria-labelledby="jalur-title"
            className="rounded-3xl border border-line bg-white p-6 md:p-10"
          >
            <div className="flex items-start gap-4">
              <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-brand-light text-brand">
                <Compass className="size-5" aria-hidden="true" />
              </span>
              <div>
                <h2 id="jalur-title" className="text-xl font-bold text-brand">
                  Jalur Belajar Anda
                </h2>
                <p className="mt-0.5 text-sm text-ink/70">
                  Course dikerjakan di situs penyedia (Udemy, Kemnaker, dll).
                  Tandai Sudah Selesai Diikuti setelah selesai.
                </p>
              </div>
            </div>

            <div className="mt-6">
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="font-semibold text-ink">Progres jalur belajar</span>
                <span className="text-ink/70">
                  {completedCourses} dari {totalCourses} course selesai
                </span>
              </div>
              <div
                role="progressbar"
                aria-label="Progres jalur belajar"
                aria-valuenow={percent}
                aria-valuemin={0}
                aria-valuemax={100}
                className="mt-2 h-2 overflow-hidden rounded-full bg-brand-light"
              >
                <div
                  className="h-full rounded-full bg-brand transition-all"
                  style={{ width: `${percent}%` }}
                />
              </div>
            </div>

            {actionError && (
              <p className="mt-4 text-sm text-destructive">{actionError}</p>
            )}

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <SearchBar
                label="Cari pelatihan"
                placeholder="Cari pelatihan, penyedia, atau skill"
                value={query}
                onChange={changeQuery}
                className="w-full max-w-xl sm:flex-1"
              />
              {levelOptions.length > 0 ? (
                <LevelSelect value={level} onChange={changeLevel} options={levelOptions} />
              ) : null}
            </div>

            {filtered.length > 0 ? (
              <p aria-live="polite" className="mt-3 text-sm text-ink/70">
                Menampilkan {firstIndex + 1}–{firstIndex + pageCourses.length} dari {filtered.length} pelatihan
                {searching ? ` untuk “${query.trim()}”` : ""}
              </p>
            ) : null}

            <div ref={listRef} className="mt-6 scroll-mt-24">
              {filtered.length === 0 ? (
                <EmptyState
                  icon={SearchX}
                  title={
                    courses.length === 0
                      ? "Belum ada pelatihan"
                      : searching
                        ? `Tidak ada pelatihan untuk “${query.trim()}”`
                        : "Tidak ada pelatihan untuk level ini"
                  }
                  text={
                    courses.length === 0
                      ? "Pelatihan akan muncul di sini setelah ditambahkan."
                      : "Coba kata lain, misalnya nama skill seperti AMDAL, atau nama penyedia seperti Kemnaker."
                  }
                >
                  {courses.length > 0 ? (
                    <button
                      type="button"
                      onClick={resetFilters}
                      className="rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand/90"
                    >
                      Hapus pencarian dan filter
                    </button>
                  ) : null}
                </EmptyState>
              ) : (
                <>
                  <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                    {pageCourses.map((course) => (
                      <CourseCard
                        key={course.id}
                        course={course}
                        status={progress[course.id]?.status}
                        onStart={handleStart}
                        onComplete={handleComplete}
                      />
                    ))}
                  </div>
                  {totalPages > 1 ? (
                    <Pagination page={currentPage} totalPages={totalPages} onChange={goToPage} />
                  ) : null}
                </>
              )}
            </div>
          </section>

          <aside className="flex flex-col gap-3 rounded-2xl border border-brand/15 bg-brand-light px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="flex items-center gap-4 text-sm text-ink">
              <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-white text-accent">
                <Sparkles className="size-4" aria-hidden="true" />
              </span>
              Setelah menyelesaikan pelatihan, profil dan tingkat kecocokan
              lamaran Anda akan diperbarui secara otomatis.
            </p>

            <Link
              href="#"
              className="inline-flex shrink-0 items-center gap-1 text-sm font-bold text-brand hover:underline"
            >
              Pelajari Selengkapnya
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </aside>
        </div>
      </div>
    </section>
  );
}