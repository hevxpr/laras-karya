"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Briefcase,
  CircleCheck,
  FileText,
  MapPin,
  PenLine,
  Sparkles,
} from "lucide-react";
import { submitApplication } from "@/app/applications/actions";
import { isUuid } from "@/lib/is-uuid";
import { buildCoverLetter } from "@/lib/applicant-mapping";
import ReadinessChecklist from "./readiness-checklist";
import SubmissionDialog from "./submission-dialog";
import ApplySteps from "./apply-steps";
import { CvUpload } from "./cv-upload";
import { useHasApplied } from "@/lib/demo-history";

// ⬇️ DIHAPUS: PLACEHOLDER_APPLY_URL (tidak dipakai lagi, lamaran sekarang dikirim lewat Laras Karya)
const MAX_FILE_MB = 5;

const SUBMIT_ERRORS = {
  auth: "Sesi Anda berakhir. Silakan masuk lagi, lalu kirim ulang lamaran.",
  closed: "Lowongan ini sudah ditutup, jadi lamaran tidak bisa dikirim.",
  notfound: "Lowongan tidak ditemukan atau sudah ditarik.",
  invalid: "Data lamaran tidak valid. Muat ulang halaman lalu coba lagi.",
  terms: "Centang pernyataan persetujuan terlebih dahulu.",
  letter: "Surat lamaran tidak boleh kosong.",
  db: "Lamaran belum bisa dikirim. Coba lagi beberapa saat lagi.",
};

function Field({ label, value, className = "" }) {
  return (
    <div className={className}>
      <dt className="text-sm text-slate-600">{label}</dt>
      <dd className="mt-1.5 rounded-xl bg-surface px-4 py-3 text-ink">
        {value}
      </dd>
    </div>
  );
}

