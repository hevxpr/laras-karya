"use client";

import { useState } from "react";
import { Upload } from "lucide-react";

import { cn } from "@/lib/utils";
import { NewChip, PdfBadge } from "./file-row";

const ACCEPT = ".pdf,.doc,.docx";
const ALLOWED_EXT = ["pdf", "doc", "docx"];

/** "1,2 MB" / "350 KB" */
export function formatFileSize(bytes) {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toLocaleString("id-ID", { maximumFractionDigits: 1 })} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

/** Pesan error untuk file CV, atau null bila boleh dipakai. */
export function cvFileProblem(file, maxMb) {
  const ext = file.name.split(".").pop()?.toLowerCase();
  if (!ALLOWED_EXT.includes(ext)) return "Format CV harus PDF, DOC, atau DOCX.";
  if (file.size === 0) return "File CV kosong. Pilih file lain.";
  if (file.size > maxMb * 1024 * 1024) return `Ukuran CV maksimal ${maxMb} MB. File Anda ${formatFileSize(file.size)}.`;
  return null;
}

/** Dua pilihan sumber CV: pakai data profil atau unggah CV sendiri. */
export function CvSourceTabs({ value, onChange, maxMb = 5 }) {
  const options = [
    { id: "profile", title: "Pakai data dari profil", desc: "CV dibuat otomatis dari profil Laras Karya-mu" },
    { id: "upload", title: "Unggah CV sendiri", desc: `PDF, DOC, atau DOCX • maks. ${maxMb} MB` },
  ];
  return (
    <div role="radiogroup" aria-label="Sumber CV" className="mt-4 grid gap-3 sm:grid-cols-2">
      {options.map((o) => {
        const active = value === o.id;
        return (
          <label
            key={o.id}
            className={cn(
              "flex cursor-pointer items-start gap-3 rounded-2xl border px-4 py-3.5 transition",
              active ? "border-brand bg-brand-light" : "border-slate-200 bg-white hover:border-brand/50",
            )}
          >
            <input
              type="radio"
              name="cv-source"
              value={o.id}
              checked={active}
              onChange={() => onChange(o.id)}
              className="peer sr-only"
            />
            <span
              aria-hidden
              className={cn(
                "mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border-2 peer-focus-visible:ring-2 peer-focus-visible:ring-brand/40",
                active ? "border-brand" : "border-slate-300",
              )}
            >
              {active && <span className="size-2.5 rounded-full bg-brand" />}
            </span>
            <span>
              <span className="block font-semibold text-ink">{o.title}</span>
              <span className="block text-xs text-slate-600">{o.desc}</span>
            </span>
          </label>
        );
      })}
    </div>
  );
}

/**
 * Unggah CV: pilih file lewat tombol atau seret ke kotak, lalu tampilkan nama & ukurannya.
 * File disimpan di state halaman dan baru diunggah ke Storage saat lamaran dikirim (lib/application-storage.js).
 *
 * Props:
 * - file: File | null, onChange(file | null)
 * - inputRef: ref <input type="file"> (dipakai juga oleh tombol di Checklist Kesiapan)
 */
export function CvUpload({ file, onChange, inputRef, maxMb = 5 }) {
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);

  function accept(picked) {
    if (!picked) return;
    const problem = cvFileProblem(picked, maxMb);
    setError(problem ?? "");
    if (!problem) onChange(picked);
  }

  return (
    <div className="mt-4">
      <input
        ref={inputRef}
        id="cv-file"
        type="file"
        accept={ACCEPT}
        className="sr-only"
        onChange={(e) => {
          accept(e.target.files?.[0]);
          e.target.value = ""; // agar file yang sama bisa dipilih ulang
        }}
      />

      {file ? (
        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-brand bg-brand-light/40 px-4 py-3">
          <PdfBadge />
          <div className="min-w-0 flex-1">
            <p className="flex flex-wrap items-center gap-2 font-semibold text-ink">
              <span className="truncate">{file.name}</span>
              <NewChip />
            </p>
            <p className="text-xs text-slate-600">{formatFileSize(file.size)} • diunggah barusan</p>
          </div>
          <div className="flex items-center gap-4 text-sm font-semibold">
            <button type="button" onClick={() => inputRef.current?.click()} className="text-brand hover:underline">
              Ganti
            </button>
            <button
              type="button"
              onClick={() => {
                onChange(null);
                setError("");
              }}
              aria-label={`Hapus CV ${file.name}`}
              className="text-red-700 hover:underline"
            >
              Hapus
            </button>
          </div>
        </div>
      ) : (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            accept(e.dataTransfer.files?.[0]);
          }}
          className={cn(
            "flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed px-4 py-6 text-center transition-colors",
            dragging ? "border-brand bg-brand-light" : "border-slate-300 bg-surface",
          )}
        >
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="inline-flex min-h-11 items-center gap-2 rounded-full bg-brand px-5 text-sm font-semibold text-white transition hover:bg-brand/90"
          >
            <Upload className="size-4" aria-hidden /> Unggah CV
          </button>
          <p className="text-xs text-slate-600">
            atau seret file ke sini. PDF, DOC, atau DOCX, maksimal {maxMb} MB.
          </p>
        </div>
      )}

      <p aria-live="polite" className="sr-only">
        {file ? `CV ${file.name} siap dilampirkan` : ""}
      </p>
      {error && (
        <p role="alert" className="mt-2 text-xs font-medium text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}
