"use server";

import { redirect } from "next/navigation";

import { EMAIL_RE } from "@/lib/auth-messages";
import { LOGIN_PATH } from "@/lib/routes";
import { safeNextPath } from "@/lib/safe-next";
import { markHistory } from "@/lib/session";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

/** Kembali ke /login dengan kode error (pesan di lib/auth-messages.js); ?next= tetap dibawa. */
function backWithError(code, next) {
  const q = new URLSearchParams({ error: code });
  if (next) q.set("next", next);
  redirect(`${LOGIN_PATH}?${q}`);
}

export async function login(formData) {
  const next = safeNextPath(formData.get("next"), "");
  const email = String(formData.get("identifier") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!isSupabaseConfigured) backWithError("config", next);
  if (!EMAIL_RE.test(email)) backWithError("email", next);
  if (!password) backWithError("password_empty", next);

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    const code =
      error.code === "email_not_confirmed" ? "unconfirmed"
      : error.code === "over_request_rate_limit" ? "rate_limit"
      : error.status === 400 || error.code === "invalid_credentials" ? "invalid"
      : "server";
    backWithError(code, next);
  }

  await markHistory(); // demo: akun lama dianggap sudah punya riwayat (lib/demo-history.js)
  redirect(next || "/home");
}
