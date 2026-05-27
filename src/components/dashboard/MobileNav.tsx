"use client";

import { DashboardNav } from "@/components/dashboard/DashboardNav";
import { LogoutButton } from "@/components/LogoutButton";
import { QUICK_FORM_LINKS } from "@/lib/auth-redirect";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const drawer =
    open && mounted ? (
      <div className="fixed inset-0 z-[200]" role="dialog" aria-modal="true" aria-label="Menú de navegación">
        <button
          type="button"
          className="absolute inset-0 bg-black/50"
          aria-label="Cerrar menú"
          onClick={() => setOpen(false)}
        />
        <aside className="absolute inset-y-0 left-0 flex w-[min(100%,18rem)] max-w-[85vw] flex-col border-r border-zinc-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex shrink-0 items-center justify-between border-b border-zinc-100 px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))] dark:border-zinc-800">
            <Link href="/dashboard" onClick={() => setOpen(false)} className="min-w-0">
              <span className="text-xs font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                InternOri
              </span>
              <span className="block text-base font-semibold text-zinc-900 dark:text-zinc-50">Menú</span>
            </Link>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-xl border border-zinc-200 text-lg text-zinc-600 dark:border-zinc-700 dark:text-zinc-300"
              aria-label="Cerrar menú"
            >
              ×
            </button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
            <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-wider text-amber-800 dark:text-amber-300">
              Cargar datos
            </p>
            <ul className="mb-6 space-y-0.5 rounded-xl border border-amber-200/60 bg-amber-50/50 p-1 dark:border-amber-900/40 dark:bg-amber-950/20">
              {QUICK_FORM_LINKS.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className="block rounded-lg px-3 py-3 text-sm font-medium text-zinc-800 hover:bg-white/80 dark:text-zinc-200 dark:hover:bg-zinc-800/80"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>

            <DashboardNav mobile />
          </div>

          <div className="shrink-0 border-t border-zinc-100 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] dark:border-zinc-800">
            <LogoutButton className="flex min-h-[44px] w-full items-center justify-center rounded-xl border border-zinc-200 text-sm font-medium text-zinc-700 no-underline hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800" />
          </div>
        </aside>
      </div>
    ) : null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="relative z-10 flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-xl border border-zinc-200 bg-zinc-50 text-zinc-800 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
        aria-expanded={open}
        aria-label="Abrir menú"
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
      {drawer ? createPortal(drawer, document.body) : null}
    </>
  );
}
