"use client";

import { useState } from "react";
import { Eye, FolderOpen } from "lucide-react";

import { formatFileSize } from "./cv-upload";
import { SelectableFile } from "./file-row";

export const MAX_PORTFOLIO = 3;
export const MAX_PORTFOLIO_MB = 2;

/** Pesan error untuk file portofolio (hanya PDF, maks. 2 MB), atau null bila boleh dipakai. */
export function portfolioFileProblem(file) {
  if (!file.name.toLowerCase().endsWith(".pdf")) return `${file.name}: portofolio harus berformat PDF.`;
  if (file.size === 0) return `${file.name}: file kosong.`;
  if (file.size > MAX_PORTFOLIO_MB * 1024 * 1024) {
    return `${file.name}: ukuran maksimal ${MAX_PORTFOLIO_MB} MB (file Anda ${formatFileSize(file.size)}).`;
  }
  return null;
}

function openItem(item) {
  if (item.file) {
    const url = URL.createObjectURL(item.file);
    window.open(url, "_blank", "noopener,noreferrer");
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  } else if (item.url) {
    window.open(item.url, "_blank", "noopener,noreferrer");
  }
}

function itemMeta(item) {
  if (item.source === "profile") {
    return ["Dari profil", item.sizeLabel, item.uploadedAt && `diunggah ${item.uploadedAt}`].filter(Boolean).join(" • ");
  }
  return `Belum ada di profil • ${formatFileSize(item.file.size)}`;
}

const linkBtn = "inline-flex items-center gap-1.5 text-sm font-semibold hover:underline";

/**
 * Pilih portofolio dari profil atau unggah baru (maks. 3 lampiran).
 * items: [{ id, source: "profile" | "upload", name, sizeLabel?, uploadedAt?, url?, file? }]
 * onAdd(files: File[]) dipanggil hanya dengan file yang lolos validasi.
 */
export function PortfolioPicker({
  items,
  selectedIds,
  onToggle,
  onAdd,
  onRemove,
  saveToProfile,
  onSaveToProfileChange,
  inputRef,
}) {
  const [error, setError] = useState("");
  const full = selectedIds.length >= MAX_PORTFOLIO;
  const hasUpload = items.some((i) => i.source === "upload");

  function onPick(e) {
    const picked = [...(e.target.files ?? [])];
    e.target.value = "";
    if (!picked.length) return;
    const problems = picked.map(portfolioFileProblem).filter(Boolean);
    const valid = picked.filter((f) => !portfolioFileProblem(f));
    setError(problems.join(" "));
    if (valid.length) onAdd(valid);
  }

  return (
    <section aria-labelledby="portfolio-title" className="rounded-2xl border border-slate-200 bg-white p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="portfolio-title" className="flex items-center gap-2 text-lg font-bold text-brand">
          <FolderOpen className="h-5 w-5" aria-hidden /> Portofolio
        </h2>
        <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800">
          Wajib untuk lowongan ini
        </span>
      </div>
      <p className="mt-4 text-sm text-slate-600">
        Pilih dari profilmu atau unggah yang baru. Maksimal {MAX_PORTFOLIO} lampiran.
      </p>
      <p aria-live="polite" className="mt-1 text-sm text-slate-600">
        {selectedIds.length} dari {MAX_PORTFOLIO} dipilih
      </p>

      <div className="mt-3 space-y-3">
        {items.map((item) => (
          <SelectableFile
            key={item.id}
            checked={selectedIds.includes(item.id)}
            disabled={full}
            onChange={() => onToggle(item.id)}
            title={item.name}
            isNew={item.source === "upload"}
            meta={itemMeta(item)}
            actions={
              item.source === "upload" ? (
                <button
                  type="button"
                  onClick={() => onRemove(item.id)}
                  aria-label={`Hapus ${item.name}`}
                  className={`${linkBtn} text-red-700`}
                >
                  Hapus
                </button>
              ) : item.url ? (
                <button type="button" onClick={() => openItem(item)} className={`${linkBtn} text-brand`}>
                  <Eye className="size-4" aria-hidden /> Lihat
                </button>
              ) : null
            }
          />
        ))}
      </div>

      {hasUpload && (
        <label className="mt-4 flex cursor-pointer items-center gap-3 text-sm text-slate-700">
          <input
            type="checkbox"
            role="switch"
            checked={saveToProfile}
            onChange={(e) => onSaveToProfileChange(e.target.checked)}
            className="peer sr-only"
          />
          <span
            aria-hidden
            className="relative h-6 w-11 shrink-0 rounded-full bg-slate-300 transition peer-checked:bg-brand peer-focus-visible:ring-2 peer-focus-visible:ring-brand/40 after:absolute after:left-0.5 after:top-0.5 after:size-5 after:rounded-full after:bg-white after:transition peer-checked:after:translate-x-5"
          />
          Simpan juga ke profil supaya bisa dipakai di lamaran lain
        </label>
      )}

      <input ref={inputRef} type="file" accept=".pdf,application/pdf" multiple className="sr-only" onChange={onPick} />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="mt-4 flex w-full flex-col items-center gap-0.5 rounded-2xl border border-dashed border-slate-300 px-4 py-4 text-center transition hover:border-brand hover:bg-brand-light/40"
      >
        <span className="text-sm font-semibold text-brand">+ Unggah portofolio baru</span>
        <span className="text-xs text-slate-600">Hanya PDF • maks. {MAX_PORTFOLIO_MB} MB per file</span>
      </button>
      {error && (
        <p role="alert" className="mt-2 text-xs font-medium text-red-700">
          {error}
        </p>
      )}
      {full && (
        <p className="mt-2 text-xs text-slate-600">
          Batas {MAX_PORTFOLIO} lampiran tercapai. Batalkan satu pilihan untuk memilih file lain.
        </p>
      )}
    </section>
  );
}
