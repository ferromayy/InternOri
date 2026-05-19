"use client";

import { buildCapacidadSkus, totalUnidadesProducidas } from "@/lib/inventario/capacidad";
import { useProductoTerminadoLotes } from "@/lib/hooks/use-producto-terminado-lotes";
import Link from "next/link";
import { useMemo } from "react";
import { RefreshBanner, StatCard } from "@/components/inventario/ui/InventarioSection";

export function OperativoDashboard() {
  const { lotes, initialLoading, refreshing, error } = useProductoTerminadoLotes();

  const skus = useMemo(() => buildCapacidadSkus(lotes), [lotes]);
  const totalPt = useMemo(() => totalUnidadesProducidas(lotes), [lotes]);
  const capacidadRestante = skus
    .filter((s) => s.receta_completa)
    .reduce((s, x) => s + x.puede_producir, 0);
  const limitados = skus.filter((s) => s.receta_completa && s.puede_producir === 0);
  const cuelloFrecuente = skus
    .filter((s) => s.cuello_botella)
    .slice(0, 5);

  if (initialLoading) return <p className="text-sm text-zinc-500">Cargando…</p>;
  if (error) return <p className="rounded-xl bg-red-50 p-4 text-sm text-red-800">{error}</p>;

  return (
    <div className="space-y-8">
      <RefreshBanner show={refreshing} />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Producto terminado" value={totalPt} hint="Unidades en stock final" tone="ok" />
        <StatCard label="Capacidad restante" value={capacidadRestante} hint="Unidades posibles hoy" />
        <StatCard
          label="SKU sin capacidad"
          value={limitados.length}
          tone={limitados.length > 0 ? "warn" : "neutral"}
        />
        <StatCard label="SKUs activos" value={skus.filter((s) => s.receta_completa).length} />
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-medium uppercase tracking-wide text-zinc-500">
          Cuellos de botella
        </h2>
        {cuelloFrecuente.length === 0 ? (
          <p className="text-sm text-zinc-500">Sin restricciones detectadas.</p>
        ) : (
          <ul className="space-y-2">
            {cuelloFrecuente.map((s) => (
              <li
                key={s.formato_id}
                className="flex flex-col gap-1 rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between dark:border-zinc-800 dark:bg-zinc-900"
              >
                <span className="font-medium">{s.sku}</span>
                <span className="text-amber-800 dark:text-amber-200">
                  Limitado por {s.cuello_botella?.label}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="text-sm">
        <Link
          href="/dashboard/inventario/producto-terminado/producir"
          className="font-medium text-emerald-800 underline dark:text-emerald-300"
        >
          Ir a Producción →
        </Link>
      </p>
    </div>
  );
}
