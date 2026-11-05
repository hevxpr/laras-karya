"use client";

import { useEffect, useState } from "react";

import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export function initialsOf(name) {
  return (
    String(name)
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0].toUpperCase())
      .join("") || "?"
  );
}

/**
 * Nama user yang sedang masuk, dari profiles.full_name (diisi saat daftar).
 * null = belum masuk, belum dimuat, atau Supabase belum dikonfigurasi.
 * Ikut berubah saat user masuk/keluar di tab lain (onAuthStateChange).
 */
export function useAccount() {
  const [account, setAccount] = useState(null);

  useEffect(() => {
    if (!isSupabaseConfigured) return undefined;
    const supabase = createClient();
    let alive = true;

    async function load() {
      const { data: auth } = await supabase.auth.getUser();
      const user = auth?.user;
      if (!user) {
        if (alive) setAccount(null);
        return;
      }
      const { data } = await supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle();
      const name = data?.full_name || user.user_metadata?.full_name || user.email?.split("@")[0] || "Akun";
      if (alive) setAccount({ name, initials: initialsOf(name), email: user.email });
    }

    load();
    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      load();
    });
    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return account;
}
