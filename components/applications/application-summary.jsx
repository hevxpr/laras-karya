import { Eye, ListChecks } from "lucide-react";

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-slate-100 py-2.5 text-sm last:border-0">
      <dt className="text-slate-600">{label}</dt>
      <dd className="min-w-0 truncate text-right font-semibold text-ink">{value}</dd>
    </div>
  );
}

/** Ringkasan isi lamaran di kolom kanan. */
export default function ApplicationSummary({ cv, portfolioCount, certificateCount, letterLabel, onPreview }) {
  return (
    <section aria-labelledby="summary-title" className="rounded-2xl border border-slate-200 bg-white p-6">
      <h2 id="summary-title" className="flex items-center gap-2 text-lg font-bold text-brand">
        <ListChecks className="h-5 w-5" aria-hidden /> Ringkasan Lamaran
      </h2>
      <dl className="mt-3">
        <Row label="CV" value={cv} />
        <Row label="Portofolio" value={`${portfolioCount} file`} />
        <Row label="Sertifikat" value={`${certificateCount} file`} />
        <Row label="Surat lamaran" value={letterLabel} />
      </dl>
      <button
        type="button"
        onClick={onPreview}
        className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-brand hover:underline"
      >
        <Eye className="size-4" aria-hidden /> Pratinjau seluruh lamaran
      </button>
    </section>
  );
}
