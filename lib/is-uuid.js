const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Id lowongan dari database berbentuk UUID; id angka (1–15) masih data contoh. Aman dipakai di server dan browser. */
export const isUuid = (value) => UUID.test(String(value ?? ""));
