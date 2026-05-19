import type {
  ConsumoProduccionInput,
  ProduccionConsumoRegistro,
} from "@/lib/inventario/produccion-consumo";
import { labelFormatoVenta } from "@/lib/inventario/formato-venta";
import type { PreciosVentaInput } from "@/lib/inventario/producir-producto-terminado";
import type { createClient } from "@/lib/supabase/server";

type Supabase = Awaited<ReturnType<typeof createClient>>;

export type OrigenProduccionRegistro = "individual" | "lote";

export type ProduccionRegistro = {
  id: string;
  cafe_verde_formato_id: string;
  cantidad: number;
  unidades_totales: number;
  kg_tostado_usado_gr: number;
  precio_venta_ars: number | null;
  precio_venta_usd: number | null;
  origen: OrigenProduccionRegistro;
  created_at: string;
  cafe_verde_formatos_venta: {
    formato_venta: string;
    cafe_verde: { codigo: string; varietal: string } | { codigo: string; varietal: string }[] | null;
  };
  consumos: ProduccionConsumoRegistro[];
};

export const LABEL_ORIGEN_PRODUCCION: Record<OrigenProduccionRegistro, string> = {
  individual: "Producción",
  lote: "Lote (varios formatos)",
};

export function labelProduccionRegistro(row: ProduccionRegistro): string {
  const f = row.cafe_verde_formatos_venta;
  if (!f) return "—";
  const cv = Array.isArray(f.cafe_verde) ? f.cafe_verde[0] : f.cafe_verde;
  const codigo = cv?.codigo ?? "?";
  return `${codigo} · ${labelFormatoVenta(f.formato_venta)}`;
}

export async function registrarProduccionHistorial(
  supabase: Supabase,
  params: {
    cafe_verde_formato_id: string;
    cantidad: number;
    unidades_totales: number;
    kg_tostado_usado_gr: number;
    origen: OrigenProduccionRegistro;
    precios?: PreciosVentaInput;
    consumos: ConsumoProduccionInput[];
  },
): Promise<{ ok: true } | { error: string }> {
  const { data: produccion, error } = await supabase
    .from("producto_terminado_produccion")
    .insert({
      cafe_verde_formato_id: params.cafe_verde_formato_id,
      cantidad: params.cantidad,
      unidades_totales: params.unidades_totales,
      kg_tostado_usado_gr: params.kg_tostado_usado_gr,
      precio_venta_ars: params.precios?.precio_venta_ars ?? null,
      precio_venta_usd: params.precios?.precio_venta_usd ?? null,
      origen: params.origen,
    })
    .select("id")
    .single();

  if (error) {
    const missing = error.message.includes("producto_terminado_produccion");
    return {
      error: missing
        ? "Ejecutá 017_producto_terminado_produccion_registro.sql en Supabase"
        : error.message,
    };
  }

  if (params.consumos.length > 0) {
    const { error: consumoError } = await supabase.from("producto_terminado_produccion_consumo").insert(
      params.consumos.map((c) => ({
        produccion_id: produccion.id,
        es_tostado: c.es_tostado,
        componente: c.componente,
        tipo: c.tipo,
        cantidad_por_unidad: c.cantidad_por_unidad,
        cantidad_usada: c.cantidad_usada,
        unidad: c.unidad,
      })),
    );

    if (consumoError) {
      await supabase.from("producto_terminado_produccion").delete().eq("id", produccion.id);
      const missing = consumoError.message.includes("producto_terminado_produccion_consumo");
      return {
        error: missing
          ? "Ejecutá 019_produccion_consumo.sql en Supabase"
          : consumoError.message,
      };
    }
  }

  return { ok: true };
}
