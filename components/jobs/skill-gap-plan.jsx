import Link from "next/link";
import { BookOpen, Check, ChevronDown, ExternalLink, Info } from "lucide-react";

import { groupSkills } from "@/lib/skill-groups";
import { hasCourse, sortGap } from "@/lib/skill-gap-data";

const GROUP_LABEL = "text-xs font-bold uppercase tracking-wide text-ink/60";
const PILL = "shrink-0 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold";
const PILL_SUDAH = `${PILL} bg-emerald-50 text-emerald-700`;
const PILL_PENGALAMAN = `${PILL} bg-slate-100 text-slate-600`;

const searchUrl = (name) => `https://www.google.com/search?q=${encodeURIComponent(`kursus pelatihan ${name}`)}`;

/** Kartu pelatihan kecil: judul, penyedia dan level. Membuka tab baru. */
function CourseLink({ course }) {
  const meta = [course.provider, course.level].filter(Boolean).join(", ");
  return (
    <a
      href={course.url}
      target="_blank"
      rel="noopener noreferrer"
      className="mt-2 flex items-start gap-2.5 rounded-lg border border-line bg-white p-3 text-[13px] text-ink transition-colors hover:border-brand"
    >
      <BookOpen className="mt-0.5 size-4 shrink-0 text-brand" aria-hidden="true" />
      <span className="min-w-0 flex-1">
        <span className="block font-semibold">{course.title}</span>
        {meta && <span className="block text-xs text-ink/70">{meta}</span>}
      </span>
      <ExternalLink className="mt-0.5 size-4 shrink-0 text-ink/50" aria-hidden="true" />
      <span className="sr-only"> (membuka tab baru)</span>
    </a>
  );
}

/** Pelatihan untuk satu skill teknis: kartu pelatihan, atau satu baris redup + "Cari di luar" bila belum ada. */
function CourseInfo({ skill }) {
  if (!Array.isArray(skill.courses)) return null; // belum diketahui (query gagal): jangan mengklaim apa pun
  if (skill.courses.length > 0) {
    return (
      <>
        {skill.courses.map((c) => (
          <CourseLink key={c.id} course={c} />
        ))}
      </>
    );
  }
  return (
    <p className="mt-1.5 text-xs text-ink/70">
      Belum ada pelatihan di Laras Karya ·{" "}
      <a
        href={searchUrl(skill.name)}
        target="_blank"
        rel="noopener noreferrer"
        className="font-semibold text-brand underline underline-offset-2"
      >
        Cari di luar<span className="sr-only"> (membuka tab baru)</span>
      </a>
    </p>
  );
}

/** Satu skill teknis yang belum dimiliki: nomor prioritas, nama, permintaan, pelatihan (judul kartu sudah menyatakan "perlu dilengkapi"). */
function GapRow({ skill, index }) {
  return (
    <li className="flex gap-3">
      <span
        className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-brand text-xs font-bold text-white"
        aria-hidden="true"
      >
        {index}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
          <p className="text-[14px] font-semibold text-ink">
            {skill.name}
            <span className="sr-only"> (belum dimiliki)</span>
          </p>
        </div>
        {skill.demand > 0 && <p className="mt-0.5 text-xs text-ink/70">Diminta di {skill.demand} lowongan</p>}
        <CourseInfo skill={skill} />
      </div>
    </li>
  );
}

/** Satu skill pendukung: sudah dimiliki (hijau) atau belum (netral, bukan merah); pelatihan hanya bila ada. */
function SupportRow({ skill }) {
  const owned = skill.status === "dimiliki";
  return (
    <li className="text-[13px] text-ink">
      <div className="flex items-center gap-2">
        <span
          className={`grid size-4 shrink-0 place-items-center rounded-full text-white ${owned ? "bg-emerald-500" : "bg-slate-400"}`}
        >
          {owned ? <Check className="size-2.5" aria-hidden="true" /> : <Info className="size-2.5" aria-hidden="true" />}
        </span>
        <span className="min-w-0 flex-1">{skill.name}</span>
        <span className={owned ? PILL_SUDAH : PILL_PENGALAMAN}>{owned ? "Sudah dimiliki" : "Dibangun lewat pengalaman"}</span>
      </div>
      {!owned && hasCourse(skill) && skill.courses.map((c) => <CourseLink key={c.id} course={c} />)}
    </li>
  );
}

