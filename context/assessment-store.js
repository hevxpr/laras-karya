"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * Penyimpanan jawaban asesmen untuk fase front-end.
 * - Bentuk data sama dengan "Contoh data yang dikirim form ke Server Action" (dokumen bagian 3).
 * - Disalin ke sessionStorage, jadi jawaban tidak hilang saat pindah halaman atau refresh,
 *   dan otomatis hilang saat tab ditutup.
 * - Dipakai lewat hook useAssessment() di halaman mana pun di bawah /assessment, tanpa Provider.
 */

const STORAGE_KEY = "laras-karya:assessment";

export const INITIAL_ANSWERS = {
  step: 1,
  // Saran keahlian AI dari cerita pengalaman: { story_key, labels }. Hanya cache di browser, tidak ikut disimpan ke database.
  ai_suggestions: null,
  step_1: { career_situation: null, career_break: null, consent: false },
  step_2: {
    province: "",
    city: "",
    open_to_relocate: false,
    education: { degree_level: "", major: "", institution: "" },
    certifications: [],
    experience_story: "",
  },
  step_3: { work_arrangement: null, interest_sectors: [], skills: [], experience_level: "" },
};

const listeners = new Set();
let cache; // undefined = belum dibaca dari sessionStorage

function read() {
  if (cache === undefined) {
    try {
      const saved = JSON.parse(window.sessionStorage.getItem(STORAGE_KEY));
      // Gabung per langkah, supaya kolom baru tetap ada untuk jawaban lama
      cache = saved
        ? {
            ...INITIAL_ANSWERS,
            ...saved,
            step_1: { ...INITIAL_ANSWERS.step_1, ...saved.step_1 },
            step_2: { ...INITIAL_ANSWERS.step_2, ...saved.step_2 },
            step_3: { ...INITIAL_ANSWERS.step_3, ...saved.step_3 },
          }
        : INITIAL_ANSWERS;
    } catch {
      cache = INITIAL_ANSWERS;
    }
  }
  return cache;
}

function write(next) {
  cache = next;
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // sessionStorage bisa tidak tersedia (mode privat tertentu); jawaban tetap ada di memori
  }
  listeners.forEach((notify) => notify());
}

function subscribe(notify) {
  listeners.add(notify);
  return () => listeners.delete(notify);
}

/** Kosongkan jawaban di browser (dipanggil saat keluar, supaya akun lain di tab ini tidak mewarisinya). */
export function clearAssessmentStore() {
  write(INITIAL_ANSWERS);
}

export function useAssessment() {
  // Saat render di server dipakai INITIAL_ANSWERS; setelah hydrate otomatis memakai isi sessionStorage.
  const answers = useSyncExternalStore(subscribe, read, () => INITIAL_ANSWERS);

  /** Gabungkan perubahan ke satu langkah, mis. updateStep("step_1", { consent: true }). */
  const updateStep = useCallback((stepKey, patch) => {
    const current = read();
    write({ ...current, [stepKey]: { ...current[stepKey], ...patch } });
  }, []);

  /** Catat langkah terjauh yang sudah dicapai (nanti disimpan ke profiles.assessment_step). */
  const reachStep = useCallback((stepNumber) => {
    const current = read();
    if (stepNumber > current.step) write({ ...current, step: stepNumber });
  }, []);

  const reset = useCallback(() => write(INITIAL_ANSWERS), []);

  /** Ganti seluruh jawaban (mis. memuat ulang asesmen yang tersimpan di database). */
  const replaceAll = useCallback((next) => {
    write({
      ...INITIAL_ANSWERS,
      ...next,
      step_1: { ...INITIAL_ANSWERS.step_1, ...next.step_1 },
      step_2: { ...INITIAL_ANSWERS.step_2, ...next.step_2 },
      step_3: { ...INITIAL_ANSWERS.step_3, ...next.step_3 },
    });
  }, []);

  /** Tandai jawaban sudah tersimpan ke database (sidik jari dari lib/assessment-mapping.js). */
  const markSaved = useCallback((key) => {
    write({ ...read(), saved_key: key });
  }, []);

  /**
   * Simpan saran keahlian AI untuk satu cerita. Diabaikan jika cerita sudah berubah saat jawaban Gemini datang,
   * supaya jawaban lama tidak menimpa yang baru.
   */
  const setSuggestions = useCallback((value) => {
    const current = read();
    if (current.step_2.experience_story.trim() !== value.story_key) return;
    write({ ...current, ai_suggestions: value });
  }, []);

  return { answers, updateStep, reachStep, reset, replaceAll, markSaved, setSuggestions };
}
