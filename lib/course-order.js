/**
 * Urutan pelatihan di /learning-path. Fungsi murni (tanpa database).
 *
 * Urutan bawaan: unggulan (is_featured) lebih dulu, lalu sort_order, lalu level
 * (Pemula -> Menengah -> Lanjutan), lalu judul.
 *
 * Titik sambung engine rekomendasi: bila `ranking` diberikan ({ [courseId]: skor }), course yang punya
 * skor diurutkan dari skor tertinggi. Course tanpa skor ditaruh di belakang dengan urutan bawaan, jadi
 * engine tidak perlu menilai semua course. Tanpa `ranking` (null), hasilnya sama dengan urutan bawaan.
 */

const LEVEL_ORDER = ["Pemula", "Menengah", "Lanjutan"];

const levelRank = (level) => {
  const i = LEVEL_ORDER.indexOf(level);
  return i === -1 ? 0 : i; // level kosong / tak dikenal diperlakukan seperti Pemula
};

/** Urutan bawaan dua baris courses (kolom database: is_featured, sort_order, level, title). */
export function compareCoursesDefault(x, y) {
  return (
    Number(Boolean(y.is_featured)) - Number(Boolean(x.is_featured)) ||
    (x.sort_order ?? 0) - (y.sort_order ?? 0) ||
    levelRank(x.level) - levelRank(y.level) ||
    String(x.title).localeCompare(String(y.title), "id")
  );
}

const scoreOf = (ranking, id) => {
  const score = ranking?.[id];
  return typeof score === "number" && Number.isFinite(score) ? score : null;
};

/**
 * @param {Array<{ id: string, is_featured?: boolean, sort_order?: number|null, level?: string|null, title: string }>} rows
 * @param {Record<string, number> | null} [ranking]  skor per course id dari engine (lebih tinggi = lebih dulu)
 * @returns salinan `rows` yang sudah diurutkan
 */
export function orderCourses(rows, ranking = null) {
  const useRanking = ranking !== null && typeof ranking === "object";
  return [...rows].sort((x, y) => {
    if (useRanking) {
      const sx = scoreOf(ranking, x.id);
      const sy = scoreOf(ranking, y.id);
      if (sx !== null && sy !== null && sx !== sy) return sy - sx;
      if ((sx === null) !== (sy === null)) return sx === null ? 1 : -1;
    }
    return compareCoursesDefault(x, y);
  });
}
