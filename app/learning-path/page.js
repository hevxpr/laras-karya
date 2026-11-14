"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowRight,
  BookOpen,
  Check,
  ChevronDown,
  Clock,
  Compass,
  ExternalLink,
  SearchX,
  X,
  Sparkle,
  Sparkles,
  Tag,
} from "lucide-react";

import Pagination from "@/components/jobs/pagination";
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

/**
 * ?q= dibaca dari URL (mis. dari pencarian di Beranda); useSearchParams wajib di dalam <Suspense>.
 * ?job=<id lowongan> memfilter pelatihan sesuai skill gap lowongan itu (tombol "Lihat Pelatihan" di halaman lowongan).
 * `key={job}` memuat ulang data saat berpindah antara semua pelatihan dan pelatihan per lowongan.
 */
function LearningPathFromUrl() {
  const params = useSearchParams();
  const initialQuery = params.get("q") ?? "";
  const job = params.get("job") ?? "";
  return <LearningPathContent key={job} initialQuery={initialQuery} job={job} />;
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

/**
 * Gambar sampul course (courses.image_url, 240x135 = rasio 16:9). Kotak gambar mengikuti rasio itu
 * (aspect-video) supaya gambar tidak terpotong. Bila kosong atau gagal dimuat, tampil placeholder.
 * `children` = lencana yang diletakkan di atas gambar (posisi diatur oleh pemanggil). Saat kartu
 * (class "group") disorot, gambar membesar sedikit.
 */
function CourseImage({ src, children }) {
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
          className="absolute inset-0 size-full object-cover transition-transform duration-500 motion-safe:group-hover:scale-105 motion-reduce:transition-none"
        />
      ) : (
        <span className="absolute inset-0 grid place-items-center text-brand/40">
          <BookOpen className="size-10" aria-hidden="true" />
        </span>
      )}
      {/* Gradasi tipis di bawah supaya lencana tetap terbaca di atas gambar apa pun */}
      <span aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-slate-900/40 to-transparent" />
      {children}
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

function CourseCard({ course, status, onStart, onComplete }) {
  return (
    <article
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-2xl border bg-white transition-all duration-200 hover:shadow-lg focus-within:ring-2 focus-within:ring-brand/20 motion-safe:hover:-translate-y-1",
        status === "completed" ? "border-brand/40 hover:border-brand" : "border-line hover:border-brand/40"
      )}
    >
      {/* Garis aksen di atas kartu: memanjang saat kartu disorot */}
      <span
        aria-hidden="true"
        className="absolute inset-x-0 top-0 z-10 h-1 origin-left scale-x-0 bg-gradient-to-r from-brand to-emerald-400 transition-transform duration-300 group-hover:scale-x-100 group-focus-within:scale-x-100 motion-reduce:transition-none"
      />

      <CourseImage src={course.imageUrl}>
        {/* Kiri atas: status atau lencana populer */}
        {status === "completed" ? (
          <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-brand px-2.5 py-1 text-xs font-bold text-white shadow-sm">
            <Check className="size-3" aria-hidden="true" />
            Selesai
          </span>
        ) : status === "enrolled" ? (
          <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-white/95 px-2.5 py-1 text-xs font-bold text-brand shadow-sm">
            <span aria-hidden="true" className="size-2 rounded-full bg-brand motion-safe:animate-pulse" />
            Sedang diikuti
          </span>
        ) : (
          course.popular && (
            <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-accent-light px-2.5 py-1 text-xs font-bold text-accent shadow-sm">
              <Sparkle className="size-3 fill-current" aria-hidden="true" />
              Paling Populer
            </span>
          )
        )}

        {/* Bawah: level (kiri) dan format belajar (kanan) */}
        <span className={cn("absolute bottom-3 left-3 rounded-full px-2.5 py-1 text-xs font-bold shadow-sm", LEVEL_BADGE[course.level])}>
          {course.level}
        </span>
        {course.format && (
          <span className="absolute bottom-3 right-3 rounded-full bg-white/90 px-2.5 py-1 text-xs font-medium text-ink/80 shadow-sm backdrop-blur">
            {course.format}
          </span>
        )}
      </CourseImage>

      <div className="flex flex-1 flex-col p-6">
        <p className="flex min-w-0 items-center gap-2.5 text-sm text-ink/80">
          <span className="grid size-7 shrink-0 place-items-center rounded-md bg-brand-light text-brand transition-colors group-hover:bg-brand group-hover:text-white">
            <BookOpen className="size-4" aria-hidden="true" />
          </span>
          <span className="truncate">{course.provider}</span>
        </p>

        <h4 className="mt-4 min-h-12 text-lg font-bold leading-snug text-ink transition-colors group-hover:text-brand">
          {course.title}
        </h4>

        {/* Durasi, lalu kategori tepat di bawahnya */}
        <ul className="mt-5 space-y-2 border-t border-line pt-4 text-sm text-ink/80">
          <li className="flex items-center gap-2">
            <Clock className="size-4 shrink-0" aria-hidden="true" />
            {course.duration}
          </li>
          {course.skillTag && (
            <li className="flex items-center gap-2">
              <Tag className="size-4 shrink-0" aria-hidden="true" />
              <span className="rounded-md border border-accent px-2 py-0.5 text-xs font-medium text-accent transition-colors group-hover:bg-accent-light">
                {course.skillTag}
              </span>
            </li>
          )}
        </ul>

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
                className="group/btn w-full bg-brand hover:bg-brand/90"
              >
                Lanjutkan Belajar di Udemy
                <ExternalLink className="size-4 transition-transform motion-safe:group-hover/btn:translate-x-0.5 motion-safe:group-hover/btn:-translate-y-0.5" aria-hidden="true" />
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
              className="group/btn w-full bg-brand hover:bg-brand/90"
              onClick={() => onStart(course.id)}
            >
              Daftar di Udemy
              <ExternalLink className="size-4 transition-transform motion-safe:group-hover/btn:translate-x-0.5 motion-safe:group-hover/btn:-translate-y-0.5" aria-hidden="true" />
            </Button>
          )}
        </div>
      </div>
    </article>
  );
}

