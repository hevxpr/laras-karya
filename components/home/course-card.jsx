"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BookOpen, Clock, Sparkle, Star } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Tampilan kartu ini sengaja sama dengan kartu pelatihan di halaman Jalur Belajar (app/learning-path/page.js):
// gambar 16:9 di atas, penyedia + lencana, judul, level + format, durasi + tag, lalu tombol.

const LEVEL_BADGE = {
  Pemula: "bg-brand-light text-brand",
  Menengah: "bg-amber-100 text-amber-700",
  Lanjutan: "bg-red-100 text-red-700",
};
// Data contoh memakai Beginner/Intermediate/Advanced; ditampilkan dengan istilah yang sama seperti Jalur Belajar.
const LEVEL_LABEL = { Beginner: "Pemula", Intermediate: "Menengah", Advanced: "Lanjutan" };

/** Gambar sampul 16:9 (240x135 dari database tidak terpotong). Kosong atau gagal dimuat: placeholder. */
function CourseImage({ src }) {
  const [failed, setFailed] = useState(false);
  const remote = /^https?:\/\//.test(src ?? "");

  return (
    <div className="relative aspect-video w-full overflow-hidden bg-brand-light">
      {src && !failed ? (
        remote ? (
          // Gambar dari database (alamat luar, mis. Udemy): tag biasa supaya tidak perlu daftar domain di next.config
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt=""
            loading="lazy"
            decoding="async"
            referrerPolicy="no-referrer"
            onError={() => setFailed(true)}
            className="absolute inset-0 size-full object-cover"
          />
        ) : (
          <Image
            src={src}
            alt=""
            fill
            sizes="(min-width: 1200px) 370px, (min-width: 768px) 33vw, 100vw"
            onError={() => setFailed(true)}
            className="object-cover object-center"
          />
        )
      ) : (
        <span className="absolute inset-0 grid place-items-center text-brand/40">
          <BookOpen className="size-10" aria-hidden="true" />
        </span>
      )}
    </div>
  );
}

/** @param {{ course: import("@/lib/home-data").CourseItem }} props */
export function CourseCard({ course }) {
  const { provider, title, level, duration, mode, focusSkill, image, isPopular, isPrimary } = course;
  const levelLabel = LEVEL_LABEL[level] ?? level;

  return (
    <article className="flex flex-col overflow-hidden rounded-2xl border border-line bg-white">
      <CourseImage src={image} />

      <div className="flex flex-1 flex-col p-6">
        <header className="flex items-center justify-between gap-3">
          <p className="flex min-w-0 items-center gap-2.5 text-sm text-ink/80">
            <span className="grid size-7 shrink-0 place-items-center rounded-md bg-brand-light text-brand">
              <BookOpen className="size-4" aria-hidden="true" />
            </span>
            <span className="truncate">{provider}</span>
          </p>

          {isPopular && (
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-accent-light px-2.5 py-1 text-xs font-bold text-accent">
              <Sparkle className="size-3 fill-current" aria-hidden="true" />
              Paling Populer
            </span>
          )}
        </header>

        <h3 className="mt-5 min-h-12 text-lg font-bold leading-snug text-ink">{title}</h3>

        <div className="mt-5 flex flex-wrap gap-2">
          <span className={cn("rounded-full px-2.5 py-1 text-xs font-bold", LEVEL_BADGE[levelLabel])}>
            {levelLabel}
          </span>
          {mode && (
            <span className="rounded-full border border-line px-2.5 py-1 text-xs font-medium text-ink/80">{mode}</span>
          )}
        </div>

        <div className="mt-5 flex min-h-8 flex-wrap items-center justify-between gap-x-3 gap-y-2 border-t border-line pt-4 text-sm text-ink/80">
          <span className="inline-flex items-center gap-2">
            <Clock className="size-4" aria-hidden="true" />
            {duration}
          </span>

          {focusSkill && (
            <span
              title={`Menutup skill gap: ${focusSkill}`}
              className="inline-flex max-w-full items-center gap-1 rounded-md border border-accent px-2 py-0.5 text-xs font-medium text-accent"
            >
              <Star className="size-3 shrink-0 fill-current" aria-hidden="true" />
              <span className="sr-only">Menutup skill gap: </span>
              <span className="truncate">{focusSkill}</span>
            </span>
          )}
        </div>

        <div className="mt-auto pt-5">
          <Link
            href="/learning-path"
            className={cn(
              buttonVariants({ size: "lg" }),
              "w-full",
              isPrimary
                ? "bg-brand text-white hover:bg-brand/90"
                : "border-brand bg-white text-brand hover:bg-brand-light",
            )}
          >
            {isPrimary ? "Mulai Belajar" : "Lihat Pelatihan"}
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </article>
  );
}
