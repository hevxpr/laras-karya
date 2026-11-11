import { Suspense } from "react";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import JobList, { JobListFromUrl } from "@/components/jobs/job-list";
import { GuestPreview } from "@/components/jobs/guest-preview";
import { Footer } from "@/components/layout/footer";
import { PageBanner } from "@/components/ui/page-banner";
import { fetchRecommendedJobs } from "@/lib/recommended-jobs-db";
import { getCurrentUser } from "@/lib/session";

export const metadata = {
  title: "Rekomendasi Karier Hijau | Laras Karya",
  description:
    "Pekerjaan sektor hijau yang paling cocok dengan profil Anda, berdasarkan hasil asesmen.",
};

/*
  Dua keadaan halaman ini:
  - tamu (belum masuk)  -> GuestPreview: satu rekomendasi utuh, sisanya buram + ajakan daftar
  - pengguna sudah masuk -> daftar penuh (JobList)
  Pembedanya sesi Supabase Auth (lib/session.js), dibaca di server di dalam <Suspense>.
  Daftar penuh dibaca dari Supabase (lib/recommended-jobs-db.js) lalu dikirim ke JobList lewat props.
  Pratinjau tamu masih memakai data contoh.
*/
async function Results() {
  const user = await getCurrentUser();
  if (!user) return <GuestPreview />;
  const { jobs, error } = await fetchRecommendedJobs(user);
  if (error) {
    return (
      <div role="alert" className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
        {error}
      </div>
    );
  }
  // JobListFromUrl membaca ?q= dari URL; selama itu, daftar tanpa pencarian tampil lebih dulu
  return (
    <Suspense fallback={<JobList jobs={jobs} />}>
      <JobListFromUrl jobs={jobs} />
    </Suspense>
  );
}

function ResultsSkeleton() {
  return (
    <div role="status" aria-label="Memuat rekomendasi" className="mt-6 space-y-5">
      <div className="h-6 w-2/3 max-w-md animate-pulse rounded bg-black/10 motion-reduce:animate-none" />
      <div className="h-64 animate-pulse rounded-2xl bg-black/5 motion-reduce:animate-none" />
    </div>
  );
}

export default function RecommendedJobsPage() {
  return (
    <main className="flex-1 bg-surface">
      <div className="mx-auto max-w-[1200px] px-4 md:px-6 xl:px-8 pb-16 pt-8">
        <nav aria-label="Breadcrumb" className="text-sm text-slate-600">
          <Link href="/home" className="hover:underline">
            Beranda
          </Link>{" "}
          / <span>Rekomendasi Karier</span>
        </nav>

        <div className="mt-3">
          <PageBanner
            image="/images/banner-jobs.jpg"
            imagePosition="center 12%"
            badge={
              <span className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-xs font-semibold text-ai">
                <Sparkles className="h-3 w-3" aria-hidden /> Berdasarkan hasil
                asesmen
              </span>
            }
            title="Rekomendasi Karier Hijau Anda"
          >
            Pekerjaan hijau yang paling cocok dengan profil Anda.
          </PageBanner>
        </div>

        <Suspense fallback={<ResultsSkeleton />}>
          <Results />
        </Suspense>
      </div>

      <Footer />
    </main>
  );
}
