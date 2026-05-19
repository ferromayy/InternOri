"use client";

import { CatalogoComponentesPanel } from "@/components/inventario/packaging/CatalogoComponentesPanel";
import { ComponenteIngresosPanel } from "@/components/inventario/packaging/ComponenteIngresosPanel";
import { metricasPackaging } from "@/lib/inventario/packaging-metrics";
import { usePackagingCatalogo } from "@/lib/hooks/use-packaging-catalogo";
import { useProductoTerminadoLotes } from "@/lib/hooks/use-producto-terminado-lotes";
import { useMemo } from "react";
import { RefreshBanner } from "@/components/inventario/ui/InventarioSection";

export function PackagingComponentesView() {
  const { catalogo, initialLoading, refreshing, error } = usePackagingCatalogo();
  const pt = useProductoTerminadoLotes();

  const componentes = useMemo(
    () => metricasPackaging(catalogo, pt.lotes).componentes,
    [catalogo, pt.lotes],
  );

  const loading = initialLoading || pt.initialLoading;

  return (
    <div className="space-y-8">
      <RefreshBanner show={refreshing || pt.refreshing} />
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Stock y catálogo de componentes físicos. Las recetas (qué usa cada formato y cuánto por
        unidad) se configuran en la pestaña Recetas.
      </p>

      <CatalogoComponentesPanel />

      <ComponenteIngresosPanel catalogo={catalogo} />

      {!loading && !error && componentes.length > 0 ? (
        <div className="overflow-x-auto rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <table className="w-full min-w-[320px] text-sm">
            <thead>
              <tr className="border-b border-zinc-100 text-left text-xs text-zinc-500 dark:border-zinc-800">
                <th className="px-4 py-3 font-medium">Componente</th>
                <th className="px-4 py-3 font-medium tabular-nums">Stock</th>
                <th className="px-4 py-3 font-medium tabular-nums" title="Cantidad de formatos/SKU que incluyen este componente en su receta">
                  Formatos que lo usan
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50 dark:divide-zinc-800/80">
              {componentes.map((c) => (
                <tr key={c.id}>
                  <td className="px-4 py-3">{c.label}</td>
                  <td
                    className={`px-4 py-3 tabular-nums ${c.critico ? "font-medium text-amber-700" : ""}`}
                  >
                    {c.stock_total}
                  </td>
                  <td className="px-4 py-3 tabular-nums text-zinc-500">{c.usos}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}
