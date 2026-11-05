import Link from "next/link";
import { MailCheck } from "lucide-react";

import { AuthShell } from "@/components/auth/auth-shell";

export const metadata = { title: "Cek Email Anda" };

export default function CheckEmailPage() {
  return (
    <AuthShell
      variant="forest"
      title="Satu langkah lagi"
      description="Konfirmasi email Anda untuk mulai memakai Laras Karya."
    >
      <div className="w-full max-w-[440px]">
        <span className="grid size-14 place-items-center rounded-2xl bg-brand-light text-brand">
          <MailCheck className="size-7" aria-hidden="true" />
        </span>
        <h2 className="mt-5 text-3xl font-bold tracking-tight text-brand">Cek email Anda</h2>
        <p className="mt-3 text-base leading-relaxed text-ink">
          Kami sudah mengirim tautan konfirmasi ke email yang Anda daftarkan. Buka tautan itu untuk mengaktifkan akun, lalu
          Anda akan langsung diarahkan ke asesmen.
        </p>
        <p className="mt-3 text-sm text-subtle">
          Tidak menemukan emailnya? Periksa folder Spam atau Promosi. Tautan berlaku sementara.
        </p>
        <Link
          href="/login"
          className="mt-8 inline-flex h-12 w-full items-center justify-center rounded-xl border border-brand font-semibold text-brand hover:bg-brand-light"
        >
          Kembali ke halaman Masuk
        </Link>
      </div>
    </AuthShell>
  );
}
