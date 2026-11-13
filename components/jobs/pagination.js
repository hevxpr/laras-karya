import { ChevronLeft, ChevronRight } from "lucide-react";

const base =
  "flex h-11 min-w-11 items-center justify-center rounded-full border px-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-40";

// Hanya 3 nomor halaman yang tampil (halaman aktif di tengah bila memungkinkan), supaya tidak penuh.
const VISIBLE = 3;

function visiblePages(page, totalPages) {
  const count = Math.min(VISIBLE, totalPages);
  const start = Math.min(Math.max(1, page - 1), totalPages - count + 1);
  return Array.from({ length: count }, (_, i) => start + i);
}

export default function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null;
  const pages = visiblePages(page, totalPages);

  return (
    <div className="mt-8 flex flex-col items-center gap-2">
      <nav aria-label="Halaman lowongan" className="flex items-center justify-center gap-2">
        <button
          type="button"
          aria-label="Halaman sebelumnya"
          disabled={page === 1}
          onClick={() => onChange(page - 1)}
          className={`${base} border-slate-200 bg-white text-ink hover:border-brand`}
        >
          <ChevronLeft className="h-4 w-4" aria-hidden />
        </button>

        {pages.map((p) => (
          <button
            key={p}
            type="button"
            aria-label={`Halaman ${p}`}
            aria-current={p === page ? "page" : undefined}
            onClick={() => onChange(p)}
            className={`${base} ${
              p === page
                ? "border-brand bg-brand text-white"
                : "border-slate-200 bg-white text-ink hover:border-brand"
            }`}
          >
            {p}
          </button>
        ))}

        <button
          type="button"
          aria-label="Halaman berikutnya"
          disabled={page === totalPages}
          onClick={() => onChange(page + 1)}
          className={`${base} border-slate-200 bg-white text-ink hover:border-brand`}
        >
          <ChevronRight className="h-4 w-4" aria-hidden />
        </button>
      </nav>
      <p className="text-sm text-slate-500">
        Halaman {page} dari {totalPages}
      </p>
    </div>
  );
}