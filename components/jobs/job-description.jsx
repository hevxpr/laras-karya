"use client";

import { useState } from "react";

const PREVIEW_CHARS = 650; // sekitar 1 bagian pertama; sisanya dilipat

/**
 * Sisa teks menu/tombol dari situs lowongan asal (hasil scraping) yang tidak berguna bagi pembaca.
 * Solusi sebenarnya: bersihkan kolom jobs.description di database. Ini hanya penutup sementara.
 */
const JUNK_LINE = [
  /^vacancy detail$/i,
  /^position experience line of business/i,
  /^daftar lowongan lainnya/i,
  /^formulir profil pribadi/i,
  /^unduh formulir lamaran/i,
];
const JUNK_PREFIX = /^ringkasan posisi\s+deskripsi pekerjaan\s*/i; // judul bagian yang menempel di awal kalimat

/**
 * Teks deskripsi dari database -> blok: judul (baris pendek berakhiran ? atau :), butir (- ...), paragraf.
 * Bila teks datang tanpa baris baru, daftar " - Kalimat" dipecah jadi butir dulu.
 */
function parse(raw) {
  let text = String(raw ?? "").trim();
  if (!text.includes("\n")) text = text.replace(/\s[-–•]\s(?=[A-ZÀ-Ý])/g, "\n- ");
  const blocks = [];
  const lines = text
    .split("\n")
    .map((l) => l.trim().replace(JUNK_PREFIX, ""))
    .filter((l) => l && !JUNK_LINE.some((re) => re.test(l.replace(/^[-–•]\s+/, ""))));
  for (const line of lines) {
    if (/^[-–•]\s+/.test(line)) {
      const item = line.replace(/^[-–•]\s+/, "");
      const last = blocks[blocks.length - 1];
      if (last?.type === "list") last.items.push(item);
      else blocks.push({ type: "list", items: [item] });
    } else if (line.length <= 80 && /[?:]$/.test(line)) {
      blocks.push({ type: "heading", text: line.replace(/:$/, "") });
    } else {
      blocks.push({ type: "p", text: line });
    }
  }
  return blocks;
}

const size = (b) => (b.type === "list" ? b.items.join(" ").length : b.text.length);

function Block({ b }) {
  if (b.type === "heading")
    return <h3 className="mt-5 text-[13px] font-semibold text-ink first:mt-0">{b.text}</h3>;
  if (b.type === "list")
    return (
      <ul className="mt-2 list-disc space-y-1.5 pl-5 text-[13px] leading-relaxed text-ink/80 marker:text-ink/40">
        {b.items.map((it, i) => (
          <li key={i}>{it}</li>
        ))}
      </ul>
    );
  return <p className="mt-2 text-[13px] leading-relaxed text-ink/80 first:mt-0">{b.text}</p>;
}

/**
 * Deskripsi lowongan yang terstruktur (judul, butir, paragraf). Bagian awal tampil, sisanya dilipat
 * di batas blok (tidak memotong di tengah butir) dengan tombol "Baca selengkapnya".
 */
export function JobDescription({ text }) {
  const [open, setOpen] = useState(false);
  const blocks = parse(text);

  // Jumlah blok yang tampil saat dilipat: sampai melewati PREVIEW_CHARS, dan tidak berhenti tepat setelah judul.
  let shown = 0;
  let chars = 0;
  while (shown < blocks.length && chars < PREVIEW_CHARS) chars += size(blocks[shown++]);
  if (blocks[shown - 1]?.type === "heading") shown += 1;
  const foldable = blocks.length - shown >= 2 && chars < size({ type: "p", text: String(text ?? "") }) - 200;
  const visible = foldable && !open ? blocks.slice(0, shown) : blocks;

  return (
    <div>
      <div className="relative">
        {visible.map((b, i) => (
          <Block key={i} b={b} />
        ))}
        {foldable && !open && (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-white to-transparent" aria-hidden="true" />
        )}
      </div>
      {foldable && (
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="mt-3 inline-flex min-h-11 items-center text-[13px] font-semibold text-brand hover:underline md:min-h-0"
        >
          {open ? "Tutup" : "Baca selengkapnya"}
        </button>
      )}
    </div>
  );
}
