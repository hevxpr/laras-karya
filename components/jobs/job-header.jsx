"use client";

import { useState } from "react";
import { Bookmark, MapPin } from "lucide-react";

import { cn } from "@/lib/utils";

import { setJobSaved } from "@/app/bookmarks/actions";
import { useToast } from "@/context/toast-context";
import { isUuid } from "@/lib/is-uuid";

import { useHasApplied } from "@/lib/demo-history";
import { AppliedBadge } from "@/components/ui/applied-badge";
import { CompanyAvatar } from "@/components/ui/company-avatar";
import { FacilityBadges } from "@/components/jobs/facility-badges";

/** Cincin persentase kecil (sisi kanan header). */
function MatchRing({ value, size = 44, strokeWidth = 3 }) {
  // Skor belum dihitung (user belum menyelesaikan asesmen / rekomendasi belum dibuat)
  if (value == null) {
    return (
      <div
        className="grid shrink-0 place-items-center rounded-full border-2 border-dashed border-mint-line text-[11px] font-bold text-ink/50"
        style={{ width: size, height: size }}
        role="img"
        aria-label="Kecocokan belum dihitung"
      >
        –
      </div>
    );
  }
  const r = (size - strokeWidth) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div
      className="relative shrink-0"
      style={{ width: size, height: size }}
      role="img"
      aria-label={`Kecocokan ${value} persen`}
    >
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={strokeWidth}
          className="stroke-mint-line"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - value / 100)}
          className="stroke-brand"
        />
      </svg>
      <span className="absolute inset-0 grid place-items-center text-[11px] font-bold text-ink">
        {value}%
      </span>
    </div>
  );
}

/**
 * Kartu header lowongan. Tombol simpan (bookmark) bisa di-toggle.
 * @param {{ job: import("@/lib/job-detail-data").JobDetail }} props
 */
export function JobHeader({ job }) {
  const [saved, setSaved] = useState(Boolean(job.saved));
  const [busy, setBusy] = useState(false);
  const { showToast } = useToast();
  const applied = useHasApplied(job.id);

  // Lowongan dari database disimpan ke saved_jobs; data contoh (id angka) hanya berubah di layar.
  async function toggleSaved() {
    if (busy) return;
    const next = !saved;
    setSaved(next);
    if (!isUuid(job.id)) return;
    setBusy(true);
    const res = await setJobSaved(job.id, next);
    setBusy(false);
    if (!res.ok) {
      setSaved(!next);
      showToast({ message: "Belum bisa menyimpan lowongan. Coba lagi.", icon: "alert", role: "alert", tone: "dark" });
    } else if (next) {
      showToast({ message: "Lowongan disimpan.", action: { label: "Lihat tersimpan", href: "/bookmarks" } });
    }
  }

  return (
    <header className="rounded-xl bg-white p-5 shadow-sm">
      <div className="flex items-start gap-4">
        <CompanyAvatar
          company={job.company}
          sector={job.sector}
          className="size-12 text-base md:size-14 md:text-lg"
        />

        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-bold leading-tight text-ink md:text-[22px]">
            {job.title}
          </h1>
          <p className="mt-0.5 text-sm font-bold text-brand">{job.company}</p>

          <p className="mt-1 flex items-start gap-1.5 text-xs text-ink/75">
            <MapPin className="mt-0.5 size-3.5 shrink-0 text-brand" aria-hidden="true" />
            <span>
              {job.address ?? job.city} {job.workMode ? `(${job.workMode})` : ""}
            </span>
          </p>
          <p className="mt-1.5 text-sm font-bold text-ink">{job.salary}</p>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <button
            type="button"
            onClick={toggleSaved}
            disabled={busy}
            aria-pressed={saved}
            aria-label={
              saved ? "Hapus dari lowongan tersimpan" : "Simpan lowongan"
            }
            className={cn(
              "grid size-11 place-items-center rounded-lg border transition-colors md:size-9",
              saved
                ? "border-brand bg-brand-light text-brand"
                : "border-line text-ink/70 hover:bg-surface",
            )}
          >
            <Bookmark
              className={cn("size-4", saved && "fill-current")}
              aria-hidden="true"
            />
          </button>
          <MatchRing value={job.matchPercent} />
        </div>
      </div>

      {/* Fasilitas ramah perempuan terlihat tanpa menggulir; lebar penuh agar tidak sempit di mobile */}
      <FacilityBadges benefits={job.facilities} max={job.facilities.length} className="mt-4" />

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-surface px-2.5 py-0.5 text-xs font-medium text-ink/75 ring-1 ring-inset ring-line">
          {job.employmentType}
        </span>
        <span className="rounded-full bg-mint px-2.5 py-0.5 text-xs font-semibold text-brand">
          {job.sector}
        </span>
      </div>

      <p className="mt-2.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-ink/70">
        <span className="text-xs font-bold text-ink">Status Lowongan:</span>
        {job.isOpen ? (
          <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
            Masih Dibuka
          </span>
        ) : (
          <span className="rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-semibold text-red-700">
            Ditutup
          </span>
        )}
        {applied && <AppliedBadge />}
        <span>Diperbarui {job.updatedAt}</span>
      </p>
    </header>
  );
}
