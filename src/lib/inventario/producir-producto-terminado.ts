import type { createClient } from "@/lib/supabase/server";

type Supabase = Awaited<ReturnType<typeof createClient>>;

export type FormatoProduccionRow = {
  id: string;
  kg_tostado_por_unidad_gr: number | null;
  receta_bloqueada: boolean;
  unidades_producidas: number;
  cafe_verde: { codigo: string } | { codigo: string }[] | null;
  packaging_requisito: {
    id: string;
    cantidad: number;
    cantidad_por_unidad: number;
  }[] | null;
};

function cafeVerdeCodigoFromRow(formato: FormatoProduccionRow): string | null {
  const raw = formato.cafe_verde;
  if (Array.isArray(raw)) return raw[0]?.codigo ?? null;
  return raw?.codigo ?? null;
}

export async function fetchFormatoProduccion(
  supabase: Supabase,
  cafeVerdeFormatoId: string,
): Promise<{ formato: FormatoProduccionRow } | { error: string }> {
  const { data: formato, error } = await supabase
    .from("cafe_verde_formatos_venta")
    .select(
      `
      id,
      kg_tostado_por_unidad_gr,
      receta_bloqueada,
      unidades_producidas,
      cafe_verde ( codigo ),
      packaging_requisito ( id, cantidad, cantidad_por_unidad )
    `,
    )
    .eq("id", cafeVerdeFormatoId)
    .maybeSingle();

  if (error) return { error: error.message };
  if (!formato) return { error: "Formato no encontrado" };
  return { formato: formato as FormatoProduccionRow };
}

export async function getTostadoDisponibleGr(
  supabase: Supabase,
  cafeVerdeCodigo: string,
): Promise<number> {
  const { data: tostados } = await supabase
    .from("cafe_tostado")
    .select("kg_existentes_gr")
    .eq("cafe_verde_codigo", cafeVerdeCodigo)
    .gt("kg_existentes_gr", 0);

  return (tostados ?? []).reduce((s, t) => s + Number(t.kg_existentes_gr), 0);
}

export function validarProduccionFormato(
  formato: FormatoProduccionRow,
  delta: number,
  tostadoDisponibleGr: number,
): { ok: true } | { error: string } {
  if (!formato.receta_bloqueada) {
    return { error: "Guardá la receta antes de producir" };
  }

  const kgPorUnidad = Number(formato.kg_tostado_por_unidad_gr);
  if (!kgPorUnidad || kgPorUnidad <= 0) {
    return { error: "Receta sin kg de tostado por unidad" };
  }

  if (!Number.isInteger(delta) || delta === 0) {
    return { error: "Cantidad inválida" };
  }

  const requisitos = formato.packaging_requisito ?? [];
  const unidades = Number(formato.unidades_producidas);

  if (delta > 0) {
    for (const r of requisitos) {
      const necesario = Number(r.cantidad_por_unidad) * delta;
      if (Number(r.cantidad) < necesario) {
        return {
          error: `Stock insuficiente de packaging (hay ${r.cantidad}, se necesitan ${necesario})`,
        };
      }
    }

    const tostadoNecesario = kgPorUnidad * delta;
    if (tostadoDisponibleGr < tostadoNecesario) {
      return {
        error: `Café tostado insuficiente (disponible ${tostadoDisponibleGr} g, necesario ${tostadoNecesario} g)`,
      };
    }
  } else {
    if (unidades + delta < 0) {
      return { error: "No hay suficientes unidades producidas para deshacer" };
    }
  }

  return { ok: true };
}

export async function aplicarProduccionFormato(
  supabase: Supabase,
  formato: FormatoProduccionRow,
  delta: number,
): Promise<{ ok: true; unidades_producidas: number } | { error: string }> {
  const cafeVerdeCodigo = cafeVerdeCodigoFromRow(formato);
  if (!cafeVerdeCodigo) return { error: "Café verde no encontrado" };

  const kgPorUnidad = Number(formato.kg_tostado_por_unidad_gr);
  const requisitos = formato.packaging_requisito ?? [];
  const unidades = Number(formato.unidades_producidas);

  if (delta > 0) {
    let restante = kgPorUnidad * delta;

    const { data: tostados } = await supabase
      .from("cafe_tostado")
      .select("id, kg_existentes_gr, kg_vendidos_gr")
      .eq("cafe_verde_codigo", cafeVerdeCodigo)
      .gt("kg_existentes_gr", 0)
      .order("fecha_tueste", { ascending: true });

    for (const t of tostados ?? []) {
      if (restante <= 0) break;
      const usar = Math.min(restante, Number(t.kg_existentes_gr));
      const { error } = await supabase
        .from("cafe_tostado")
        .update({ kg_vendidos_gr: Number(t.kg_vendidos_gr) + usar })
        .eq("id", t.id);
      if (error) return { error: error.message };
      restante -= usar;
    }

    for (const r of requisitos) {
      const nuevaCantidad = Number(r.cantidad) - Number(r.cantidad_por_unidad) * delta;
      const { error } = await supabase
        .from("packaging_requisito")
        .update({ cantidad: nuevaCantidad })
        .eq("id", r.id);
      if (error) return { error: error.message };
    }
  } else if (delta < 0) {
    const devolver = Math.abs(delta);
    let restanteTostado = kgPorUnidad * devolver;

    const { data: tostados } = await supabase
      .from("cafe_tostado")
      .select("id, kg_vendidos_gr")
      .eq("cafe_verde_codigo", cafeVerdeCodigo)
      .order("fecha_tueste", { ascending: false });

    for (const t of tostados ?? []) {
      if (restanteTostado <= 0) break;
      const maxDevolver = Number(t.kg_vendidos_gr);
      const devolverAqui = Math.min(restanteTostado, maxDevolver);
      if (devolverAqui <= 0) continue;
      const { error } = await supabase
        .from("cafe_tostado")
        .update({ kg_vendidos_gr: maxDevolver - devolverAqui })
        .eq("id", t.id);
      if (error) return { error: error.message };
      restanteTostado -= devolverAqui;
    }

    for (const r of requisitos) {
      const nuevaCantidad = Number(r.cantidad) + Number(r.cantidad_por_unidad) * devolver;
      const { error } = await supabase
        .from("packaging_requisito")
        .update({ cantidad: nuevaCantidad })
        .eq("id", r.id);
      if (error) return { error: error.message };
    }
  }

  const nuevasUnidades = unidades + delta;
  const { data: updated, error: updateUnidadesError } = await supabase
    .from("cafe_verde_formatos_venta")
    .update({ unidades_producidas: nuevasUnidades })
    .eq("id", formato.id)
    .select("unidades_producidas")
    .maybeSingle();

  if (updateUnidadesError) return { error: updateUnidadesError.message };
  if (!updated) {
    return {
      error:
        "No se pudo actualizar unidades producidas. Verificá permisos UPDATE en cafe_verde_formatos_venta.",
    };
  }

  return { ok: true, unidades_producidas: Number(updated.unidades_producidas) };
}

