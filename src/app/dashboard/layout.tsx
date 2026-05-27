import { DashboardNav } from "@/components/dashboard/DashboardNav";
import { EnvBanner } from "@/components/dashboard/EnvBanner";
import { MobileNav } from "@/components/dashboard/MobileNav";
import { LogoutButton } from "@/components/LogoutButton";
import { ScrollToHash } from "@/components/inventario/ui/ScrollToHash";
import { Suspense } from "react";
import { SESSION_COOKIE, verifySessionCookie } from "@/lib/auth";
import { cookies } from "next/headers";
import Link from "next/link";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const username = await verifySessionCookie(cookieStore.get(SESSION_COOKIE)?.value);

  return (
    <div className="flex min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <aside className="hidden w-64 shrink-0 border-r border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900 md:flex md:flex-col">
        <Link href="/dashboard" className="mb-8 block px-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-400">
            InternOri
          </span>
          <span className="mt-1 block text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            Dashboard
          </span>
        </Link>
        <div className="flex-1 overflow-y-auto">
          <DashboardNav />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <EnvBanner />
        <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-zinc-200 bg-white/95 px-4 py-3 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-900/95 md:px-8">
          <div className="flex min-w-0 items-center gap-2 md:hidden">
            <MobileNav />
            <Link href="/dashboard" className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              InternOri
            </Link>
          </div>
          <p className="hidden text-sm text-zinc-500 md:block">
            {username ? (
              <>
                Sesión:{" "}
                <span className="font-medium text-zinc-800 dark:text-zinc-200">{username}</span>
              </>
            ) : null}
          </p>
          <LogoutButton />
        </header>

        <main className="flex-1 overflow-y-auto p-4 pb-8 md:p-8">
          <Suspense fallback={null}>
            <ScrollToHash />
          </Suspense>
          {children}
        </main>
      </div>
    </div>
  );
}
