"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Briefcase,
  CircleCheck,
  FileText,
  MapPin,
  PenLine,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { submitApplication } from "@/app/applications/actions";
import { isUuid } from "@/lib/is-uuid";
import { buildCoverLetter } from "@/lib/applicant-mapping";
import ReadinessChecklist from "./readiness-checklist";
import SubmissionDialog from "./submission-dialog";
import ApplySteps from "./apply-steps";
import { CvSourceTabs, CvUpload } from "./cv-upload";
import { MAX_PORTFOLIO, PortfolioPicker } from "./portfolio-picker";
import { CertificatePicker } from "./certificate-picker";
import ApplicationSummary from "./application-summary";
import { ApplicationPreviewDialog, CvPreviewDialog } from "./application-preview";
import { useHasApplied } from "@/lib/demo-history";
import { removeApplicationFiles, uploadApplicationFiles } from "@/lib/application-storage";

const MAX_FILE_MB = 5;
const DRAFT_PREFIX = "laras-karya:apply-draft:";

const SUBMIT_ERRORS = {
  auth: "Sesi Anda berakhir. Silakan masuk lagi, lalu kirim ulang lamaran.",
  closed: "Lowongan ini sudah ditutup, jadi lamaran tidak bisa dikirim.",
  notfound: "Lowongan tidak ditemukan atau sudah ditarik.",
  invalid: "Data lamaran tidak valid. Muat ulang halaman lalu coba lagi.",
  terms: "Centang pernyataan persetujuan terlebih dahulu.",
  letter: "Surat lamaran tidak boleh kosong.",
  db: "Lamaran belum bisa dikirim. Coba lagi beberapa saat lagi.",
  storage: "Berkas gagal diunggah. Periksa koneksi lalu coba lagi.",
};

const nowLabel = () => new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
const outlineBtn =
  "rounded-full border border-brand px-3.5 py-1.5 text-xs font-semibold text-brand transition hover:bg-brand-light";

