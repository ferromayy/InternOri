"use client";

import { buildCapacidadSkus } from "@/lib/inventario/capacidad";
import { useProductoTerminadoLotes } from "@/lib/hooks/use-producto-terminado-lotes";
import { useMemo } from "react";
import { EmptyState, RefreshBanner } from "@/components/inventario/ui/InventarioSection";

export function CapacidadView() {
  const { lotes, initialLoading, refreshing, error } = useProductoTerminadoLotes();
  const skus = useMemo(() => buildCapacidadSkus(lotes), [lotes]);

  if (initialLoading) return <p className="text-sm text-zinc-500">Cargando…</p>;
  if (error) return <p className="rounded-xl bg-red-50 p-4 text-sm text-red-800">{error}</p>;

  return (
    <div className="space-y-4">
      <RefreshBanner show={refreshing} />
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Unidades que podés producir hoy según café tostado y packaging disponibles.
      </p>

      {skus.length === 0 ? (
        <EmptyState>Sin productos configurados.</EmptyState>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <table className="w-full min-w-[320px] text-sm">
            <thead>
              <tr className="border-b border-zinc-100 text-left text-xs text-zinc-500 dark:border-zinc-800">
                <th className="px-4 py-3 font-medium">Producto</th>
                <th className="px-4 py-3 font-medium tabular-nums">Puedo producir</th>
                <th className="hidden px-4 py-3 font-medium sm:table-cell">Limitado por</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50 dark:divide-zinc-800/80">
              {skus.map((s) => (
                <tr key={s.formato_id}>
                  <td className="px-4 py-3">
                    <span className="font-medium">{s.sku}</span>
                    {!s.receta_completa ? (
                      <span className="mt-0.5 block text-xs text-amber-700">Receta pendiente</span>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-lg font-semibold tabular-nums">
                    {s.receta_completa ? s.puede_producir : "—"}
                  </td>
                  <td className="hidden px-4 py-3 text-xs text-zinc-500 sm:table-cell">
                    {s.cuello_botella?.label ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
