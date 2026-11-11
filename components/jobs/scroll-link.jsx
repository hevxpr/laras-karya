"use client";

/**
 * Tautan "lompat ke bagian di halaman yang sama" yang SELALU bekerja.
 * next/link dengan href="#id" hanya menggulir sekali: setelah alamat sudah memuat #id, klik berikutnya
 * dianggap tidak ada perubahan. Di sini kita gulir sendiri lewat scrollIntoView, jadi bisa diklik berulang kali.
 * Kartu tujuan perlu id yang sama (dan scroll-mt-24 supaya tidak tertutup navbar).
 */
export function ScrollLink({ to, className, children }) {
  const onClick = (e) => {
    const el = document.getElementById(to);
    if (!el) return; // elemen tidak ada: biarkan perilaku bawaan
    e.preventDefault();
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  };
  return (
    <a href={`#${to}`} onClick={onClick} className={className}>
      {children}
    </a>
  );
}
