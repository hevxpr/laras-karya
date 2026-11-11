"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, RefreshCw } from "lucide-react";

import { refreshRecommendations } from "@/app/home/actions";
import { JobCard } from "@/components/home/job-card";
import { cn } from "@/lib/utils";

/** Seksi rekomendasi lowongan. Tombol "Perbarui Rekomendasi" meminta database menghitung ulang, lalu memuat ulang halaman. */
export function RecommendedJobs({ jobs }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState(null);
  const isUpdating = updating || isPending;

  async function handleUpdate() {
    setUpdating(true);
    setError(null);
    const result = await refreshRecommendations();
    if (result.ok) startTransition(() => router.refresh());
    else setError(result.error);
    setUpdating(false);
  }

  const topId = jobs
    .filter((j) => j.isOpen)
    .reduce(
      (best, j) => (best && best.matchPercent >= j.matchPercent ? best : j),
      null,
    )?.id;

  return (
    <section aria-labelledby="jobs-title" className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2
            id="jobs-title"
            className="text-base font-bold text-ink md:text-lg"
          >
            Rekomendasi Lowongan Hijau untuk Anda
          </h2>
        </div>
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={handleUpdate}
            disabled={isUpdating}
            className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-brand px-3.5 text-xs font-semibold text-brand transition-colors hover:bg-brand-light disabled:opacity-70 md:min-h-8"
          >
            <RefreshCw
              className={cn("size-3.5", isUpdating && "animate-spin")}
              aria-hidden="true"
            />
            {isUpdating ? "Memperbarui…" : "Perbarui Rekomendasi"}
          </button>
          <Link
            href="/recommended-jobs"
            className="inline-flex min-h-11 items-center gap-1 text-xs font-bold text-brand hover:underline md:min-h-0"
          >
            Lihat Semua Lowongan{" "}
            <ArrowRight className="size-3.5" aria-hidden="true" />
          </Link>
        </div>
      </div>

      {error ? (
        <p role="alert" className="text-xs font-semibold text-red-700">
          {error}
        </p>
      ) : null}

      {jobs.length === 0 && !isUpdating ? (
        <p className="rounded-xl border border-dashed border-mint-line bg-white px-5 py-8 text-center text-sm text-ink/75">
          Belum ada rekomendasi. Selesaikan asesmen karier, lalu tekan Perbarui Rekomendasi.
        </p>
      ) : null}

      <div className="grid gap-4 md:grid-cols-3" aria-busy={isUpdating}>
        {isUpdating
          ? jobs.map((j) => (
              <div
                key={j.id}
                className="h-[176px] animate-pulse rounded-xl bg-white/80"
              />
            ))
          : jobs.map((j) => (
              <JobCard key={j.id} job={j} featured={j.id === topId} />
            ))}
      </div>
    </section>
  );
}
