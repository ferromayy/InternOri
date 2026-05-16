import { LoginForm } from "@/components/LoginForm";
import { Suspense } from "react";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 px-6 font-sans dark:bg-zinc-950">
      <main className="w-full max-w-sm space-y-6 rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="space-y-1 text-center">
          <p className="text-sm font-medium uppercase tracking-wide text-zinc-500">InternOri</p>
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">Iniciar sesión</h1>
        </div>

        <Suspense fallback={<p className="text-sm text-zinc-500">Cargando…</p>}>
          <LoginForm />
        </Suspense>
      </main>
    </div>
  );
}
