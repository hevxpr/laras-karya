import PreviewDialog from "./preview-dialog";

function Block({ title, children }) {
  return (
    <div>
      <h3 className="text-sm font-bold text-slate-600">{title}</h3>
      <div className="mt-1.5 text-ink">{children}</div>
    </div>
  );
}

const none = <span className="text-slate-500">Belum diisi</span>;

function CvBody({ a }) {
  return (
    <>
      <Block title="Nama Lengkap">{a.name}</Block>
      <Block title="Telepon">{a.phone || none}</Block>
      <Block title="Pengalaman Terakhir">
        {a.lastJob ? `${a.lastJob.title} — ${a.lastJob.company}${a.lastJob.period ? ` (${a.lastJob.period})` : ""}` : none}
      </Block>
      <Block title="Pendidikan">
        {a.education ? [a.education.degree, a.education.school].filter(Boolean).join(" — ") : none}
      </Block>
      <Block title="Keahlian">{a.skills?.length ? a.skills.join(", ") : none}</Block>
    </>
  );
}

/** Pratinjau CV yang dibuat otomatis dari profil. */
export function CvPreviewDialog({ open, onClose, applicant }) {
  return (
    <PreviewDialog open={open} onClose={onClose} title="Pratinjau CV">
      <CvBody a={applicant} />
    </PreviewDialog>
  );
}

/** Pratinjau seluruh lamaran sebelum dikirim. */
export function ApplicationPreviewDialog({ open, onClose, job, applicant, cvMode, cvFile, portfolios, certificates, letter }) {
  return (
    <PreviewDialog open={open} onClose={onClose} title="Pratinjau Lamaran">
      <Block title="Lowongan">
        {job.title} · {job.company}
      </Block>
      <Block title="CV">
        {cvMode === "upload" ? (cvFile ? cvFile.name : none) : "Dibuat otomatis dari profil"}
      </Block>
      <Block title="Nama Lengkap">{applicant.name}</Block>
      <Block title="Telepon">{applicant.phone || none}</Block>
      {cvMode === "profile" && (
        <>
          <Block title="Pengalaman Terakhir">
            {applicant.lastJob
              ? `${applicant.lastJob.title} — ${applicant.lastJob.company}`
              : none}
          </Block>
          <Block title="Pendidikan">
            {applicant.education ? [applicant.education.degree, applicant.education.school].filter(Boolean).join(" — ") : none}
          </Block>
        </>
      )}
      <Block title={`Portofolio (${portfolios.length})`}>
        {portfolios.length ? (
          <ul className="list-disc pl-5">
            {portfolios.map((p) => (
              <li key={p.id}>{p.name}</li>
            ))}
          </ul>
        ) : (
          <span className="text-slate-500">Belum dipilih</span>
        )}
      </Block>
      <Block title={`Sertifikat (${certificates.length})`}>
        {certificates.length ? (
          <ul className="list-disc pl-5">
            {certificates.map((c) => (
              <li key={c.id}>{c.name}</li>
            ))}
          </ul>
        ) : (
          <span className="text-slate-500">Tidak ada</span>
        )}
      </Block>
      <Block title="Surat Lamaran">
        <p className="whitespace-pre-line rounded-xl bg-surface p-4 leading-relaxed text-slate-700">{letter}</p>
      </Block>
    </PreviewDialog>
  );
}
