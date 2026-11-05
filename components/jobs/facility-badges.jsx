import { HeartHandshake } from "lucide-react";

import { HIGHLIGHT_BENEFITS, facilityLabel } from "@/lib/job-catalog";

/**
 * Lencana fasilitas ramah perempuan pada kartu lowongan (dipakai /jobs dan /recommended-jobs).
 * Fasilitas yang sedang dipilih di filter tampil lebih dulu dan lebih menonjol, supaya jelas kenapa
 * lowongan ini muncul dan tidak tersembunyi di balik "+n".
 */
export function FacilityBadges({ benefits = [], selected = [], max = 3, className = "mt-3" }) {
  const list = benefits
    .filter((b) => HIGHLIGHT_BENEFITS.includes(b))
    .sort((a, b) => Number(selected.includes(b)) - Number(selected.includes(a)));
  if (list.length === 0) return null;

  return (
    <ul aria-label="Dukungan untuk pekerja" className={`flex flex-wrap gap-2 ${className}`}>
      {list.slice(0, max).map((b) => (
        <li
          key={b}
          className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${
            selected.includes(b) ? "bg-ai text-white" : "bg-pink-50 text-ai"
          }`}
        >
          <HeartHandshake className="h-3.5 w-3.5" aria-hidden /> {facilityLabel(b)}
        </li>
      ))}
      {list.length > max ? (
        <li className="inline-flex items-center rounded-full px-1 py-1 text-xs font-medium text-slate-500">+{list.length - max}</li>
      ) : null}
    </ul>
  );
}
