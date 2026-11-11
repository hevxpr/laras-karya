import { isUuid } from "@/lib/is-uuid";

export const LOGIN_PATH = "/login";
export const REGISTER_PATH = "/register";

// Arahkan ke login, lalu kembali ke halaman tujuan setelah masuk.
export const loginTo = (next) => `${LOGIN_PATH}?next=${encodeURIComponent(next)}`;
export const LEARNING_PATH = "/learning-path";

/**
 * Tautan ke Jalur Belajar. Dengan id lowongan dari database (UUID), halaman hanya memuat pelatihan untuk
 * skill gap lowongan itu; tanpa id (atau id contoh 1-15), semua pelatihan.
 */
export const learningPathHref = (jobId) => (isUuid(jobId) ? `${LEARNING_PATH}?job=${jobId}` : LEARNING_PATH);
