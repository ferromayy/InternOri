import { createClient } from "@/lib/supabase/server";
import type { CafeTostado } from "@/types/inventario";

function formatGr(value: number) {
  return new Intl.NumberFormat("es-AR", { maximumFractionDigits: 2 }).format(value);
}

function formatDate(value: string) {
  return new Date(value + "T12:00:00").toLocaleDateString("es-AR");
}

export async function CafeTostadoList() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("cafe_tostado")
    .select(
      "id, codigo, cafe_verde_codigo, fecha_tueste, perfil, kg_verde_tostado_gr, kg_despues_tostar_gr, merma_gr, kg_vendidos_gr, kg_existentes_gr, created_at",
    )
    .order("fecha_tueste", { ascending: false });

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
        <p className="font-medium">No se pudo cargar el inventario</p>
        <p className="mt-1">{error.message}</p>
        <p className="mt-2 text-xs opacity-80">
          ¿Ejecutaste{" "}
          <code className="rounded bg-red-100 px-1 dark:bg-red-900">005_cafe_tostado_merma_verde.sql</code>{" "}
          (o 004 si es instalación nueva)?
        </p>
      </div>
    );
  }

  const items = (data ?? []) as CafeTostado[];

  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-zinc-200 bg-white p-8 text-center text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900">
        Todavía no hay registros de café tostado.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-zinc-200 bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950">
            <tr>
              <th className="px-4 py-3">Tueste</th>
              <th className="px-4 py-3">ID verde</th>
              <th className="px-4 py-3">Fecha</th>
              <th className="px-4 py-3">Perfil</th>
              <th className="px-4 py-3 text-right">Kg verde</th>
              <th className="px-4 py-3 text-right">Kg después</th>
              <th className="px-4 py-3 text-right">Merma</th>
              <th className="px-4 py-3 text-right">Kg vendidos</th>
              <th className="px-4 py-3 text-right">Kg existentes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {items.map((row) => (
              <tr key={row.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-950/50">
                <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-100">
                  {row.codigo}
                </td>
                <td className="px-4 py-3">{row.cafe_verde_codigo}</td>
                <td className="px-4 py-3">{formatDate(row.fecha_tueste)}</td>
                <td className="px-4 py-3">{row.perfil}</td>
                <td className="px-4 py-3 text-right tabular-nums">{formatGr(row.kg_verde_tostado_gr)}</td>
                <td className="px-4 py-3 text-right tabular-nums">
                  {formatGr(row.kg_despues_tostar_gr)}
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-amber-800 dark:text-amber-300">
                  {formatGr(row.merma_gr)}
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-zinc-500">
                  {formatGr(row.kg_vendidos_gr)}
                </td>
                <td className="px-4 py-3 text-right tabular-nums font-medium">
                  {formatGr(row.kg_existentes_gr)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