function StatusChip({ open }) {
  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-medium ${open ? "bg-brand-light text-brand" : "bg-red-50 text-red-700"}`}
    >
      {open ? "Masih Dibuka" : "Ditutup"}
    </span>
  );
}

/**
 * onSubmitted: dipanggil begitu lamaran tersimpan (induk menahan tampilan "sudah melamar" sampai pop-up ditutup).
 * onDismiss: dipanggil saat pop-up ditutup.
 */
function PrepareForm({ job, applicant, onSubmitted, onDismiss }) {
  const router = useRouter();
  const a = applicant;
  const isOpen = job.status === "dibuka";
  // ⬇️ DIHAPUS: const applyUrl (tidak dipakai lagi)
  const place = job.mode === "Remote" ? "Remote" : [job.mode, job.city].filter(Boolean).join(" — ") || "Lokasi tidak dicantumkan";
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const [letter, setLetter] = useState(() => buildCoverLetter(job, a));
  const [editing, setEditing] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [portfolio, setPortfolio] = useState(""); // nama file (file belum dikirim ke mana pun)
  const [uploadError, setUploadError] = useState("");
  const [consent, setConsent] = useState(false);
  // File CV yang dilampirkan untuk lamaran ini. BACKEND: unggah ke Storage -> applications.resume_url
  const [cvFile, setCvFile] = useState(null);
  const cvInputRef = useRef(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const fileRef = useRef(null);

  const hasLetter = letter.trim().length > 0;
  const canContinue = isOpen && consent && hasLetter && !submitting;

  function onPickFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_FILE_MB * 1024 * 1024) {
      setUploadError(`Ukuran file maksimal ${MAX_FILE_MB} MB.`);
      e.target.value = "";
      return;
    }
    setUploadError("");
    setPortfolio(file.name);
  }

  async function handleContinue() {
    if (!canContinue) return;

    // Lowongan contoh (id angka): hanya menampilkan pop-up, tidak ada yang disimpan.
    if (!isUuid(job.id)) {
      setDialogOpen(true);
      return;
    }

    // Lowongan dari database: simpan ke tabel applications (status awal "diproses" = tampil "Dilamar").
    // TODO (backend): unggah CV dan portfolio ke Storage -> applications.resume_url / portfolio_url
    // (bucket Storage belum ada).
    setSubmitting(true);
    setSubmitError("");
    const result = await submitApplication({ jobId: job.id, coverLetter: letter, termsAccepted: consent });
    setSubmitting(false);

    if (result.ok) {
      onSubmitted?.();
      setDialogOpen(true);
    } else if (result.error === "duplicate") {
      // Sudah pernah melamar (mis. dari tab lain): muat ulang supaya tampil "Anda sudah melamar".
      router.refresh();
    } else {
      setSubmitError(SUBMIT_ERRORS[result.error] ?? SUBMIT_ERRORS.db);
    }
  }

  const portfolioButton = (
    <>
      <input
        ref={fileRef}
        id="portfolio"
        type="file"
        accept=".pdf,.doc,.docx"
        className="sr-only"
        onChange={onPickFile}
      />
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        className="rounded-full border border-brand px-3.5 py-1.5 text-xs font-semibold text-brand transition hover:bg-brand-light"
      >
        {portfolio ? "Ganti File" : "Unggah Portfolio"}
      </button>
      {uploadError && (
        <p role="alert" className="mt-1.5 text-xs text-red-700">
          {uploadError}
        </p>
      )}
    </>
  );

  const items = [
    {
      key: "profil",
      label: a.complete ? "Profil lengkap" : "Profil belum lengkap (telepon, pengalaman, atau pendidikan)",
      done: a.complete,
      action: a.complete ? null : (
        <Link
          href="/profile"
          className="rounded-full border border-brand px-3.5 py-1.5 text-xs font-semibold text-brand transition hover:bg-brand-light"
        >
          Lengkapi Profil
        </Link>
      ),
    },
    {
      key: "cv",
      label: cvFile ? `CV terunggah: ${cvFile.name}` : "CV belum diunggah",
      done: Boolean(cvFile),
      action: cvFile ? null : (
        <button
          type="button"
          onClick={() => cvInputRef.current?.click()}
          className="rounded-full border border-brand px-3.5 py-1.5 text-xs font-semibold text-brand transition hover:bg-brand-light"
        >
          Unggah CV
        </button>
      ),
    },
    {
      key: "surat",
      label: hasLetter ? "Surat lamaran tersedia" : "Surat lamaran belum diisi",
      done: hasLetter,
    },
    {
      key: "portfolio",
      label: portfolio
        ? `Portfolio terunggah: ${portfolio}`
        : "Portfolio diperlukan untuk lowongan ini",
      done: Boolean(portfolio),
      action: portfolioButton,
    },
    {
      key: "syarat",
      label: consent
        ? "Syarat & ketentuan disetujui"
        : "Syarat & ketentuan belum disetujui",
      done: consent,
    },
  ];

  const hint = !isOpen
    ? "Lowongan ini sudah ditutup."
    : !consent
      ? "Centang pernyataan di atas untuk melanjutkan."
      : !hasLetter
        ? "Isi surat lamaran terlebih dahulu."
      : !cvFile
        ? "Belum ada CV terlampir. Anda tetap bisa melanjutkan, tetapi sebagian perusahaan mewajibkan CV."
      : "Lamaran Anda akan dikirim ke perusahaan melalui Laras Karya.";

  return (
    <>
      <nav aria-label="Breadcrumb" className="text-sm text-slate-600">
        <Link href="/recommended-jobs" className="hover:underline">
          Lowongan
        </Link>{" "}
        /{" "}
        <Link href={`/recommended-jobs/${job.id}`} className="hover:underline">
          {job.title}
        </Link>{" "}
        / <span aria-current="page">Persiapan Lamaran</span>
      </nav>

      <h1 className="mt-3 text-3xl font-bold text-brand md:text-4xl">
        Persiapan Lamaran Pekerjaan
      </h1>
      {/* ⬇️ DIUBAH: subjudul (sebelumnya "...sebelum melamar di situs perusahaan.") */}
      <p className="mt-2 text-slate-800">
        Lengkapi dan periksa dokumen Anda sebelum mengirim lamaran.
      </p>
      <ApplySteps current={2} />

      <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5">
        <div className="flex items-center gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-light text-brand">
            <Briefcase className="h-6 w-6" aria-hidden />
          </span>
          <div>
            <h2 className="text-lg font-bold text-ink">{job.title}</h2>
            <p className="flex flex-wrap items-center gap-2 text-sm text-slate-600">
              {job.company} <span aria-hidden>•</span>
              <span className="rounded-full bg-brand-light px-2.5 py-0.5 text-xs font-medium text-brand">
                {job.sector}
              </span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 text-sm text-slate-700">
          <span className="flex items-center gap-1.5">
            <MapPin className="h-4 w-4" aria-hidden /> {place}
          </span>
          <StatusChip open={isOpen} />
        </div>
      </div>

      {!isOpen && (
        <p
          role="alert"
          className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          Lowongan ini sudah ditutup, jadi lamaran tidak bisa dilanjutkan.{" "}
          <Link href="/recommended-jobs" className="font-semibold underline">
            Lihat rekomendasi lainnya
          </Link>
          .
        </p>
      )}

      <div className="mt-6 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_400px]">
        <div className="space-y-6">
          <section
            aria-labelledby="cv-title"
            className="rounded-2xl border border-slate-200 bg-white p-6"
          >
            <h2
              id="cv-title"
              className="flex items-center gap-2 text-lg font-bold text-brand"
            >
              <FileText className="h-5 w-5" aria-hidden /> Data CV &amp; Profil
            </h2>
            <p className="mt-4 flex items-center gap-2 rounded-xl bg-brand-light px-4 py-3 text-sm text-brand">
              <CircleCheck className="h-4 w-4 shrink-0" aria-hidden />
              Data CV diambil dari profil Anda — terhubung otomatis
            </p>

            <dl className="mt-5 grid gap-4 sm:grid-cols-2">
              <Field label="Nama Lengkap" value={a.name} />
              <Field label="Telepon" value={a.phone || <span className="text-slate-500">Belum diisi</span>} />
              <Field
                className="sm:col-span-2"
                label="Pengalaman Terakhir"
                value={
                  a.lastJob
                    ? `${a.lastJob.title} — ${a.lastJob.company}${a.lastJob.period ? ` (${a.lastJob.period})` : ""}`
                    : <span className="text-slate-500">Belum diisi</span>
                }
              />
              <Field
                className="sm:col-span-2"
                label="Pendidikan"
                value={
                  a.education
                    ? [a.education.degree, a.education.school].filter(Boolean).join(" — ")
                    : <span className="text-slate-500">Belum diisi</span>
                }
              />
              <Field
                className="sm:col-span-2"
                label="Keahlian"
                value={
                  a.skills?.length ? (
                    <span className="flex flex-wrap gap-1.5">
                      {a.skills.slice(0, 8).map((k) => (
                        <span key={k} className="rounded-full bg-white px-2.5 py-0.5 text-xs font-medium text-brand ring-1 ring-slate-200">
                          {k}
                        </span>
                      ))}
                      {a.skills.length > 8 && <span className="text-xs text-slate-600">+{a.skills.length - 8}</span>}
                    </span>
                  ) : (
                    <span className="text-slate-500">Belum diisi</span>
                  )
                }
              />
            </dl>

            <CvUpload file={cvFile} onChange={setCvFile} inputRef={cvInputRef} maxMb={MAX_FILE_MB} />

            <Link
              href="/profile"
              className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-brand hover:underline"
            >
              Edit Profil <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </section>

          <section
            aria-labelledby="letter-title"
            className="rounded-2xl border border-slate-200 bg-white p-6"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2
                id="letter-title"
                className="flex items-center gap-2 text-lg font-bold text-brand"
              >
                <PenLine className="h-5 w-5" aria-hidden /> Surat Lamaran
              </h2>
              <span className="inline-flex items-center gap-1 rounded-full bg-ai/10 px-3 py-1 text-xs font-semibold text-ai">
                <Sparkles className="h-3 w-3" aria-hidden /> Dibuat dengan
                bantuan AI
              </span>
            </div>

            {editing ? (
              <>
                <label htmlFor="surat" className="sr-only">
                  Isi surat lamaran
                </label>
                <textarea
                  id="surat"
                  rows={10}
                  value={letter}
                  onChange={(e) => setLetter(e.target.value)}
                  className="mt-4 w-full rounded-xl border border-slate-300 bg-white p-4 leading-relaxed text-ink"
                />
              </>
            ) : (
              <>
                <div className="mt-4 rounded-xl bg-surface p-5">
                  <p
                    className={`whitespace-pre-line leading-relaxed text-slate-700 ${
                      expanded ? "" : "line-clamp-6"
                    }`}
                  >
                    {letter}
                  </p>
                </div>
                {letter.length > 400 && (
                  <button
                    type="button"
                    onClick={() => setExpanded((v) => !v)}
                    aria-expanded={expanded}
                    className="mr-5 mt-5 inline-flex items-center text-sm font-semibold text-brand hover:underline"
                  >
                    {expanded ? "Ringkas" : "Lihat selengkapnya"}
                  </button>
                )}
              </>
            )}

            <button
              type="button"
              onClick={() => setEditing((v) => !v)}
              className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-brand hover:underline"
            >
              {editing ? (
                "Selesai Mengedit"
              ) : (
                <>
                  Edit Surat Lamaran{" "}
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </>
              )}
            </button>
          </section>
        </div>

        <div className="space-y-6">
          <ReadinessChecklist items={items} />

          <div className="rounded-2xl bg-brand-light p-6">
            <label className="flex cursor-pointer items-start gap-3 text-sm font-medium text-ink">
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                className="mt-0.5 h-5 w-5 shrink-0 accent-brand"
              />
              Saya menyatakan data yang diberikan adalah benar
            </label>
            <button
              type="button"
              onClick={handleContinue}
              disabled={!canContinue}
              aria-describedby="continue-hint"
              className="mt-4 w-full rounded-full bg-brand px-6 py-4 font-semibold text-white transition hover:bg-brand/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {/* ⬇️ DIUBAH: teks tombol (sebelumnya "Lanjut Melamar di Situs Perusahaan") */}
              {submitting ? "Mengirim…" : "Kirim Lamaran"}
            </button>
            {submitError && (
              <p role="alert" className="mt-3 rounded-xl bg-red-50 px-4 py-3 text-center text-sm text-red-700">
                {submitError}
              </p>
            )}
            <p
              id="continue-hint"
              className="mt-3 text-center text-xs text-slate-600"
            >
              {hint}
            </p>
          </div>
        </div>
      </div>

      <SubmissionDialog
        open={dialogOpen}
        onClose={() => {
          setDialogOpen(false);
          onDismiss?.();
        }}
        job={job}
        // ⬇️ DIHAPUS: applyUrl={applyUrl} (pop-up tidak lagi memuat tautan situs perusahaan)
      />
    </>
  );
}

/**
 * job & alreadyApplied datang dari server (app/applications/prepare/page.js).
 * alreadyApplied (boolean) = dibaca dari tabel applications; tanpa itu (lowongan contoh) dijawab data contoh.
 */
export default function PrepareApplication({ job, applicant, alreadyApplied: appliedFromDb }) {
  const applied = useHasApplied(job?.id, appliedFromDb);
  // Setelah lamaran tersimpan, halaman dibaca ulang dan "sudah melamar" menjadi true. Selama pop-up
  // keberhasilan masih terbuka, formulir tetap dipertahankan supaya pop-up tidak ikut hilang.
  const [justSubmitted, setJustSubmitted] = useState(false);
  const alreadyApplied = applied && !justSubmitted;

  if (job && alreadyApplied) {
    return (
      <div className="mx-auto max-w-[1200px] px-4 pb-16 pt-8 md:px-6 xl:px-8">
        <nav aria-label="Breadcrumb" className="text-sm text-slate-600">
          <Link href="/recommended-jobs" className="hover:underline">
            Lowongan
          </Link>{" "}
          / <span aria-current="page">Persiapan Lamaran</span>
        </nav>

        <div className="mx-auto mt-8 max-w-xl rounded-2xl border border-slate-200 bg-white p-8 text-center">
          <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-brand-light text-brand">
            <CircleCheck className="h-8 w-8" aria-hidden />
          </span>
          <p className="mt-5 text-lg font-bold text-ink">
            Anda sudah melamar lowongan ini
          </p>
          <p className="mt-1 text-sm text-slate-600">
            {job.title} · {job.company}
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              href="/applications"
              className="rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand/90"
            >
              Lihat Lamaran Saya
            </Link>
            <Link
              href="/recommended-jobs"
              className="rounded-full border border-brand px-5 py-2.5 text-sm font-semibold text-brand transition hover:bg-brand-light"
            >
              Cari lowongan lain
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1200px] px-4 pb-16 pt-8 md:px-6 xl:px-8">
      {job ? (
        <PrepareForm
          key={job.id}
          job={job}
          applicant={applicant}
          onSubmitted={() => setJustSubmitted(true)}
          onDismiss={() => setJustSubmitted(false)}
        />
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <p className="font-bold text-ink">Lowongan tidak ditemukan</p>
          <p className="mt-1 text-sm text-slate-600">
            Pilih lowongan dari daftar rekomendasi untuk mulai menyiapkan
            lamaran.
          </p>
          <Link
            href="/recommended-jobs"
            className="mt-4 inline-block rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand/90"
          >
            Lihat rekomendasi lowongan
          </Link>
        </div>
      )}
    </div>
  );
}
