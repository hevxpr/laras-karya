import { Suspense } from "react";
import { redirect } from "next/navigation";
import PrepareApplication from "@/components/applications/prepare-application";
import { Footer } from "@/components/layout/footer";
import { isUuid } from "@/lib/is-uuid";
import { fetchJobDetail } from "@/lib/job-detail-db";
import { JOBS } from "@/lib/mock-jobs";
import { loginTo } from "@/lib/routes";
import { getCurrentUser } from "@/lib/session";

export const metadata = {
  title: "Persiapan Lamaran | Laras Karya",
  description: "Lengkapi dan periksa dokumen Anda sebelum sebelum mengirim Lamaran.",
};

/** Detail lowongan dari database -> bentuk yang dipakai formulir persiapan (sama dengan lib/mock-jobs.js). */
function toPrepareJob(detail) {
  return {
    id: detail.id,
    title: detail.title,
    company: detail.company,
    sector: detail.sector,
    status: detail.isOpen ? "dibuka" : "ditutup",
    mode: detail.workMode ?? "",
    city: detail.city ?? "",
  };
}

/*
  /applications/prepare?job=<id>
  - id UUID  = lowongan dari database Supabase (wajib masuk). Status "sudah dilamar" dibaca dari tabel applications.
  - id angka = data contoh untuk demo, tetap berjalan seperti sebelumnya (tanpa menyimpan ke database).
  Tanpa parameter job, sementara dipakai lowongan contoh pertama.
  searchParams dibaca di sini (server) di dalam <Suspense>, sesuai aturan Next.js 16.
*/
async function PrepareLoader({ searchParams }) {
  const { job: param } = await searchParams;
  const raw = Array.isArray(param) ? param[0] : param;

  if (raw && isUuid(raw)) {
    const user = await getCurrentUser();
    if (!user) redirect(loginTo(`/applications/prepare?job=${raw}`));

    const detail = await fetchJobDetail(raw, user);
    return (
      <PrepareApplication
        job={detail ? toPrepareJob(detail) : null}
        alreadyApplied={Boolean(detail?.applied)}
      />
    );
  }

  const job = JOBS.find((j) => j.id === Number(raw ?? 1)) ?? null;
  return <PrepareApplication job={job} />;
}

export default function PrepareApplicationPage({ searchParams }) {
  return (
    <main className="flex-1 bg-surface">
      <Suspense
        fallback={
          <div role="status" className="mx-auto max-w-[1200px] px-4 py-16 text-slate-600 md:px-6 xl:px-8">
            Memuat persiapan lamaran…
          </div>
        }
      >
        <PrepareLoader searchParams={searchParams} />
      </Suspense>
      <Footer />
    </main>
  );
}
