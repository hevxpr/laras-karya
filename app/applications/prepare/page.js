import { Suspense } from "react";
import { redirect } from "next/navigation";
import PrepareApplication from "@/components/applications/prepare-application";
import { Footer } from "@/components/layout/footer";
import { loadMyProfile } from "@/app/profile/data-actions";
import { toApplicant } from "@/lib/applicant-mapping";
import { isUuid } from "@/lib/is-uuid";
import { fetchJobDetail } from "@/lib/job-detail-db";
//import { MOCK_APPLICANT, MOCK_CERTIFICATIONS, MOCK_PORTFOLIOS } from "@/lib/mock-applicant";
import { JOBS } from "@/lib/mock-jobs";
import { loginTo } from "@/lib/routes";
import { getCurrentUser } from "@/lib/session";

export const metadata = {
  title: "Persiapan Lamaran | Laras Karya",
  description: "Lengkapi dan periksa dokumen Anda sebelum sebelum mengirim Lamaran.",
};

const SHORT_MONTHS = { Januari: "Jan", Februari: "Feb", Agustus: "Agu", Oktober: "Okt", Desember: "Des", September: "Sep", November: "Nov" };
/** "30 November 2026" -> "30 Nov 2026" (bulan lain sudah pendek atau tetap utuh). */
const shortDate = (text) => (text ? String(text).replace(/[A-Za-z]+/, (m) => SHORT_MONTHS[m] ?? m) : undefined);

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
    deadline: shortDate(detail.deadline),
  };
}

/*
  /applications/prepare?job=<id>
  - id UUID  = lowongan dari database Supabase (wajib masuk). Status "sudah dilamar" dibaca dari tabel applications,
               data pelamar (nama, telepon, pengalaman, pendidikan, keahlian) dari profil user (loadMyProfile).
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

    // Lowongan dan profil pelamar dibaca bersamaan; profil gagal dibaca (null) tetap menghasilkan formulir yang bisa dipakai.
    const [detail, profile] = await Promise.all([fetchJobDetail(raw, user), loadMyProfile()]);
    return (
      <PrepareApplication
        job={detail ? toPrepareJob(detail) : null}
        alreadyApplied={Boolean(detail?.applied)}
        applicant={toApplicant(profile, user)}
      />
    );
  }

  // Lowongan contoh (id angka): data pelamar contoh, seperti sebelumnya.
  const job = JOBS.find((j) => j.id === Number(raw ?? 1)) ?? null;
  const applicant = {
    name: MOCK_APPLICANT.name,
    phone: MOCK_APPLICANT.phone,
    lastJob: { title: MOCK_APPLICANT.lastJob.title, company: MOCK_APPLICANT.lastJob.company, period: `${MOCK_APPLICANT.lastJob.years} tahun` },
    education: MOCK_APPLICANT.education,
    skills: [],
    certifications: MOCK_CERTIFICATIONS,
    portfolios: MOCK_PORTFOLIOS,
    complete: true,
  };
  return <PrepareApplication job={job} applicant={applicant} />;
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
