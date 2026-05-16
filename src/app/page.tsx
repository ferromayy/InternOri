import { SupabaseStatus } from "@/components/SupabaseStatus";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 px-6 font-sans dark:bg-zinc-950">
      <main className="w-full max-w-lg space-y-8 rounded-2xl border border-zinc-200 bg-white p-10 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="space-y-2">
          <p className="text-sm font-medium uppercase tracking-wide text-zinc-500">
            InternOri
          </p>
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
            Next.js + Supabase
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400">
            Frontend en Vercel · Backend y Postgres en Supabase
          </p>
        </div>

        <SupabaseStatus />

        <ol className="list-decimal space-y-2 pl-5 text-sm text-zinc-600 dark:text-zinc-400">
          <li>Crea un proyecto en supabase.com</li>
          <li>
            Ejecuta el SQL en{" "}
            <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-800">
              supabase/migrations/001_health_check.sql
            </code>
          </li>
          <li>
            Copia{" "}
            <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-800">.env.example</code> a{" "}
            <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-800">.env.local</code> con tus
            keys
          </li>
        </ol>
      </main>
    </div>
  );
}
