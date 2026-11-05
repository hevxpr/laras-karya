"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

import { loadMyAssessment, saveAssessment } from "@/app/assessment/actions";
import { INITIAL_ANSWERS, useAssessment } from "@/context/assessment-store";
import { useToast } from "@/context/toast-context";
import { answersKey } from "@/lib/assessment-mapping";
import { SKILL_OPTIONS } from "@/lib/assessment-options";
import { isValid, validateStep1, validateStep2, validateStep3 } from "@/lib/assessment-validation";

const isComplete = (a) =>
  isValid(validateStep1(a.step_1)) && isValid(validateStep2(a.step_2)) && isValid(validateStep3(a.step_3, SKILL_OPTIONS));

/**
 * Menyimpan jawaban asesmen ke profil user, di halaman mana pun (dipasang di app/layout.js).
 * - User sudah masuk: tersimpan begitu asesmen lengkap (saat layar proses AI tampil).
 * - Tamu: jawaban tetap di browser; tersimpan otomatis setelah ia daftar atau masuk.
 * Server Action menolak tamu dengan error "auth", dan itu diabaikan di sini.
 */
export function AssessmentSync() {
  const { answers, markSaved } = useAssessment();
  const { showToast } = useToast();
  const attempted = useRef(null);
  const pathname = usePathname();
  // Saat masih mengisi/mengedit langkah 1–4, tunggu sampai "Proses Rekomendasi" (layar loading),
  // supaya setiap perubahan kecil tidak membuat arsip asesmen baru.
  const editing = /^\/assessment(\/[1-4])?$/.test(pathname ?? "");

  const complete = isComplete(answers);
  const key = complete && !editing ? answersKey(answers) : null;

  useEffect(() => {
    if (!key || answers.saved_key === key || attempted.current === key) return;
    attempted.current = key;
    saveAssessment(answers).then((res) => {
      if (res.ok) return markSaved(key);
      // Gagal: boleh dicoba lagi di halaman berikutnya. "auth" = belum masuk; setelah daftar/masuk,
      // pengguna berpindah halaman sehingga penyimpanan otomatis dicoba ulang.
      attempted.current = null;
      if (res.error !== "auth") {
        showToast({ message: "Jawaban asesmen belum tersimpan ke profil. Kami akan mencoba lagi.", icon: "alert", role: "alert" });
      }
    });
    // Dicoba saat jawaban berubah atau saat pindah halaman (mis. setelah daftar/masuk).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, answers.saved_key, pathname]);

  return null;
}

/** Mengisi ulang form asesmen dari database jika user masuk dan form di browser masih kosong. */
export function AssessmentPrefill() {
  const { answers, replaceAll, markSaved } = useAssessment();
  const tried = useRef(false);
  const pristine = answersKey(answers) === answersKey(INITIAL_ANSWERS);

  useEffect(() => {
    if (!pristine || tried.current) return;
    tried.current = true;
    loadMyAssessment().then((saved) => {
      if (!saved) return;
      replaceAll(saved);
      markSaved(answersKey(saved)); // sudah ada di database, tidak perlu disimpan ulang
    });
  }, [pristine, replaceAll, markSaved]);

  return null;
}
