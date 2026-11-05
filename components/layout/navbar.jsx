"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bookmark, LogOut, Menu, User, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { NAV_ITEMS, MOCK_USER, isNavItemActive } from "@/lib/navigation";
import { signOut } from "@/app/auth/actions";

/** Item-item yang muncul di dropdown avatar profil. */
const PROFILE_MENU = [
  { label: "Profil Saya", href: "/profile", icon: User },
  { label: "Lowongan Tersimpan", href: "/bookmarks", icon: Bookmark },
  // Tambahkan item lain di sini (mis. Pengaturan)
  { label: "Keluar", icon: LogOut, isDivider: true, signOut: true },
];

/**
 * Dropdown profil yang muncul saat avatar diklik.
 * Menutup sendiri saat klik di luar (onClose) atau saat item dipilih.
 * @param {{ user: { name: string, initials: string }, onClose: () => void }} props
 */
function ProfileDropdown({ user, onClose }) {
  const ref = useRef(null);

  // Tutup saat klik di luar dropdown
  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        onClose();
      }
    }
    // Gunakan capture agar mencegat sebelum event lain
    document.addEventListener("mousedown", handleClickOutside, true);
    return () =>
      document.removeEventListener("mousedown", handleClickOutside, true);
  }, [onClose]);

  // Tutup saat Escape ditekan
  useEffect(() => {
    function handleEsc(e) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  return (
    <div
      ref={ref}
      role="menu"
      aria-label={`Menu akun ${user.name}`}
      className="absolute right-0 top-full z-50 mt-2 w-52 overflow-hidden rounded-xl border border-line bg-white shadow-lg"
    >
      {/* Info pengguna */}
      <div className="border-b border-line px-4 py-3">
        <p className="text-sm font-semibold text-ink">{user.name}</p>
        <p className="mt-0.5 text-xs text-subtle">Pencari kerja</p>
      </div>

      {/* Menu items */}
      <ul className="py-1.5">
        {PROFILE_MENU.map(({ label, href, icon: Icon, isDivider, signOut: isSignOut }) => (
          <li key={label}>
            {isDivider && <hr className="my-1.5 border-line" />}
            {isSignOut ? (
              <form action={signOut}>
                <button
                  type="submit"
                  role="menuitem"
                  className="flex min-h-10 w-full items-center gap-3 px-4 text-left text-sm text-ink/80 transition-colors hover:bg-brand-light hover:text-brand focus-visible:bg-brand-light focus-visible:text-brand focus-visible:outline-none"
                >
                  <Icon className="size-4 shrink-0" aria-hidden="true" />
                  {label}
                </button>
              </form>
            ) : (
              <Link
                href={href}
                role="menuitem"
                onClick={onClose}
                className="flex min-h-10 items-center gap-3 px-4 text-sm text-ink/80 transition-colors hover:bg-brand-light hover:text-brand focus-visible:bg-brand-light focus-visible:text-brand focus-visible:outline-none"
              >
                <Icon className="size-4 shrink-0" aria-hidden="true" />
                {label}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Tombol avatar + dropdown profil. State dropdown dikelola di sini,
 * terpisah dari state menu mobile.
 * @param {{ user: { name: string, initials: string } }} props
 */
function ProfileMenu({ user }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={`Menu akun ${user.name}`}
        onClick={() => setOpen((v) => !v)}
        className="grid size-9 place-items-center rounded-full bg-brand-light text-xs font-bold text-brand transition-opacity hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
      >
        {user.initials}
      </button>

      {open && (
        <ProfileDropdown user={user} onClose={() => setOpen(false)} />
      )}
    </div>
  );
}

/**
 * Tampilan navbar (tanpa hook URL). Dipakai oleh versi final dan oleh fallback Suspense.
 * @param {{ user: { name: string, initials: string }, pathname: string, open: boolean, onToggle: () => void }} props
 */
function NavbarView({ user, pathname, open, onToggle }) {
  // Menu aktif ditentukan oleh lib/navigation.js (lihat activeFor), mis. /bookmarks menyalakan "Lowongan".
  const isActive = (href) => {
    const item = NAV_ITEMS.find((i) => i.href === href);
    return item ? isNavItemActive(item, pathname) : false;
  };

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-white/95 backdrop-blur">
      <nav
        aria-label="Navigasi utama"
        className="mx-auto flex h-16 max-w-[1200px] items-center justify-between px-4 md:px-6 xl:px-8"
      >
        <Link href="/home" className="flex min-h-11 items-center" aria-label="Laras Karya, ke Beranda">
          <Image src="/logo-laras-karya.png" alt="Laras Karya" width={462} height={138} priority className="h-12 w-auto" />
        </Link>

        <div className="flex items-center gap-2 md:gap-4">
          <ul className="hidden items-center gap-1 md:flex xl:gap-4">
            {NAV_ITEMS.map(({ label, href }) => (
              <li key={href}>
                <Link
                  href={href}
                  aria-current={isActive(href) ? "page" : undefined}
                  className={cn(
                    "flex min-h-11 items-center border-b-2 px-2.5 text-sm transition-colors xl:px-3",
                    isActive(href)
                      ? "border-brand font-bold text-brand"
                      : "border-transparent font-medium text-ink/80 hover:text-brand"
                  )}
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>

          {/* Avatar → dropdown profil (desktop & tablet) */}
          <ProfileMenu user={user} />

          {/* Hamburger mobile */}
          <button
            type="button"
            className="grid size-11 place-items-center rounded-lg text-ink md:hidden"
            aria-expanded={open}
            aria-controls="menu-mobile"
            aria-label={open ? "Tutup menu" : "Buka menu"}
            onClick={onToggle}
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </nav>

      {open && (
        <ul id="menu-mobile" className="border-t border-line bg-white px-4 py-2 md:hidden">
          {NAV_ITEMS.map(({ label, href, icon: Icon }) => (
            <li key={href}>
              <Link
                href={href}
                aria-current={isActive(href) ? "page" : undefined}
                className={cn(
                  "flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm",
                  isActive(href) ? "bg-brand-light font-bold text-brand" : "font-medium text-ink/80"
                )}
              >
                <Icon className="size-4" aria-hidden="true" />
                {label}
              </Link>
            </li>
          ))}

          {/* Tambahkan item profil di menu mobile juga */}
          <li>
            <hr className="my-1.5 border-line" />
          </li>
          {PROFILE_MENU.map(({ label, href, icon: Icon, signOut: isSignOut }) => (
            <li key={label}>
              {isSignOut ? (
                <form action={signOut}>
                  <button
                    type="submit"
                    className="flex min-h-11 w-full items-center gap-3 rounded-lg px-3 text-left text-sm font-medium text-ink/80"
                  >
                    <Icon className="size-4" aria-hidden="true" />
                    {label}
                  </button>
                </form>
              ) : (
                <Link
                  href={href}
                  className="flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium text-ink/80"
                >
                  <Icon className="size-4" aria-hidden="true" />
                  {label}
                </Link>
              )}
            </li>
          ))}
        </ul>
      )}
    </header>
  );
}

/** Bagian tampilan navbar dengan state menu mobile. */
function NavbarContent({ user, pathname }) {
  const [open, setOpen] = useState(false);

  return <NavbarView user={user} pathname={pathname} open={open} onToggle={() => setOpen((v) => !v)} />;
}

/** Bagian yang membaca URL (usePathname). key={pathname} otomatis mereset menu mobile saat rute berganti. */
function NavbarRouter({ user }) {
  const pathname = usePathname();

  return <NavbarContent key={pathname} user={user} pathname={pathname} />;
}

/**
 * ≥1280 desktop · 768–1279 tablet (lebih rapat) · <768 hamburger (belum didesain di Figma)
 * Dibungkus Suspense karena Next.js 16 (Cache Components) mewajibkannya untuk usePathname().
 * Fallback = navbar yang sama tanpa penanda menu aktif, jadi tidak ada loncatan tampilan.
 * @param {{ user?: { name: string, initials: string } }} props
 */
export function Navbar({ user = MOCK_USER }) {
  return (
    <Suspense fallback={<NavbarView user={user} pathname="" open={false} onToggle={() => {}} />}>
      <NavbarRouter user={user} />
    </Suspense>
  );
}
