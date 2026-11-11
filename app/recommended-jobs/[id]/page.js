import { Suspense } from "react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ChevronLeft } from "lucide-react";

import { FitReasonBanner } from "@/components/jobs/fit-reason-banner";
import { JobHeader } from "@/components/jobs/job-header";
import { JobRequirements } from "@/components/jobs/job-requirements";
import { JobSidebarInfo } from "@/components/jobs/job-sidebar-info";
import { SkillGapPlan } from "@/components/jobs/skill-gap-plan";
import { MatchSkillGapCard } from "@/components/jobs/match-skill-gap-card";
import { MobileApplyBar } from "@/components/jobs/mobile-apply-bar";
//import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { countMissingSkills, getJobDetail } from "@/lib/job-detail-data";
import { fetchJobDetail } from "@/lib/job-detail-db";
import { isUuid } from "@/lib/job-detail-mapping";
import { loginTo } from "@/lib/routes";
import { getCurrentUser } from "@/lib/session";

/*
  Metadata statis. generateMetadata yang membaca `params` dihapus karena
  Next.js 16 (Cache Components) menganggap `params` sebagai data runtime.
*/
export const metadata = {
  title: "Detail Lowongan | Laras Karya",
};

/** Placeholder saat konten lowongan dimuat. */
function JobDetailSkeleton() {
  return (
    <div
      className="grid gap-4 lg:grid-cols-3"
      role="status"
      aria-label="Memuat detail lowongan"
    >
      <div className="space-y-4 lg:col-span-2">
        <div className="h-40 animate-pulse rounded-xl bg-white/80" />
        <div className="h-48 animate-pulse rounded-xl bg-white/80" />
        <div className="h-56 animate-pulse rounded-xl bg-white/80" />
      </div>
      <div className="space-y-4">
        <div className="h-64 animate-pulse rounded-xl bg-white/80" />
        <div className="h-72 animate-pulse rounded-xl bg-brand/30" />
      </div>
    </div>
  );
}

/**
 * Id UUID = lowongan dari database Supabase (wajib masuk, karena skor dan keahlian milik user).
 * Id angka (1–15) = data contoh untuk demo, tetap berjalan seperti sebelumnya.
 */
async function loadJob(id) {
  if (!isUuid(id)) return getJobDetail(id);

  const user = await getCurrentUser();
  if (!user) redirect(loginTo(`/recommended-jobs/${id}`));

  const job = await fetchJobDetail(id, user);
  if (!job) notFound();
  return job;
}

/**
 * Bagian yang membaca `params`. Dipisah dan dibungkus <Suspense> di halaman,
 * sehingga `await params` tidak lagi memblokir prerender (aturan Next.js 16).
 * @param {{ params: Promise<{ id: string }> }} props
 */
async function JobDetailContent({ params }) {
  const { id } = await params;
  const job = await loadJob(id);

  return (
    <>
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <JobHeader job={job} />
          <FitReasonBanner
            job={job}
            missingCount={countMissingSkills(job.skills)}
          />
          <JobSidebarInfo job={job} />
          <SkillGapPlan job={job} />
          <JobRequirements job={job} />
        </div>

        <aside aria-label="Kecocokan profil dan aksi melamar">
          <MatchSkillGapCard job={job} planHref="rencana-belajar" />
        </aside>
      </div>
      <MobileApplyBar job={job} />
    </>
  );
}

/*
  F04b/F04c · detail lowongan.
  Desktop (≥1024): 2 kolom (konten 2/3, sidebar 1/3) · Tablet & mobile: 1 kolom bertumpuk.
  Kerangka (navbar, tautan kembali, footer) statis; konten lowongan di-stream lewat Suspense.
*/
export default function JobDetailPage({ params }) {
  return (
    <div className="flex min-h-screen flex-col bg-surface pb-20 lg:pb-0">
      {/* <Navbar /> */}

      <main className="mx-auto w-full max-w-[1040px] flex-1 px-4 py-6 md:px-6 md:py-8">
        <Link
          href="/recommended-jobs"
          className="mb-4 inline-flex min-h-11 items-center gap-1 text-xs text-ink/75 hover:text-brand hover:underline md:min-h-0"
        >
          <ChevronLeft className="size-3.5" aria-hidden="true" />
          Kembali ke Rekomendasi
        </Link>

        <Suspense fallback={<JobDetailSkeleton />}>
          <JobDetailContent params={params} />
        </Suspense>
      </main>

      <Footer />
    </div>
  );
}
