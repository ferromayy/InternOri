import type { createClient } from "@/lib/supabase/server";

type Supabase = Awaited<ReturnType<typeof createClient>>;

/** Una sola consulta: tostado disponible (g) agrupado por cafe_verde_codigo. */
export async function getTostadoDisponiblePorCodigos(
  supabase: Supabase,
  codigos: string[],
): Promise<Record<string, number>> {
  const unicos = [...new Set(codigos.filter(Boolean))];
  const result: Record<string, number> = {};
  for (const c of unicos) result[c] = 0;
  if (unicos.length === 0) return result;

  const { data, error } = await supabase
    .from("cafe_tostado")
    .select("cafe_verde_codigo, kg_existentes_gr")
    .in("cafe_verde_codigo", unicos)
    .is("deleted_at", null)
    .gt("kg_existentes_gr", 0);

  if (error || !data) return result;

  for (const row of data) {
    const codigo = row.cafe_verde_codigo;
    result[codigo] = (result[codigo] ?? 0) + Number(row.kg_existentes_gr);
  }

  return result;
}
