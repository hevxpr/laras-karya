import { Suspense } from "react";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import JobList, { JobListFromUrl } from "@/components/jobs/job-list";
import { GuestPreview } from "@/components/jobs/guest-preview";
import { Footer } from "@/components/layout/footer";
import { PageBanner } from "@/components/ui/page-banner";
import { hasCompletedAssessment } from "@/lib/assessment-status";
<<<<<<< HEAD
import { fetchGuestPreview } from "@/lib/guest-preview-db";
=======
>>>>>>> c5e2fed3d2a789827c54fbf733966f0ae4942fba
import { fetchRecommendedJobs } from "@/lib/recommended-jobs-db";
import { getCurrentUser } from "@/lib/session";

export const metadata = {
  title: "Rekomendasi Karier Hijau | Laras Karya",
  description:
    "Pekerjaan sektor hijau yang paling cocok dengan profil Anda, berdasarkan hasil asesmen.",
};

function BannerBadge({ children }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-xs font-semibold text-ai">
      <Sparkles className="h-3 w-3" aria-hidden /> {children}
    </span>
  );
}

/*
  Lencana banner. "Berdasarkan hasil asesmen" hanya benar untuk user yang sudah asesmen; untuk tamu dan
  user baru dipakai kalimat netral. Dibaca di server di dalam <Suspense> (banner sendiri statis),
  dan selama dimuat tampil kalimat netral yang sama.
*/
async function AssessmentBadge() {
  const user = await getCurrentUser();
  const done = user ? await hasCompletedAssessment(user) : false;
  return <BannerBadge>{done === false ? "Rekomendasi karier hijau" : "Berdasarkan hasil asesmen"}</BannerBadge>;
}

/*
  Dua keadaan halaman ini:
  - tamu (belum masuk)  -> GuestPreview: satu rekomendasi utuh, sisanya buram + ajakan daftar
  - pengguna sudah masuk -> daftar penuh (JobList)
  Pembedanya sesi Supabase Auth (lib/session.js), dibaca di server di dalam <Suspense>.
  Daftar penuh dibaca dari Supabase (lib/recommended-jobs-db.js) lalu dikirim ke JobList lewat props.
  Pratinjau tamu dibaca dari fungsi database guest_jobs_preview (lib/guest-preview-db.js).
*/
async function Results() {
  const user = await getCurrentUser();
  if (!user) {
    const { preview, error } = await fetchGuestPreview();
    if (error) {
      return (
        <div role="alert" className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
          {error}
        </div>
      );
    }
    return <GuestPreview preview={preview} />;
  }
  if (!user) return <GuestPreview />;
  const [{ jobs, error }, assessed] = await Promise.all([fetchRecommendedJobs(user), hasCompletedAssessment(user)]);
  const assessmentDone = assessed !== false; // gagal dibaca: anggap sudah, supaya tidak salah mengajak
  if (error) {
    return (
      <div role="alert" className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
        {error}
      </div>
    );
  }
  // JobListFromUrl membaca ?q= dari URL; selama itu, daftar tanpa pencarian tampil lebih dulu
  return (
    <Suspense fallback={<JobList jobs={jobs} assessmentDone={assessmentDone} />}>
      <JobListFromUrl jobs={jobs} assessmentDone={assessmentDone} />
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
              <Suspense fallback={<BannerBadge>Rekomendasi karier hijau</BannerBadge>}>
                <AssessmentBadge />
              </Suspense>
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
