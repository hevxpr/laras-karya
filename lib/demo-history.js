import { useSyncExternalStore } from "react";

import { hasApplied } from "@/lib/applications-data";
import { isDemoMode } from "@/lib/demo-mode";
import { HISTORY_COOKIE } from "@/lib/history-cookie";

/*
  Tahap pengguna dalam DEMO: "baru" (akun yang barusan didaftarkan, belum ada riwayat) atau
  "riwayat" (pengguna lama yang sudah punya lamaran dan lowongan tersimpan).

    - Daftar  -> "baru"     (server menghapus cookie lk_history; lihat app/register/actions.js)
    - Masuk   -> "riwayat"  (akun lama; app/login/actions.js)
    - Catatan "Beberapa minggu kemudian" (components/demo/history-gate.jsx) -> "riwayat"
    - Di LUAR mode demo selalu "riwayat": data contoh tampil apa adanya, seperti sebelumnya.

  "Sudah dilamar?" untuk komponen client dijawab di sini (useHasApplied), berdasarkan data di
  lib/applications-data.js. Saat backend tersambung: ganti isi hasApplied dengan query tabel
  applications milik pengguna; akun baru otomatis tanpa lamaran, dan file ini beserta
  components/demo/history-gate.jsx bisa dihapus (komponen cukup memanggil hasApplied).
  Hanya untuk komponen client. SEMENTARA: hapus bersama /demo sebelum rilis publik.
*/
const EVENT = "lk-history-change";

function hasHistoryCookie() {
  try {
    return document.cookie.split("; ").includes(`${HISTORY_COOKIE}=1`);
  } catch {
    return false;
  }
}

/** Sudah punya riwayat? Di luar mode demo selalu true. */
export function hasHistory() {
  return !isDemoMode() || hasHistoryCookie();
}

/** Dipanggil tombol "Lanjutkan" pada catatan waktu. */
export function startHistory() {
  document.cookie = `${HISTORY_COOKIE}=1; path=/; samesite=lax`;
  window.dispatchEvent(new Event(EVENT));
}

function subscribe(onChange) {
  window.addEventListener(EVENT, onChange);
  return () => window.removeEventListener(EVENT, onChange);
}

/** "pending" di server dan saat hydrate; lalu "baru" atau "riwayat" di browser. */
export const useHistoryStage = () =>
  useSyncExternalStore(subscribe, () => (hasHistory() ? "riwayat" : "baru"), () => "pending");

export const useHasHistory = () => useHistoryStage() === "riwayat";

/**
 * Pengganti hasApplied() untuk komponen client.
 * `applied` (boolean) datang dari database lewat server (job.applied) dan selalu menang.
 * Tanpa itu (data contoh dengan id angka), dijawab dari data contoh seperti sebelumnya.
 */
export function useHasApplied(jobId, applied) {
  const history = useHasHistory();
  if (typeof applied === "boolean") return applied;
  return history && hasApplied(jobId);
}
