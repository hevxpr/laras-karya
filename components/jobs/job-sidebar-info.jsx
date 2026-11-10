import { Check } from "lucide-react";

/** Satu pil keahlian: hijau = sudah dimiliki, bingkai merah = belum. */
function SkillPill({ s }) {
  return s.status === "dimiliki" ? (
    <li className="inline-flex items-center gap-1 rounded-full bg-brand px-3 py-1 text-xs font-semibold text-white">
      <Check className="size-3" aria-hidden="true" /> {s.name}
      <span className="sr-only"> (sudah dimiliki)</span>
    </li>
  ) : (
    <li className="rounded-full border border-red-300 bg-white px-3 py-1 text-xs font-semibold text-red-700">
      {s.name}
      <span className="sr-only"> (belum dimiliki)</span>
    </li>
  );
}

/**
 * Kartu "Keterampilan yang Dibutuhkan": pil hijau = sudah dimiliki, bingkai merah = belum.
 * Gaji dan lokasi ada di header, aksi melamar ada di MatchSkillGapCard.
 * @param {{ job: import("@/lib/job-detail-data").JobDetail }} props
 */
export function JobSidebarInfo({ job }) {
  // Lowongan dari database punya penanda wajib / nilai tambah (job_skills.is_required); data contoh tidak.
  const hasRequirement = job.skills.some((s) => typeof s.required === "boolean");
  const groups = hasRequirement
    ? [
        { key: "wajib", title: "Wajib", items: job.skills.filter((s) => s.required === true) },
        { key: "tambahan", title: "Nilai tambah", items: job.skills.filter((s) => s.required !== true) },
      ].filter((g) => g.items.length > 0)
    : [{ key: "semua", title: null, items: job.skills }];

  return (
    <section
      aria-labelledby="skills-title"
      className="rounded-xl bg-white p-5 shadow-sm"
    >
      <h2 id="skills-title" className="text-[15px] font-bold text-ink">
        Keterampilan yang Dibutuhkan
      </h2>
      {groups.map((g) => (
        <div key={g.key}>
          {g.title ? <h3 className="mt-4 text-xs font-semibold text-ink/70">{g.title}</h3> : null}
          <ul className={`flex flex-wrap gap-2 ${g.title ? "mt-2" : "mt-3"}`}>
            {g.items.map((s) => (
              <SkillPill key={s.id} s={s} />
            ))}
          </ul>
        </div>
      ))}
    </section>
  );
}