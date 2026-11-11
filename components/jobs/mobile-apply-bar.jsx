"use client";

import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";

import { useHasApplied } from "@/lib/demo-history";

/**
 * Bilah aksi tetap di dasar layar, khusus HP/tablet. Di desktop aksi melamar
 * sudah menempel di kartu "Kecocokan Profil". Status yang ditampilkan sama
 * dengan kartu itu: sudah dilamar, masih dibuka, atau ditutup.
 * @param {{ job: import("@/lib/job-detail-data").JobDetail }} props
 */
export function MobileApplyBar({ job }) {
  const applied = useHasApplied(job.id);

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white/95 backdrop-blur lg:hidden">
      <div className="mx-auto flex max-w-[1040px] items-center gap-3 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <div className="shrink-0">
          <p className="text-lg font-bold leading-none text-brand">
            {job.matchPercent == null ? "–" : `${job.matchPercent}%`}
          </p>
          <p className="mt-0.5 text-xs text-ink/70">Kecocokan</p>
        </div>

        {applied ? (
          <Link
            href="/applications"
            className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-full border border-brand px-5 text-sm font-semibold text-brand"
          >
            <CheckCircle2 className="size-4" aria-hidden="true" /> Lihat Lamaran Saya
          </Link>
        ) : job.isOpen ? (
          <Link
            href={`/applications/prepare?job=${job.id}`}
            className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-full bg-brand px-5 text-sm font-semibold text-white"
          >
            Lamar Sekarang <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        ) : (
          <button
            type="button"
            disabled
            className="flex min-h-11 flex-1 cursor-not-allowed items-center justify-center rounded-full bg-slate-200 px-5 text-sm font-semibold text-slate-600"
          >
            Lowongan Ditutup
          </button>
        )}
      </div>
    </div>
  );
}