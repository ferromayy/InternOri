"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function InventarioPageHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow?: string;
  title: string;
  description: string;
}) {
  return (
    <header className="space-y-2">
      {eyebrow ? (
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-zinc-500">{eyebrow}</p>
      ) : null}
      <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 md:text-3xl">
        {title}
      </h1>
      <p className="max-w-2xl text-sm leading-relaxed text-zinc-600 dark:text-zinc-400 md:text-base">
        {description}
      </p>
    </header>
  );
}

export function InventarioSubNav({
  basePath,
  items,
}: {
  basePath: string;
  items: { href: string; label: string; exact?: boolean }[];
}) {
  const pathname = usePathname();

  return (
    <nav
      className="-mx-1 flex gap-1 overflow-x-auto pb-1 scrollbar-none"
      aria-label="Subsecciones"
    >
      {items.map((item) => {
        const active = item.exact
          ? pathname === item.href
          : pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`shrink-0 rounded-full px-4 py-2 text-sm transition ${
              active
                ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function StatCard({
  label,
  value,
  hint,
  tone = "neutral",
}: {
  label: string;
  value: string | number;
  hint?: string;
  tone?: "neutral" | "warn" | "ok";
}) {
  const toneClass =
    tone === "warn"
      ? "border-amber-200/80 bg-amber-50/50 dark:border-amber-900/40 dark:bg-amber-950/20"
      : tone === "ok"
        ? "border-emerald-200/80 bg-emerald-50/40 dark:border-emerald-900/40 dark:bg-emerald-950/15"
        : "border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900";

  return (
    <div className={`rounded-2xl border p-5 ${toneClass}`}>
      <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">{label}</p>
      <p className="mt-2 text-3xl font-semibold tabular-nums tracking-tight text-zinc-900 dark:text-zinc-50">
        {value}
      </p>
      {hint ? <p className="mt-2 text-xs text-zinc-500">{hint}</p> : null}
    </div>
  );
}

export function RefreshBanner({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <p className="text-xs text-zinc-500" aria-live="polite">
      Actualizando…
    </p>
  );
}

export function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-2xl border border-dashed border-zinc-300 px-6 py-10 text-center text-sm text-zinc-500 dark:border-zinc-700">
      {children}
    </p>
  );
}
