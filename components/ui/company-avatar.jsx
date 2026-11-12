"use client";

import { useState } from "react";

import { cn } from "@/lib/utils";

// Avatar perusahaan: logo bila ada (logoUrl), kalau tidak ada atau gagal dimuat tampil inisial.
// Warna inisial mengikuti sektor. Ukuran kotak logo sama dengan kotak inisial (className).
const TONES = {
  "Energi Terbarukan": "bg-amber-100 text-amber-800",
  "Bangunan Hijau": "bg-sky-100 text-sky-800",
  Konservasi: "bg-emerald-100 text-emerald-800",
  Agroforestri: "bg-lime-100 text-lime-800",
  "Pertanian Berkelanjutan": "bg-lime-100 text-lime-800",
  "Ekonomi Hijau": "bg-teal-100 text-teal-800",
  "Emisi Karbon": "bg-slate-200 text-slate-800",
  "Pengelolaan Limbah": "bg-orange-100 text-orange-800",
};

// Warna sektor yang sama dengan avatar, dipakai juga untuk chip sektor di kartu.
export function sectorTone(sector) {
  return TONES[sector] ?? "bg-brand-light text-brand";
}

function initials(name = "") {
  return name
    .replace(/^(PT|CV|Yayasan)\s+/i, "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
}

const isHttpUrl = (url) => /^https?:\/\//i.test(String(url ?? ""));

export function CompanyAvatar({
  company,
  sector,
  logoUrl,
  className = "h-12 w-12 text-base",
}) {
  const [failed, setFailed] = useState(false);

  if (isHttpUrl(logoUrl) && !failed) {
    return (
      <span
        aria-hidden="true"
        className={cn("grid shrink-0 place-items-center overflow-hidden rounded-xl border border-slate-200 bg-white", className)}
      >
        {/* Logo dari alamat luar (database): tag biasa supaya tidak perlu daftar domain di next.config */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={logoUrl}
          alt=""
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          onError={() => setFailed(true)}
          className="size-full object-contain"
        />
      </span>
    );
  }

  const tone = sectorTone(sector);
  return (
    <span
      aria-hidden="true"
      className={`grid shrink-0 place-items-center rounded-xl font-bold ${tone} ${className}`}
    >
      {initials(company)}
    </span>
  );
}
