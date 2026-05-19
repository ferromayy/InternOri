"use client";

import { metricasPackaging } from "@/lib/inventario/packaging-metrics";
import { usePackagingCatalogo } from "@/lib/hooks/use-packaging-catalogo";
import { useProductoTerminadoLotes } from "@/lib/hooks/use-producto-terminado-lotes";
import Link from "next/link";
import { useMemo } from "react";
import { EmptyState, RefreshBanner, StatCard } from "@/components/inventario/ui/InventarioSection";

export function PackagingDashboard() {
  const catalog = usePackagingCatalogo();
  const pt = useProductoTerminadoLotes();

  const loading = catalog.initialLoading || pt.initialLoading;
  const error = catalog.error ?? pt.error;

  const m = useMemo(
    () => metricasPackaging(catalog.catalogo, pt.lotes),
    [catalog.catalogo, pt.lotes],
  );

  if (loading) return <p className="text-sm text-zinc-500">Cargando resumen…</p>;
  if (error) return <p className="rounded-xl bg-red-50 p-4 text-sm text-red-800">{error}</p>;

  return (
    <div className="space-y-8">
      <RefreshBanner show={catalog.refreshing || pt.refreshing} />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Componentes" value={m.componentes.length} hint="Tipos únicos en sistema" />
        <StatCard
          label="Stock crítico"
          value={m.componentesCriticos.length}
          hint="≤ 5 unidades"
          tone={m.componentesCriticos.length > 0 ? "warn" : "neutral"}
        />
        <StatCard label="Recetas activas" value={m.recetasActivas} />
        <StatCard
          label="Capacidad total"
          value={m.capacidadTotal}
          hint="Unidades armables (todas las SKU)"
        />
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-medium uppercase tracking-wide text-zinc-500">
          Componentes con stock bajo
        </h2>
        {m.componentesCriticos.length === 0 ? (
          <p className="text-sm text-zinc-500">Ningún componente en nivel crítico.</p>
        ) : (
          <ul className="divide-y divide-zinc-100 rounded-2xl border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
            {m.componentesCriticos.slice(0, 8).map((c) => (
              <li key={c.id} className="flex justify-between gap-4 px-4 py-3 text-sm">
                <span>{c.label}</span>
                <span className="tabular-nums text-amber-700">{c.stock_total}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-medium uppercase tracking-wide text-zinc-500">
          Cuántas unidades puedo armar
        </h2>
        {m.skusConReceta.length === 0 ? (
          <EmptyState>
            Completá recetas en{" "}
            <Link href="/dashboard/inventario/packaging/recetas" className="underline">
              Recetas
            </Link>
            .
          </EmptyState>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
            <table className="w-full min-w-[280px] text-sm">
              <thead>
                <tr className="border-b border-zinc-100 text-left text-xs text-zinc-500 dark:border-zinc-800">
                  <th className="px-4 py-3 font-medium">SKU</th>
                  <th className="px-4 py-3 font-medium tabular-nums">Puedo armar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50 dark:divide-zinc-800/80">
                {m.skusConReceta.slice(0, 12).map((s) => (
                  <tr key={s.formato_id}>
                    <td className="px-4 py-3">{s.sku}</td>
                    <td className="px-4 py-3 font-semibold tabular-nums">{s.puede_producir}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {m.recetasIncompletas > 0 ? (
        <p className="text-sm text-amber-800 dark:text-amber-200">
          {m.recetasIncompletas} receta{m.recetasIncompletas !== 1 ? "s" : ""} pendiente
          {m.recetasIncompletas !== 1 ? "s" : ""} de definir.{" "}
          <Link href="/dashboard/inventario/packaging/recetas" className="underline">
            Ir a Recetas
          </Link>
        </p>
      ) : null}
    </div>
  );
}

