import { NextResponse } from "next/server";

import { safeNextPath } from "@/lib/safe-next";
import { createClient } from "@/lib/supabase/server";

/**
 * Tujuan tautan di email konfirmasi Supabase. Mendukung dua bentuk:
 * - ?code=...                 (template email bawaan Supabase, alur PKCE)
 * - ?token_hash=...&type=...  (jika template email diubah ke bentuk token_hash)
 */
export async function GET(request) {
  const { searchParams, origin } = new URL(request.url);
  const next = safeNextPath(searchParams.get("next"), "/assessment/1");
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");

  const supabase = await createClient();
  let error = new Error("missing");
  if (code) ({ error } = await supabase.auth.exchangeCodeForSession(code));
  else if (tokenHash && type) ({ error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash }));

  return NextResponse.redirect(error ? `${origin}/login?error=link` : `${origin}${next}`);
}
