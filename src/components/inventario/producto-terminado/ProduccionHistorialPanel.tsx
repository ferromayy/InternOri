"use client";

import {
  LABEL_ORIGEN_PRODUCCION,
  labelProduccionRegistro,
  type ProduccionRegistro,
} from "@/lib/inventario/produccion-registro";
import {
  labelConsumoProduccion,
  type ProduccionConsumoRegistro,
} from "@/lib/inventario/produccion-consumo";
import { formatMoneda } from "@/lib/inventario/moneda";
import { useProduccionHistorial } from "@/lib/hooks/use-produccion-historial";
import { Fragment } from "react";

function formatFecha(iso: string) {
  return new Date(iso).toLocaleString("es-AR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

function formatCantidad(c: ProduccionConsumoRegistro) {
  const n = new Intl.NumberFormat("es-AR", { maximumFractionDigits: 2 }).format(c.cantidad_usada);
  return c.unidad === "g" ? `${n} g` : `${n} ud`;
}

function consumosOrdenados(consumos: ProduccionConsumoRegistro[]) {
  return [...consumos].sort((a, b) => {
    if (a.es_tostado && !b.es_tostado) return -1;
    if (!a.es_tostado && b.es_tostado) return 1;
    return labelConsumoProduccion(a).localeCompare(labelConsumoProduccion(b));
  });
}

function ConsumosList({ row }: { row: ProduccionRegistro }) {
  const consumos = consumosOrdenados(row.consumos ?? []);

  if (consumos.length > 0) {
    return (
      <ul className="space-y-1 text-xs text-zinc-600 dark:text-zinc-400">
        {consumos.map((c) => (
          <li key={c.id} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5">
            <span>
              <span className="font-medium text-zinc-700 dark:text-zinc-300">
                {labelConsumoProduccion(c)}
              </span>
              {c.cantidad_por_unidad != null && !c.es_tostado ? (
                <span className="text-zinc-500"> ({c.cantidad_por_unidad} / u)</span>
              ) : c.cantidad_por_unidad != null && c.es_tostado ? (
                <span className="text-zinc-500"> ({c.cantidad_por_unidad} g / u)</span>
              ) : null}
            </span>
            <span className="tabular-nums text-zinc-800 dark:text-zinc-200">
              −{formatCantidad(c)}
            </span>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <ul className="space-y-1 text-xs text-zinc-600 dark:text-zinc-400">
      <li className="flex flex-wrap items-baseline justify-between gap-x-4">
        <span className="font-medium text-zinc-700 dark:text-zinc-300">Café tostado</span>
        <span className="tabular-nums">
          −
          {new Intl.NumberFormat("es-AR", { maximumFractionDigits: 2 }).format(
            row.kg_tostado_usado_gr,
          )}{" "}
          g
        </span>
      </li>
      <li className="text-zinc-500 italic">
        Sin detalle de packaging (registro anterior a esta función).
      </li>
    </ul>
  );
}

export function ProduccionHistorialPanel() {
  const { producciones, initialLoading, refreshing, error } = useProduccionHistorial();

  return (
    <section className="space-y-4 border-t border-zinc-200 pt-8 dark:border-zinc-800">
      <div>
        <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
          Historial de producción
        </h2>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Cada registro incluye el café tostado y los componentes de packaging consumidos.
        </p>
      </div>

      {refreshing ? <p className="text-xs text-zinc-500">Actualizando…</p> : null}

      {initialLoading ? (
        <p className="text-sm text-zinc-500">Cargando historial…</p>
      ) : error ? (
        <p className="rounded-xl bg-red-50 p-4 text-sm text-red-800">{error}</p>
      ) : producciones.length === 0 ? (
        <p className="rounded-xl border border-dashed border-zinc-200 p-6 text-center text-sm text-zinc-500 dark:border-zinc-700">
          Todavía no hay producciones registradas.
        </p>
      ) : (
        <ProduccionesTable rows={producciones} />
      )}
    </section>
  );
}

function ProduccionesTable({ rows }: { rows: ProduccionRegistro[] }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <table className="w-full min-w-[760px] text-left text-sm">
        <thead className="border-b border-zinc-100 text-xs uppercase tracking-wide text-zinc-500 dark:border-zinc-800">
          <tr>
            <th className="px-4 py-3 font-medium">Fecha</th>
            <th className="px-4 py-3 font-medium">Producto</th>
            <th className="px-4 py-3 font-medium tabular-nums text-right">Unidades</th>
            <th className="px-4 py-3 font-medium tabular-nums text-right">Stock total</th>
            <th className="px-4 py-3 font-medium tabular-nums text-right">Venta ARS</th>
            <th className="px-4 py-3 font-medium tabular-nums text-right">Venta USD</th>
            <th className="px-4 py-3 font-medium">Origen</th>
            <th className="px-4 py-3 font-medium">Detalle</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-50 dark:divide-zinc-800/80">
          {rows.map((row) => (
            <Fragment key={row.id}>
              <tr className="hover:bg-zinc-50/80 dark:hover:bg-zinc-950/40">
                <td className="whitespace-nowrap px-4 py-3 text-zinc-600">
                  {formatFecha(row.created_at)}
                </td>
                <td className="px-4 py-3 font-medium">{labelProduccionRegistro(row)}</td>
                <td className="px-4 py-3 text-right tabular-nums font-medium text-emerald-800 dark:text-emerald-300">
                  +{row.cantidad}
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-zinc-600">
                  {row.unidades_totales}
                </td>
                <td className="px-4 py-3 text-right tabular-nums">
                  {formatMoneda(row.precio_venta_ars, "ARS")}
                </td>
                <td className="px-4 py-3 text-right tabular-nums">
                  {formatMoneda(row.precio_venta_usd, "USD")}
                </td>
                <td className="px-4 py-3 text-xs text-zinc-600">
                  {LABEL_ORIGEN_PRODUCCION[row.origen] ?? row.origen}
                </td>
                <td
                  className="max-w-[140px] truncate px-4 py-3 text-xs text-zinc-500"
                  title={row.detalle ?? ""}
                >
                  {row.detalle ?? "—"}
                </td>
              </tr>
              <tr className="bg-zinc-50/90 dark:bg-zinc-950/50">
                <td colSpan={8} className="px-4 py-3">
                  <p className="mb-2 text-[10px] font-medium uppercase tracking-wide text-zinc-500">
                    Insumos consumidos
                  </p>
                  <ConsumosList row={row} />
                </td>
              </tr>
            </Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}
