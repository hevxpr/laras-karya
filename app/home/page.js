import { Suspense } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { HistoryGate } from "@/components/demo/history-gate";
import { CourseCard } from "@/components/home/course-card";
import { ProfileCompletion } from "@/components/home/profile-completion";
import { RecentApplications } from "@/components/home/recent-applications";
import { RecommendedJobs } from "@/components/home/recommended-jobs";
import { WelcomeBanner } from "@/components/home/welcome-banner";
import { PROFILE_MISSING, PROFILE_REMAINING } from "@/lib/profile-data";
import { Footer } from "@/components/layout/footer";
import { loadMyProfile } from "@/app/profile/data-actions";
import { fetchMyApplications } from "@/lib/applications-db";
import { hasCompletedAssessment } from "@/lib/assessment-status";
import { fetchHomeCourses } from "@/lib/home-courses-db";
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

  Kartu kelengkapan profil dihitung dari profil sungguhan (loadMyProfile, rumus yang sama dengan /profile).
  Bila profil gagal dibaca, kartunya disembunyikan (tidak menampilkan angka contoh).
*/
async function HomeTop() {
  const user = await getCurrentUser();
  let firstName = HOME_USER.firstName;
  let matchedJobs = HOME_USER.matchedJobs;
  let jobs = MOCK_JOBS;
  let error = null;
  let profile = { completeness: HOME_USER.profileCompleteness, remaining: PROFILE_REMAINING, missing: PROFILE_MISSING }; // data contoh bila tanpa sesi
  let applications; // undefined = RecentApplications memakai data contoh
  let assessmentDone = true; // tanpa sesi (data contoh) atau gagal dibaca: tampilan lama, bukan ajakan
  if (user) {
    firstName = user.name?.trim().split(/\s+/)[0] || "Anda";
    const [recommended, mine, myProfile, assessed] = await Promise.all([
      fetchHomeRecommendations(user),
      fetchMyApplications(user),
      loadMyProfile(),
      hasCompletedAssessment(user),
    ]);
    assessmentDone = assessed !== false;
    ({ matchedJobs, jobs, error } = recommended);
    profile = myProfile; // null bila gagal dibaca
    applications = mine.applications;
  }
  return (
    <>
      <div className="space-y-3">
        <WelcomeBanner firstName={firstName} matchedJobs={matchedJobs} assessmentDone={assessmentDone} />
        {profile && <ProfileCompletion value={profile.completeness} missing={profile.missing} remaining={profile.remaining} />}
      </div>
      {error ? (
        <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
          {error}
        </div>
      ) : (
        <RecommendedJobs jobs={jobs} assessmentDone={assessmentDone} />
      )}
      <RecentApplications applications={applications} />
    </>
  );
}

/*
  Isi bagian Pelatihan: saran AI dan tiga kartu pelatihan. Dibaca dari Supabase (lib/home-courses-db.js)
  dari skill gap lowongan yang cocok untuk user. Tanpa sesi (mis. env Supabase belum diisi di komputer
  lokal), tampil data contoh seperti sebelumnya.
*/
async function HomeCourses() {
  const user = await getCurrentUser();
  let suggestion = HOME_ALERT;
  let courses = MOCK_COURSES;
  let note = null;
  let error = null;
  if (user) ({ alert: suggestion, courses, note, error } = await fetchHomeCourses(user));

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="courses-title" className="text-base font-bold text-ink md:text-lg">
            Pelatihan untuk Menutup Skill Gap Anda
          </h2>
          {suggestion ? (
            <p className="mt-0.5 text-xs text-ink/75">
              <span className="font-bold text-ai">Saran AI:</span> selesaikan{" "}
              <strong className="font-bold text-ai">{suggestion.skill}</strong>
              {suggestion.gapCount > 0 ? (
                <>
                  {", skill gap yang muncul di "}
                  <strong className="font-bold text-ai">{suggestion.gapCount}</strong>
                  {" lowongan cocok Anda"}
                </>
              ) : null}
              .
            </p>
          ) : null}
        </div>
        <Link
          href="/learning-path"
          className="inline-flex min-h-11 items-center gap-1 text-xs font-bold text-brand hover:underline md:min-h-0"
        >
          Lihat Semua Pelatihan <ArrowRight className="size-3.5" aria-hidden="true" />
        </Link>
      </div>

      {courses.length > 0 ? (
        <div className="grid gap-5 md:grid-cols-3">
          {courses.map((c) => (
            <CourseCard key={c.id} course={c} />
          ))}
        </div>
      ) : (
        // Belum ada rekomendasi: info dengan gaya yang sama seperti bagian Rekomendasi Lowongan
        <p className="rounded-xl border border-dashed border-mint-line bg-white px-5 py-8 text-center text-sm text-ink/75">
          {error ??
            note ??
            "Belum ada rekomendasi pelatihan. Selesaikan asesmen karier, lalu tekan Perbarui Rekomendasi di atas."}
        </p>
      )}
    </>
  );
}

/** Placeholder saat saran pelatihan dimuat. */
function HomeCoursesSkeleton() {
  return (
    <div role="status" aria-label="Memuat saran pelatihan" className="space-y-5">
      <div className="h-10 w-80 max-w-full animate-pulse rounded-lg bg-white/70 motion-reduce:animate-none" />
      <div className="grid gap-5 md:grid-cols-3">
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} className="h-[440px] animate-pulse rounded-2xl bg-white/80 motion-reduce:animate-none" />
        ))}
      </div>
    </div>
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
            <Suspense fallback={<HomeCoursesSkeleton />}>
              <HomeCourses />
            </Suspense>
          </div>
        </section>
      </main>

      <Footer />
    </div>
    </HistoryGate>
  );
}