"use client";

import { buildCapacidadSkus } from "@/lib/inventario/capacidad";
import { costoPorUnidadStock, sumarCostosDual, type CostoDual } from "@/lib/inventario/costo-stock";
import { formatMoneda } from "@/lib/inventario/moneda";
import { useProductoTerminadoLotes } from "@/lib/hooks/use-producto-terminado-lotes";
import { useMemo } from "react";
import { StockVentaPanel } from "@/components/inventario/producto-terminado/StockVentaPanel";
import { EmptyState, RefreshBanner } from "@/components/inventario/ui/InventarioSection";

function CeldaCosto({ costo }: { costo: CostoDual }) {
  return (
    <td className="px-4 py-3 text-right text-xs tabular-nums text-zinc-600">
      <div>{formatMoneda(costo.ars, "ARS")}</div>
      <div className="text-zinc-400">{formatMoneda(costo.usd, "USD")}</div>
    </td>
  );
}

export function StockView() {
  const { lotes, initialLoading, refreshing, error } = useProductoTerminadoLotes();
  const skus = useMemo(() => buildCapacidadSkus(lotes), [lotes]);

  const porCafe = useMemo(() => {
    const map = new Map<
      string,
      { unidades: number; costo: CostoDual }
    >();
    for (const s of skus) {
      const prev = map.get(s.codigo) ?? {
        unidades: 0,
        costo: { ars: null, usd: null },
      };
      map.set(s.codigo, {
        unidades: prev.unidades + s.unidades_producidas,
        costo: sumarCostosDual(prev.costo, {
          ars: s.costo_total_ars,
          usd: s.costo_total_usd,
        }),
      });
    }
    return [...map.entries()]
      .filter(([, v]) => v.unidades > 0)
      .sort((a, b) => a[0].localeCompare(b[0]));
  }, [skus]);

  const skusConStock = skus.filter((s) => s.unidades_producidas > 0);

  if (initialLoading) return <p className="text-sm text-zinc-500">Cargando…</p>;
  if (error) return <p className="rounded-xl bg-red-50 p-4 text-sm text-red-800">{error}</p>;

  return (
    <div className="flex flex-col gap-8">
      <RefreshBanner show={refreshing} />

      <p className="text-xs text-zinc-500">
        Costo por unidad y costo total del stock: café verde (según kg de tostado en la receta) +
        packaging (precio de compra ÷ stock del componente × cantidad por unidad). Si falta algún
        precio, esa parte no suma.
      </p>

      <div className="order-1 md:order-none">
        <StockVentaPanel />
      </div>

      <section className="order-3 space-y-3 md:order-none">
        <h2 className="text-sm font-medium uppercase tracking-wide text-zinc-500">Por SKU</h2>
        {skusConStock.length === 0 ? (
          <EmptyState>Sin producción registrada.</EmptyState>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="border-b border-zinc-100 text-xs uppercase tracking-wide text-zinc-500 dark:border-zinc-800">
                <tr>
                  <th className="px-4 py-3 font-medium">SKU</th>
                  <th className="px-4 py-3 font-medium tabular-nums text-right">Unidades</th>
                  <th className="px-4 py-3 font-medium tabular-nums text-right">Costo por unidad</th>
                  <th className="px-4 py-3 font-medium tabular-nums text-right">Costo total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50 dark:divide-zinc-800/80">
                {skusConStock.map((s) => (
                  <tr key={s.formato_id} className="hover:bg-zinc-50/80 dark:hover:bg-zinc-950/40">
                    <td className="px-4 py-3 font-medium">{s.sku}</td>
                    <td className="px-4 py-3 text-right text-lg font-semibold tabular-nums">
                      {s.unidades_producidas}
                    </td>
                    <CeldaCosto
                      costo={{
                        ars: s.costo_por_unidad_ars,
                        usd: s.costo_por_unidad_usd,
                      }}
                    />
                    <CeldaCosto
                      costo={{ ars: s.costo_total_ars, usd: s.costo_total_usd }}
                    />
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="order-4 space-y-3 md:order-none">
        <h2 className="text-sm font-medium uppercase tracking-wide text-zinc-500">Por café (ID)</h2>
        {porCafe.length === 0 ? (
          <EmptyState>Sin producción registrada.</EmptyState>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
            <table className="w-full min-w-[520px] text-left text-sm">
              <thead className="border-b border-zinc-100 text-xs uppercase tracking-wide text-zinc-500 dark:border-zinc-800">
                <tr>
                  <th className="px-4 py-3 font-medium">ID café verde</th>
                  <th className="px-4 py-3 font-medium tabular-nums text-right">Unidades</th>
                  <th className="px-4 py-3 font-medium tabular-nums text-right">Costo por unidad</th>
                  <th className="px-4 py-3 font-medium tabular-nums text-right">Costo total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50 dark:divide-zinc-800/80">
                {porCafe.map(([codigo, row]) => (
                  <tr key={codigo} className="hover:bg-zinc-50/80 dark:hover:bg-zinc-950/40">
                    <td className="px-4 py-3 font-medium">{codigo}</td>
                    <td className="px-4 py-3 text-right text-lg font-semibold tabular-nums">
                      {row.unidades}
                    </td>
                    <CeldaCosto costo={costoPorUnidadStock(row.costo, row.unidades)} />
                    <CeldaCosto costo={row.costo} />
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
