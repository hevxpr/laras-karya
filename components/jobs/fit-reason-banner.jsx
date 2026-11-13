import { ScrollLink } from "@/components/jobs/scroll-link";
import { ArrowRight, Check, Info, Sparkles } from "lucide-react";

import { buildFitInsights } from "@/lib/fit-insights";
import { groupSkills } from "@/lib/skill-groups";
import { sortGap } from "@/lib/skill-gap-data";

/** @param {number} p */
function matchLevel(p) {
  if (p >= 90) return "sangat tinggi";
  if (p >= 80) return "tinggi";
  if (p >= 70) return "cukup tinggi";
  return "sedang";
}

/**
 * Baris kecocokan biasa ("Tingkat kecocokan tinggi (83%)..."). Juga dipakai sebagai cadangan
 * bila ringkasan AI belum siap atau gagal (components/jobs/ai-fit-summary.jsx).
 * @param {{ job: import("@/lib/job-detail-data").JobDetail }} props
 */
export function FitMatchLine({ job }) {
  // Skor belum ada: penjelasannya cukup di kartu hijau (supaya tidak muncul dua kali).
  if (job.matchPercent == null) return null;
  return (
    <p className="mt-2 text-xs text-ink/70">
      {`Tingkat kecocokan ${matchLevel(job.matchPercent)} (${job.matchPercent}%), berdasarkan profil dan hasil asesmen Anda.`}
    </p>
  );
}

/**
 * Banner "Mengapa lowongan ini cocok untuk Anda". Isinya dari lib/fit-insights.js,
 * sumber yang sama dengan kartu di /recommended-jobs, jadi keduanya selalu seirama.
 * summary (opsional) = pengganti baris kecocokan, mis. ringkasan AI di dalam <Suspense>.
 * @param {{ job: import("@/lib/job-detail-data").JobDetail, summary?: import("react").ReactNode }} props
 */
export function FitReasonBanner({ job, summary }) {
  const g = groupSkills(job.skills);
  const insights = buildFitInsights({
    sector: job.sector,
    mode: job.workMode,
    city: job.city,
    perks: job.perks ?? [],
    owned: job.skills.filter((s) => s.status === "dimiliki").map((s) => s.name),
    missing: job.skills.filter((s) => s.status !== "dimiliki").map((s) => s.name),
    viewer: job.viewer ?? null,
    // Lowongan dari database: prioritas belajar hanya dari skill teknis (skill pendukung diasah lewat pengalaman),
    // dengan urutan yang sama seperti panel skill gap.
    learn: g.structured ? sortGap(g.technicalMissing).map((s) => s.name) : undefined,
  });
  if (insights.length === 0) return null;
  const points = insights.filter((i) => i.tone !== "next");
  const nextInsight = insights.find((i) => i.tone === "next");
  // "Prioritas belajar" menaut ke kartu Rencana Belajar di halaman yang sama.
  const next = nextInsight ? { ...nextInsight, to: "rencana-belajar", linkLabel: "Lihat rencana belajar" } : null;

  return (
    <section
      aria-labelledby="fit-title"
      className="rounded-xl border border-mint-line bg-brand-light from-mint to-white p-5"
    >
      <div className="flex items-center gap-2">
        <span className="grid size-6 place-items-center rounded-full bg-brand text-white">
          <Sparkles className="size-3.5" aria-hidden="true" />
        </span>
        <h2 id="fit-title" className="text-[15px] font-bold text-ink">
          Mengapa lowongan ini cocok untuk Anda
        </h2>
      </div>
      {summary ?? <FitMatchLine job={job} />}

      <ul className="mt-3 space-y-3">
        {points.map(({ id, tone, text, detail }) => (
          <li key={id} className="flex items-start gap-2.5 text-[13px] text-ink">
            {tone === "good" ? (
              <Check className="mt-0.5 size-4 shrink-0 text-brand" aria-hidden="true" />
            ) : (
              <Info className="mt-0.5 size-4 shrink-0 text-amber-600" aria-hidden="true" />
            )}
            <div>
              <p className="font-semibold">{text}</p>
              {detail ? <p className="mt-0.5 text-xs leading-relaxed text-ink/70">{detail}</p> : null}
            </div>
          </li>
        ))}
      </ul>

      {next ? (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-t border-mint-line pt-3 text-[13px]">
          <span className="font-semibold text-ink">{next.text}</span>
          <ScrollLink
            to={next.to}
            className="inline-flex min-h-11 items-center gap-1 font-semibold text-brand hover:underline md:min-h-0"
          >
            {next.linkLabel}
            <ArrowRight className="size-3.5" aria-hidden="true" />
          </ScrollLink>
        </div>
      ) : null}
    </section>
  );
}
