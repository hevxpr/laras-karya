import Link from "next/link";
import { CheckCircle2, Heart, Laptop, MapPin, Sparkles } from "lucide-react";

import { cn } from "@/lib/utils";
import { hasApplied } from "@/lib/applications-data";
import { CompanyAvatar } from "@/components/ui/company-avatar";

/** @param {{ job: import("@/lib/home-data").JobItem }} props */
export function JobCard({ job, featured = false }) {
  const {
    id,
    title,
    company,
    logoUrl,
    sector,
    matchPercent,
    workMode,
    salary,
    isOpen,
    benefit,
  } = job;

  // Status lamaran dari database bila ada (job.applied), kalau tidak dari data contoh
  const applied = job.applied ?? hasApplied(id);
  const MetaIcon = workMode.startsWith("Remote") ? Laptop : MapPin;

  return (
    <article className="flex flex-col gap-4 rounded-xl border border-line bg-white p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <CompanyAvatar
          company={company}
          sector={sector}
          logoUrl={logoUrl}
          className="h-10 w-10 text-sm"
        />
        <div className="min-w-0 flex-1">
          <h3
            className={cn(
              "text-[15px] font-bold leading-snug",
              isOpen ? "text-ink" : "text-ink/70",
            )}
          >
            {title}
          </h3>
          <p className="text-xs text-ink/70">{company}</p>
        </div>
        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-ai/10 px-2.5 py-1 text-xs font-semibold text-ai">
          <Sparkles className="size-3" aria-hidden="true" />
          {matchPercent}% Cocok
        </span>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
        <span className="inline-flex items-center gap-1 text-xs text-ink/75">
          <MetaIcon className="size-3.5 shrink-0" aria-hidden="true" />
          {workMode}
        </span>
        <span className="text-sm font-bold text-brand">{salary}</span>
      </div>

      <div className="mt-auto flex items-center justify-between gap-2">
        {isOpen ? (
          <>
            {benefit ? (
              <span className="inline-flex min-w-0 items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
                <Heart className="size-3 shrink-0" aria-hidden="true" />
                <span className="truncate">{benefit}</span>
              </span>
            ) : (
              <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
                Masih Dibuka
              </span>
            )}

            {applied ? (
              <Link
                href="/applications"
                className="inline-flex min-h-11 shrink-0 items-center gap-1 text-xs font-bold text-emerald-700 hover:underline md:min-h-9"
              >
                <CheckCircle2 className="size-3.5" aria-hidden="true" /> Sudah
                Dilamar
              </Link>
            ) : (
              <Link
                href={`/recommended-jobs/${id}`}
                className={cn(
                  "inline-flex min-h-11 shrink-0 items-center justify-center rounded-full border border-brand px-4 text-xs font-bold transition-colors md:min-h-9",
                  featured
                    ? "bg-brand text-white hover:bg-brand/90"
                    : "bg-white text-brand hover:bg-brand-light",
                )}
              >
                Lihat Detail
              </Link>
            )}
          </>
        ) : (
          <>
            <span className="rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-semibold text-red-700">
              Ditutup
            </span>
            <span className="text-xs font-medium text-ink/70">
              Lowongan Ditutup
            </span>
          </>
        )}
      </div>
    </article>
  );
}
