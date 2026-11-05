"use client";

import { useState } from "react";
import { Check, HeartHandshake } from "lucide-react";

import { FACILITIES } from "@/lib/job-catalog";

/**
 * Filter fasilitas ramah perempuan: chip yang bisa dipilih lebih dari satu (AND: lowongan harus
 * menyediakan semuanya). Selalu terlihat (bukan di balik tombol Filter) karena ini kebutuhan utama
 * pencari kerja perempuan. Angka di chip = jumlah lowongan bila chip itu ditambahkan ke pilihan sekarang;
 * chip yang pasti menghasilkan nol dinonaktifkan supaya tidak berujung halaman kosong.
 * fadeClass = warna latar tempat filter ditaruh untuk bayangan tepi kanan (mis. "from-white", "from-surface").
 * Dipakai di /jobs dan /recommended-jobs. Di layar kecil chip bergulir ke samping agar tidak memakan banyak tinggi.
 */
export function FacilityFilter({ selected, counts, onToggle, onClear, fadeClass = "from-white" }) {
  // Bayangan di tepi kanan (hanya layar kecil) menandakan barisnya bisa digeser; hilang saat sudah di ujung.
  const [atEnd, setAtEnd] = useState(false);
  return (
    <div role="group" aria-labelledby="facility-title" className="mt-4">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <p id="facility-title" className="flex items-center gap-1.5 text-sm font-bold text-ink">
          <HeartHandshake className="h-4 w-4 text-brand" aria-hidden />
          Fasilitas ramah perempuan
        </p>
        <p className="text-[13px] text-slate-700">
          {selected.length > 0 ? (
            <>
              Menampilkan lowongan yang memiliki semua fasilitas terpilih
              {" · "}
              <button type="button" onClick={onClear} className="font-semibold text-brand hover:underline">
                Hapus pilihan
              </button>
            </>
          ) : (
            "Pilih satu atau lebih"
          )}
        </p>
      </div>
      <div className="relative">
      {/* relative: teks sr-only di dalam chip bersifat absolute; tanpa ini ia lolos dari area gulir dan melebarkan seluruh halaman */}
      <ul
        onScroll={(e) => setAtEnd(e.currentTarget.scrollLeft + e.currentTarget.clientWidth >= e.currentTarget.scrollWidth - 4)}
        className="relative -mx-1 mt-2 flex gap-2 overflow-x-auto px-1 pb-1 sm:flex-wrap sm:overflow-visible"
      >
        {FACILITIES.map((f) => {
          const on = selected.includes(f.value);
          const count = counts[f.value] ?? 0;
          const disabled = !on && count === 0;
          return (
            <li key={f.value} className="shrink-0">
              <button
                type="button"
                aria-pressed={on}
                disabled={disabled}
                onClick={() => onToggle(f.value)}
                className={`inline-flex min-h-10 items-center gap-1.5 rounded-full border px-3.5 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 ${
                  on
                    ? "border-brand bg-brand text-white"
                    : "border-slate-200 bg-white text-ink hover:border-brand hover:text-brand disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:border-slate-200 disabled:hover:text-ink"
                }`}
              >
                {on ? <Check className="h-4 w-4" aria-hidden /> : null}
                {f.label}
                <span
                  className={`grid h-5 min-w-5 place-items-center rounded-full px-1.5 text-xs font-semibold tabular-nums ${
                    on ? "bg-white/25 text-white" : "bg-slate-100 text-slate-700"
                  }`}
                >
                  <span className="sr-only"> (</span>
                  {count}
                  <span className="sr-only"> lowongan)</span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      <div
        aria-hidden
        className={`pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l ${fadeClass} to-transparent transition-opacity sm:hidden ${atEnd ? "opacity-0" : "opacity-100"}`}
      />
      </div>
    </div>
  );
}
