import Link from "next/link";
import { ArrowRight, Briefcase, CalendarClock, HeartHandshake, MapPin, Wallet } from "lucide-react";

import { CompanyAvatar } from "@/components/ui/company-avatar";
import { HIGHLIGHT_BENEFITS, employmentLabel, experienceLabel, facilityLabel, formatDate } from "@/lib/job-catalog";
import { loginTo } from "@/lib/routes";

/** Kartu lowongan umum: tanpa skor kecocokan (itu khusus halaman rekomendasi). */
export function CatalogJobCard({ job, selectedFacilities = [] }) {
  const place = job.mode === "Remote" ? "Remote" : `${job.city} • ${job.mode}`;
  // Fasilitas yang sedang dipilih di filter tampil lebih dulu dan lebih menonjol, supaya jelas kenapa
  // lowongan ini muncul dan tidak tersembunyi di balik "+n".
  const benefits = (job.benefits ?? [])
    .filter((b) => HIGHLIGHT_BENEFITS.includes(b))
    .sort((a, b) => Number(selectedFacilities.includes(b)) - Number(selectedFacilities.includes(a)));
  const detailHref = loginTo(`/recommended-jobs/${job.id}`);

  return (
    <article className="relative flex flex-col rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-brand/40 hover:shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <span className="rounded-full bg-brand-light px-3 py-1 text-xs font-medium text-brand">{job.sector}</span>
        {job.employmentType ? (
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
            {employmentLabel(job.employmentType)}
          </span>
        ) : null}
      </div>

      <div className="mt-4 flex items-center gap-3">
        <CompanyAvatar company={job.company} sector={job.sector} className="h-12 w-12 text-base" />
        <div className="min-w-0">
          <h3 className="text-lg font-bold leading-snug text-ink">
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
          <MapPin className="h-4 w-4 shrink-0" aria-hidden /> {place}
        </li>
        <li className="flex items-center gap-2">
          <Wallet className="h-4 w-4 shrink-0" aria-hidden /> {job.salary}
        </li>
        {job.experienceLevel ? (
          <li className="flex items-center gap-2">
            <Briefcase className="h-4 w-4 shrink-0" aria-hidden /> {experienceLabel(job.experienceLevel)}
          </li>
        ) : null}
        {job.deadline ? (
          <li className="flex items-center gap-2">
            <CalendarClock className="h-4 w-4 shrink-0" aria-hidden /> Tutup {formatDate(job.deadline)}
          </li>
        ) : null}
      </ul>

      <ul aria-label="Keahlian yang dibutuhkan" className="mt-4 flex flex-wrap gap-2">
        {job.skills.slice(0, 3).map((s) => (
          <li key={s} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
            {s}
          </li>
        ))}
        {job.skills.length > 3 ? (
          <li className="rounded-full px-1 py-1 text-xs font-medium text-slate-500">+{job.skills.length - 3}</li>
        ) : null}
      </ul>

      {benefits.length > 0 ? (
        <ul aria-label="Dukungan untuk pekerja" className="mt-3 flex flex-wrap gap-2">
          {benefits.slice(0, 3).map((b) => (
            <li
              key={b}
              className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${
                selectedFacilities.includes(b) ? "bg-ai text-white" : "bg-pink-50 text-ai"
              }`}
            >
              <HeartHandshake className="h-3.5 w-3.5" aria-hidden /> {facilityLabel(b)}
            </li>
          ))}
          {benefits.length > 3 ? (
            <li className="inline-flex items-center rounded-full px-1 py-1 text-xs font-medium text-slate-500">+{benefits.length - 3}</li>
          ) : null}
        </ul>
      ) : null}

      <span className="mt-auto inline-flex items-center gap-1 pt-5 text-sm font-semibold text-brand" aria-hidden>
        Lihat detail <ArrowRight className="h-4 w-4" />
      </span>
    </article>
  );
}
