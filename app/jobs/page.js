import { Suspense } from "react";

import PublicShell from "@/components/layout/public-shell";
import JobCatalog, { JobCatalogFromUrl } from "@/components/jobs/job-catalog";
import { PageBanner } from "@/components/ui/page-banner";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { fetchCatalogJobs } from "@/lib/job-catalog-db";

export const metadata = {
  title: "Lowongan Karier Hijau | Laras Karya",
  description:
    "Jelajahi semua lowongan sektor hijau yang masih dibuka. Cari dan saring berdasarkan sektor, kota, pola kerja, fasilitas pendukung, dan pengalaman.",
};

/** Placeholder saat daftar lowongan dimuat dari database. */
function CatalogSkeleton() {
  return (
    <div className="mt-6 space-y-4" role="status" aria-label="Memuat lowongan">
      <div className="h-28 animate-pulse rounded-2xl bg-white/80" />
      <div className="h-36 animate-pulse rounded-2xl bg-white/80" />
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="h-64 animate-pulse rounded-2xl bg-white/80" />
        ))}
      </div>
    </div>
  );
}

/** Mengambil lowongan di server, lalu mengirimnya ke komponen katalog (client) lewat props. */
async function CatalogLoader() {
  const { jobs, error } = isSupabaseConfigured
    ? await fetchCatalogJobs()
    : { jobs: [], error: "Koneksi database belum dikonfigurasi." };
  if (error) {
    return (
      <div role="alert" className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
        {error}
      </div>
    );
  }
  return (
    // JobCatalogFromUrl membaca ?q= dari URL; selama itu, daftar tanpa pencarian tampil lebih dulu
    <Suspense fallback={<JobCatalog jobs={jobs} />}>
      <JobCatalogFromUrl jobs={jobs} />
    </Suspense>
  );
}

export default function PublicJobsPage() {
  return (
    <PublicShell active="/jobs">
      <main className="flex-1 bg-surface">
        <div className="mx-auto max-w-[1200px] px-4 pb-16 pt-8 md:px-6 xl:px-8">
          <PageBanner image="/images/banner-jobs.jpg" imagePosition="center 12%" title="Lowongan Karier Hijau">
            Jelajahi semua lowongan sektor hijau yang masih dibuka, dari energi terbarukan sampai konservasi.
          </PageBanner>
          <Suspense fallback={<CatalogSkeleton />}>
            <CatalogLoader />
          </Suspense>
        </div>
      </main>
    </PublicShell>
  );
}
