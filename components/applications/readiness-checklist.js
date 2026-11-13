import { ClipboardCheck, ShieldCheck, TriangleAlert } from "lucide-react";

/**
 * items: [{ key, label, done, sub?, action? }]  (sub = keterangan kecil di bawah label, action = tombol/elemen tambahan)
 */
export default function ReadinessChecklist({ items }) {
  const total = items.length;
  const count = items.filter((i) => i.done).length;
  const pct = Math.round((count / total) * 100);
  const remaining = total - count;
  const r = 28;
  const c = 2 * Math.PI * r;

  return (
    <section aria-labelledby="checklist-title" className="rounded-2xl border border-slate-200 bg-white p-6">
      <h2 id="checklist-title" className="flex items-center gap-2 text-lg font-bold text-brand">
        <ClipboardCheck className="h-5 w-5" aria-hidden /> Checklist Kesiapan
      </h2>

      <div className="mt-5 flex items-center gap-4 border-b border-slate-200 pb-5">
        <div className="relative h-16 w-16 shrink-0" aria-hidden>
          <svg viewBox="0 0 64 64" className="h-16 w-16 -rotate-90">
            <circle cx="32" cy="32" r={r} fill="none" strokeWidth="5" className="stroke-slate-200" />
            <circle
              cx="32" cy="32" r={r} fill="none" strokeWidth="5" strokeLinecap="round"
              className="stroke-brand transition-all" strokeDasharray={c} strokeDashoffset={c * (1 - count / total)}
            />
          </svg>
          <span className="absolute inset-0 flex flex-col items-center justify-center text-[11px] font-bold leading-tight text-brand">
            {count}/{total}
            <span className="font-medium">Siap</span>
          </span>
        </div>
        <div aria-live="polite">
          <p className="font-bold text-ink">{pct}% Persyaratan Terpenuhi</p>
          <p className="text-sm text-slate-600">
            {remaining > 0
              ? `Tinggal ${remaining} langkah lagi untuk melengkapi seluruh berkas lamaran.`
              : "Semua berkas siap. Anda bisa lanjut melamar."}
          </p>
        </div>
      </div>

      <ul className="mt-5 space-y-3">
        {items.map((i) => (
          <li key={i.key}>
            <div className={`flex items-center gap-2.5 text-sm ${i.done ? "text-brand" : "text-amber-700"}`}>
              {i.done ? <ShieldCheck className="h-4 w-4 shrink-0" aria-hidden /> : <TriangleAlert className="h-4 w-4 shrink-0" aria-hidden />}
              <span>{i.label}</span>
            </div>
            {i.sub && <p className="mt-0.5 pl-[26px] text-xs text-slate-600">{i.sub}</p>}
            {i.action && <div className="mt-2 pl-[26px]">{i.action}</div>}
          </li>
        ))}
      </ul>
    </section>
  );
}
