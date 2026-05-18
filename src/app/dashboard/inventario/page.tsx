import Link from "next/link";

const items = [
  { href: "/dashboard/inventario/cafe-verde", label: "Café verde", ready: true },
  { href: "/dashboard/inventario/cafe-tostado", label: "Café tostado", ready: true },
  { href: "/dashboard/inventario/packaging", label: "Packaging", ready: true },
  { href: "/dashboard/inventario/producto-terminado", label: "Producto terminado", ready: true },
] as const;

export default function InventarioPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          Inventario productivo
        </h1>
        <p className="mt-1 text-zinc-600 dark:text-zinc-400">
          Elegí una categoría para registrar o consultar stock.
        </p>
      </header>

      <ul className="grid gap-3 sm:grid-cols-2">
        {items.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className="flex items-center justify-between rounded-xl border border-zinc-200 bg-white px-5 py-4 transition hover:border-amber-300 dark:border-zinc-800 dark:bg-zinc-900"
            >
              <span className="font-medium text-zinc-900 dark:text-zinc-50">{item.label}</span>
              <span className={`text-xs ${item.ready ? "text-emerald-600" : "text-zinc-400"}`}>
                {item.ready ? "Activo" : "Próximamente"}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
