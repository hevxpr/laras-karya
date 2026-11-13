import { Sparkles } from "lucide-react";

import { FitMatchLine } from "@/components/jobs/fit-reason-banner";
import { getJobExplanation } from "@/lib/ai-job-explanation";
import { getCurrentUser } from "@/lib/session";

/**
 * Ringkasan 2-3 kalimat di kartu "Mengapa lowongan ini cocok untuk Anda", disusun Gemini dari data
 * terstruktur (lib/ai-job-explanation.js). Komponen server: dipasang di dalam <Suspense> oleh halaman,
 * dengan <FitMatchLine> (baris kecocokan biasa) sebagai fallback. Jadi halaman tidak menunggu AI,
 * dan bila Gemini gagal atau lewat 10 detik, yang tampil tetap baris biasa itu.
 * @param {{ job: import("@/lib/job-detail-data").JobDetail }} props
 */
export async function AiFitSummary({ job }) {
  const user = await getCurrentUser();
  const text = user ? await getJobExplanation(job, user) : null;
  if (!text) return <FitMatchLine job={job} />;

  return (
    <div className="mt-2">
      <p className="text-[13px] leading-relaxed text-ink/85">{text}</p>
      <p className="mt-1.5 inline-flex items-center gap-1 text-[11px] text-ink/60">
        <Sparkles className="size-3" aria-hidden="true" />
        Dijelaskan dengan bantuan AI. Skor dan daftar keahlian di bawah dihitung dari data, bukan oleh AI.
      </p>
    </div>
  );
}
