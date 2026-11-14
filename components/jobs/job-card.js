"use client";

import Link from "next/link";

import {
  ArrowRight,
  ListChecks,
  MapPin,
  Star,
  Wallet,
} from "lucide-react";
import MatchPanel, { GuestMatchPanel, splitSkills } from "./match-panel";
import { FacilityBadges } from "./facility-badges";

import { useHasApplied } from "@/lib/demo-history";
import { AppliedBadge } from "@/components/ui/applied-badge";
import { CompanyAvatar, sectorTone } from "@/components/ui/company-avatar";

function TopRow({ job, showMatch = true, hideApplied = false }) {
  const applied = useHasApplied(job.id, job.applied);
  return (
    <div className="flex items-center justify-between gap-3">
      <span
        className={`rounded-full px-3 py-1 text-xs font-medium ${sectorTone(job.sector)}`}
      >
        {job.sector}
      </span>
      <div className="flex flex-wrap items-center justify-end gap-2">
        {!hideApplied && applied && <AppliedBadge />}
        {showMatch && job.match != null && (
          <span className="rounded-full bg-ai/10 px-3 py-1 text-xs font-semibold text-ai">
            {job.match}% Cocok
          </span>
        )}
      </div>
    </div>
  );
}

function Meta({ job, selectedFacilities = [] }) {
  // Kota atau pola kerja bisa kosong di data database; yang kosong dilewati.
  const place = job.mode === "Remote" ? "Remote" : [job.city, job.mode].filter(Boolean).join(" • ") || "Lokasi tidak dicantumkan";
  return (
    <ul className="mt-3 space-y-1.5 text-sm text-slate-600">
      <li className="flex items-center gap-2">
        <MapPin className="h-4 w-4 shrink-0" aria-hidden /> {place}
      </li>
      <li className="flex items-center gap-2 font-bold text-brand">
        <Wallet className="h-4 w-4 shrink-0" aria-hidden /> {job.salary}
      </li>
      {job.benefits?.length > 0 && (
        <li>
          <FacilityBadges benefits={job.benefits} selected={selectedFacilities} className="mt-2.5" />
        </li>
      )}
    </ul>
  );
}

function SkillSummary({ job }) {
  const { owned } = splitSkills(job);
  const total = job.skills.length;
  if (total === 0) return <span />;
  return (
    <p className="flex items-center gap-1.5 text-xs text-slate-600">
      <ListChecks className="h-4 w-4 shrink-0 text-brand" aria-hidden />
      {owned.length === total
        ? "Semua keterampilan dimiliki"
        : `${owned.length} dari ${total} keterampilan dimiliki`}
    </p>
  );
}

/** hideApplied: sembunyikan lencana "Sudah Dilamar" (dipakai pratinjau tamu, yang belum punya lamaran). */
export function FeaturedJobCard({ job, hideApplied = false, guest = false, selectedFacilities = [] }) {
  return (
    <section
      aria-label="Rekomendasi paling cocok"
      className="rounded-3xl border-2 border-brand bg-brand-light p-5 sm:p-7"
    >
      <span className="inline-flex items-center gap-1.5 rounded-full bg-brand px-3 py-1.5 text-xs font-semibold text-white">
        <Star className="h-3 w-3" aria-hidden /> Paling cocok untuk Anda
      </span>

      <div className="mt-4 grid gap-5 lg:grid-cols-[1.35fr_1fr]">
        <article className="flex flex-col rounded-2xl bg-white p-6">
          <TopRow job={job} showMatch={false} hideApplied={hideApplied} />
          <div className="mt-5 flex items-center gap-4">
            <CompanyAvatar
              company={job.company}
              sector={job.sector}
              logoUrl={job.companyLogoUrl}
              className="h-16 w-16 text-xl"
            />
            <div className="min-w-0">
              <h2 className="text-3xl font-bold text-ink">{job.title}</h2>
              <p className="mt-1 text-slate-600">{job.company}</p>
            </div>
          </div>
          <p className="mt-4 leading-relaxed text-slate-700">
            {job.description}
          </p>
          <Meta job={job} selectedFacilities={selectedFacilities} />

          <p className="mt-5 text-sm font-semibold text-ink">
            Keterampilan yang dibutuhkan
          </p>
          <ul className="mt-2 flex flex-wrap gap-2">
            {job.skills.map((s) => (
              <li
                key={s}
                className="rounded-full bg-brand-light px-3.5 py-1.5 text-xs font-semibold text-brand"
              >
                {s}
              </li>
            ))}
          </ul>

          <div className="mt-auto pt-8">
            <Link
              href={`/recommended-jobs/${job.id}`}
              className="flex items-center justify-center gap-2 rounded-xl bg-brand px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-brand/90"
            >
              Lihat Detail Lowongan{" "}
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
        </article>

        {guest ? <GuestMatchPanel /> : <MatchPanel job={job} />}
      </div>
    </section>
  );
}

export function JobCard({ job, selectedFacilities = [] }) {
  return (
    <article className="flex flex-col rounded-2xl border border-line bg-white p-6 shadow-sm">
      <TopRow job={job} />
      <div className="mt-4 flex items-center gap-3">
        <CompanyAvatar company={job.company} sector={job.sector} logoUrl={job.companyLogoUrl} />
        <div className="min-w-0">
          <h3 className="text-xl font-bold text-ink">{job.title}</h3>
          <p className="text-slate-600">{job.company}</p>
        </div>
      </div>
      <Meta job={job} selectedFacilities={selectedFacilities} />

      <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-5">
        <SkillSummary job={job} />
        <Link
          href={`/recommended-jobs/${job.id}`}
          aria-label={`Lihat detail ${job.title} di ${job.company}`}
          className="inline-flex min-h-11 items-center gap-2 rounded-full border border-brand px-5 text-sm font-semibold text-brand transition hover:bg-brand-light"
        >
          Lihat Detail <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </div>
    </article>
  );
}