import Link from "next/link";
import {
  ArrowRight,
  Search,
  Lightbulb,
  TrendingUp,
  CircleCheck,
  Star,
} from "lucide-react";

import { CompanyAvatar } from "@/components/ui/company-avatar";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { fetchLandingJobs } from "@/lib/job-catalog-db";

const questions = [
  {
    icon: Search,
    title: "Apa yang cocok untuk saya?",
    text: "Kami carikan lowongan hijau yang sesuai dengan pengalaman Anda.",
  },
  {
    icon: Lightbulb,
    title: "Mengapa ini cocok?",
    text: "Setiap rekomendasi disertai alasan yang jelas.",
  },
  {
    icon: TrendingUp,
    title: "Apa yang masih kurang?",
    text: "Lihat keterampilan yang perlu dilengkapi.",
  },
  {
    icon: CircleCheck,
    title: "Apa langkah selanjutnya?",
    text: "Temukan pelatihan, siapkan CV, lalu lamar dan pantau statusnya.",
  },
];

export function Questions() {
  return (
    <section className="bg-brand-light">
      <div className="mx-auto max-w-[1200px] px-4 py-16 md:px-6 xl:px-8">
        <h2 className="text-3xl font-bold text-ink">
          Empat pertanyaan yang kami bantu jawab
        </h2>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {questions.map(({ icon: Icon, title, text }) => (
            <article
              key={title}
              className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-mint-line transition hover:-translate-y-1 hover:shadow-md"
            >
              <span className="grid h-12 w-12 place-items-center rounded-xl bg-brand-light text-brand">
                <Icon className="h-6 w-6" aria-hidden />
              </span>
              <h3 className="mt-5 text-lg font-bold leading-snug text-ink lg:min-h-[3.25rem]">
                {title}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-slate-600">
                {text}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

/** Kerangka bagian pratinjau saat lowongan dimuat dari database. */
export function JobsSkeleton() {
  return (
    <section className="bg-white" role="status" aria-label="Memuat lowongan">
      <div className="mx-auto max-w-[1200px] px-4 py-16 md:px-6 xl:px-8">
        <div className="h-9 w-72 max-w-full animate-pulse rounded-lg bg-slate-100 motion-reduce:animate-none" />
        <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="h-[118px] animate-pulse rounded-2xl bg-slate-100 motion-reduce:animate-none" />
          ))}
        </div>
      </div>
    </section>
  );
}

/* Pratinjau lowongan hijau: enam lowongan dari Supabase (lib/job-catalog-db.js, fetchLandingJobs). */
export async function Jobs() {
  const { jobs, error } = isSupabaseConfigured
    ? await fetchLandingJobs()
    : { jobs: [], error: "Pratinjau lowongan belum bisa dimuat." };
  return (
    <section className="bg-white">
      <div className="mx-auto max-w-[1200px] px-4 py-16 md:px-6 xl:px-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
          <div>
            <h2 className="text-3xl font-bold text-ink">
              Pratinjau lowongan hijau
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Sekilas pilihan di berbagai sektor. Selesaikan asesmen untuk
              melihat yang sesuai dengan profil Anda.
            </p>
          </div>
          <Link
            href="/jobs"
            className="flex shrink-0 items-center gap-1 whitespace-nowrap text-sm font-semibold text-brand hover:underline"
          >
            Lihat Semua <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
        {jobs.length === 0 ? (
          <p className="mt-8 rounded-2xl border border-dashed border-slate-200 px-5 py-8 text-center text-sm text-slate-600">
            {error ?? "Belum ada lowongan yang bisa ditampilkan."} Lihat daftar lengkapnya di halaman Lowongan.
          </p>
        ) : (
          <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {jobs.map((j) => (
              <Link
                key={j.id}
                href="/jobs"
                className="flex items-start gap-3 rounded-2xl border border-slate-200 p-5 transition hover:border-brand"
              >
                <CompanyAvatar
                  company={j.company}
                  sector={j.tag}
                  className="h-10 w-10 text-sm"
                />
                <div className="min-w-0">
                  <h3 className="text-lg font-bold leading-snug text-ink">
                    {j.title}
                  </h3>
                  <p className="text-sm text-slate-600">{j.company}</p>
                  <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                    <span className="text-slate-600">{j.place}</span>
                    <span className="font-semibold text-brand">{j.salary}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export function CtaBanner() {
  return (
    <section className="bg-surface">
      <div className="mx-auto max-w-[1200px] px-4 py-10 md:px-6 xl:px-8">
        <div className="flex flex-col items-start justify-between gap-6 rounded-3xl bg-brand p-8 md:flex-row md:items-center md:p-14">
          <div className="max-w-xl">
            <span className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-xs font-bold text-ai">
              <Star className="h-3 w-3" aria-hidden /> ASESMEN 5 MENIT
            </span>
            <h2 className="mt-4 text-3xl font-bold text-white">
              Temukan Kecocokan Karier Anda
            </h2>
            <p className="mt-4 text-balance leading-relaxed text-emerald-100/80">
              Rekomendasi karier hijau yang disusun dari pengalaman Anda,
              lengkap dengan penjelasannya.
            </p>
          </div>
          <Link
            href="/assessment"
            className="rounded-full bg-white px-7 py-3.5 text-sm font-bold text-brand transition hover:bg-emerald-50"
          >
            Mulai Asesmen Gratis
          </Link>
        </div>
      </div>
    </section>
  );
}
