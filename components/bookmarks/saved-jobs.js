"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Bookmark, ChevronDown, Sparkles } from "lucide-react";
import { setJobSaved } from "@/app/bookmarks/actions";
import { useToast } from "@/context/toast-context";
import { useDemoMode } from "@/lib/demo-mode";
import { isUuid } from "@/lib/is-uuid";
import { SAVED_JOBS } from "@/lib/mock-saved-jobs";
import SavedJobCard from "./saved-job-card";
import { EmptyState } from "@/components/ui/empty-state";

const SORTS = [
  { value: "terbaru", label: "Urutkan: Terbaru" },
  { value: "cocok", label: "Urutkan: Paling cocok" },
  { value: "nama", label: "Urutkan: Nama A–Z" },
];

function sortJobs(list, by) {
  const copy = [...list];
  if (by === "cocok") return copy.sort((a, b) => (b.match ?? -1) - (a.match ?? -1));
  if (by === "nama")
    return copy.sort((a, b) => a.title.localeCompare(b.title, "id"));
  return copy.sort((a, b) => b.savedAt.localeCompare(a.savedAt));
}

/**
 * @param {{ initialJobs?: object[] }} props
 *   initialJobs = lowongan tersimpan dari database (lib/saved-jobs-db.js). Bila kosong dan mode demo
 *   menyala, daftar contoh (lib/mock-saved-jobs.js) yang ditampilkan, supaya alur demo tetap jalan.
 */
export default function SavedJobs({ initialJobs = [] }) {
  const demo = useDemoMode();
  const { showToast } = useToast();
  const base = useMemo(
    () => (initialJobs.length > 0 ? initialJobs : demo ? SAVED_JOBS : []),
    [initialJobs, demo],
  );
  const [removedIds, setRemovedIds] = useState(() => new Set()); // lowongan yang dibatalkan simpan di layar ini
  const items = useMemo(() => base.filter((j) => !removedIds.has(j.id)), [base, removedIds]);
  const [sortBy, setSortBy] = useState("terbaru");
  const [removed, setRemoved] = useState(null); // { job } untuk tombol "Urungkan"

  // Pemberitahuan "Urungkan" hilang sendiri setelah 8 detik.
  useEffect(() => {
    if (!removed) return;
    const t = setTimeout(() => setRemoved(null), 8000);
    return () => clearTimeout(t);
  }, [removed]);

  const sorted = useMemo(() => sortJobs(items, sortBy), [items, sortBy]);

  const hide = (id) => setRemovedIds((prev) => new Set(prev).add(id));
  const unhide = (id) =>
    setRemovedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  const failed = () =>
    showToast({ message: "Perubahan belum tersimpan. Coba lagi.", icon: "alert", role: "alert", tone: "dark" });

  // Layar berubah dulu supaya terasa cepat; bila database menolak, dikembalikan. Id angka = data contoh (hanya di layar).
  async function remove(id) {
    const job = items.find((j) => j.id === id);
    if (!job) return;
    hide(id);
    setRemoved({ job });
    if (!isUuid(id)) return;
    const res = await setJobSaved(id, false);
    if (!res.ok) {
      unhide(id);
      setRemoved(null);
      failed();
    }
  }

  async function undo() {
    if (!removed) return;
    const { job } = removed;
    unhide(job.id);
    setRemoved(null);
    if (!isUuid(job.id)) return;
    const res = await setJobSaved(job.id, true);
    if (!res.ok) {
      hide(job.id);
      failed();
    }
  }

  return (
    <>
      <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-brand md:text-4xl">
            Lowongan yang Disimpan
          </h1>
          <p className="mt-2 text-slate-800">
            Daftar pekerjaan hijau yang telah Anda tandai untuk dilamar nanti.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <span
            aria-live="polite"
            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700"
          >
            {items.length} lowongan tersimpan
          </span>
          <div className="relative">
            <label htmlFor="urutan-tersimpan" className="sr-only">
              Urutkan lowongan tersimpan
            </label>
            <select
              id="urutan-tersimpan"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="appearance-none rounded-full border border-slate-200 bg-white py-2 pl-4 pr-10 text-sm font-semibold text-ink transition hover:border-brand"
            >
              {SORTS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
            <ChevronDown
              className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink"
              aria-hidden
            />
          </div>
        </div>
      </div>

      <div role="status" aria-live="polite">
        {removed && (
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-ink px-4 py-3 text-sm text-white">
            <span>“{removed.job.title}” dihapus dari daftar tersimpan.</span>
            <button
              type="button"
              onClick={undo}
              className="font-semibold underline underline-offset-4"
            >
              Urungkan
            </button>
          </div>
        )}
      </div>

      {sorted.length > 0 ? (
        <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {sorted.map((job) => (
            <SavedJobCard key={job.id} job={job} onRemove={remove} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Bookmark}
          title="Belum ada lowongan tersimpan"
          text="Tandai lowongan dengan ikon penanda, dan lowongan itu akan muncul di sini."
        >
          <Link
            href="/recommended-jobs"
            className="inline-block rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand/90"
          >
            Lihat rekomendasi lowongan
          </Link>
        </EmptyState>
      )}

      <div className="mt-10 flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-brand-light px-6 py-5">
        <div className="flex items-center gap-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-ai">
            <Sparkles className="h-5 w-5" aria-hidden />
          </span>
          <p className="text-ink">
            Ingin menemukan lebih banyak lowongan yang cocok? Perbarui profil
            Anda untuk rekomendasi terbaru.
          </p>
        </div>
        <Link
          href="/profile"
          className="flex items-center gap-1 font-semibold text-brand hover:underline"
        >
          Perbarui Profil <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </div>
    </>
  );
}
