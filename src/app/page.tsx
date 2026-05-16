import { LogoutButton } from "@/components/LogoutButton";
import { SupabaseStatus } from "@/components/SupabaseStatus";
import { SESSION_COOKIE, verifySessionCookie } from "@/lib/auth";
import { cookies } from "next/headers";

export default async function Home() {
  const cookieStore = await cookies();
  const username = await verifySessionCookie(cookieStore.get(SESSION_COOKIE)?.value);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 px-6 font-sans dark:bg-zinc-950">
      <main className="w-full max-w-lg space-y-8 rounded-2xl border border-zinc-200 bg-white p-10 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <p className="text-sm font-medium uppercase tracking-wide text-zinc-500">InternOri</p>
            <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
              Next.js + Supabase
            </h1>
            {username ? (
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Sesión:{" "}
                <span className="font-medium text-zinc-900 dark:text-zinc-200">{username}</span>
              </p>
            ) : null}
          </div>
          <LogoutButton />
        </div>

        <SupabaseStatus />
      </main>
    </div>
  );
}
