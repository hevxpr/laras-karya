"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";

/** Dialog pratinjau memakai <dialog> bawaan browser (fokus terkunci, Esc menutup). */
export default function PreviewDialog({ open, onClose, title, children }) {
  const ref = useRef(null);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) {
      d.showModal();
      document.body.style.overflow = "hidden";
    }
    if (!open && d.open) {
      d.close();
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby="preview-title"
      onClose={onClose}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
      className="m-auto max-h-[90vh] w-[calc(100%-2rem)] max-w-[640px] overflow-y-auto rounded-3xl bg-white p-0 text-ink shadow-2xl backdrop:bg-ink/60"
    >
      <div className="sticky top-0 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
        <h2 id="preview-title" className="text-lg font-bold text-brand">
          {title}
        </h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Tutup pratinjau"
          className="grid size-9 place-items-center rounded-full text-slate-600 hover:bg-surface"
        >
          <X className="size-5" aria-hidden />
        </button>
      </div>
      <div className="space-y-5 p-6">{children}</div>
    </dialog>
  );
}
