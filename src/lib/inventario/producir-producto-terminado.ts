import { buildConsumosProduccion } from "@/lib/inventario/produccion-consumo";
import { registrarProduccionHistorial, type OrigenProduccionRegistro } from "@/lib/inventario/produccion-registro";
import { stockFromRequisitoRow } from "@/lib/inventario/packaging-componente";
import { getTostadoDisponiblePorCodigos } from "@/lib/inventario/tostado-disponible";
import type { createClient } from "@/lib/supabase/server";

type Supabase = Awaited<ReturnType<typeof createClient>>;

export type PreciosVentaInput = {
  precio_venta_ars: number | null;
  precio_venta_usd: number | null;
};

export type AplicarProduccionOptions = {
  precios?: PreciosVentaInput;
  origen?: OrigenProduccionRegistro;
  detalle?: string | null;
};

export type FormatoProduccionRow = {
  id: string;
  formato_venta: string;
  kg_tostado_por_unidad_gr: number | null;
  receta_bloqueada: boolean;
  unidades_producidas: number;
  precio_venta_ars?: number | null;
  precio_venta_usd?: number | null;
  cafe_verde: { codigo: string } | { codigo: string }[] | null;
  packaging_requisito: {
    id: string;
    packaging_componente_id: string | null;
    componente: string;
    tipo: string;
    cantidad: number;
    cantidad_por_unidad: number;
    packaging_componente?: { cantidad: number } | { cantidad: number }[] | null;
  }[] | null;
};

type RequisitoProduccion = NonNullable<FormatoProduccionRow["packaging_requisito"]>[number];

function stockRequisito(r: RequisitoProduccion): number {
  return stockFromRequisitoRow(r);
}

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
    .select(FORMATO_PRODUCCION_SELECT)
    .eq("id", cafeVerdeFormatoId)
    .maybeSingle();

  if (error) return { error: error.message };
  if (!formato) return { error: "Formato no encontrado" };
  return { formato: formato as FormatoProduccionRow };
}

const FORMATO_PRODUCCION_SELECT = `
  id,
  formato_venta,
  kg_tostado_por_unidad_gr,
  receta_bloqueada,
  unidades_producidas,
  precio_venta_ars,
  precio_venta_usd,
  cafe_verde ( codigo ),
  packaging_requisito (
    id,
    packaging_componente_id,
    componente,
    tipo,
    cantidad,
    cantidad_por_unidad,
    packaging_componente ( cantidad )
  )
`;

export async function fetchFormatosProduccion(
  supabase: Supabase,
  cafeVerdeFormatoIds: string[],
): Promise<{ formatos: FormatoProduccionRow[] } | { error: string }> {
  if (cafeVerdeFormatoIds.length === 0) {
    return { formatos: [] };
  }

  const { data, error } = await supabase
    .from("cafe_verde_formatos_venta")
    .select(FORMATO_PRODUCCION_SELECT)
    .in("id", cafeVerdeFormatoIds);

  if (error) return { error: error.message };

  const byId = new Map((data ?? []).map((f) => [f.id, f as FormatoProduccionRow]));
  const formatos: FormatoProduccionRow[] = [];
  for (const id of cafeVerdeFormatoIds) {
    const row = byId.get(id);
    if (!row) return { error: "Formato no encontrado" };
    formatos.push(row);
  }
  return { formatos };
}

