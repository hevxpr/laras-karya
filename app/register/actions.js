"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { EMAIL_RE, isStrongPassword } from "@/lib/auth-messages";
import { REGISTER_PATH } from "@/lib/routes";
import { safeNextPath } from "@/lib/safe-next";
import { clearHistory, markHistory } from "@/lib/session";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

function backWithError(code, next) {
  const q = new URLSearchParams({ error: code });
  if (next) q.set("next", next);
  redirect(`${REGISTER_PATH}?${q}`);
}

/** Alamat situs untuk tautan konfirmasi email (Vercel: dari header; boleh diganti NEXT_PUBLIC_SITE_URL). */
async function siteOrigin() {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? (host?.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

export async function signup(formData) {
  const next = safeNextPath(formData.get("next"), "");
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("identifier") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!isSupabaseConfigured) backWithError("config", next);
  if (name.length < 2) backWithError("name", next);
  if (!EMAIL_RE.test(email)) backWithError("email", next);
  if (!isStrongPassword(password)) backWithError("weak_password", next);
  if (formData.get("agree") !== "on") backWithError("agree", next);

  const supabase = await createClient();
  const destination = next || "/assessment/1";
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: name }, // dibaca trigger handle_new_user untuk mengisi profiles.full_name
      emailRedirectTo: `${await siteOrigin()}/auth/callback?next=${encodeURIComponent(destination)}`,
    },
  });

  const alreadyRegistered =
    error?.code === "user_already_exists" ||
    /already (registered|exists)/i.test(error?.message ?? "") ||
    // Saat konfirmasi email aktif, Supabase tidak membocorkan bahwa email sudah ada: user dikembalikan tanpa identitas.
    (!error && data.user && data.user.identities?.length === 0);

  if (alreadyRegistered) {
    // Email sudah terdaftar: kalau kata sandinya cocok, langsung masuk (memudahkan demo yang diulang).
    const { error: loginError } = await supabase.auth.signInWithPassword({ email, password });
    if (loginError) backWithError("exists", next);
    await markHistory();
    redirect(destination);
  }

  if (error) {
    const code =
      error.code === "weak_password" ? "weak_password"
      : error.code === "email_address_invalid" ? "email"
      : error.code?.startsWith("over_") ? "rate_limit"
      : "server";
    backWithError(code, next);
  }

  // Konfirmasi email aktif: belum ada sesi sampai pengguna membuka tautan di email.
  if (!data.session) redirect(`${REGISTER_PATH}/cek-email?email=${encodeURIComponent(email)}`);

  await clearHistory(); // akun baru: belum ada lamaran atau riwayat (lib/demo-history.js)
  redirect(destination);
}
