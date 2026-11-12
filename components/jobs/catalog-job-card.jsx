import Link from "next/link";
import { ArrowRight, Briefcase, CalendarClock, Globe, MapPin, Wallet } from "lucide-react";

import { CompanyAvatar } from "@/components/ui/company-avatar";
import { FacilityBadges } from "@/components/jobs/facility-badges";
import { employmentLabel, experienceLabel, formatDate } from "@/lib/job-catalog";
import { loginTo } from "@/lib/routes";

/** Kartu lowongan umum: tanpa skor kecocokan (itu khusus halaman rekomendasi). */
export function CatalogJobCard({ job, selectedFacilities = [] }) {
  // Kota atau pola kerja bisa kosong di database; yang kosong dilewati.
  const place = job.mode === "Remote" ? "Remote" : [job.city, job.mode].filter(Boolean).join(" • ") || "Lokasi tidak dicantumkan";
  const detailHref = loginTo(`/jobs/${job.id}`);
  // Deadline dalam 7 hari ke depan ditandai supaya mudah terlihat.
  const closingSoon = job.daysLeft != null && job.daysLeft <= 7;

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 transition-all duration-200 hover:border-brand/40 hover:shadow-lg focus-within:border-brand/40 focus-within:ring-2 focus-within:ring-brand/20 motion-safe:hover:-translate-y-1">
      {/* Garis aksen di atas kartu: memanjang saat kartu disorot */}
      <span
        aria-hidden
        className="absolute inset-x-0 top-0 h-1 origin-left scale-x-0 bg-gradient-to-r from-brand to-emerald-400 transition-transform duration-300 group-hover:scale-x-100 group-focus-within:scale-x-100 motion-reduce:transition-none"
      />

      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-brand-light px-3 py-1 text-xs font-medium text-brand">{job.sector}</span>
          {job.isNew ? (
            <span className="rounded-full bg-accent-light px-2.5 py-1 text-xs font-bold text-accent">Baru</span>
          ) : null}
        </div>
        {job.employmentType ? (
          <span className="shrink-0 whitespace-nowrap rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
            {employmentLabel(job.employmentType)}
          </span>
        ) : null}
      </div>

      <div className="mt-4 flex items-center gap-3">
        <span className="shrink-0 transition-transform duration-200 motion-safe:group-hover:scale-105">
          <CompanyAvatar
            company={job.company}
            sector={job.sector}
            logoUrl={job.companyLogoUrl}
            className="h-12 w-12 text-base"
          />
        </span>
        <div className="min-w-0">
          <h3 className="text-lg font-bold leading-snug text-ink transition-colors group-hover:text-brand">
            {/* Tautan menutupi seluruh kartu tanpa membuat tombol di dalam tautan */}
            <Link href={detailHref} className="after:absolute after:inset-0 hover:underline focus-visible:underline">
              {job.title}
            </Link>
          </h3>
          <p className="truncate text-sm text-slate-600">{job.company}</p>
        </div>
      </div>

      <ul className="mt-4 space-y-1.5 text-sm text-slate-600">
        <li className="flex items-center gap-2">
          <MapPin className="h-4 w-4 shrink-0 text-brand/70" aria-hidden /> {place}
        </li>
        <li className="flex items-center gap-2">
          <Wallet className="h-4 w-4 shrink-0 text-brand/70" aria-hidden /> {job.salary}
        </li>
        {job.experienceLevel ? (
          <li className="flex items-center gap-2">
            <Briefcase className="h-4 w-4 shrink-0 text-brand/70" aria-hidden /> {experienceLabel(job.experienceLevel)}
          </li>
        ) : null}
        {job.deadline ? (
          <li className={`flex items-center gap-2 ${closingSoon ? "font-medium text-amber-700" : ""}`}>
            <CalendarClock className={`h-4 w-4 shrink-0 ${closingSoon ? "" : "text-brand/70"}`} aria-hidden /> Tutup{" "}
            {formatDate(job.deadline)}
            {closingSoon ? ` · ${job.daysLeft === 0 ? "hari ini" : `${job.daysLeft} hari lagi`}` : ""}
          </li>
        ) : null}
      </ul>

      <ul aria-label="Keahlian yang dibutuhkan" className="mt-4 flex flex-wrap gap-2">
        {job.skills.slice(0, 3).map((s) => (
          <li
            key={s}
            className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700 transition-colors group-hover:bg-brand-light group-hover:text-brand"
          >
            {s}
          </li>
        ))}
        {job.skills.length > 3 ? (
          <li className="rounded-full px-1 py-1 text-xs font-medium text-slate-500">+{job.skills.length - 3}</li>
        ) : null}
      </ul>

      <FacilityBadges benefits={job.benefits} selected={selectedFacilities} />

      <div className="mt-auto flex items-center justify-between gap-3 pt-5">
        <span className="inline-flex items-center gap-1 text-sm font-semibold text-brand" aria-hidden>
          Lihat detail{" "}
          <ArrowRight className="h-4 w-4 transition-transform duration-200 motion-safe:group-hover:translate-x-1" />
        </span>
        {job.companyWebsiteUrl ? (
          // z-10: di atas tautan yang menutupi kartu, supaya tetap bisa diklik sendiri
          <a
            href={job.companyWebsiteUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Buka situs ${job.company} (tab baru)`}
            title="Situs perusahaan"
            className="relative z-10 grid size-11 place-items-center rounded-full border border-slate-200 text-slate-500 transition hover:border-brand hover:bg-brand-light hover:text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 md:size-9"
          >
            <Globe className="size-4" aria-hidden />
          </a>
        ) : null}
      </div>
    </article>
  );
}
