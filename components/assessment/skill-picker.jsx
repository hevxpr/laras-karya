"use client";

import { useId, useState } from "react";
import { Plus, Sparkles, X } from "lucide-react";

import { LIMITS } from "@/lib/assessment-options";

/**
 * Pemilih keahlian (dropdown dengan pencarian).
 * Pengguna HANYA bisa memilih dari `options` (katalog keahlian), jadi nama keahlian selalu
 * sama dengan yang dipakai lowongan dan pelatihan. Tidak ada keahlian ketik bebas.
 */
export function SkillPicker({ options, values, onChange, suggestions = [], aiSuggestions = [], aiLoading = false, aiFailed = false, aiEmpty = false }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const inputId = useId();
  const hintId = useId();
  const listId = useId();

  const typed = query.replace(/\s+/g, " ").trim().toLowerCase();
  const chosen = new Set(values.map((v) => v.toLowerCase()));
  const isFull = values.length >= LIMITS.maxSkills;

  const available = options.filter((o) => !chosen.has(o.toLowerCase()));
  const matches = typed ? available.filter((o) => o.toLowerCase().includes(typed)) : available;
  const freshAi = aiSuggestions.filter((s) => !chosen.has(s.toLowerCase()));
  const aiSet = new Set(aiSuggestions.map((s) => s.toLowerCase()));
  // Saran sektor tidak mengulang yang sudah disarankan AI.
  const freshSuggestions = suggestions.filter((s) => !chosen.has(s.toLowerCase()) && !aiSet.has(s.toLowerCase())).slice(0, 5);

  const add = (skill) => {
    if (!chosen.has(skill.toLowerCase()) && !isFull) onChange([...values, skill]);
    setQuery("");
  };
  const remove = (skill) => onChange(values.filter((v) => v !== skill));

  const showList = open && !isFull;

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-black/10 bg-surface p-3">
        {values.map((skill) => (
          <span key={skill} className="inline-flex items-center gap-1 rounded-lg bg-brand px-2.5 py-1.5 text-[13px] font-semibold text-white">
            {skill}
            <button type="button" onClick={() => remove(skill)} className="rounded-full p-0.5 hover:bg-white/20" aria-label={`Hapus ${skill}`}>
              <X className="size-3.5" aria-hidden="true" />
            </button>
          </span>
        ))}
        <label htmlFor={inputId} className="sr-only">Cari dan pilih keahlian</label>
        <input
          id={inputId}
          type="text"
          role="combobox"
          aria-expanded={showList}
          aria-controls={listId}
          aria-describedby={hintId}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setOpen(false)}
          onKeyDown={(e) => {
            if (e.key === "Escape") setOpen(false);
            if (e.key !== "Enter") return;
            e.preventDefault();
            if (matches[0] && !isFull) add(matches[0]);
          }}
          placeholder={isFull ? "Batas keahlian tercapai" : "Cari atau pilih keahlian..."}
          disabled={isFull}
          className="min-w-48 flex-1 bg-transparent px-1 py-1 text-sm outline-none placeholder:text-ink/50 disabled:cursor-not-allowed"
          autoComplete="off"
        />
      </div>

      {showList ? (
        <ul
          id={listId}
          role="listbox"
          aria-label="Daftar keahlian"
          className="mt-2 max-h-64 overflow-y-auto rounded-xl border border-black/10 bg-white"
        >
          {matches.length > 0 ? (
            matches.map((skill) => (
              <li key={skill} role="option" aria-selected="false">
                {/* onMouseDown + preventDefault: pilihan tercatat sebelum input kehilangan fokus */}
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    add(skill);
                  }}
                  className="w-full px-4 py-2.5 text-left text-sm hover:bg-brand-light"
                >
                  {skill}
                </button>
              </li>
            ))
          ) : (
            <li className="px-4 py-3 text-sm text-ink/70">Keahlian “{query.trim()}” tidak ada di daftar. Coba kata lain.</li>
          )}
        </ul>
      ) : null}

      <p id={hintId} className="mt-1.5 text-xs leading-relaxed text-ink/70">
        {isFull
          ? `Anda sudah memilih ${LIMITS.maxSkills} keahlian (batas maksimal). Hapus salah satu untuk mengganti.`
          : "Pilih dari daftar agar nama keahlian sama dengan yang dipakai lowongan."}
      </p>

      {aiLoading ? (
        <p className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-ai" role="status">
          <Sparkles className="size-3.5 motion-safe:animate-pulse" aria-hidden="true" />
          AI sedang membaca cerita pengalaman Anda…
        </p>
      ) : null}
      {freshAi.length > 0 ? (
        <div className="mt-3">
          <p className="mb-2 inline-flex items-center gap-1.5 text-xs font-semibold text-ai">
            <Sparkles className="size-3.5" aria-hidden="true" />
            Disarankan AI dari cerita pengalaman Anda:
          </p>
          <div className="flex flex-wrap gap-2">
            {freshAi.map((skill) => (
              <button
                key={skill}
                type="button"
                onClick={() => add(skill)}
                disabled={isFull}
                className="inline-flex items-center gap-1 rounded-full border border-ai/40 bg-pink-50 px-3 py-1.5 text-[13px] hover:border-ai disabled:opacity-50"
              >
                <Plus className="size-3.5" aria-hidden="true" />
                {skill}
              </button>
            ))}
          </div>
        </div>
      ) : null}
      {aiEmpty ? (
        <p className="mt-3 text-xs text-ink/70" role="status">
          AI belum menemukan keahlian di daftar yang cocok dengan cerita Anda. Anda bisa memilih secara manual.
        </p>
      ) : null}
      {aiFailed ? (
        <p className="mt-3 text-xs text-ink/70" role="status">
          Saran dari cerita belum tersedia. Anda tetap bisa memilih keahlian secara manual.
        </p>
      ) : null}

      {freshSuggestions.length > 0 ? (
        <div className="mt-3">
          <p className="mb-2 text-xs font-semibold text-ink/70">Keahlian yang sering dicari di sektor pilihan Anda:</p>
          <div className="flex flex-wrap gap-2">
            {freshSuggestions.map((skill) => (
              <button
                key={skill}
                type="button"
                onClick={() => add(skill)}
                disabled={isFull}
                className="inline-flex items-center gap-1 rounded-full border border-black/15 bg-white px-3 py-1.5 text-[13px] hover:border-brand/50 disabled:opacity-50"
              >
                <Plus className="size-3.5" aria-hidden="true" />
                {skill}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
