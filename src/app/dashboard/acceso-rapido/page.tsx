import { QUICK_FORM_LINKS } from "@/lib/auth-redirect";
import Link from "next/link";

export default function AccesoRapidoPage() {
  return (
    <div className="mx-auto max-w-lg space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Acceso rápido</h1>
        <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
          Guardá estos enlaces en el celular (favoritos o pantalla de inicio). Si no tenés sesión,
          verás el login y después entrás directo al formulario.
        </p>
      </header>

      <ul className="divide-y divide-zinc-100 rounded-2xl border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
        {QUICK_FORM_LINKS.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className="flex min-h-[52px] items-center px-4 py-3 text-sm font-medium text-zinc-800 hover:bg-amber-50 dark:text-zinc-200 dark:hover:bg-amber-950/30"
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
