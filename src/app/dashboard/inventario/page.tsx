import Link from "next/link";

const flujo = [
  { href: "/dashboard/inventario/cafe-verde", label: "Café verde", desc: "Ingreso de lotes" },
  { href: "/dashboard/inventario/cafe-tostado", label: "Café tostado", desc: "Tueste y merma" },
] as const;

const config = [
  {
    href: "/dashboard/inventario/packaging",
    label: "Packaging",
    desc: "Componentes, recetas y compatibilidad",
  },
] as const;

const operacion = [
  {
    href: "/dashboard/inventario/producto-terminado",
    label: "Producto terminado",
    desc: "Producción, capacidad y stock",
  },
] as const;

export default function InventarioPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-10">
      <header>
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-zinc-500">
          Inventario productivo
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 md:text-3xl">
          Orí — flujo de café
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
          Materia prima → configuración de packaging → producción de producto terminado.
        </p>
      </header>

      <Section title="Materia prima" items={flujo} />
      <Section title="Configuración" items={config} />
      <Section title="Operación" items={operacion} />
    </div>
  );
}

function Section({
  title,
  items,
}: {
  title: string;
  items: readonly { href: string; label: string; desc: string }[];
}) {
  return (
    <section>
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">
        {title}
      </h2>
      <ul className="grid gap-3 sm:grid-cols-2">
        {items.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className="block rounded-2xl border border-zinc-200 bg-white px-5 py-4 transition hover:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-600"
            >
              <span className="font-medium text-zinc-900 dark:text-zinc-50">{item.label}</span>
              <span className="mt-1 block text-xs text-zinc-500">{item.desc}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
