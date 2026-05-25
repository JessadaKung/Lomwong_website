"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LayoutDashboard, LogOut, Menu, X } from "lucide-react";
import StatusBadge from "./StatusBadge";

const links = [
  ["หน้าแรก", "/"],
  ["เมนู", "/menu"],
  ["ห้องพัก", "/rooms"],
  ["จองโต๊ะ", "/booking"],
  ["ติดต่อ", "/contact"]
];

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const isDashboard = pathname?.startsWith("/dashboard");

  useEffect(() => {
    setLoggedIn(Boolean(localStorage.getItem("lomwong_token")));
  }, [pathname]);

  function logout() {
    localStorage.removeItem("lomwong_token");
    localStorage.removeItem("lomwong_user");
    setLoggedIn(false);
    setOpen(false);
    router.push("/dashboard/login");
  }

  return (
    <header className="fixed left-0 right-0 top-0 z-40 border-b border-gold/20 bg-dark/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-xl border border-gold/35 bg-gold/10 font-display text-xl text-gold-light">LW</div>
          <div>
            <p className="font-display text-xl text-gold-light">Lom Wong</p>
            <p className="text-xs text-cream/70">Café & Daily Rooms</p>
          </div>
        </Link>
        <nav className="hidden items-center gap-2 md:flex">
          {links.map(([label, href]) => (
            <Link key={href} href={href} className="rounded-full px-3 py-2 text-sm text-cream/80 hover:bg-gold/10 hover:text-gold-light">
              {label}
            </Link>
          ))}
          <StatusBadge />
          {loggedIn && !isDashboard && (
            <Link href="/dashboard" className="rounded-full border border-gold/25 px-3 py-2 text-sm text-gold-light hover:bg-gold/10">
              <LayoutDashboard size={16} className="inline-block align-[-3px]" /> Dashboard
            </Link>
          )}
          {loggedIn && isDashboard && (
            <button className="btn btn-ghost" onClick={logout}>
              <LogOut size={18} />ออกจากระบบ
            </button>
          )}
        </nav>
        <button aria-label="เปิดเมนู" className="btn btn-ghost md:hidden" onClick={() => setOpen((value) => !value)}>
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>
      {open && (
        <div className="border-t border-gold/15 bg-dark2 px-4 py-3 md:hidden">
          <div className="mb-3"><StatusBadge /></div>
          {links.map(([label, href]) => (
            <Link key={href} href={href} onClick={() => setOpen(false)} className="block rounded-lg px-3 py-3 text-cream/85 hover:bg-gold/10">
              {label}
            </Link>
          ))}
          {loggedIn && !isDashboard && (
            <Link href="/dashboard" onClick={() => setOpen(false)} className="mt-3 flex items-center gap-2 rounded-lg border border-gold/25 px-3 py-3 text-gold-light hover:bg-gold/10">
              <LayoutDashboard size={18} />Dashboard
            </Link>
          )}
          {loggedIn && isDashboard && (
            <button className="btn btn-ghost mt-3 w-full" onClick={logout}>
              <LogOut size={18} />ออกจากระบบ
            </button>
          )}
        </div>
      )}
    </header>
  );
}
