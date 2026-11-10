import Link from "next/link";
import { ArrowRight, Check, Info, Sparkles } from "lucide-react";

import { buildFitInsights } from "@/lib/fit-insights";

/** @param {number} p */
function matchLevel(p) {
  if (p >= 90) return "sangat tinggi";
  if (p >= 80) return "tinggi";
  if (p >= 70) return "cukup tinggi";
  return "sedang";
}

/**
 * Banner "Mengapa lowongan ini cocok untuk Anda". Isinya dari lib/fit-insights.js,
 * sumber yang sama dengan kartu di /recommended-jobs, jadi keduanya selalu seirama.
 * @param {{ job: import("@/lib/job-detail-data").JobDetail }} props
 */
export function FitReasonBanner({ job }) {
  const insights = buildFitInsights({
    sector: job.sector,
    mode: job.workMode,
    city: job.city,
    perks: job.perks ?? [],
    owned: job.skills.filter((s) => s.status === "dimiliki").map((s) => s.name),
    missing: job.skills.filter((s) => s.status !== "dimiliki").map((s) => s.name),
    viewer: job.viewer ?? null,
  });
  if (insights.length === 0) return null;
  const points = insights.filter((i) => i.tone !== "next");
  const next = insights.find((i) => i.tone === "next");

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
      <p className="mt-2 text-xs text-ink/70">
        {job.matchPercent == null
          ? "Skor kecocokan akan muncul setelah asesmen selesai dan rekomendasi dihitung."
          : `Tingkat kecocokan ${matchLevel(job.matchPercent)} (${job.matchPercent}%), berdasarkan profil dan hasil asesmen Anda.`}
      </p>

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
          <Link
            href={next.href}
            className="inline-flex min-h-11 items-center gap-1 font-semibold text-brand hover:underline md:min-h-0"
          >
            {next.linkLabel}
            <ArrowRight className="size-3.5" aria-hidden="true" />
          </Link>
        </div>
      ) : null}
    </section>
  );
}
