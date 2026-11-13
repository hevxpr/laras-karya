import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { HomeSearch } from "@/components/home/home-search";

/*
  Hero Beranda: sapaan, judul, pencarian, satu tautan ke lowongan cocok.
  Struktur hero sama untuk semua pengguna. Hanya dua teks yang bergantung status asesmen (assessmentDone):
  lencana ("Halo" untuk yang belum asesmen) dan judul. Ajakan Mulai Asesmen ada di kartu di bawah hero.
  Kelengkapan profil sengaja tidak di sini; lihat components/home/profile-completion.jsx.

  Latar foto: taruh gambar di public/images/hero-home.jpg (export dari Figma).
  Jika file belum ada, banner tetap tampil dengan warna hijau.

  Cara menyetel posisi foto: ubah angka pada bg-[position:X%_Y%]
  - Y kecil = bagian atas foto lebih terlihat (kepala), Y besar = bagian bawah lebih terlihat
  - X besar = fokus ke sisi kanan foto

  Cara menyetel lebar area teks yang solid: ubah via-XX% dan to-XX% pada gradasi di bawah.
  Teks berhenti sekitar 46% lebar banner, jadi hijau pekat dijaga sampai ~40% lalu habis di ~65%.
*/
export function WelcomeBanner({ firstName, matchedJobs, assessmentDone = true }) {
  return (
    <section
      aria-labelledby="welcome-title"
      className="relative rounded-2xl bg-brand"
    >
      {/* Foto + gradasi dipotong di lapisan ini saja. Section sengaja tanpa overflow-hidden
          supaya menu pilihan pencarian bisa keluar dari batas hero. */}
      <div aria-hidden="true" className="absolute inset-0 overflow-hidden rounded-2xl">
        <div
          className="absolute inset-0 bg-cover bg-[position:75%_35%] md:bg-[position:65%_32%]"
          style={{ backgroundImage: "url('/images/hero-home.jpg')" }}
        />
        {/* Mobile: teks selebar kartu, jadi seluruhnya ditutup lebih pekat (kontras teks putih). */}
        {/* Desktop: hijau pekat di area teks, memudar jelas ke foto di kanan. */}
        <div className="absolute inset-0 bg-gradient-to-r from-brand/95 via-brand/90 to-brand/80 md:from-brand md:via-brand/95 md:via-40% md:to-brand/0 md:to-65%" />
      </div>

      <div className="relative flex min-h-[220px] max-w-xl flex-col items-start justify-center gap-4 px-6 py-6 md:min-h-[240px] md:px-10 xl:min-h-[250px] xl:px-12">
        <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-brand">
          {assessmentDone ? `Selamat datang kembali, ${firstName}` : `Halo, ${firstName}`}
        </span>
        <h1
          id="welcome-title"
          className="text-[26px] font-bold leading-tight text-white md:text-3xl"
        >
          {!assessmentDone
            ? "Mulai dari asesmen untuk menemukan lowongan hijau yang cocok"
            : matchedJobs > 0
              ? `Ada ${matchedJobs} lowongan hijau yang cocok untuk Anda`
              : "Perbarui rekomendasi untuk melihat lowongan yang cocok"}
        </h1>
        <HomeSearch />
        <Link
          href="/recommended-jobs"
          className="-mt-2 inline-flex min-h-11 items-center gap-1.5 text-sm font-bold text-white underline-offset-4 hover:underline md:mt-0 md:min-h-0 md:py-1"
        >
          Lihat Lowongan Cocok
          <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}
