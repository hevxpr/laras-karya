import { Suspense } from "react";

import PublicShell from "@/components/layout/public-shell";
import JobCatalog, { JobCatalogFromUrl } from "@/components/jobs/job-catalog";
import { PageBanner } from "@/components/ui/page-banner";

export const metadata = {
  title: "Lowongan Karier Hijau | Laras Karya",
  description:
    "Jelajahi semua lowongan sektor hijau yang masih dibuka. Cari dan saring berdasarkan sektor, kota, pola kerja, fasilitas pendukung, dan pengalaman.",
};

export default function PublicJobsPage() {
  return (
    <PublicShell active="/jobs">
      <main className="flex-1 bg-surface">
        <div className="mx-auto max-w-[1200px] px-4 pb-16 pt-8 md:px-6 xl:px-8">
          <PageBanner image="/images/banner-jobs.jpg" title="Lowongan Karier Hijau">
            Jelajahi semua lowongan sektor hijau yang masih dibuka, dari energi terbarukan sampai konservasi.
          </PageBanner>
          {/* JobCatalogFromUrl membaca ?q= dari URL; selama itu, daftar tanpa pencarian tampil lebih dulu */}
          <Suspense fallback={<JobCatalog />}>
            <JobCatalogFromUrl />
          </Suspense>
        </div>
      </main>
    </PublicShell>
  );
}
