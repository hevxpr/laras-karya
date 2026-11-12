export const LOGIN_PATH = "/login";
export const REGISTER_PATH = "/register";

// Arahkan ke login, lalu kembali ke halaman tujuan setelah masuk.
export const loginTo = (next) => `${LOGIN_PATH}?next=${encodeURIComponent(next)}`;