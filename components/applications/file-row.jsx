import { Check } from "lucide-react";

import { cn } from "@/lib/utils";

/** Ikon "PDF" kecil di sisi kiri baris file. */
export function PdfBadge({ className }) {
  return (
    <span
      aria-hidden
      className={cn(
        "grid size-11 shrink-0 place-items-center rounded-xl bg-red-50 text-[11px] font-bold text-red-600",
        className,
      )}
    >
      PDF
    </span>
  );
}

export function NewChip() {
  return (
    <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] font-semibold text-indigo-700">
      Baru
    </span>
  );
}

/**
 * Baris file yang bisa dipilih (checkbox sungguhan, bisa dioperasikan keyboard).
 * actions: elemen di sisi kanan (Lihat / Hapus).
 */
export function SelectableFile({ checked, onChange, disabled = false, title, isNew = false, meta, actions }) {
  const blocked = disabled && !checked;
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-2xl border px-4 py-3 transition",
        checked ? "border-brand bg-brand-light/40" : "border-slate-200 bg-white",
        blocked && "opacity-60",
      )}
    >
      <label className={cn("flex min-w-0 flex-1 items-center gap-3", blocked ? "cursor-not-allowed" : "cursor-pointer")}>
        <input
          type="checkbox"
          checked={checked}
          disabled={blocked}
          onChange={(e) => onChange(e.target.checked)}
          className="peer sr-only"
        />
        <span
          aria-hidden
          className={cn(
            "grid size-5 shrink-0 place-items-center rounded-md border-2 text-white peer-focus-visible:ring-2 peer-focus-visible:ring-brand/40",
            checked ? "border-brand bg-brand" : "border-slate-300 bg-white",
          )}
        >
          {checked && <Check className="size-3.5" strokeWidth={3} />}
        </span>
        <PdfBadge />
        <span className="min-w-0">
          <span className="flex flex-wrap items-center gap-2 font-semibold text-ink">
            <span className="truncate">{title}</span>
            {isNew && <NewChip />}
          </span>
          <span className="block text-xs text-slate-600">{meta}</span>
        </span>
      </label>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}
