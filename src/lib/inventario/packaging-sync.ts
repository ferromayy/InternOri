import type { createClient } from "@/lib/supabase/server";

type Supabase = Awaited<ReturnType<typeof createClient>>;

function requisitoKey(componente: string, tipo: string) {
  return `${componente}\0${tipo}`;
}

/**
 * Replica cada requisito (componente + tipo) en todos los formatos del mismo café verde.
 * Así en Producto terminado cada presentación muestra las mismas opciones de packaging.
 */
export async function syncPackagingRequisitosForCafeVerdeId(
  supabase: Supabase,
  cafeVerdeId: string,
): Promise<number> {
  const { data: formatos, error: formatosError } = await supabase
    .from("cafe_verde_formatos_venta")
    .select("id")
    .eq("cafe_verde_id", cafeVerdeId);

  if (formatosError || !formatos?.length) return 0;

  const formatoIds = formatos.map((f) => f.id);
  const { data: allRequisitos, error: reqError } = await supabase
    .from("packaging_requisito")
    .select("cafe_verde_formato_id, componente, tipo")
    .in("cafe_verde_formato_id", formatoIds);

  if (reqError || !allRequisitos?.length) return 0;

  const catalog = new Map<string, { componente: string; tipo: string }>();
  for (const r of allRequisitos) {
    catalog.set(requisitoKey(r.componente, r.tipo), {
      componente: r.componente,
      tipo: r.tipo,
    });
  }

  const byFormato = new Map<string, Set<string>>();
  for (const r of allRequisitos) {
    const set = byFormato.get(r.cafe_verde_formato_id) ?? new Set();
    set.add(requisitoKey(r.componente, r.tipo));
    byFormato.set(r.cafe_verde_formato_id, set);
  }

  let created = 0;
  for (const formato of formatos) {
    const existing = byFormato.get(formato.id) ?? new Set();
    for (const { componente, tipo } of catalog.values()) {
      const key = requisitoKey(componente, tipo);
      if (existing.has(key)) continue;

      const { error } = await supabase.from("packaging_requisito").insert({
        cafe_verde_formato_id: formato.id,
        componente,
        tipo,
        cantidad: 0,
        cantidad_por_unidad: 0,
      });

      if (!error) {
        created += 1;
        existing.add(key);
      }
    }
  }

  return created;
}

export async function syncPackagingRequisitosForFormatoId(
  supabase: Supabase,
  cafeVerdeFormatoId: string,
): Promise<number> {
  const { data: formato, error } = await supabase
    .from("cafe_verde_formatos_venta")
    .select("cafe_verde_id")
    .eq("id", cafeVerdeFormatoId)
    .maybeSingle();

  if (error || !formato?.cafe_verde_id) return 0;
  return syncPackagingRequisitosForCafeVerdeId(supabase, formato.cafe_verde_id);
}

export async function syncPackagingRequisitosForCodigo(
  supabase: Supabase,
  codigo: string,
): Promise<number> {
  const { data: lote, error } = await supabase
    .from("cafe_verde")
    .select("id")
    .eq("codigo", codigo)
    .maybeSingle();

  if (error || !lote?.id) return 0;
  return syncPackagingRequisitosForCafeVerdeId(supabase, lote.id);
}
