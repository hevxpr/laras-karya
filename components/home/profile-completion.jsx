import Link from "next/link";
import { ArrowRight } from "lucide-react";

// Paling banyak berapa bagian yang disebut; sisanya diringkas "dan N lainnya" supaya kartu tetap satu baris.
const MAX_SHOWN = 2;

/** Teks "Tersisa: ..." dari daftar bagian yang belum terisi, bobot terbesar lebih dulu. Lengkapnya ada di /profile. */
function summarize(missing) {
  const byWeight = [...missing].sort((a, b) => b.weight - a.weight);
  const shown = missing.length <= MAX_SHOWN + 1 ? byWeight : byWeight.slice(0, MAX_SHOWN);
  const rest = missing.length - shown.length;
  const parts = shown.map((m) => `${m.label} (${m.weight}%)`);
  if (rest > 0) return `Tersisa: ${parts.join(", ")}, dan ${rest} lainnya`;
  return `Tersisa: ${parts.length > 1 ? `${parts.slice(0, -1).join(", ")} dan ${parts[parts.length - 1]}` : parts[0]}`;
}

/**
 * Pengingat kelengkapan profil di bawah hero, satu baris di layar sm ke atas.
 * Hilang sendiri kalau profil sudah 100%.
 * @param {{ value: number, missing?: {label: string, weight: number}[], remaining?: string }} props
 *   value = persen kelengkapan, 0 sampai 100; missing = bagian yang belum terisi (diringkas di sini);
 *   remaining = teks cadangan bila missing tidak ada. Teks tampil di layar md ke atas.
 */
export function ProfileCompletion({ value, missing, remaining = "" }) {
  if (value >= 100) return null;
  const text = missing?.length ? summarize(missing) : remaining;

  return (
    <section
      aria-label="Kelengkapan profil"
      className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-xl border border-line bg-white px-4 py-2 md:px-5"
    >
      <p className="text-sm font-semibold text-ink">
        Profil Anda {value}% lengkap
        {text ? <span className="ml-2 hidden font-normal text-ink/70 md:inline">{text}</span> : null}
      </p>
      <div
        role="progressbar"
        aria-label="Kelengkapan profil"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={value}
        className="order-last h-2 basis-full overflow-hidden rounded-full bg-brand-light sm:order-none sm:max-w-xs sm:flex-1 sm:basis-auto"
      >
        <div className="h-full rounded-full bg-brand" style={{ width: `${value}%` }} />
      </div>
      <Link
        href="/profile"
        className="ml-auto inline-flex min-h-11 shrink-0 items-center gap-1 text-sm font-bold text-brand hover:underline md:min-h-9"
      >
        Lengkapi Profil
        <ArrowRight className="size-3.5" aria-hidden="true" />
      </Link>
    </section>
  );
}
