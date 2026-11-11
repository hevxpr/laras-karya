import Link from "next/link";
import { Check, Lock, Mail, User } from "lucide-react";

import { signup } from "./actions";

import { AuthShell } from "@/components/auth/auth-shell";
import { DemoPrefill } from "@/components/auth/demo-prefill";
import { AuthError } from "@/components/auth/auth-error";
import { AfterSignupHint, NextField, NextLink } from "@/components/auth/next-field";
import { SignupSteps } from "@/components/auth/signup-steps";
import { GoogleIcon } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { DEMO_CREDENTIALS } from "@/lib/demo-persona";
import { cn } from "@/lib/utils";
import { PasswordInput } from "@/components/auth/password-input";

export const metadata = { title: "Daftar" };

export default function RegisterPage() {
  return (
    <AuthShell
      variant="leaf"
      title="Mulai Perjalanan Karier Hijau Anda"
      //description="Daftar gratis, jawab asesmen singkat, dan temukan lowongan yang cocok dengan profil Anda."
      panelFooter={
        <SignupSteps />
      }
    >
      <div className="w-full max-w-[440px]">
        <h2 className="text-3xl font-bold tracking-tight text-brand md:text-[2.5rem] md:leading-tight lg:text-[length:clamp(1.5rem,4.2vh,2.5rem)]">
          Buat Akun Laras Karya
        </h2>
        <p className="mt-2 text-base text-ink">Mulai temukan lowongan hijau yang selaras dengan Anda.</p>

        <form className="mt-6 space-y-4 lg:mt-[clamp(1rem,3vh,1.5rem)] lg:space-y-[clamp(0.5rem,1.8vh,1rem)]">
          <NextField />
          <AuthError />
          <DemoPrefill values={{ ...DEMO_CREDENTIALS, agree: true }} />
          <div>
            <label htmlFor="name" className="mb-2 block text-sm font-semibold text-ink lg:mb-1.5">
              Nama Lengkap
            </label>
            <div className="flex h-12 items-center lg:h-[clamp(2.25rem,5.4vh,3rem)] gap-3 rounded-xl border border-line bg-white px-4 focus-within:border-brand focus-within:ring-3 focus-within:ring-brand/20">
              <User className="size-5 shrink-0 text-ink/60" aria-hidden="true" />
              <input
                id="name"
                name="name"
                type="text"
                autoComplete="name" required
                placeholder="Masukkan nama lengkap"
                className="h-full min-w-0 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-subtle"
              />
            </div>
          </div>

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
            <PasswordInput />
            <p id="password-hint" className="mt-1.5 text-sm text-subtle">Minimal 8 karakter, kombinasi huruf dan angka.</p>
          </div>

          <div className="flex items-start gap-3 text-sm text-ink/80">
            <span className="relative mt-0.5 grid size-5 shrink-0 place-items-center">
              <input
                id="agree"
                name="agree" required
                type="checkbox"
                className="peer size-5 cursor-pointer appearance-none rounded-md border-2 border-brand bg-white checked:bg-brand-light focus-visible:ring-3 focus-visible:ring-brand/30 focus-visible:outline-none"
              />
              <Check
                className="pointer-events-none absolute size-3.5 text-brand opacity-0 peer-checked:opacity-100"
                strokeWidth={3}
                aria-hidden="true"
              />
            </span>
            <label htmlFor="agree" className="cursor-pointer leading-6">
              Saya menyetujui{" "}
              <Link href="/terms" className="font-semibold text-brand underline underline-offset-2">
                Syarat &amp; Ketentuan
              </Link>{" "}
              serta{" "}
              <Link href="/privacy" className="font-semibold text-brand underline underline-offset-2">
                Kebijakan Privasi
              </Link>{" "}
              Laras Karya.
            </label>
          </div>

          <div className="space-y-3">
            <Button type="submit" formAction={signup} className="h-12 w-full lg:h-[clamp(2.25rem,5.4vh,3rem)] bg-brand hover:bg-brand/90 rounded-xl text-white font-semibold">
              Daftar Sekarang
            </Button>
            <AfterSignupHint />
          </div>

          <div className="flex items-center gap-4 text-sm text-subtle" role="separator" aria-label="atau">
            <span className="h-px flex-1 bg-line" />
            atau
            <span className="h-px flex-1 bg-line" />
          </div>

          <Button
            type="button"
            variant="outline"
            className="h-12 w-full gap-3 lg:h-[clamp(2.25rem,5.4vh,3rem)] rounded-xl border-line bg-white text-base font-semibold text-ink"
          >
            <GoogleIcon className="size-5" />
            Daftar dengan Google
          </Button>
        </form>

        <p className="mt-8 text-center lg:mt-[clamp(0.75rem,2.5vh,1.25rem)] text-base text-ink">
          Sudah punya akun?{" "}
          <NextLink href="/login" className="font-bold text-brand hover:underline">
            Masuk di sini
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