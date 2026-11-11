import { Suspense } from "react";
import Link from "next/link";
import { HistoryGate } from "@/components/demo/history-gate";
import { Footer } from "@/components/layout/footer";
import { ChevronRight } from "lucide-react";

// ⬇️ DIUBAH: ApplicationHistory sekarang dipakai lewat ApplicationsView (kartu statistik + riwayat berbagi filter)
import { ApplicationsView } from "@/components/applications/applications-view";
import { DocumentPrepBanner } from "@/components/applications/document-prep-banner";
//import { Navbar } from "@/components/layout/navbar";
// ⬇️ DIHAPUS: import StatCard dan STAT_CARDS (dipindah ke ApplicationsView)
import { MOCK_APPLICATIONS } from "@/lib/applications-data";
import { fetchMyApplications } from "@/lib/applications-db";
import { getCurrentUser } from "@/lib/session";

export const metadata = {
  title: "Lamaran Saya & Status Tracker | Laras Karya",
};

/*
  Isi halaman dibaca dari Supabase (lib/applications-db.js) untuk user yang sedang masuk, jadi status yang
  diubah di tabel applications (Interview / Diterima / Ditolak) tampil di kartu statistik, filter, dan
  riwayat setelah halaman dimuat ulang. Tanpa sesi (mis. env Supabase belum diisi di komputer lokal),
  tampil data contoh seperti sebelumnya.
*/
async function ApplicationsContent() {
  const user = await getCurrentUser();
  if (!user) return <ApplicationsView applications={MOCK_APPLICATIONS} />;

  const { applications, error } = await fetchMyApplications(user);
  if (error) {
    return (
      <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
        {error}
      </div>
    );
  }
  return <ApplicationsView applications={applications} />;
}

/** Placeholder saat lamaran dimuat. */
function ApplicationsSkeleton() {
  return (
    <div role="status" aria-label="Memuat lamaran" className="space-y-6">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} className="h-[88px] animate-pulse rounded-xl bg-white/80 motion-reduce:animate-none" />
        ))}
      </div>
      <div className="h-72 animate-pulse rounded-2xl bg-black/5 motion-reduce:animate-none" />
    </div>
  );
}

/* F05 · application-tracker. Kerangka statis; isi lamaran di-stream lewat Suspense. */
export default function ApplicationsPage() {
  return (
    <HistoryGate>
    <div className="flex min-h-screen flex-col bg-surface">
      {/* <Navbar /> */}

      <main className="mx-auto w-full max-w-[1200px] flex-1 space-y-6 px-4 py-6 md:px-6 md:py-8 xl:px-8">
        <header className="space-y-2">
          <nav aria-label="Breadcrumb" className="text-xs text-ink/70">
            <ol className="flex items-center gap-1">
              <li>
                <Link href="/home" className="hover:text-brand hover:underline">Beranda</Link>
              </li>
              <li aria-hidden="true">
                <ChevronRight className="size-3" />
              </li>
              <li aria-current="page">Lamaran Saya</li>
            </ol>
          </nav>
          <h1 className="text-2xl font-bold text-brand md:text-[26px]">Lamaran Saya &amp; Status Tracker</h1>
          <p className="text-sm text-ink/80">Pantau status lamaran dan persiapan dokumen Anda di satu tempat.</p>
        </header>

        {/* ⬇️ DIUBAH: blok kartu statistik (STAT_CARDS.map) dan <ApplicationHistory /> digabung menjadi satu komponen */}
        <Suspense fallback={<ApplicationsSkeleton />}>
          <ApplicationsContent />
        </Suspense>

        {/* Catatan: jika banner dokumen diaktifkan lagi, letakkan di bawah ApplicationsView
            (atau pindahkan ke dalam applications-view.jsx bila ingin berada di antara kartu dan riwayat). */}
        {/*<DocumentPrepBanner checklist={MOCK_DOCUMENT_CHECKLIST} profileCompleteness={MOCK_PROFILE_COMPLETENESS} />*/}
      </main>

      <Footer />
    </div>
    </HistoryGate>
  );
}
