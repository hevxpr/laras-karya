/** Pesan untuk ?error=<kode> di halaman Masuk dan Daftar. Fungsi murni (server & browser). */
export const AUTH_MESSAGES = {
  config: "Layanan akun belum dikonfigurasi. Hubungi tim pengembang.",
  email: "Masukkan alamat email yang valid, misalnya nama@email.com.",
  password_empty: "Masukkan kata sandi Anda.",
  invalid: "Email atau kata sandi salah.",
  unconfirmed: "Email Anda belum dikonfirmasi. Buka tautan yang kami kirim ke email Anda.",
  name: "Masukkan nama lengkap Anda.",
  weak_password: "Kata sandi minimal 8 karakter dan memuat huruf serta angka.",
  agree: "Centang persetujuan Syarat & Ketentuan untuk melanjutkan.",
  exists: "Email ini sudah terdaftar. Silakan masuk.",
  rate_limit: "Terlalu banyak percobaan. Tunggu beberapa menit, lalu coba lagi.",
  link: "Tautan konfirmasi tidak valid atau sudah kedaluwarsa. Silakan masuk atau daftar ulang.",
  server: "Terjadi gangguan. Coba lagi beberapa saat lagi.",
};

export const authMessage = (code) => (code ? AUTH_MESSAGES[code] ?? AUTH_MESSAGES.server : null);

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Minimal 8 karakter, ada huruf dan angka (sesuai petunjuk di formulir daftar). */
export const isStrongPassword = (p) => p.length >= 8 && /[A-Za-z]/.test(p) && /\d/.test(p);