/** Bagian yang bisa dilipat (elemen <details> bawaan browser, tanpa JavaScript tambahan). */
function Fold({ title, children }) {
  return (
    <details className="group mt-4 rounded-lg border border-line">
      <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-2 px-3 text-[13px] font-semibold text-ink [&::-webkit-details-marker]:hidden">
        {title}
        <ChevronDown className="size-4 shrink-0 text-ink/60 transition-transform group-open:rotate-180" aria-hidden="true" />
      </summary>
      <div className="px-3 pb-3">{children}</div>
    </details>
  );
}

/**
 * Kartu "Rencana Belajar" di kolom utama. Susunannya mengikuti desain ketua: blok keterampilan teknis (yang belum
 * dimiliki, merah dan ada tindakan) dipisah dari blok keterampilan pendukung (netral, dibangun lewat pengalaman).
 * Ditambah urutan prioritas, jumlah lowongan yang memintanya, dan pelatihan per skill.
 * Daftarnya tampil penuh di kolom utama (bukan di sidebar yang sempit). Tidak tampil bila tidak ada yang perlu dilengkapi.
 * @param {{ job: import("@/lib/job-detail-data").JobDetail }} props
 */
export function SkillGapPlan({ job }) {
  const g = groupSkills(job.skills);
  const isOwned = (s) => s.status === "dimiliki";
  const technicalGap = sortGap(g.structured ? g.technicalMissing : job.skills.filter((s) => !isOwned(s)));
  const supportingGap = g.structured ? sortGap(g.supportingMissing) : [];
  // Blok pendukung: yang belum dimiliki dulu (urut prioritas), lalu yang sudah dimiliki.
  // Daftar skill pendukung sudah ada di kartu "Keterampilan yang Dibutuhkan"; di sini hanya yang punya pelatihan.
  const supporting = g.structured ? supportingGap.filter(hasCourse) : [];
  const ownedTechnical = g.structured ? g.technical.filter(isOwned) : job.skills.filter(isOwned);

  if (technicalGap.length === 0 && supporting.length === 0) return null;

  return (
    <section id="rencana-belajar" aria-labelledby="plan-title" className="scroll-mt-24 rounded-xl bg-white p-5 shadow-sm">
      <h2 id="plan-title" className="text-[15px] font-bold text-ink">
        Rencana Belajar
      </h2>

      <div className="mt-3 rounded-lg bg-surface p-4">
        {technicalGap.length > 0 ? (
          <>
            <h3 className={GROUP_LABEL}>
              {technicalGap.length} {g.structured ? "keterampilan teknis" : "keterampilan"} perlu dilengkapi
            </h3>
            <p className="mt-1 text-xs text-ink/70">Diurutkan dari yang paling banyak diminta lowongan lain.</p>
            <ol className="mt-4 space-y-5">
              {technicalGap.map((s, i) => (
                <GapRow key={s.id} skill={s} index={i + 1} />
              ))}
            </ol>
          </>
        ) : (
          <p className="flex items-center gap-2 text-[13px] font-semibold text-ink">
            <span className="grid size-4 shrink-0 place-items-center rounded-full bg-emerald-500 text-white">
              <Check className="size-2.5" aria-hidden="true" />
            </span>
            Semua keterampilan teknis terpenuhi
          </p>
        )}
      </div>

      {supporting.length > 0 && (
        <div className="mt-3 rounded-lg bg-surface p-4">
          <h3 className={GROUP_LABEL}>Pelatihan untuk keterampilan pendukung</h3>
          <ul className="mt-3 space-y-3">
            {supporting.map((s) => (
              <SupportRow key={s.id} skill={s} />
            ))}
          </ul>
          {supportingGap.length > 0 && (
            <p className="mt-3 text-xs text-ink/70">
              Sudah punya pengalamannya?{" "}
              <Link href="/profile" className="font-semibold text-brand underline underline-offset-2">
                Tambahkan ke profil
              </Link>
            </p>
          )}
        </div>
      )}

      {ownedTechnical.length > 0 && (
        <Fold title={`Keterampilan yang sudah dimiliki (${ownedTechnical.length})`}>
          <ul className="space-y-2">
            {ownedTechnical.map((s) => (
              <li key={s.id} className="flex items-center gap-2 text-[13px] text-ink">
                <span className="grid size-4 shrink-0 place-items-center rounded-full bg-emerald-500 text-white">
                  <Check className="size-2.5" aria-hidden="true" />
                </span>
                {s.name}
              </li>
            ))}
          </ul>
        </Fold>
      )}
    </section>
  );
}
