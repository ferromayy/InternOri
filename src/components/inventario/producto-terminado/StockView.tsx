"use client";

import { buildCapacidadSkus } from "@/lib/inventario/capacidad";
import { useProductoTerminadoLotes } from "@/lib/hooks/use-producto-terminado-lotes";
import { useMemo } from "react";
import { StockVentaPanel } from "@/components/inventario/producto-terminado/StockVentaPanel";
import { EmptyState, RefreshBanner } from "@/components/inventario/ui/InventarioSection";

export function StockView() {
  const { lotes, initialLoading, refreshing, error } = useProductoTerminadoLotes();
  const skus = useMemo(() => buildCapacidadSkus(lotes), [lotes]);

  const porCafe = useMemo(() => {
    const map = new Map<string, number>();
    for (const s of skus) {
      map.set(s.codigo, (map.get(s.codigo) ?? 0) + s.unidades_producidas);
    }
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [skus]);

  if (initialLoading) return <p className="text-sm text-zinc-500">Cargando…</p>;
  if (error) return <p className="rounded-xl bg-red-50 p-4 text-sm text-red-800">{error}</p>;

  return (
    <div className="space-y-8">
      <RefreshBanner show={refreshing} />

      <StockVentaPanel />

      <section className="space-y-3">
        <h2 className="text-sm font-medium uppercase tracking-wide text-zinc-500">Por SKU</h2>
        {skus.length === 0 ? (
          <EmptyState>Sin producción registrada.</EmptyState>
        ) : (
          <ul className="divide-y divide-zinc-100 rounded-2xl border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
            {skus.map((s) => (
              <li
                key={s.formato_id}
                className="flex items-center justify-between gap-4 px-4 py-3 text-sm"
              >
                <span>{s.sku}</span>
                <span className="text-lg font-semibold tabular-nums">{s.unidades_producidas}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-medium uppercase tracking-wide text-zinc-500">Por café (ID)</h2>
        <ul className="divide-y divide-zinc-100 rounded-2xl border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
          {porCafe.map(([codigo, total]) => (
            <li
              key={codigo}
              className="flex items-center justify-between gap-4 px-4 py-3 text-sm"
            >
              <span className="font-medium">{codigo}</span>
              <span className="text-lg font-semibold tabular-nums">{total}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
