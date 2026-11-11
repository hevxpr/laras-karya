"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Check,
  CheckCircle2,
  ClipboardCheck,
  X,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { useHasApplied } from "@/lib/demo-history";

const SKILL_STATUS = {
  dimiliki: {
    label: "Sudah dimiliki",
    pill: "bg-emerald-400/20 text-emerald-100",
    ok: true,
  },
  belum: {
    label: "Belum dimiliki",
    pill: "bg-red-400/20 text-red-200",
    ok: false,
  },
};

/**
 * Kartu hijau tua "Kecocokan Profil" (sticky di desktop).
 * - Toggle buka/tutup breakdown Skill Gap (F04b ↔ F04c)
 * - "Lamar Sekarang" mensimulasikan kirim lamaran (idle → loading → done)
 *
 * @param {{ job: import("@/lib/job-detail-data").JobDetail, defaultOpen?: boolean }} props
 */
export function MatchSkillGapCard({ job, defaultOpen = false }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const applied = useHasApplied(job.id);

  const missing = job.skills.filter((s) => s.status !== "dimiliki");

  return (
    <section
      aria-labelledby="match-title"
      className="rounded-xl bg-brand p-5 text-white shadow-sm lg:sticky lg:top-24"
    >
      <div className="flex items-center justify-between">
        <h2 id="match-title" className="text-[13px] font-bold">
          Kecocokan Profil
        </h2>
        <span className="text-[13px] font-bold">
          {job.matchPercent == null ? "Belum dihitung" : `${job.matchPercent}%`}
        </span>
      </div>

      {job.matchPercent == null ? (
        <p className="mt-2 text-xs text-white/80">
          Skor kecocokan muncul setelah asesmen selesai dan rekomendasi dihitung.
        </p>
      ) : (
        <>
          <div
            className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/25"
            role="progressbar"
            aria-valuenow={job.matchPercent}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Kecocokan profil"
          >
            <div
              className="h-full rounded-full bg-white"
              style={{ width: `${job.matchPercent}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-white/80">
            Dihitung dari tujuh komponen: keahlian, sektor, pengalaman, pola kerja, lokasi, pendidikan, dan benefit.
          </p>
        </>
      )}

      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        aria-expanded={isOpen}
        aria-controls="skill-gap-panel"
        className="mt-3 flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-white/60 text-[13px] font-semibold transition-colors hover:bg-white/10"
      >
        <ClipboardCheck className="size-4" aria-hidden="true" />
        {isOpen ? "Sembunyikan Skill Gap" : "Cek Skill Gap"}
      </button>

      {isOpen && (
        <div id="skill-gap-panel" className="mt-3 rounded-lg bg-white/10 p-3">
          <p className="text-xs font-bold uppercase tracking-wide text-white/80">
            {missing.length} keterampilan perlu dilengkapi
          </p>

          <ul className="mt-2.5 space-y-2">
            {job.skills.map((s) => {
              const st = SKILL_STATUS[s.status];
              return (
                <li key={s.id} className="flex items-center gap-2 text-[12px]">
                  <span
                    className={cn(
                      "grid size-4 shrink-0 place-items-center rounded-full",
                      st.ok ? "bg-emerald-500" : "bg-red-500",
                    )}
                  >
                    {st.ok ? (
                      <Check className="size-2.5" aria-hidden="true" />
                    ) : (
                      <X className="size-2.5" aria-hidden="true" />
                    )}
                  </span>
                  <span className="min-w-0 flex-1">{s.name}</span>
                  <span
                    className={cn(
                      "whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-semibold",
                      st.pill,
                    )}
                  >
                    {st.label}
                  </span>
                </li>
              );
            })}
          </ul>

          <Link
            href="/learning-path"
            className="mt-3 flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-white text-[12px] font-bold text-brand transition-colors hover:bg-brand-light"
          >
            <BookOpen className="size-4" aria-hidden="true" />
            Lihat Pelatihan ({missing.length} keterampilan)
          </Link>
        </div>
      )}

      {applied ? (
        <Link
          href="/applications"
          className="mt-3 flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-white/60 text-[13px] font-semibold transition-colors hover:bg-white/10"
        >
          <CheckCircle2 className="size-4" aria-hidden="true" /> Lihat Lamaran
          Saya
        </Link>
      ) : job.isOpen ? (
        <>
          <Link
            href={`/applications/prepare?job=${job.id}`}
            className="mt-3 flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-white text-[13px] font-bold text-brand transition-colors hover:bg-brand-light"
          >
            Lamar Sekarang <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
          <p className="mt-2 text-center text-xs text-white/80">
            Periksa dokumen dulu, lalu kirim lamaran.
          </p>
        </>
      ) : (
        <button
          type="button"
          disabled
          className="mt-3 flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-white/70 text-[13px] font-bold text-brand/60 cursor-not-allowed"
        >
          Lowongan Ditutup
        </button>
      )}
    </section>
  );
}