export async function producirFormato(
  supabase: Supabase,
  cafeVerdeFormatoId: string,
  delta: number,
  tostadoDisponibleOverride?: number,
): Promise<{ ok: true; unidades_producidas: number } | { error: string }> {
  const fetched = await fetchFormatoProduccion(supabase, cafeVerdeFormatoId);
  if ("error" in fetched) return fetched;

  const codigo = cafeVerdeCodigoFromRow(fetched.formato);
  if (!codigo) return { error: "Café verde no encontrado" };

  const tostadoDisponible =
    tostadoDisponibleOverride ?? (await getTostadoDisponibleGr(supabase, codigo));

  const validacion = validarProduccionFormato(fetched.formato, delta, tostadoDisponible);
  if ("error" in validacion) return validacion;

  const resultado = await aplicarProduccionFormato(supabase, fetched.formato, delta);
  return resultado;
}

export type ItemProduccionLote = {
  cafe_verde_formato_id: string;
  cantidad: number;
};

export async function producirLote(
  supabase: Supabase,
  codigo: string,
  items: ItemProduccionLote[],
): Promise<
  | { ok: true; resultados: { cafe_verde_formato_id: string; unidades_producidas: number }[] }
  | { error: string }
> {
  const pendientes = items.filter((i) => i.cantidad > 0);
  if (pendientes.length === 0) {
    return { error: "Indicá al menos una cantidad mayor a 0" };
  }

  for (const item of pendientes) {
    if (!Number.isInteger(item.cantidad) || item.cantidad < 0) {
      return { error: "Las cantidades deben ser números enteros ≥ 0" };
    }
  }

  const formatos: FormatoProduccionRow[] = [];
  for (const item of pendientes) {
    const fetched = await fetchFormatoProduccion(supabase, item.cafe_verde_formato_id);
    if ("error" in fetched) return fetched;
    const itemCodigo = cafeVerdeCodigoFromRow(fetched.formato);
    if (itemCodigo !== codigo) {
      return { error: "Todos los formatos deben pertenecer al mismo ID de café verde" };
    }
    formatos.push(fetched.formato);
  }

  let tostadoRestante = await getTostadoDisponibleGr(supabase, codigo);

  for (let i = 0; i < pendientes.length; i++) {
    const validacion = validarProduccionFormato(formatos[i], pendientes[i].cantidad, tostadoRestante);
    if ("error" in validacion) {
      return {
        error: `${validacion.error} (formato en posición ${i + 1})`,
      };
    }
    const kgPorUnidad = Number(formatos[i].kg_tostado_por_unidad_gr);
    tostadoRestante -= kgPorUnidad * pendientes[i].cantidad;
  }

  const resultados: { cafe_verde_formato_id: string; unidades_producidas: number }[] = [];

  for (let i = 0; i < pendientes.length; i++) {
    const item = pendientes[i];
    const fetched = await fetchFormatoProduccion(supabase, item.cafe_verde_formato_id);
    if ("error" in fetched) return fetched;

    const tostadoActual = await getTostadoDisponibleGr(supabase, codigo);
    const validacion = validarProduccionFormato(fetched.formato, item.cantidad, tostadoActual);
    if ("error" in validacion) return validacion;

    const aplicado = await aplicarProduccionFormato(supabase, fetched.formato, item.cantidad);
    if ("error" in aplicado) return aplicado;

    resultados.push({
      cafe_verde_formato_id: item.cafe_verde_formato_id,
      unidades_producidas: aplicado.unidades_producidas,
    });
  }

  return { ok: true, resultados };
}
