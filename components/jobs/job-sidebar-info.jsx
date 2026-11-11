import { Check } from "lucide-react";

import { groupSkills } from "@/lib/skill-groups";

/**
 * Satu pil keahlian: hijau = sudah dimiliki. Yang belum dimiliki: bingkai merah untuk skill teknis
 * (ada tindakan yang bisa diambil), bingkai netral untuk skill pendukung (tidak terasa sebagai kekurangan).
 */
function SkillPill({ s, supporting = false }) {
  if (s.status === "dimiliki") {
    return (
      <li className="inline-flex items-center gap-1 rounded-full bg-brand px-3 py-1 text-xs font-semibold text-white">
        <Check className="size-3" aria-hidden="true" /> {s.name}
        <span className="sr-only"> (sudah dimiliki)</span>
      </li>
    );
  }
  return (
    <li
      className={
        supporting
          ? "rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-semibold text-slate-600"
          : "rounded-full border border-red-300 bg-white px-3 py-1 text-xs font-semibold text-red-700"
      }
    >
      {s.name}
      <span className="sr-only"> (belum dimiliki)</span>
    </li>
  );
}

const GROUP_LABEL = "text-xs font-bold uppercase tracking-wide text-ink/60";

/**
 * Kartu "Keterampilan yang Dibutuhkan".
 * Lowongan dari database dibagi: Keterampilan Teknis (is_required) dan Keterampilan Pendukung.
 * Data contoh tampil sebagai satu daftar seperti sebelumnya.
 * Gaji dan lokasi ada di header, aksi melamar ada di MatchSkillGapCard.
 * @param {{ job: import("@/lib/job-detail-data").JobDetail }} props
 */
export function JobSidebarInfo({ job }) {
  const g = groupSkills(job.skills);

  return (
    <section
      aria-labelledby="skills-title"
      className="rounded-xl bg-white p-5 shadow-sm"
    >
      <h2 id="skills-title" className="text-[15px] font-bold text-ink">
        Keterampilan yang Dibutuhkan
      </h2>

      {g.structured ? (
        <>
          {g.technical.length > 0 && (
            <div className="mt-4">
              <h3 className={GROUP_LABEL}>Keterampilan teknis</h3>
              <ul className="mt-2 flex flex-wrap gap-2">
                {g.technical.map((s) => (
                  <SkillPill key={s.id} s={s} />
                ))}
              </ul>
            </div>
          )}
          {g.supporting.length > 0 && (
            <div className="mt-4">
              <h3 className={GROUP_LABEL}>Keterampilan pendukung</h3>
              <ul className="mt-2 flex flex-wrap gap-2">
                {g.supporting.map((s) => (
                  <SkillPill key={s.id} s={s} supporting />
                ))}
              </ul>
              <p className="mt-2 text-xs text-ink/60">
                Keterampilan pendukung diasah lewat pengalaman, bukan pelatihan.
              </p>
            </div>
          )}
        </>
      ) : (
        <ul className="mt-3 flex flex-wrap gap-2">
          {job.skills.map((s) => (
            <SkillPill key={s.id} s={s} />
          ))}
        </ul>
      )}
    </section>
  );
}