export async function getTostadoDisponibleGr(
  supabase: Supabase,
  cafeVerdeCodigo: string,
): Promise<number> {
  const map = await getTostadoDisponiblePorCodigos(supabase, [cafeVerdeCodigo]);
  return map[cafeVerdeCodigo] ?? 0;
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
      const stock = stockRequisito(r);
      if (stock < necesario) {
        return {
          error: `Stock insuficiente de packaging (hay ${stock}, se necesitan ${necesario})`,
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
  options?: AplicarProduccionOptions,
): Promise<{ ok: true; unidades_producidas: number } | { error: string }> {
  const precios = options?.precios;
  const origen = options?.origen ?? "individual";
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
      .is("deleted_at", null)
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

    const updatedComponentes = new Set<string>();
    for (const r of requisitos) {
      const stock = stockRequisito(r);
      const nuevaCantidad = stock - Number(r.cantidad_por_unidad) * delta;
      if (r.packaging_componente_id) {
        if (!updatedComponentes.has(r.packaging_componente_id)) {
          const { error } = await supabase
            .from("packaging_componente")
            .update({ cantidad: nuevaCantidad })
            .eq("id", r.packaging_componente_id);
          if (error) return { error: error.message };
          updatedComponentes.add(r.packaging_componente_id);
        }
        await supabase
          .from("packaging_requisito")
          .update({ cantidad: nuevaCantidad })
          .eq("packaging_componente_id", r.packaging_componente_id);
      } else {
        const { error } = await supabase
          .from("packaging_requisito")
          .update({ cantidad: nuevaCantidad })
          .eq("id", r.id);
        if (error) return { error: error.message };
      }
    }
  } else if (delta < 0) {
    const devolver = Math.abs(delta);
    let restanteTostado = kgPorUnidad * devolver;

    const { data: tostados } = await supabase
      .from("cafe_tostado")
      .select("id, kg_vendidos_gr")
      .eq("cafe_verde_codigo", cafeVerdeCodigo)
      .is("deleted_at", null)
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

    const updatedComponentes = new Set<string>();
    for (const r of requisitos) {
      const stock = stockRequisito(r);
      const nuevaCantidad = stock + Number(r.cantidad_por_unidad) * devolver;
      if (r.packaging_componente_id) {
        if (!updatedComponentes.has(r.packaging_componente_id)) {
          const { error } = await supabase
            .from("packaging_componente")
            .update({ cantidad: nuevaCantidad })
            .eq("id", r.packaging_componente_id);
          if (error) return { error: error.message };
          updatedComponentes.add(r.packaging_componente_id);
        }
        await supabase
          .from("packaging_requisito")
          .update({ cantidad: nuevaCantidad })
          .eq("packaging_componente_id", r.packaging_componente_id);
      } else {
        const { error } = await supabase
          .from("packaging_requisito")
          .update({ cantidad: nuevaCantidad })
          .eq("id", r.id);
        if (error) return { error: error.message };
      }
    }
  }

  const nuevasUnidades = unidades + delta;
  const updatePayload: {
    unidades_producidas: number;
    precio_venta_ars?: number | null;
    precio_venta_usd?: number | null;
  } = { unidades_producidas: nuevasUnidades };
  if (precios) {
    updatePayload.precio_venta_ars = precios.precio_venta_ars;
    updatePayload.precio_venta_usd = precios.precio_venta_usd;
  }

  const { data: updated, error: updateUnidadesError } = await supabase
    .from("cafe_verde_formatos_venta")
    .update(updatePayload)
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

  const unidades_producidas = Number(updated.unidades_producidas);

  if (delta > 0) {
    const preciosRegistro: PreciosVentaInput = precios ?? {
      precio_venta_ars:
        formato.precio_venta_ars != null ? Number(formato.precio_venta_ars) : null,
      precio_venta_usd:
        formato.precio_venta_usd != null ? Number(formato.precio_venta_usd) : null,
    };
    const historial = await registrarProduccionHistorial(supabase, {
      cafe_verde_formato_id: formato.id,
      cantidad: delta,
      unidades_totales: unidades_producidas,
      kg_tostado_usado_gr: kgPorUnidad * delta,
      origen,
      precios: preciosRegistro,
      detalle: options?.detalle ?? null,
      consumos: buildConsumosProduccion(formato, delta, cafeVerdeCodigo),
    });
    if ("error" in historial) return historial;
  }

  return { ok: true, unidades_producidas };
}

export async function producirFormato(
  supabase: Supabase,
  cafeVerdeFormatoId: string,
  delta: number,
  tostadoDisponibleOverride?: number,
  precios?: PreciosVentaInput,
  detalle?: string | null,
): Promise<{ ok: true; unidades_producidas: number } | { error: string }> {
  const fetched = await fetchFormatoProduccion(supabase, cafeVerdeFormatoId);
  if ("error" in fetched) return fetched;

  const codigo = cafeVerdeCodigoFromRow(fetched.formato);
  if (!codigo) return { error: "Café verde no encontrado" };

  const tostadoDisponible =
    tostadoDisponibleOverride ?? (await getTostadoDisponibleGr(supabase, codigo));

  const validacion = validarProduccionFormato(fetched.formato, delta, tostadoDisponible);
  if ("error" in validacion) return validacion;

  const resultado = await aplicarProduccionFormato(supabase, fetched.formato, delta, {
    precios,
    origen: "individual",
    detalle,
  });
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
  detalle?: string | null,
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

  const ids = pendientes.map((p) => p.cafe_verde_formato_id);
  const fetched = await fetchFormatosProduccion(supabase, ids);
  if ("error" in fetched) return fetched;

  const formatos = fetched.formatos;
  for (const formato of formatos) {
    if (cafeVerdeCodigoFromRow(formato) !== codigo) {
      return { error: "Todos los formatos deben pertenecer al mismo ID de café verde" };
    }
  }

  let tostadoRestante = await getTostadoDisponibleGr(supabase, codigo);

  for (let i = 0; i < pendientes.length; i++) {
    const validacion = validarProduccionFormato(formatos[i], pendientes[i].cantidad, tostadoRestante);
    if ("error" in validacion) {
      return {
        error: `${validacion.error} (${formatos[i].id === pendientes[i].cafe_verde_formato_id ? "revisá cantidades" : "formato inválido"})`,
      };
    }
    const kgPorUnidad = Number(formatos[i].kg_tostado_por_unidad_gr);
    tostadoRestante -= kgPorUnidad * pendientes[i].cantidad;
  }

  const resultados: { cafe_verde_formato_id: string; unidades_producidas: number }[] = [];

  for (let i = 0; i < pendientes.length; i++) {
    const item = pendientes[i];
    const refetch = await fetchFormatoProduccion(supabase, item.cafe_verde_formato_id);
    if ("error" in refetch) return refetch;

    const aplicado = await aplicarProduccionFormato(supabase, refetch.formato, item.cantidad, {
      origen: "lote",
      detalle,
    });
    if ("error" in aplicado) return aplicado;

    resultados.push({
      cafe_verde_formato_id: item.cafe_verde_formato_id,
      unidades_producidas: aplicado.unidades_producidas,
    });
  }

  return { ok: true, resultados };
}
