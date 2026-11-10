import { Suspense } from "react";
import Link from "next/link";
import SavedJobs from "@/components/bookmarks/saved-jobs";
import { HistoryGate } from "@/components/demo/history-gate";
import { Footer } from "@/components/layout/footer";
import { fetchSavedJobs } from "@/lib/saved-jobs-db";
import { getCurrentUser } from "@/lib/session";

export const metadata = {
  title: "Lowongan Tersimpan | Laras Karya",
  description: "Daftar pekerjaan hijau yang Anda tandai untuk dilamar nanti.",
};

/** Placeholder saat daftar tersimpan dimuat. */
function SavedJobsSkeleton() {
  return (
    <div role="status" aria-label="Memuat lowongan tersimpan" className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
      {[0, 1, 2].map((i) => (
        <div key={i} className="h-64 animate-pulse rounded-2xl bg-white/80" />
      ))}
    </div>
  );
}

/**
 * Lowongan tersimpan dari database (saved_jobs milik user yang masuk).
 * Dipisah dan dibungkus <Suspense> karena membaca sesi, sama seperti halaman detail (aturan Next.js 16).
 * Mode demo: bila user belum menyimpan apa pun, SavedJobs menampilkan data contoh (lib/mock-saved-jobs.js).
 */
async function SavedJobsLoader() {
  const user = await getCurrentUser();
  const jobs = user ? await fetchSavedJobs(user) : [];
  return <SavedJobs initialJobs={jobs} />;
}

export default function BookmarksPage() {
  return (
    <HistoryGate>
    <main className="flex-1 bg-surface">
      <div className="mx-auto max-w-[1200px] px-4 md:px-6 xl:px-8 pb-16 pt-8">
        <nav aria-label="Breadcrumb" className="text-sm text-slate-600">
          <Link href="/home" className="hover:underline">Beranda</Link> /{" "}
          <Link href="/recommended-jobs" className="hover:underline">Lowongan</Link> /{" "}
          <span aria-current="page">Tersimpan</span>
        </nav>

        <Suspense fallback={<SavedJobsSkeleton />}>
          <SavedJobsLoader />
        </Suspense>
      </div>

      <Footer />
    </main>
    </HistoryGate>
  );
}
