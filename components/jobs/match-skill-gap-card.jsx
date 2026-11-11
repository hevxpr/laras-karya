"use client";

import Link from "next/link";

import { ScrollLink } from "@/components/jobs/scroll-link";
import { ArrowRight, BookOpen, Check, CheckCircle2, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { useHasApplied } from "@/lib/demo-history";
import { groupSkills } from "@/lib/skill-groups";
import { hasCourse, sortGap } from "@/lib/skill-gap-data";

/** Paling banyak berapa skill per blok yang dirinci di kartu ini; sisanya ada di kartu "Rencana Belajar". */
const MAX_ROWS = 3;

const BLOCK = "mt-3 rounded-lg bg-white/10 p-3";
const BLOCK_TITLE = "text-xs font-bold uppercase tracking-wide text-white/80";

/**
 * Satu skill teknis yang belum dimiliki, SATU baris: lingkaran X merah, nama, dan (bila ada) penanda pelatihan.
 * Rincian pelatihan / "Cari di luar" ada di kartu "Rencana Belajar", supaya kartu ini tetap pendek.
 */
function GapRow({ skill }) {
  return (
    <li className="flex items-center gap-2 text-[13px]">
      <span className="grid size-4 shrink-0 place-items-center rounded-full bg-red-500">
        <X className="size-2.5" aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1 break-words">
        {skill.name}
        <span className="sr-only"> (belum dimiliki)</span>
      </span>
      {hasCourse(skill) && (
        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-brand">
          <BookOpen className="size-3" aria-hidden="true" />
          {skill.courses.length}
          <span className="sr-only"> pelatihan tersedia</span>
        </span>
      )}
    </li>
  );
}

/**
 * Kartu hijau tua "Kecocokan Profil" (sticky di desktop): skor, ringkasan skill gap, dan aksi.
 * Rincian skill gap (teknis, pendukung, pelatihan) ada di kartu "Rencana Belajar" (skill-gap-plan.jsx).
 * Kartu ini sengaja pendek (tinggi sekitar 350-400px) supaya tombol aksi selalu terlihat saat sticky.
 * "Lamar Sekarang" mensimulasikan kirim lamaran (idle → loading → done).
 *
 * @param {{ job: import("@/lib/job-detail-data").JobDetail, planHref?: string }} props
 *   planHref: id kartu tujuan tautan "Lihat rencana belajar" (mis. "rencana-belajar"); tanpa ini tautan tidak ditampilkan.
 */
export function MatchSkillGapCard({ job, planHref }) {
  const applied = useHasApplied(job.id);

  const g = groupSkills(job.skills);
  // Lowongan dari database: yang dihitung "perlu dilengkapi" dan masuk tombol pelatihan hanya skill teknis,
  // diurutkan dari yang paling berpengaruh (wajib dulu, paling banyak diminta, sudah ada pelatihan).
  const gap = sortGap(g.structured ? g.technicalMissing : job.skills.filter((s) => s.status !== "dimiliki"));
  const hasGap = gap.length > 0;
  const hasSkills = g.structured ? g.technical.length > 0 : job.skills.length > 0;
  const label = g.structured ? "keterampilan teknis" : "keterampilan";
  // Info pelatihan: tampil hanya bila datanya diketahui (courses bukan undefined).
  const coursesKnown = gap.some((s) => Array.isArray(s.courses));
  const skillsWithCourse = gap.filter(hasCourse).length;
  // Ada gap, tapi tidak satu pun skill-nya punya pelatihan: tombol pelatihan tidak ditampilkan sebagai tautan.
  const noTraining = hasGap && coursesKnown && skillsWithCourse === 0;
  const trainingCount = coursesKnown ? skillsWithCourse : gap.length;
  // "Lamar Sekarang" jadi tombol kedua hanya bila ada tombol pelatihan yang bisa ditekan sebagai tombol utama.
  const lamarSecondary = hasGap && !noTraining;

  return (
    <section aria-labelledby="match-title" className="rounded-xl bg-brand p-5 text-white shadow-sm lg:sticky lg:top-24">
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
            <div className="h-full rounded-full bg-white" style={{ width: `${job.matchPercent}%` }} />
          </div>
          <p className="mt-2 text-xs text-white/80">
            Dihitung dari enam komponen: keahlian, sektor, pengalaman, pola kerja, pendidikan, dan lokasi.
          </p>
        </>
      )}

      {hasSkills && (
        <div className={BLOCK}>
          {hasGap ? (
            <>
              <p className={BLOCK_TITLE}>
                {gap.length} {label} perlu dilengkapi
              </p>
              <ul className="mt-2.5 space-y-2">
                {gap.slice(0, MAX_ROWS).map((s) => (
                  <GapRow key={s.id} skill={s} />
                ))}
              </ul>
              {planHref && (
                <ScrollLink
                  to={planHref}
                  className="mt-2 inline-flex min-h-11 items-center text-xs font-semibold underline underline-offset-2 md:min-h-0"
                >
                  {gap.length > MAX_ROWS ? `+${gap.length - MAX_ROWS} lainnya · ` : ""}Lihat rencana belajar
                </ScrollLink>
              )}
            </>
          ) : (
            <p className="flex items-center gap-2 text-[13px] font-semibold">
              <span className="grid size-4 shrink-0 place-items-center rounded-full bg-emerald-500">
                <Check className="size-2.5" aria-hidden="true" />
              </span>
              Semua {label} terpenuhi
            </p>
          )}
        </div>
      )}

      {hasGap && !noTraining && (
        <Link
          href="/learning-path"
          className="mt-3 flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-white text-[13px] font-bold text-brand transition-colors hover:bg-brand-light"
        >
          <BookOpen className="size-4" aria-hidden="true" />
          Lihat Pelatihan ({trainingCount} keterampilan)
        </Link>
      )}
      {noTraining && (
        <p className="mt-3 flex min-h-11 w-full items-center justify-center rounded-lg bg-white/10 px-3 text-center text-[13px] font-semibold text-white/70">
          Belum ada pelatihan tersedia
        </p>
      )}

      {applied ? (
        <Link
          href="/applications"
          className="mt-3 flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-white/60 text-[13px] font-semibold transition-colors hover:bg-white/10"
        >
          <CheckCircle2 className="size-4" aria-hidden="true" /> Lihat Lamaran Saya
        </Link>
      ) : job.isOpen ? (
        <>
          <Link
            href={`/applications/prepare?job=${job.id}`}
            className={cn(
              "mt-3 flex min-h-11 w-full items-center justify-center gap-2 rounded-lg text-[13px] font-bold transition-colors",
              lamarSecondary
                ? "border border-white/60 text-white hover:bg-white/10"
                : "bg-white text-brand hover:bg-brand-light",
            )}
          >
            Lamar Sekarang <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
          <p className="mt-2 text-center text-xs text-white/80">Periksa dokumen dulu, lalu kirim lamaran.</p>
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