function Field({ label, value, className = "" }) {
  return (
    <div className={className}>
      <dt className="text-sm text-slate-600">{label}</dt>
      <dd className="mt-1.5 rounded-xl bg-surface px-4 py-3 text-ink">{value}</dd>
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

const notFilled = <span className="text-slate-500">Belum diisi</span>;

/**
 * onSubmitted: dipanggil begitu lamaran tersimpan (induk menahan tampilan "sudah melamar" sampai pop-up ditutup).
 * onDismiss: dipanggil saat pop-up ditutup.
 */
function PrepareForm({ job, applicant, onSubmitted, onDismiss }) {
  const router = useRouter();
  const a = applicant;
  const isOpen = job.status === "dibuka";
  const place =
    job.mode === "Remote" ? "Remote" : job.city || job.mode || "Lokasi tidak dicantumkan";
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  // ---- Surat lamaran ----
  const generatedLetter = useMemo(() => buildCoverLetter(job, a), [job, a]);
  const [letter, setLetter] = useState(generatedLetter);
  const [editing, setEditing] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const hasLetter = letter.trim().length > 0;

  // ---- CV: dari profil atau unggah sendiri (diunggah ke Storage saat Kirim -> applications.resume_url) ----
  const [cvMode, setCvMode] = useState("profile");
  const [cvFile, setCvFile] = useState(null);
  const cvInputRef = useRef(null);

  // ---- Portofolio: dari profil + unggahan baru (maks. 3 dipilih; diunggah saat Kirim -> applications.portfolio_url) ----
  const profilePortfolios = useMemo(
    () => (a.portfolios ?? []).map((p) => ({ ...p, source: "profile" })),
    [a.portfolios],
  );
  const [uploads, setUploads] = useState([]);
  const [portfolioIds, setPortfolioIds] = useState(() => profilePortfolios.slice(0, 1).map((p) => p.id));
  const [saveToProfile, setSaveToProfile] = useState(true);
  const portfolioInputRef = useRef(null);
  const portfolioItems = [...profilePortfolios, ...uploads];
  const selectedPortfolios = portfolioItems.filter((p) => portfolioIds.includes(p.id));
  const newPortfolioCount = selectedPortfolios.filter((p) => p.source === "upload").length;

  // ---- Sertifikat (opsional) ----
  const certifications = a.certifications ?? [];
  const [certIds, setCertIds] = useState(() => certifications.slice(0, 1).map((c) => c.id));
  const selectedCerts = certifications.filter((c) => certIds.includes(c.id));

  const [consent, setConsent] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [cvPreviewOpen, setCvPreviewOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  // ---- Draf otomatis (per lowongan, di browser ini). File tidak ikut tersimpan, hanya pilihan dan surat. ----
  const draftKey = `${DRAFT_PREFIX}${job.id}`;
  const [hydrated, setHydrated] = useState(false);
  const [draftTime, setDraftTime] = useState("");
  const [draftNote, setDraftNote] = useState("");
  const draft = useMemo(
    () => ({ letter, portfolioIds: portfolioIds.filter((id) => profilePortfolios.some((p) => p.id === id)), certIds, saveToProfile }),
    [letter, portfolioIds, certIds, saveToProfile, profilePortfolios],
  );

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(draftKey) ?? "null");
      if (saved) {
        /* eslint-disable react-hooks/set-state-in-effect */
        if (typeof saved.letter === "string" && saved.letter.trim()) setLetter(saved.letter);
        if (Array.isArray(saved.portfolioIds)) setPortfolioIds(saved.portfolioIds.filter((id) => profilePortfolios.some((p) => p.id === id)));
        if (Array.isArray(saved.certIds)) setCertIds(saved.certIds.filter((id) => certifications.some((c) => c.id === id)));
        if (typeof saved.saveToProfile === "boolean") setSaveToProfile(saved.saveToProfile);
        /* eslint-enable react-hooks/set-state-in-effect */
      }
    } catch {
      // draf rusak atau penyimpanan diblokir: abaikan
    }
    setHydrated(true);
    // hanya dijalankan sekali saat halaman dibuka
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function writeDraft() {
    try {
      localStorage.setItem(draftKey, JSON.stringify(draft));
      setDraftTime(nowLabel());
      return true;
    } catch {
      return false;
    }
  }

  useEffect(() => {
    if (!hydrated || !isOpen) return;
    const t = setTimeout(() => {
      try {
        localStorage.setItem(draftKey, JSON.stringify(draft));
        setDraftTime(nowLabel());
      } catch {
        // penyimpanan penuh atau diblokir: draf otomatis dilewati
      }
    }, 800);
    return () => clearTimeout(t);
  }, [hydrated, isOpen, draft, draftKey]);

  function saveDraftNow() {
    setDraftNote(writeDraft() ? "Draf disimpan." : "Draf tidak bisa disimpan di browser ini.");
  }

  // ---- Aksi portofolio ----
  function togglePortfolio(id) {
    setPortfolioIds((ids) => {
      if (ids.includes(id)) return ids.filter((x) => x !== id);
      return ids.length >= MAX_PORTFOLIO ? ids : [...ids, id];
    });
  }

  function addPortfolios(files) {
    const stamp = Date.now();
    const added = files.map((file, i) => ({ id: `upload-${stamp}-${i}`, source: "upload", name: file.name, file }));
    setUploads((list) => [...list, ...added]);
    setPortfolioIds((ids) => {
      const room = Math.max(0, MAX_PORTFOLIO - ids.length);
      return [...ids, ...added.slice(0, room).map((p) => p.id)];
    });
  }

  function removePortfolio(id) {
    setUploads((list) => list.filter((p) => p.id !== id));
    setPortfolioIds((ids) => ids.filter((x) => x !== id));
  }

  // ---- Kesiapan ----
  const cvReady = cvMode === "profile" || Boolean(cvFile);
  const canContinue = isOpen && consent && hasLetter && cvReady && selectedPortfolios.length > 0 && !submitting;

  async function handleContinue() {
    if (!canContinue) return;

    // Lowongan contoh (id angka): hanya menampilkan pop-up, tidak ada yang disimpan.
    if (!isUuid(job.id)) {
      setDialogOpen(true);
      return;
    }

    // Lowongan dari database: unggah berkas ke bucket Storage "Documents", lalu simpan lamaran ke tabel
    // applications (status awal "diproses" = tampil "Dilamar") beserta path berkasnya.
    // TODO: saveToProfile baru berupa niat; belum ada tabel/kolom untuk menyimpan portofolio di profil.
    setSubmitting(true);
    setSubmitError("");

    const upload = await uploadApplicationFiles({
      jobId: job.id,
      cvFile: cvMode === "upload" ? cvFile : null,
      portfolioFiles: selectedPortfolios.filter((p) => p.source === "upload"),
    });
    if (!upload.ok) {
      setSubmitting(false);
      setSubmitError(SUBMIT_ERRORS[upload.error] ?? SUBMIT_ERRORS.storage);
      return;
    }

    const result = await submitApplication({
      jobId: job.id,
      coverLetter: letter,
      termsAccepted: consent,
      attachments: {
        cv: { source: cvMode, fileName: cvMode === "upload" ? cvFile?.name : null, path: upload.cvPath },
        portfolios: selectedPortfolios.map((p) => ({ name: p.name, source: p.source, path: upload.portfolioPaths[p.id] ?? null })),
        certifications: selectedCerts.map((c) => ({ name: c.name, issuer: c.issuer })),
        saveToProfile: newPortfolioCount > 0 && saveToProfile,
      },
    });
    if (!result.ok) await removeApplicationFiles(upload.uploaded); // lamaran gagal: jangan tinggalkan berkas yatim
    setSubmitting(false);

    if (result.ok) {
      try {
        localStorage.removeItem(draftKey);
      } catch {
        // abaikan
      }
      onSubmitted?.();
      setDialogOpen(true);
    } else if (result.error === "duplicate") {
      // Sudah pernah melamar (mis. dari tab lain): muat ulang supaya tampil "Anda sudah melamar".
      router.refresh();
    } else {
      setSubmitError(SUBMIT_ERRORS[result.error] ?? SUBMIT_ERRORS.db);
    }
  }

  const items = [
    {
      key: "profil",
      label: a.complete ? "Profil lengkap" : "Profil belum lengkap (telepon, pengalaman, atau pendidikan)",
      done: a.complete,
      action: a.complete ? null : (
        <Link href="/profile" className={outlineBtn}>
          Lengkapi Profil
        </Link>
      ),
    },
    cvMode === "profile"
      ? {
          key: "cv",
          label: a.complete ? "CV siap" : "CV dari profil belum lengkap",
          done: a.complete,
          sub: "Dibuat otomatis dari profil",
        }
      : {
          key: "cv",
          label: cvFile ? "CV siap" : "CV belum diunggah",
          done: Boolean(cvFile),
          sub: cvFile?.name,
          action: cvFile ? null : (
            <button type="button" onClick={() => cvInputRef.current?.click()} className={outlineBtn}>
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
      label: selectedPortfolios.length ? "Portofolio terlampir" : "Portofolio diperlukan untuk lowongan ini",
      done: selectedPortfolios.length > 0,
      sub: selectedPortfolios.length
        ? `${selectedPortfolios.length} file${newPortfolioCount ? ` (${newPortfolioCount} baru)` : ""}`
        : undefined,
      action: selectedPortfolios.length ? null : (
        <button type="button" onClick={() => portfolioInputRef.current?.click()} className={outlineBtn}>
          Unggah Portofolio
        </button>
      ),
    },
    {
      key: "syarat",
      label: consent ? "Syarat & ketentuan disetujui" : "Syarat & ketentuan belum disetujui",
      done: consent,
    },
  ];

  const hint = !isOpen
    ? "Lowongan ini sudah ditutup."
    : !consent
      ? "Centang pernyataan di atas untuk melanjutkan."
      : !hasLetter
        ? "Isi surat lamaran terlebih dahulu."
        : !cvReady
          ? "Unggah CV terlebih dahulu, atau pilih Pakai data dari profil."
          : selectedPortfolios.length === 0
            ? "Pilih atau unggah minimal 1 portofolio."
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

      <h1 className="mt-3 text-3xl font-bold text-brand md:text-4xl">Persiapan Lamaran Pekerjaan</h1>
      <p className="mt-2 text-slate-800">Lengkapi dan periksa dokumen Anda sebelum mengirim lamaran.</p>
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
        <div className="flex flex-wrap items-center gap-3 text-sm text-slate-700">
          <span className="flex items-center gap-1.5">
            <MapPin className="h-4 w-4" aria-hidden /> {place}
          </span>
          {job.deadline && <span className="text-slate-600">Ditutup {job.deadline}</span>}
          <StatusChip open={isOpen} />
        </div>
      </div>

      {!isOpen && (
        <p role="alert" className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          Lowongan ini sudah ditutup, jadi lamaran tidak bisa dilanjutkan.{" "}
          <Link href="/recommended-jobs" className="font-semibold underline">
            Lihat rekomendasi lainnya
          </Link>
          .
        </p>
      )}

      <div className="mt-6 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_400px]">
        <div className="space-y-6">
          <section aria-labelledby="cv-title" className="rounded-2xl border border-slate-200 bg-white p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 id="cv-title" className="flex items-center gap-2 text-lg font-bold text-brand">
                <FileText className="h-5 w-5" aria-hidden /> CV &amp; Data Diri
              </h2>
              <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800">Wajib</span>
            </div>

            <CvSourceTabs value={cvMode} onChange={setCvMode} maxMb={MAX_FILE_MB} />

            {cvMode === "profile" ? (
              <p className="mt-4 flex items-center gap-2 rounded-xl bg-brand-light px-4 py-3 text-sm text-brand">
                <CircleCheck className="h-4 w-4 shrink-0" aria-hidden />
                Data CV diambil dari profilmu dan otomatis ikut diperbarui jika profil diubah
              </p>
            ) : (
              <>
                <CvUpload file={cvFile} onChange={setCvFile} inputRef={cvInputRef} maxMb={MAX_FILE_MB} />
                <p className="mt-4 flex items-center gap-2 rounded-xl bg-surface px-4 py-3 text-sm text-slate-700">
                  <span aria-hidden>ⓘ</span>
                  Nama dan kontak tetap diambil dari profilmu supaya perekrut bisa menghubungimu.
                </p>
              </>
            )}

            <dl className="mt-5 grid gap-4 sm:grid-cols-2">
              <Field label="Nama Lengkap" value={a.name} />
              <Field label="Telepon" value={a.phone || notFilled} />
              {cvMode === "profile" && (
                <>
                  <Field
                    className="sm:col-span-2"
                    label="Pengalaman Terakhir"
                    value={
                      a.lastJob
                        ? `${a.lastJob.title} — ${a.lastJob.company}${a.lastJob.period ? ` (${a.lastJob.period})` : ""}`
                        : notFilled
                    }
                  />
                  <Field
                    className="sm:col-span-2"
                    label="Pendidikan"
                    value={
                      a.education ? [a.education.degree, a.education.school].filter(Boolean).join(" — ") : notFilled
                    }
                  />
                  <Field
                    className="sm:col-span-2"
                    label="Keahlian"
                    value={
                      a.skills?.length ? (
                        <span className="flex flex-wrap gap-1.5">
                          {a.skills.slice(0, 8).map((k) => (
                            <span
                              key={k}
                              className="rounded-full bg-brand-light px-3 py-1 text-xs font-semibold text-brand"
                            >
                              {k}
                            </span>
                          ))}
                          {a.skills.length > 8 && (
                            <span className="self-center text-xs text-slate-600">+{a.skills.length - 8}</span>
                          )}
                        </span>
                      ) : (
                        notFilled
                      )
                    }
                  />
                </>
              )}
            </dl>

            <div className="mt-5 flex flex-wrap items-center gap-5 text-sm font-semibold text-brand">
              {cvMode === "profile" && (
                <button type="button" onClick={() => setCvPreviewOpen(true)} className="hover:underline">
                  Pratinjau CV (PDF)
                </button>
              )}
              <Link href="/profile" className="inline-flex items-center gap-1 hover:underline">
                Edit Profil <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </div>
          </section>

          <PortfolioPicker
            items={portfolioItems}
            selectedIds={portfolioIds}
            onToggle={togglePortfolio}
            onAdd={addPortfolios}
            onRemove={removePortfolio}
            saveToProfile={saveToProfile}
            onSaveToProfileChange={setSaveToProfile}
            inputRef={portfolioInputRef}
          />

          <CertificatePicker
            items={certifications}
            selectedIds={certIds}
            onToggle={(id) => setCertIds((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]))}
          />

          <section aria-labelledby="letter-title" className="rounded-2xl border border-slate-200 bg-white p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 id="letter-title" className="flex items-center gap-2 text-lg font-bold text-brand">
                <PenLine className="h-5 w-5" aria-hidden /> Surat Lamaran
              </h2>
              <span className="inline-flex items-center gap-1 rounded-full bg-ai/10 px-3 py-1 text-xs font-semibold text-ai">
                <Sparkles className="h-3 w-3" aria-hidden /> Dibuat dengan bantuan AI
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
              <div className="mt-4 rounded-xl bg-surface p-5">
                <p
                  className={`whitespace-pre-line leading-relaxed text-slate-700 ${expanded ? "" : "line-clamp-6"}`}
                >
                  {letter}
                </p>
              </div>
            )}

            <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm font-semibold text-brand">
              {!editing && letter.length > 400 && (
                <button
                  type="button"
                  onClick={() => setExpanded((v) => !v)}
                  aria-expanded={expanded}
                  className="hover:underline"
                >
                  {expanded ? "Ringkas" : "Lihat selengkapnya"}
                </button>
              )}
              <button
                type="button"
                onClick={() => setEditing((v) => !v)}
                className="inline-flex items-center gap-1 hover:underline"
              >
                {editing ? (
                  "Selesai Mengedit"
                ) : (
                  <>
                    Edit Surat Lamaran <ArrowRight className="h-4 w-4" aria-hidden />
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  setLetter(generatedLetter);
                  setEditing(false);
                }}
                className="inline-flex items-center gap-1.5 hover:underline"
              >
                <RefreshCw className="size-4" aria-hidden /> Buat ulang dengan AI
              </button>
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <ReadinessChecklist items={items} />

          <ApplicationSummary
            cv={cvMode === "profile" ? "Dari profil (PDF otomatis)" : (cvFile?.name ?? "Belum diunggah")}
            portfolioCount={selectedPortfolios.length}
            certificateCount={selectedCerts.length}
            letterLabel={letter === generatedLetter ? "Draf AI" : "Sudah diedit"}
            onPreview={() => setPreviewOpen(true)}
          />

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
              {submitting ? "Mengirim…" : "Kirim Lamaran"}
            </button>
            {submitError && (
              <p role="alert" className="mt-3 rounded-xl bg-red-50 px-4 py-3 text-center text-sm text-red-700">
                {submitError}
              </p>
            )}
            <p id="continue-hint" className="mt-3 text-center text-xs text-slate-600">
              {hint}
            </p>
            {isOpen && (
              <div className="mt-4 text-center">
                <button type="button" onClick={saveDraftNow} className="text-sm font-semibold text-brand hover:underline">
                  Simpan sebagai draf
                </button>
                <p aria-live="polite" className="mt-1 text-xs text-slate-600">
                  {draftNote || (draftTime ? `Draf tersimpan otomatis • ${draftTime}` : "Draf tersimpan otomatis")}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <CvPreviewDialog open={cvPreviewOpen} onClose={() => setCvPreviewOpen(false)} applicant={a} />
      <ApplicationPreviewDialog
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        job={job}
        applicant={a}
        cvMode={cvMode}
        cvFile={cvFile}
        portfolios={selectedPortfolios}
        certificates={selectedCerts}
        letter={letter}
      />
      <SubmissionDialog
        open={dialogOpen}
        onClose={() => {
          setDialogOpen(false);
          onDismiss?.();
        }}
        job={job}
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
