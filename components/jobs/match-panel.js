import Link from "next/link";
import { Check, Sparkles } from "lucide-react";
import { buildReasons } from "@/lib/match-reasons";
import { learningPathHref } from "@/app/api/learning/route";

export function splitSkills(job) {
  const missing = (job.gaps ?? []).map((g) => (Array.isArray(g) ? g[0] : g));
  const owned = job.skills.filter((s) => !missing.includes(s));
  return { owned, missing };
}

export function SkillGapList({ owned, missing }) {
  return (
    <div className="space-y-4">
      {owned.length > 0 && (
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-slate-600">
            Sudah Anda miliki
          </p>
          <ul className="mt-2 flex flex-wrap gap-2">
            {owned.map((s) => (
              <li
                key={s}
                className="inline-flex items-center gap-1 rounded-full bg-brand px-3 py-1 text-xs font-semibold text-white"
              >
                <Check className="h-3 w-3" aria-hidden /> {s}
              </li>
            ))}
          </ul>
        </div>
      )}
      {missing.length > 0 ? (
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-slate-600">
            Belum dimiliki
          </p>
          <ul className="mt-2 flex flex-wrap gap-2">
            {missing.map((s) => (
              <li
                key={s}
                className="rounded-full border border-red-300 bg-white px-3 py-1 text-xs font-semibold text-red-700"
              >
                {s}
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="text-sm text-slate-600">
          Semua keterampilan yang diminta sudah Anda miliki.
        </p>
      )}
    </div>
  );
}

/** Pengganti MatchPanel untuk tamu: belum ada skor, alasan, atau skill gap karena belum ada profil. */
export function GuestMatchPanel() {
  return (
    <aside aria-label="Kecocokan dengan profil Anda" className="rounded-2xl bg-white p-6">
      <h3 className="flex items-center gap-2 font-bold text-ai">
        <Sparkles className="h-4 w-4" aria-hidden /> Mengapa cocok untuk Anda
      </h3>
      <p className="mt-5 font-bold text-ink">Skor kecocokan dihitung dari profil Anda</p>
      <p className="mt-1 text-sm text-slate-600">
        Setelah masuk, Anda melihat tingkat kecocokan, alasan, dan skill gap untuk lowongan ini, berdasarkan keahlian,
        sektor, pengalaman, pola kerja, lokasi, dan pendidikan Anda.
      </p>
    </aside>
  );
}

export default function MatchPanel({ job }) {
  const r = 26;
  const c = 2 * Math.PI * r;
  const { owned, missing } = splitSkills(job);
  const reasons = job.reasons ?? buildReasons(job, owned);

  return (
    <aside aria-label="Alasan kecocokan" className="rounded-2xl bg-white p-6">
      <h3 className="flex items-center gap-2 font-bold text-ai">
        <Sparkles className="h-4 w-4" aria-hidden /> Mengapa cocok untuk Anda
      </h3>

      <div className="mt-5 flex items-center gap-4">
        <div className="relative h-16 w-16 shrink-0">
          <svg viewBox="0 0 64 64" className="h-16 w-16 -rotate-90" aria-hidden>
            <circle
              cx="32"
              cy="32"
              r={r}
              fill="none"
              strokeWidth="5"
              className="stroke-slate-200"
            />
            <circle
              cx="32"
              cy="32"
              r={r}
              fill="none"
              strokeWidth="5"
              strokeLinecap="round"
              className="stroke-brand"
              strokeDasharray={c}
              strokeDashoffset={c * (1 - job.match / 100)}
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-brand">
            {job.match}%
          </span>
        </div>
        <div>
          <p className="font-bold text-ink">Tingkat kecocokan</p>
          <p className="text-xs text-slate-600">
            Dihitung dari enam komponen: keahlian, sektor, pengalaman, pola kerja, pendidikan, dan lokasi.
          </p>
        </div>
      </div>

      <ul className="mt-5 space-y-2 text-sm text-slate-800">
        {reasons.map((t) => (
          <li key={t} className="flex items-center gap-2">
            <Check className="h-4 w-4 shrink-0 text-brand" aria-hidden /> {t}
          </li>
        ))}
      </ul>

      <div className="mt-6 border-t border-slate-200 pt-5">
        <h4 className="mb-4 font-bold text-ink">Skill Gap</h4>
        <SkillGapList owned={owned} missing={missing} />
        <Link
          href={learningPathHref(job.id)}
          className="mt-3 inline-flex min-h-11 items-center text-sm font-semibold text-brand hover:underline"
        >
          Lihat Pelatihan Terkait
        </Link>
      </div>
    </aside>
  );
}
