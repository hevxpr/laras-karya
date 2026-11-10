"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowRight,
  BookOpen,
  Check,
  Clock,
  Compass,
  ExternalLink,
  Lock,
  SearchX,
  Sparkle,
  Sparkles,
  Upload,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { SearchBar } from "@/components/ui/search-bar";
import { courseSearchFields, matchesQuery, replaceQueryParam } from "@/lib/search";
import { cn } from "@/lib/utils";

import { completeCourse, getLearningPath, startCourse } from "./actions";

const STEP_CARD = {
  completed: "border-2 border-brand/30 bg-white",
  active: "border-2 border-brand bg-brand-light",
  locked: "border-2 border-dashed border-line bg-white",
};

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

function LearningPathContent({ initialQuery = "" }) {
  const [query, setQuery] = useState(initialQuery);
  const urlTimer = useRef(null);
  useEffect(() => () => clearTimeout(urlTimer.current), []);
  const [target, setTarget] = useState(null);
  const [steps, setSteps] = useState([]);
  const [progress, setProgress] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");

  const isCompleted = (courseId) => progress[courseId]?.status === "completed";

  // Status langkah dihitung dari status course:
  // selesai  = semua course di langkah itu completed
  // aktif    = langkah sebelumnya selesai (atau langkah pertama)
  // terkunci = langkah sebelumnya belum selesai
  const stepViews = steps.map((step, index) => {
    const doneCount = step.courses.filter((course) => isCompleted(course.id)).length;
    const previousDone =
      index === 0 || steps[index - 1].courses.every((course) => isCompleted(course.id));

    const state =
      doneCount === step.courses.length ? "completed" : previousDone ? "active" : "locked";

    return { ...step, doneCount, state };
  });

  // Pencarian hanya menyaring TAMPILAN; status langkah tetap dihitung dari semua course di atas.
  const searching = query.trim().length > 0;
  const visibleSteps = stepViews
    .map((step) => ({
      ...step,
      shownCourses: step.courses.filter((course) => matchesQuery(courseSearchFields(course), query)),
    }))
    .filter((step) => !searching || step.shownCourses.length > 0);
  const matchCount = visibleSteps.reduce((sum, step) => sum + step.shownCourses.length, 0);

  const changeQuery = (value) => {
    setQuery(value);
    clearTimeout(urlTimer.current);
    urlTimer.current = setTimeout(() => replaceQueryParam(value), 300);
  };

  const totalCourses = steps.reduce((sum, step) => sum + step.courses.length, 0);
  const completedCourses = stepViews.reduce((sum, step) => sum + step.doneCount, 0);
  const percent = totalCourses ? Math.round((completedCourses / totalCourses) * 100) : 0;

  useEffect(() => {
    getLearningPath()
      .then((data) => {
        setTarget(data.target);
        setSteps(data.steps);
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
                  Tandai Sudah Selesai Diikuti setelah selesai, dan langkah
                  berikutnya terbuka setelah semua course di langkah sebelumnya
                  selesai.
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

            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2">
              <SearchBar
                label="Cari pelatihan"
                placeholder="Cari pelatihan, penyedia, atau skill"
                value={query}
                onChange={changeQuery}
                className="w-full max-w-xl"
              />
              {searching && matchCount > 0 ? (
                <p aria-live="polite" className="text-sm text-ink/70">
                  {matchCount} pelatihan cocok dengan “{query.trim()}”
                </p>
              ) : null}
            </div>

            {searching && matchCount === 0 ? (
              <EmptyState
                icon={SearchX}
                title={`Tidak ada pelatihan untuk “${query.trim()}”`}
                text="Coba kata lain, misalnya nama skill seperti AMDAL, atau nama penyedia seperti Kemnaker."
              >
                <button
                  type="button"
                  onClick={() => changeQuery("")}
                  className="rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand/90"
                >
                  Hapus pencarian
                </button>
              </EmptyState>
            ) : null}

            <ol className="mt-8 space-y-6">
              {visibleSteps.map((step) => (
                <li
                  key={step.n}
                  aria-current={step.state === "active" ? "step" : undefined}
                  className={cn("rounded-2xl p-5 md:p-6", STEP_CARD[step.state])}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex items-start gap-4">
                      <span
                        className={cn(
                          "grid size-9 shrink-0 place-items-center rounded-full text-sm font-bold",
                          step.state === "locked"
                            ? "bg-brand-light text-brand"
                            : "bg-brand text-white"
                        )}
                      >
                        {step.state === "completed" ? (
                          <Check className="size-4" aria-hidden="true" />
                        ) : step.state === "locked" ? (
                          <Lock className="size-4" aria-hidden="true" />
                        ) : (
                          step.n
                        )}
                      </span>

                      <div>
                        <h3 className="text-lg font-bold text-brand">
                          Langkah {step.n}: {step.title}
                        </h3>
                        <p className="mt-1 max-w-2xl text-sm leading-relaxed text-ink/80">
                          {step.description}
                        </p>
                      </div>
                    </div>

                    <div className="text-sm sm:text-right">
                      <p className="font-semibold text-ink">
                        {step.doneCount}/{step.courses.length} course selesai
                      </p>
                      <p className="text-ink/70">
                        {step.state === "completed" && "Langkah selesai"}
                        {step.state === "active" && "Langkah saat ini"}
                        {step.state === "locked" &&
                          `Selesaikan semua course di Langkah ${step.n - 1} untuk membuka`}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-5 md:grid-cols-2">
                    {step.shownCourses.map((course) => {
                      const status = progress[course.id]?.status;
                      const locked = step.state === "locked";

                      return (
                        <article
                          key={course.id}
                          className={cn(
                            "flex flex-col rounded-2xl border border-line bg-white p-6",
                            locked && "opacity-60"
                          )}
                        >
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

                          <h4 className="mt-5 min-h-12 text-lg font-bold leading-snug text-ink">
                            {course.title}
                          </h4>

                          <div className="mt-5 flex flex-wrap gap-2">
                            <span
                              className={cn(
                                "rounded-full px-2.5 py-1 text-xs font-bold",
                                LEVEL_BADGE[course.level]
                              )}
                            >
                              {course.level}
                            </span>
                            <span className="rounded-full border border-line px-2.5 py-1 text-xs font-medium text-ink/80">
                              {course.format}
                            </span>
                          </div>

                          <div className="mt-5 flex min-h-8 items-center justify-between gap-3 border-t border-line pt-4 text-sm text-ink/80">
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

                          <div className="mt-5">
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
                                  Lanjutkan Belajar {course.provider}
                                  <ExternalLink className="size-4" aria-hidden="true" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="muted"
                                  className="w-full inline-flex min-h-11 items-center gap-1.5 border-brand px-3.5 text-xs font-semibold text-brand transition-colors hover:bg-brand-light disabled:opacity-70 md:min-h-8"
                                  onClick={() => handleComplete(course.id)}
                                >
                                  Sudah Selesai Diikuti
                                </Button>
                              </div>
                            ) : locked ? (
                              <Button size="lg" variant="muted" className="w-full" disabled>
                                <Lock className="size-4" aria-hidden="true" />
                                Terkunci
                              </Button>
                            ) : (
                              <Button
                                href="https://www.udemy.com/"
                                target="_blank"
                                rel="noopener noreferrer"
                                size="lg"
                                className="w-full bg-brand hover:bg-brand/90"
                                onClick={() => handleStart(course.id)}
                              >
                                Daftar di Udemy
                                <ExternalLink className="size-4" aria-hidden="true" />
                              </Button>
                            )}
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </li>
              ))}
            </ol>
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
