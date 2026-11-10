import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";

import { SUPABASE_KEY, SUPABASE_URL, isSupabaseConfigured } from "@/lib/supabase/env";
import { LOGIN_PATH, REGISTER_PATH } from "@/lib/routes";

/** Halaman yang wajib masuk. Tamu diarahkan ke /login?next=<halaman tujuan>. */
export const PROTECTED_PREFIXES = ["/home", "/profile", "/applications", "/bookmarks", "/learning-path"];

const startsWithAny = (path, prefixes) => prefixes.some((p) => path === p || path.startsWith(`${p}/`));

/**
 * Dipanggil proxy.js di setiap request: menyegarkan token Supabase (cookie) dan menjaga halaman.
 * Aturan Supabase: jangan menjalankan kode lain di antara createServerClient dan getClaims(),
 * dan selalu kembalikan response yang membawa cookie terbaru.
 */
export async function updateSession(request) {
  if (!isSupabaseConfigured) return NextResponse.next({ request });

  let response = NextResponse.next({ request });
  const supabase = createServerClient(SUPABASE_URL, SUPABASE_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) request.cookies.set(name, value);
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) response.cookies.set(name, value, options);
      },
    },
  });

  const { data } = await supabase.auth.getClaims();
  const signedIn = Boolean(data?.claims?.sub);
  const { pathname, search } = request.nextUrl;

  const redirectTo = (path) => {
    const url = request.nextUrl.clone();
    const [p, q = ""] = path.split("?");
    url.pathname = p;
    url.search = q ? `?${q}` : "";
    const res = NextResponse.redirect(url);
    for (const cookie of response.cookies.getAll()) res.cookies.set(cookie); // jangan hilangkan cookie sesi baru
    return res;
  };

  if (!signedIn && startsWithAny(pathname, PROTECTED_PREFIXES)) {
    return redirectTo(`${LOGIN_PATH}?next=${encodeURIComponent(pathname + search)}`);
  }
  if (signedIn && startsWithAny(pathname, [LOGIN_PATH, REGISTER_PATH])) {
  const next = request.nextUrl.searchParams.get("next") ?? "";
  // Hanya path internal (bukan //host atau /\host) dan bukan kembali ke login/register.
  const safe =
    next.startsWith("/") &&
    !next.startsWith("//") &&
    !next.startsWith("/\\") &&
    !startsWithAny(next.split("?")[0], [LOGIN_PATH, REGISTER_PATH]);
  return redirectTo(safe ? next : "/home");
}
  return response;
}
