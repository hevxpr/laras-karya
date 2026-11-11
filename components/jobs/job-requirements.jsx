import { Check, HeartHandshake } from "lucide-react";

import { FacilityBadges } from "./facility-badges";
import { JobDescription } from "./job-description";

/** Kartu putih bergaya seragam untuk tiap seksi konten. */
function Section({ id, title, children }) {
  return (
    <section aria-labelledby={id} className="rounded-xl bg-white p-5 shadow-sm">
      <h2 id={id} className="mb-3 text-[15px] font-bold text-ink">
        {title}
      </h2>
      {children}
    </section>
  );
}

/**
 * Tiga seksi: Persyaratan Pekerjaan, Detail Pekerjaan, Benefit & Fasilitas (persyaratan dulu: singkat dan menentukan "layak melamar?").
 * Lokasi perusahaan sudah tampil di kartu JobHeader utama.
 * @param {{ job: import("@/lib/job-detail-data").JobDetail }} props
 */
export function JobRequirements({ job }) {
  // Kalau fasilitas dan benefit sama-sama kosong, cukup satu kalimat (bukan dua kalimat kosong berturut-turut).
  const noBenefits = job.facilities.length === 0 && job.benefits.length === 0;

  return (
    <>
      <Section id="requirements-title" title="Persyaratan Pekerjaan">
        <ul className="list-disc space-y-2 pl-5 text-[13px] leading-relaxed text-ink/80 marker:text-ink/50">
          {job.requirements.map((req) => (
            <li key={req}>{req}</li>
          ))}
        </ul>
      </Section>

      <Section id="detail-title" title="Detail Pekerjaan">
        <JobDescription text={job.description} />
      </Section>

      <Section id="benefits-title" title="Benefit & Fasilitas">
        {noBenefits ? (
          <p className="text-[13px] text-ink/70">Perusahaan belum mencantumkan benefit atau fasilitas.</p>
        ) : (
          <>
          {/* Fasilitas ramah perempuan dipisah dari benefit umum, dengan lencana yang sama seperti di daftar lowongan. */}
          <h3 className="flex items-center gap-1.5 text-[13px] font-semibold text-ink">
            <HeartHandshake className="size-4 text-ai" aria-hidden="true" />
            Dukungan untuk pekerja perempuan
          </h3>
          {job.facilities.length > 0 ? (
            <FacilityBadges benefits={job.facilities} max={job.facilities.length} className="mt-2" />
          ) : (
            <p className="mt-1.5 text-[13px] text-ink/70">Perusahaan belum mencantumkan fasilitas khusus.</p>
          )}

          <h3 className="mt-5 text-[13px] font-semibold text-ink">Benefit umum</h3>
          {job.benefits.length > 0 ? (
            <ul className="mt-2 flex flex-wrap gap-2">
              {job.benefits.map((b) => (
                <li
                  key={b.id}
                  className="inline-flex items-start gap-1.5 rounded-2xl bg-surface px-3 py-1.5 text-xs text-ink/80 ring-1 ring-inset ring-line"
                >
                  <Check className="mt-0.5 size-3 shrink-0 text-brand" aria-hidden="true" />
                  {b.label}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-1.5 text-[13px] text-ink/70">Perusahaan belum mencantumkan benefit lain.</p>
          )}
          </>
        )}
      </Section>
    </>
  );
}