function LearningPathContent({ initialQuery = "", job = "" }) {
  const [query, setQuery] = useState(initialQuery);
  const urlTimer = useRef(null);
  useEffect(() => () => clearTimeout(urlTimer.current), []);
  const [target, setTarget] = useState(null);
  const [jobInfo, setJobInfo] = useState(null); // lowongan yang jadi filter (null = semua pelatihan)
  const [gap, setGap] = useState(null);
  const [jobNotFound, setJobNotFound] = useState(false);
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
    getLearningPath(job || null)
      .then((data) => {
        setTarget(data.target);
        setJobInfo(data.job);
        setGap(data.gap);
        setJobNotFound(data.jobNotFound);
        setCourses(data.courses);
        setProgress(data.progress);
        setLoading(false);
      })
      .catch((error) => {
        setError(error.message);
        setLoading(false);
      });
  }, [job]);

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

        {jobNotFound ? (
          <p
            role="status"
            className="mt-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800"
          >
            Lowongan yang dimaksud tidak ditemukan, jadi semua pelatihan ditampilkan.
          </p>
        ) : null}

        {jobInfo ? (
          <div
            role="status"
            className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-brand/20 bg-brand-light px-4 py-3 text-sm text-ink"
          >
            <p>
              Menampilkan pelatihan untuk:{" "}
              <span className="font-bold text-brand">
                {jobInfo.title}
                {jobInfo.company ? `, ${jobInfo.company}` : ""}
              </span>
            </p>
            <Link
              href="/learning-path"
              className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-brand px-4 text-xs font-bold text-brand transition-colors hover:bg-white md:min-h-9"
            >
              <X className="size-3.5" aria-hidden="true" />
              Hapus filter
            </Link>
          </div>
        ) : null}

        <div className="mt-10 space-y-8">
          {/* Target posisi & skill gap (hanya saat ?job= dipilih) */}
          {target ? (
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
                {target.moreSkills > 0 ? (
                  <p className="mt-2 text-xs text-white/80">+{target.moreSkills} keterampilan lainnya</p>
                ) : null}
              </div>
            </section>
          ) : null}

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

            {gap?.uncovered.length > 0 && courses.length > 0 ? (
              <p className="mt-3 text-sm text-ink/70">
                Belum ada pelatihan di Laras Karya untuk: {gap.uncovered.join(", ")}.
              </p>
            ) : null}

            {filtered.length > 0 ? (
              <p aria-live="polite" className="mt-3 text-sm text-ink/70">
                Menampilkan {firstIndex + 1}–{firstIndex + pageCourses.length} dari {filtered.length} pelatihan
                {searching ? ` untuk “${query.trim()}”` : ""}
              </p>
            ) : null}

            <div ref={listRef} className="mt-6 scroll-mt-24">
              {courses.length === 0 && gap ? (
                <EmptyState
                  icon={gap.missing === 0 ? Check : SearchX}
                  title={
                    gap.total === 0
                      ? "Lowongan ini belum mencantumkan keterampilan teknis"
                      : gap.missing === 0
                        ? "Anda sudah memenuhi semua skill untuk lowongan ini"
                        : "Belum ada pelatihan untuk skill yang kurang"
                  }
                  text={
                    gap.missing === 0
                      ? "Tidak ada skill teknis yang perlu dilengkapi. Anda bisa langsung melamar, atau lihat pelatihan lain."
                      : `Belum ada pelatihan di Laras Karya untuk: ${gap.uncovered.join(", ")}. Cari di penyedia lain, atau lihat semua pelatihan.`
                  }
                >
                  <Link
                    href="/learning-path"
                    className="inline-flex rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand/90"
                  >
                    Lihat semua pelatihan
                  </Link>
                </EmptyState>
              ) : filtered.length === 0 ? (
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
                    <Pagination page={currentPage} totalPages={totalPages} onChange={goToPage} label="Halaman pelatihan" />
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