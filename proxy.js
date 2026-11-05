import { updateSession } from "@/lib/supabase/proxy";

// Next.js 16: pengganti middleware.js. Menyegarkan sesi Supabase dan menjaga halaman yang wajib masuk.
export async function proxy(request) {
  return updateSession(request);
}

export const config = {
  // Lewati file statis, gambar, ikon, service worker, dan manifest.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sw.js|offline.html|manifest.webmanifest|icons/|images/|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico|txt|xml)$).*)",
  ],
};
