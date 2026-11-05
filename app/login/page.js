import Image from "next/image";
import Link from "next/link";
import { Lock, Mail } from "lucide-react";

import { login } from "./actions";

import { AuthShell } from "@/components/auth/auth-shell";
import { DemoPrefill } from "@/components/auth/demo-prefill";
import { AuthError } from "@/components/auth/auth-error";
import { NextField, NextLink } from "@/components/auth/next-field";
import { GoogleIcon } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { DEMO_CREDENTIALS } from "@/lib/demo-persona";

export const metadata = { title: "Masuk" };

const HIGHLIGHTS = [
  { value: "5 menit", label: "Asesmen Singkat" },
  { value: "AI", label: "Rekomendasi Personal" },
];

export default function LoginPage() {
  return (
    <AuthShell
      variant="forest"
      title="Temukan Karier Hijau yang Bermakna"
      description="Platform karier khusus perempuan untuk sektor lingkungan dan keberlanjutan."
      panelMedia={
        <div className="relative">
          <span
            aria-hidden="true"
            className="absolute -left-20 top-1/2 size-[340px] -translate-y-1/2 rounded-full bg-white/[0.04]"
          />
          <Image
            src="/images/login-hero.png"
            alt="Tiga perempuan profesional di sektor lingkungan: menanam bibit, membawa laptop, dan memegang tablet di lokasi proyek"
            width={551}
            height={471}
            priority
            className="relative h-auto max-h-[34vh] w-auto max-w-[400px] rounded-3xl object-cover"
          />
        </div>
      }
      panelFooter={
        <dl className="flex gap-12 border-t border-white/10 pt-5">
          {HIGHLIGHTS.map(({ value, label }) => (
            <div key={label}>
              <dt className="sr-only">{label}</dt>
              <dd className="text-2xl font-bold" aria-hidden="true">
                {value}
              </dd>
              <dd className="mt-0.5 text-sm text-white/80">{label}</dd>
            </div>
          ))}
        </dl>
      }
    >
      <div className="w-full max-w-[440px]">
        <h2 className="text-3xl font-bold tracking-tight text-brand md:text-[2.5rem] md:leading-tight lg:text-[length:clamp(1.5rem,4.2vh,2.5rem)]">
          Selamat Datang Kembali
        </h2>
        <p className="mt-2 text-base text-ink">Masuk untuk melanjutkan perjalanan karier hijau Anda.</p>

        <form className="mt-6 space-y-4 lg:mt-[clamp(1rem,3vh,1.5rem)] lg:space-y-[clamp(0.5rem,1.8vh,1rem)]">
          <NextField />
          <AuthError />
          <DemoPrefill values={{ identifier: DEMO_CREDENTIALS.identifier, password: DEMO_CREDENTIALS.password }} />
          <div>
            <label htmlFor="identifier" className="mb-2 block text-sm font-semibold text-ink lg:mb-1.5">
              Email
            </label>
            <div className="flex h-12 items-center lg:h-[clamp(2.25rem,5.4vh,3rem)] gap-3 rounded-xl border border-line bg-white px-4 focus-within:border-brand focus-within:ring-3 focus-within:ring-brand/20">
              <Mail className="size-5 shrink-0 text-ink/60" aria-hidden="true" />
              <input
                id="identifier"
                name="identifier"
                type="email"
                autoComplete="email" required
                placeholder="contoh@email.com"
                className="h-full min-w-0 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-subtle/80"
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="mb-2 block text-sm font-semibold text-ink lg:mb-1.5">
              Kata Sandi
            </label>
            <div className="flex h-12 items-center lg:h-[clamp(2.25rem,5.4vh,3rem)] gap-3 rounded-xl border border-line bg-white px-4 focus-within:border-brand focus-within:ring-3 focus-within:ring-brand/20">
              <Lock className="size-5 shrink-0 text-ink/60" aria-hidden="true" />
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password" required
                placeholder="Masukkan kata sandi Anda"
                className="h-full min-w-0 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-subtle"
              />
            </div>
            <div className="mt-1.5 flex justify-end text-sm">
              <Link href="/forgot-password" className="font-semibold text-brand hover:underline">
                Lupa kata sandi?
              </Link>
            </div>
          </div>

          <Button type="submit" formAction={login} className="mt-4 h-12 w-full lg:h-[clamp(2.25rem,5.4vh,3rem)] bg-brand hover:bg-brand/90 rounded-xl text-white font-semibold">
            Masuk
          </Button>

          <div className="flex items-center gap-4 text-sm text-subtle" role="separator" aria-label="atau">
            <span className="h-px flex-1 bg-line" />
            atau
            <span className="h-px flex-1 bg-line" />
          </div>

          <Button
            type="button"
            variant="outline"
            className="h-12 w-full gap-3 lg:h-[clamp(2.25rem,5.4vh,3rem)] rounded-xl border-line text-base font-semibold text-ink"
          >
            <GoogleIcon className="size-5" />
            Masuk dengan Google
          </Button>
        </form>

        <p className="mt-8 text-center lg:mt-[clamp(0.75rem,2.5vh,1.25rem)] text-base text-ink">
          Belum punya akun?{" "}
          <NextLink href="/register" className="font-bold text-brand hover:underline">
            Daftar di sini
          </NextLink>
        </p>

        <p className="mt-8 flex items-center lg:mt-[clamp(0.5rem,2vh,1rem)] justify-center gap-2 text-sm text-subtle">
          <Lock className="size-4" aria-hidden="true" />
          Data Anda dilindungi dan tidak dibagikan tanpa izin.
        </p>
      </div>
    </AuthShell>
  );
}