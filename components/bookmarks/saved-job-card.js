"use client";

import Link from "next/link";
import {
  ArrowRight,
  BookmarkCheck,
  Briefcase,
  MapPin,
  Sparkles,
  Wallet,
} from "lucide-react";

import { hasApplied } from "@/lib/applications-data";
import { AppliedBadge } from "@/components/ui/applied-badge";
import { CompanyAvatar } from "@/components/ui/company-avatar";

export default function SavedJobCard({ job, onRemove }) {
  const open = job.status === "dibuka";
  const place =
    job.mode === "Remote" ? "Remote" : [job.mode, job.city].filter(Boolean).join(" — ") || "Lokasi belum dicantumkan";
  // Lowongan yang sudah ditutup dibuat lebih pudar, tapi tombol simpan dan status tetap jelas.
  const fade = open ? "" : "opacity-70";
  // Badge "Sudah Dilamar" tampil untuk lowongan dibuka maupun ditutup.
  // Data dari database membawa `applied`; data contoh dicek lewat daftar lamaran contoh.
  const alreadyApplied = job.applied ?? hasApplied(job.id);

  return (
    <article className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6">
      <div className="flex items-start justify-between gap-3">
        <div className={`flex flex-wrap items-center gap-2 ${fade}`}>
          <span className="rounded-full bg-brand-light px-3 py-1 text-xs font-medium text-brand">
            {job.sector}
          </span>
          {job.match != null && (
            <span className="inline-flex items-center gap-1 rounded-full bg-ai/10 px-3 py-1 text-xs font-semibold text-ai">
              <Sparkles className="h-3 w-3" aria-hidden /> {job.match}% Cocok
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={() => onRemove(job.id)}
          aria-label={`Batalkan simpan: ${job.title}`}
          className="-m-1 rounded-full p-1 text-brand transition hover:bg-brand-light"
        >
          <BookmarkCheck className="h-5 w-5" aria-hidden />
        </button>
      </div>

      <div className={`mb-6 ${fade}`}>
        <div className="mt-4 flex items-center gap-3">
          <CompanyAvatar company={job.company} sector={job.sector} logoUrl={job.companyLogoUrl} />
          <div className="min-w-0">
            <h3 className="text-xl font-bold text-ink">{job.title}</h3>
            <p className="text-slate-600">{job.company}</p>
          </div>
        </div>
        <ul className="mt-4 space-y-1.5 text-sm text-slate-600">
          <li className="flex items-center gap-2">
            <Briefcase className="h-4 w-4 shrink-0" aria-hidden /> {job.sector}
          </li>
          <li className="flex items-center gap-2">
            <MapPin className="h-4 w-4 shrink-0" aria-hidden /> {place}
          </li>
          <li className="flex items-center gap-2">
            <Wallet className="h-4 w-4 shrink-0" aria-hidden /> {job.salary}
          </li>
        </ul>
      </div>

      <div className="mt-auto flex items-center justify-between gap-3 border-t border-slate-200 pt-5">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <span
            className={`rounded-full px-3 py-1 text-xs font-medium ${open ? "bg-brand-light text-brand" : "bg-red-50 text-red-700"}`}
          >
            {open ? "Masih Dibuka" : "Ditutup"}
          </span>
          {alreadyApplied && <AppliedBadge />}
        </div>
        <Link
          href={`/recommended-jobs/${job.id}`}
          className={`inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border border-brand px-4 py-2 text-sm font-semibold text-brand transition hover:bg-brand-light ${fade}`}
        >
          Lihat Detail <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </div>
    </article>
  );
}