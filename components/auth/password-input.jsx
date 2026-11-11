"use client";

import { useState } from "react";
import { Eye, EyeOff, Lock } from "lucide-react";

export function PasswordInput({
  id = "password",
  name = "password",
  autoComplete = "current-password",
  placeholder = "Masukkan kata sandi Anda",
  minLength = 8,
}) {
  const [visible, setVisible] = useState(false);
  const ToggleIcon = visible ? EyeOff : Eye;

  return (
    <div className="flex h-12 items-center lg:h-[clamp(2.25rem,5.4vh,3rem)] gap-3 rounded-xl border border-line bg-white px-4 focus-within:border-brand focus-within:ring-3 focus-within:ring-brand/20">
      <Lock className="size-5 shrink-0 text-ink/60" aria-hidden="true" />
      <input
        id={id}
        name={name}
        type={visible ? "text" : "password"}
        autoComplete={autoComplete}
        required
        placeholder={placeholder}
        className="h-full min-w-0 flex-1 bg-transparent text-sm  text-ink outline-none placeholder:text-subtle"
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
        aria-pressed={visible}
        className="shrink-0 rounded-md p-1 text-ink/60 hover:text-ink focus-visible:outline-2 focus-visible:outline-brand"
      >
        <ToggleIcon className="size-5" aria-hidden="true" />
      </button>
    </div>
  );
}
