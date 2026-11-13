"use client";

import { useEffect, useRef, useState } from "react";
import { Award, FileText, Plus, Sparkles, Trash2, UploadCloud, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { createDocumentUrl, deleteDocument, formatSize, listDocuments, uploadDocument, validatePdf } from "@/lib/documents";

/*
  Kartu "Sertifikasi & Portofolio" di halaman /profile (desain: satu pintu "Tambah Dokumen").

  - User memilih jenis dokumen (Sertifikat / Portofolio), lalu mengunggah file PDF (maks. 2 MB per file).
    Boleh menambah lebih dari satu dokumen; tiap dokumen satu file.
  - File disimpan di Supabase Storage dan barisnya di tabel `documents` (lib/documents.js). Unggah dan hapus
    langsung berlaku, tidak menunggu "Simpan Perubahan".
  - Sertifikat juga ditambahkan ke draf profil (profiles.certifications) lewat onAddCertification, supaya bagian
    lain yang membaca profil tetap melihatnya. Sertifikat lama yang belum punya file tetap tampil ("Belum ada file").
    Penghubung dokumen <-> sertifikat di draf: nama|penerbit|tahun (id sertifikat di draf dibuat ulang tiap dimuat).
*/

const CARD = "rounded-3xl border border-line bg-white p-6 md:p-8";
const CARD_TITLE = "flex items-center gap-3 text-xl font-semibold text-ink";
const CARD_ICON = "grid size-10 place-items-center rounded-xl bg-brand-light text-brand";
const INPUT =
  "h-11 w-full rounded-xl border border-line bg-white px-4 text-sm text-ink outline-none placeholder:text-subtle/80 focus:border-brand focus:ring-3 focus:ring-brand/20";

const TABS = [
  { value: "all", label: "Semua" },
  { value: "certificate", label: "Sertifikat" },
  { value: "portfolio", label: "Portofolio" },
];

const KIND_BADGE = {
  certificate: { label: "Sertifikat", className: "bg-brand-light text-brand" },
  portfolio: { label: "Portofolio", className: "bg-blue-50 text-blue-700" },
};

const baseName = (file) => (file ? file.name.replace(/\.pdf$/i, "") : "");

const certKey = (cert) => [cert.name, cert.issuer, cert.year].map((v) => String(v ?? "").trim().toLowerCase()).join("|");
const docCertKey = (doc) => certKey({ name: doc.title, issuer: doc.issuer, year: doc.year });

function DocumentDialog({ initialFile, onClose, onSubmit }) {
  const ref = useRef(null);
  const [kind, setKind] = useState("certificate");
  const [file, setFile] = useState(() => (initialFile && !validatePdf(initialFile) ? initialFile : null));
  const [error, setError] = useState(() => (initialFile ? validatePdf(initialFile) : ""));
  const [name, setName] = useState("");
  const [issuer, setIssuer] = useState("");
  const [year, setYear] = useState("");
  const [title, setTitle] = useState(() => (initialFile && !validatePdf(initialFile) ? baseName(initialFile) : ""));
  const [askAi, setAskAi] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (el && !el.open) el.showModal();
  }, []);

  function handlePick(e) {
    const picked = e.target.files?.[0];
    e.target.value = ""; // supaya file yang sama bisa dipilih lagi setelah dihapus
    if (!picked) return;
    const problem = validatePdf(picked);
    if (problem) {
      setError(problem);
      return;
    }
    setError("");
    setFile(picked);
    setTitle((current) => current || baseName(picked));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (busy) return;
    const fileProblem = validatePdf(file);
    if (fileProblem) return setError(fileProblem);

    if (kind === "certificate") {
      if (!name.trim() || !issuer.trim()) return setError("Nama sertifikasi dan penerbit wajib diisi.");
      if (year.trim() && !/^\d{4}$/.test(year.trim())) return setError("Tahun harus 4 angka, misalnya 2023.");
    } else if (!title.trim()) {
      return setError("Judul portofolio wajib diisi.");
    }

    setError("");
    setBusy(true);
    const result = await onSubmit({
      kind,
      file,
      title: kind === "certificate" ? name.trim() : title.trim(),
      issuer: kind === "certificate" ? issuer.trim() : "",
      year: kind === "certificate" ? year.trim() : "",
      askAi: kind === "certificate" && askAi,
    });
    // Jika berhasil, kartu induk menutup dialog ini (komponen dilepas), jadi hanya kegagalan yang ditangani.
    if (!result.ok) {
      setError(result.error);
      setBusy(false);
    }
  }

  return (
    <dialog
      ref={ref}
      aria-labelledby="document-dialog-title"
      onClose={onClose}
      onClick={(e) => {
        if (e.target === ref.current && !busy) ref.current.close();
      }}
      className="m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-lg overflow-y-auto rounded-3xl border border-line bg-white p-0 shadow-xl backdrop:bg-black/40"
    >
      <form onSubmit={handleSubmit} className="p-6 md:p-8">
        <h2 id="document-dialog-title" className="text-xl font-semibold text-ink">
          Tambah Dokumen
        </h2>

        <div className="mt-6 space-y-5">
          <fieldset disabled={busy}>
            <legend className="mb-2 text-sm font-semibold text-ink">Jenis dokumen</legend>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {[
                { value: "certificate", label: "Sertifikat", hint: "Pelatihan, kursus, lisensi" },
                { value: "portfolio", label: "Portofolio", hint: "Hasil kerja, laporan, proyek" },
              ].map((option) => (
                <label
                  key={option.value}
                  className="flex cursor-pointer items-start gap-3 rounded-2xl border border-line p-4 has-[:checked]:border-brand has-[:checked]:bg-brand-light has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-brand/30"
                >
                  <input
                    type="radio"
                    name="kind"
                    value={option.value}
                    checked={kind === option.value}
                    onChange={() => {
                      setKind(option.value);
                      setError("");
                    }}
                    className="mt-1 accent-brand"
                  />
                  <span>
                    <span className="block text-sm font-semibold text-ink">{option.label}</span>
                    <span className="block text-xs text-ink/70">{option.hint}</span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          <div>
            <p className="mb-2 text-sm font-semibold text-ink">File (PDF, maks. 2 MB)</p>
            {file ? (
              <div className="flex items-center gap-3 rounded-2xl border border-brand/30 bg-brand-light px-4 py-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-red-50 text-[11px] font-bold text-red-600">
                  PDF
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-ink">{file.name}</p>
                  <p className="text-xs text-ink/70">{formatSize(file.size)} • siap diunggah</p>
                </div>
                <button
                  type="button"
                  aria-label="Hapus file yang dipilih"
                  disabled={busy}
                  onClick={() => setFile(null)}
                  className="grid size-8 place-items-center rounded-full text-red-600 hover:bg-white focus-visible:ring-2 focus-visible:ring-red-300 focus-visible:outline-none disabled:opacity-50"
                >
                  <X className="size-4" aria-hidden="true" />
                </button>
              </div>
            ) : (
              <label className="flex cursor-pointer flex-col items-center gap-2 rounded-2xl border border-dashed border-brand bg-white px-6 py-6 text-center text-sm text-ink/80 transition-colors focus-within:ring-3 focus-within:ring-brand/30 hover:bg-brand-light/50">
                <UploadCloud className="size-6 text-brand" aria-hidden="true" />
                <span>Klik untuk memilih file PDF</span>
                <input type="file" accept="application/pdf" onChange={handlePick} className="sr-only" />
              </label>
            )}
          </div>

          {kind === "certificate" ? (
            <>
              <div>
                <label htmlFor="doc-name" className="mb-1.5 block text-sm font-semibold text-ink">
                  Nama Sertifikasi
                </label>
                <input id="doc-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={200} disabled={busy} className={INPUT} />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_8rem]">
                <div>
                  <label htmlFor="doc-issuer" className="mb-1.5 block text-sm font-semibold text-ink">
                    Penerbit
                  </label>
                  <input id="doc-issuer" value={issuer} onChange={(e) => setIssuer(e.target.value)} maxLength={120} disabled={busy} className={INPUT} />
                </div>
                <div>
                  <label htmlFor="doc-year" className="mb-1.5 block text-sm font-semibold text-ink">
                    Tahun
                  </label>
                  <input
                    id="doc-year"
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    inputMode="numeric"
                    maxLength={4}
                    placeholder="2023"
                    disabled={busy}
                    className={INPUT}
                  />
                </div>
              </div>
              <label className="flex cursor-pointer items-start gap-3 rounded-2xl bg-amber-50 px-4 py-3 has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-brand/30">
                <input
                  type="checkbox"
                  checked={askAi}
                  onChange={(e) => setAskAi(e.target.checked)}
                  disabled={busy}
                  className="mt-1 size-4 accent-brand"
                />
                <span className="text-sm">
                  <span className="inline-flex items-center gap-1.5 font-semibold text-ink">
                    <Sparkles className="size-3.5 text-ai" aria-hidden="true" />
                    Sarankan keahlian dengan AI
                  </span>
                  <span className="mt-0.5 block text-xs text-ink/70">
                    AI membaca nama dan penerbit sertifikat, lalu menyarankan keahlian. Kamu yang memilih mana yang ditambahkan.
                  </span>
                </span>
              </label>
            </>
          ) : (
            <div>
              <label htmlFor="doc-title" className="mb-1.5 block text-sm font-semibold text-ink">
                Judul Portofolio
              </label>
              <input id="doc-title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={150} disabled={busy} className={INPUT} />
            </div>
          )}
        </div>

        {error && (
          <p role="alert" className="mt-4 text-sm font-medium text-red-600">
            {error}
          </p>
        )}

        <div className="mt-8 flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            disabled={busy}
            onClick={() => ref.current?.close()}
            className="h-11 rounded-full border-brand bg-white px-6 text-sm font-semibold text-brand hover:bg-brand-light hover:text-brand"
          >
            Batal
          </Button>
          <Button type="submit" disabled={busy} className="h-11 rounded-full bg-brand px-6 text-sm font-semibold hover:bg-brand/90">
            {busy ? "Mengunggah…" : "Simpan"}
          </Button>
        </div>
      </form>
    </dialog>
  );
}

export function DocumentsSection({ certifications, onAddCertification, onDeleteCertification, onRemoveCertificationFromDraft }) {
  const [tab, setTab] = useState("all");
  const [docs, setDocs] = useState([]); // dokumen dari tabel `documents`
  const [status, setStatus] = useState("loading"); // "loading" | "ready" | "error"
  const [modal, setModal] = useState(null); // null | { key, file }
  const [dragging, setDragging] = useState(false);
  const [notice, setNotice] = useState("");
  const [actionError, setActionError] = useState("");
  const [busyId, setBusyId] = useState(null); // id dokumen yang sedang dibuka / dihapus

  useEffect(() => {
    let alive = true;
    listDocuments().then((res) => {
      if (!alive) return;
      if (res.ok) {
        setDocs(res.docs);
        setStatus("ready");
      } else {
        setStatus("error");
      }
    });
    return () => {
      alive = false;
    };
  }, []);

  function openModal(file = null) {
    setNotice("");
    setActionError("");
    setModal({ key: Date.now(), file });
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragging(false);
    const files = Array.from(e.dataTransfer?.files ?? []);
    if (files.length === 0) return;
    setActionError("");
    setNotice(files.length > 1 ? "Tambahkan satu dokumen per file. File pertama dipakai, sisanya bisa ditambahkan satu per satu." : "");
    setModal({ key: Date.now(), file: files[0] });
  }

  async function handleSubmit(input) {
    const result = await uploadDocument(input);
    if (!result.ok) return result;

    setDocs((current) => [result.doc, ...current]);
    if (input.kind === "certificate") {
      onAddCertification({ name: input.title, issuer: input.issuer, year: input.year }, input.askAi);
    }
    setModal(null);
    return result;
  }

  async function viewDocument(item) {
    setActionError("");
    setBusyId(item.id);
    // Buka tab kosong dulu (masih dalam klik user) supaya tidak diblokir pop-up, lalu arahkan ke tautan bertanda tangan.
    const tabRef = window.open("about:blank", "_blank");
    const result = await createDocumentUrl(item.doc.filePath);
    setBusyId(null);
    if (!result.ok) {
      tabRef?.close();
      setActionError(result.error);
      return;
    }
    if (tabRef) {
      tabRef.opener = null;
      tabRef.location.href = result.url;
    } else {
      window.open(result.url, "_blank", "noopener,noreferrer");
    }
  }

  async function removeItem(item) {
    if (item.source === "legacy") {
      onDeleteCertification(item.cert); // konfirmasi ada di page.js
      return;
    }
    if (!window.confirm(`Hapus "${item.title}"?`)) return;

    setActionError("");
    setBusyId(item.id);
    const result = await deleteDocument(item.doc);
    setBusyId(null);
    if (!result.ok) {
      setActionError(result.error);
      return;
    }
    setDocs((current) => current.filter((d) => d.id !== item.id));
    if (item.type === "certificate") {
      const match = certifications.find((cert) => certKey(cert) === docCertKey(item.doc));
      if (match) onRemoveCertificationFromDraft(match.id);
    }
  }

  // Sertifikat di draf profil yang belum punya file ikut ditampilkan (data lama).
  const docCertKeys = new Set(docs.filter((d) => d.kind === "certificate").map(docCertKey));
  const items = [
    ...docs.map((doc) => ({
      source: "doc",
      type: doc.kind,
      id: doc.id,
      title: doc.title,
      meta: doc.kind === "certificate" ? [doc.issuer, doc.year].filter(Boolean).join(" • ") : "Portofolio",
      fileSize: doc.fileSize,
      doc,
    })),
    ...certifications
      .filter((cert) => !docCertKeys.has(certKey(cert)))
      .map((cert) => ({
        source: "legacy",
        type: "certificate",
        id: cert.id,
        title: cert.name,
        meta: [cert.issuer, cert.year].filter(Boolean).join(" • "),
        fileSize: null,
        cert,
      })),
  ];
  const counts = {
    all: items.length,
    certificate: items.filter((i) => i.type === "certificate").length,
    portfolio: items.filter((i) => i.type === "portfolio").length,
  };
  const visible = tab === "all" ? items : items.filter((item) => item.type === tab);

  return (
    <section aria-labelledby="sertifikasi-title" className={CARD}>
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="sertifikasi-title" className={CARD_TITLE}>
          <span className={CARD_ICON}>
            <Award className="size-5" aria-hidden="true" />
          </span>
          Sertifikasi &amp; Portofolio
        </h2>
        <Button
          type="button"
          onClick={() => openModal()}
          className="h-10 gap-1.5 rounded-full bg-brand px-4 text-sm font-semibold hover:bg-brand/90"
        >
          <Plus className="size-4" aria-hidden="true" />
          Tambah Dokumen
        </Button>
      </header>

      <div className="mt-6 flex flex-wrap gap-2" role="group" aria-label="Filter jenis dokumen">
        {TABS.map((t) => (
          <button
            key={t.value}
            type="button"
            aria-pressed={tab === t.value}
            onClick={() => setTab(t.value)}
            className={
              tab === t.value
                ? "rounded-full bg-brand px-4 py-1.5 text-sm font-semibold text-white focus-visible:ring-3 focus-visible:ring-brand/30 focus-visible:outline-none"
                : "rounded-full bg-surface px-4 py-1.5 text-sm font-semibold text-ink/70 hover:text-ink focus-visible:ring-3 focus-visible:ring-brand/30 focus-visible:outline-none"
            }
          >
            {t.label} ({counts[t.value]})
          </button>
        ))}
      </div>

      {visible.length > 0 ? (
        <ul className="mt-5 space-y-3">
          {visible.map((item) => (
            <li
              key={`${item.source}-${item.id}`}
              className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-2xl border border-line px-4 py-3.5"
            >
              <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-red-50 text-xs font-bold text-red-600">PDF</span>
              <div className="min-w-0 flex-1">
                <h3 className="flex flex-wrap items-center gap-2 text-base font-semibold text-ink">
                  <span className="break-words">{item.title}</span>
                  <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${KIND_BADGE[item.type].className}`}>
                    {KIND_BADGE[item.type].label}
                  </span>
                </h3>
                <p className="mt-0.5 text-sm text-ink/70">
                  {[item.meta, item.fileSize ? formatSize(item.fileSize) : "Belum ada file"].filter(Boolean).join(" • ")}
                </p>
              </div>
              <div className="flex items-center gap-4 text-sm font-semibold">
                {item.source === "doc" && (
                  <button
                    type="button"
                    aria-label={`Lihat ${item.title}`}
                    disabled={busyId === item.id}
                    onClick={() => viewDocument(item)}
                    className="inline-flex min-h-9 items-center gap-1.5 text-brand hover:underline focus-visible:ring-3 focus-visible:ring-brand/30 focus-visible:outline-none disabled:opacity-50"
                  >
                    <FileText className="size-4" aria-hidden="true" />
                    Lihat
                  </button>
                )}
                <button
                  type="button"
                  aria-label={`Hapus ${item.title}`}
                  disabled={busyId === item.id}
                  onClick={() => removeItem(item)}
                  className="inline-flex min-h-9 items-center gap-1.5 text-red-600 hover:underline focus-visible:ring-3 focus-visible:ring-red-300 focus-visible:outline-none disabled:opacity-50"
                >
                  <Trash2 className="size-4" aria-hidden="true" />
                  Hapus
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-5 text-sm text-ink/70" role={status === "loading" ? "status" : undefined}>
          {status === "loading"
            ? "Memuat dokumen…"
            : tab === "all"
              ? "Belum ada dokumen. Tambahkan sertifikat atau portofolio Anda."
              : "Belum ada dokumen di kategori ini."}
        </p>
      )}

      {status === "error" && (
        <p role="alert" className="mt-3 text-sm font-medium text-red-600">
          Dokumen yang sudah diunggah tidak dapat dimuat. Muat ulang halaman untuk mencoba lagi.
        </p>
      )}
      {actionError && (
        <p role="alert" className="mt-3 text-sm font-medium text-red-600">
          {actionError}
        </p>
      )}

      <button
        type="button"
        onClick={() => openModal()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={`mt-4 flex w-full flex-col items-center gap-1 rounded-2xl border border-dashed border-brand px-6 py-6 text-center text-sm text-ink/80 transition-colors hover:bg-brand-light/50 focus-visible:ring-3 focus-visible:ring-brand/30 focus-visible:outline-none ${
          dragging ? "bg-brand-light" : "bg-white"
        }`}
      >
        <UploadCloud className="size-6 text-brand" aria-hidden="true" />
        <span>
          Seret file PDF ke sini atau klik <strong className="font-semibold text-brand">Tambah Dokumen</strong>
        </span>
        <span className="text-xs text-ink/60">Hanya PDF, maks. 2 MB per file</span>
      </button>
      {notice && (
        <p role="status" className="mt-2 text-xs font-medium text-ink/70">
          {notice}
        </p>
      )}

      {modal && <DocumentDialog key={modal.key} initialFile={modal.file} onClose={() => setModal(null)} onSubmit={handleSubmit} />}
    </section>
  );
}
