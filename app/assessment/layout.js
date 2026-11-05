import { AssessmentPrefill } from "@/components/assessment/assessment-sync";

/** Kerangka bersama semua halaman /assessment/*: latar dan lebar kartu. */
export default function AssessmentLayout({ children }) {
  return (
    <main className="flex-1 bg-surface px-4 py-8 sm:py-12">
      <AssessmentPrefill />
      <div className="mx-auto w-full max-w-[640px]">{children}</div>
    </main>
  );
}
