import { Suspense } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { HistoryGate } from "@/components/demo/history-gate";
import { CourseCard } from "@/components/home/course-card";
import { ProfileCompletion } from "@/components/home/profile-completion";
import { RecentApplications } from "@/components/home/recent-applications";
import { RecommendedJobs } from "@/components/home/recommended-jobs";
import { WelcomeBanner } from "@/components/home/welcome-banner";
import { PROFILE_REMAINING } from "@/lib/profile-data";
import { Footer } from "@/components/layout/footer";
import { fetchHomeRecommendations } from "@/lib/recommended-jobs-db";
import { getCurrentUser } from "@/lib/session";
import {
  HOME_ALERT,
  HOME_USER,
  MOCK_COURSES,
  MOCK_JOBS,
} from "@/lib/home-data";

export const metadata = {
  title: "Beranda | Laras Karya",
};

/*
  Bagian atas Beranda (sapaan, rekomendasi lowongan, lamaran terbaru). Rekomendasi dibaca dari Supabase
  (lib/recommended-jobs-db.js) untuk user yang sedang masuk. Tanpa sesi (mis. env Supabase belum diisi
  di komputer lokal), tampil data contoh seperti sebelumnya. Bagian Pelatihan di bawah masih data contoh.
*/
async function HomeTop() {
  const user = await getCurrentUser();
  let firstName = HOME_USER.firstName;
  let matchedJobs = HOME_USER.matchedJobs;
  let jobs = MOCK_JOBS;
  let error = null;
  if (user) {
    firstName = user.name?.trim().split(/\s+/)[0] || "Anda";
    ({ matchedJobs, jobs, error } = await fetchHomeRecommendations(user));
  }
  return (
    <>
      <div className="space-y-3">
        <WelcomeBanner firstName={firstName} matchedJobs={matchedJobs} />
        <ProfileCompletion value={HOME_USER.profileCompleteness} remaining={PROFILE_REMAINING} />
      </div>
      {error ? (
        <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
          {error}
        </div>
      ) : (
        <RecommendedJobs jobs={jobs} />
      )}
      <RecentApplications />
    </>
  );
}

/** Placeholder saat data lowongan dimuat. */
function HomeTopSkeleton() {
  return (
    <div role="status" aria-label="Memuat Beranda" className="space-y-6">
      <div className="h-[240px] animate-pulse rounded-2xl bg-black/5 motion-reduce:animate-none" />
      <div className="grid gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} className="h-[176px] animate-pulse rounded-xl bg-white/80 motion-reduce:animate-none" />
        ))}
      </div>
    </div>
  );
}

/* Beranda / dashboard. Server component; hanya RecommendedJobs yang client (tombol perbarui). */
export default function HomePage() {
  return (
    <HistoryGate>
    <div className="flex min-h-screen flex-col bg-surface">
      <main className="flex-1">
        <div className="mx-auto w-full max-w-[1200px] space-y-10 px-4 py-6 md:space-y-12 md:px-6 md:py-8 xl:px-8">
          <Suspense fallback={<HomeTopSkeleton />}>
            <HomeTop />
          </Suspense>
        </div>

        {/* Pita hijau lembut selebar layar */}
        <section aria-labelledby="courses-title" className="mt-4 bg-mint">
          <div className="mx-auto w-full max-w-[1200px] space-y-5 px-4 py-10 md:px-6 xl:px-8">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2
                  id="courses-title"
                  className="text-base font-bold text-ink md:text-lg"
                >
                  Pelatihan untuk Menutup Skill Gap Anda
                </h2>
                <p className="mt-0.5 text-xs text-ink/75">
                  <span className="font-bold text-ai">Saran AI:</span>{" "}
                  selesaikan{" "}
                  <strong className="font-bold text-ai">
                    {HOME_ALERT.skill}
                  </strong>
                  {HOME_ALERT.gapCount > 0 ? (
                    <>
                      {", skill gap yang muncul di "}
                      <strong className="font-bold text-ai">
                        {HOME_ALERT.gapCount}
                      </strong>
                      {" lowongan cocok Anda"}
                    </>
                  ) : null}
                  .
                </p>
              </div>
              <Link
                href="/learning-path"
                className="inline-flex min-h-11 items-center gap-1 text-xs font-bold text-brand hover:underline md:min-h-0"
              >
                Lihat Semua Pelatihan{" "}
                <ArrowRight className="size-3.5" aria-hidden="true" />
              </Link>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {MOCK_COURSES.map((c) => (
                <CourseCard key={c.id} course={c} />
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
    </HistoryGate>
  );
}
