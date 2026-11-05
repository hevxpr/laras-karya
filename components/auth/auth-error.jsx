"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { CircleAlert } from "lucide-react";

import { authMessage } from "@/lib/auth-messages";

function AuthErrorInner() {
  const message = authMessage(useSearchParams().get("error"));
  if (!message) return null;
  return (
    <p role="alert" className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
      <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      {message}
    </p>
  );
}

/** Pesan error dari ?error= (dikirim Server Action masuk/daftar). Taruh di dalam <form>. */
export function AuthError() {
  return (
    <Suspense fallback={null}>
      <AuthErrorInner />
    </Suspense>
  );
}
