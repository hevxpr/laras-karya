import { Suspense } from "react";

import PublicShell from "@/components/layout/public-shell";
import Hero from "@/components/landing/hero";
import { Questions, Jobs, JobsSkeleton, CtaBanner } from "@/components/landing/sections";

export default function LandingPage() {
  return (
    <PublicShell active="/">
      <main>
        <Hero />
        <Questions />
        <Suspense fallback={<JobsSkeleton />}>
          <Jobs />
        </Suspense>
        <CtaBanner />
      </main>
    </PublicShell>
  );
}
