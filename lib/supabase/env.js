/**
 * Alamat dan kunci publik Supabase dari environment variables (aman untuk browser; dilindungi RLS).
 * Nama baru Supabase: NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY. Nama lama (ANON_KEY) tetap diterima.
 * Kunci rahasia (service role / secret key) TIDAK dipakai di sini dan tidak boleh berawalan NEXT_PUBLIC_.
 */
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
export const SUPABASE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/** false = env belum diisi; aplikasi tetap bisa dibuka, tetapi masuk/daftar menampilkan pesan. */
export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_KEY);
