import Link from "next/link";

const sections = [
  {
    title: "Inventario productivo",
    href: "/dashboard/inventario",
    description: "Café verde, tostado, packaging y producto terminado",
  },
  {
    title: "Activos",
    href: "/dashboard/activos",
    description: "Maquinaria y equipos",
  },
  {
    title: "Insumos operativos",
    href: "/dashboard/insumos",
    description: "Materiales del día a día",
  },
] as const;

export default function DashboardPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <header>
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Resumen</h1>
        <p className="mt-1 text-zinc-600 dark:text-zinc-400">
          Panel de visualización. Los KPIs se agregarán en una próxima etapa.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        {sections.map((s) => (
          <Link
            key={s.href}
            href={s.href}
            className="rounded-xl border border-zinc-200 bg-white p-5 transition hover:border-amber-300 hover:shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-amber-800"
          >
            <h2 className="font-medium text-zinc-900 dark:text-zinc-50">{s.title}</h2>
            <p className="mt-2 text-sm text-zinc-500">{s.description}</p>
          </Link>
        ))}
      </div>

      <div className="rounded-xl border border-dashed border-zinc-300 bg-zinc-100/50 p-12 text-center dark:border-zinc-700 dark:bg-zinc-900/50">
        <p className="text-sm text-zinc-500">Espacio reservado para KPIs y gráficos</p>
      </div>
    </div>
  );
}
