import { mapCafeVerdeRows } from "@/lib/inventario/cafe-verde";
import { labelsFormatosVenta } from "@/lib/inventario/formato-venta";
import { createClient } from "@/lib/supabase/server";
import type { CafeVerde } from "@/types/inventario";

function formatGr(value: number) {
  return new Intl.NumberFormat("es-AR", { maximumFractionDigits: 2 }).format(value);
}

function formatDate(value: string) {
  return new Date(value + "T12:00:00").toLocaleDateString("es-AR");
}

const CAFE_VERDE_SELECT = `
  id,
  codigo,
  varietal,
  origen,
  productor,
  proceso,
  fecha_ingreso,
  importador,
  lote,
  kg_iniciales_gr,
  kg_usados_gr,
  kg_actuales_gr,
  created_at,
  cafe_verde_formatos_venta ( formato_venta )
`;

export async function CafeVerdeList() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("cafe_verde")
    .select(CAFE_VERDE_SELECT)
    .order("fecha_ingreso", { ascending: false });

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
        <p className="font-medium">No se pudo cargar el inventario</p>
        <p className="mt-1">{error.message}</p>
        <p className="mt-2 text-xs opacity-80">
          ¿Ejecutaste{" "}
          <code className="rounded bg-red-100 px-1 dark:bg-red-900">
            007_cafe_verde_formatos_venta_multi.sql
          </code>{" "}
          en Supabase?
        </p>
      </div>
    );
  }

  const items = mapCafeVerdeRows(data ?? []) as CafeVerde[];

  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-zinc-200 bg-white p-8 text-center text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900">
        Todavía no hay lotes de café verde registrados.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-zinc-200 bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950">
            <tr>
              <th className="px-4 py-3">ID</th>
              <th className="px-4 py-3">Lote</th>
              <th className="px-4 py-3">Venta</th>
              <th className="px-4 py-3">Varietal</th>
              <th className="px-4 py-3">Origen</th>
              <th className="px-4 py-3">Productor</th>
              <th className="px-4 py-3">Ingreso</th>
              <th className="px-4 py-3 text-right">Kg iniciales</th>
              <th className="px-4 py-3 text-right">Kg usados</th>
              <th className="px-4 py-3 text-right">Kg actuales</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {items.map((row) => (
              <tr key={row.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-950/50">
                <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-100">{row.codigo}</td>
                <td className="px-4 py-3">{row.lote}</td>
                <td className="max-w-[200px] px-4 py-3 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
                  {labelsFormatosVenta(row.formatos_venta)}
                </td>
                <td className="px-4 py-3">{row.varietal}</td>
                <td className="px-4 py-3">{row.origen}</td>
                <td className="px-4 py-3">{row.productor}</td>
                <td className="px-4 py-3">{formatDate(row.fecha_ingreso)}</td>
                <td className="px-4 py-3 text-right tabular-nums">{formatGr(row.kg_iniciales_gr)}</td>
                <td className="px-4 py-3 text-right tabular-nums text-zinc-500">
                  {formatGr(row.kg_usados_gr)}
                </td>
                <td className="px-4 py-3 text-right tabular-nums font-medium text-amber-800 dark:text-amber-300">
                  {formatGr(row.kg_actuales_gr)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
