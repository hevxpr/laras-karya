import Link from "next/link";
import { Award } from "lucide-react";

import { SelectableFile } from "./file-row";

/** Sertifikat pendukung (opsional), diambil dari bagian Sertifikasi di profil. */
export function CertificatePicker({ items, selectedIds, onToggle }) {
  return (
    <section aria-labelledby="cert-title" className="rounded-2xl border border-slate-200 bg-white p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="cert-title" className="flex items-center gap-2 text-lg font-bold text-brand">
          <Award className="h-5 w-5" aria-hidden /> Sertifikat Pendukung
        </h2>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">Opsional</span>
      </div>

      {items.length ? (
        <div className="mt-4 space-y-3">
          {items.map((c) => (
            <SelectableFile
              key={c.id}
              checked={selectedIds.includes(c.id)}
              onChange={() => onToggle(c.id)}
              title={c.name}
              meta={[c.issuer, c.year, c.sizeLabel].filter(Boolean).join(" • ")}
            />
          ))}
        </div>
      ) : (
        <p className="mt-4 rounded-xl bg-surface px-4 py-3 text-sm text-slate-600">
          Belum ada sertifikat di profilmu.{" "}
          <Link href="/profile" className="font-semibold text-brand hover:underline">
            Tambah di Profil
          </Link>
        </p>
      )}
    </section>
  );
}
