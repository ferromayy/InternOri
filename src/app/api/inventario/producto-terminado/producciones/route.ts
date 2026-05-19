import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

const SELECT = `
  id,
  cafe_verde_formato_id,
  cantidad,
  unidades_totales,
  kg_tostado_usado_gr,
  precio_venta_ars,
  precio_venta_usd,
  origen,
  created_at,
  cafe_verde_formatos_venta (
    formato_venta,
    cafe_verde ( codigo, varietal )
  ),
  consumos:producto_terminado_produccion_consumo (
    id,
    produccion_id,
    es_tostado,
    componente,
    tipo,
    cantidad_por_unidad,
    cantidad_usada,
    unidad
  )
`;

export async function GET() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("producto_terminado_produccion")
    .select(SELECT)
    .order("created_at", { ascending: false })
    .limit(500);

  if (error) {
    const missing = error.message.includes("producto_terminado_produccion");
    return NextResponse.json(
      {
        error: missing
          ? "Ejecutá 017_producto_terminado_produccion_registro.sql en Supabase"
          : error.message,
      },
      { status: 502 },
    );
  }

  const producciones = (data ?? []).map((row) => {
    const r = row as Record<string, unknown>;
    const consumos = r.consumos;
    return {
      ...r,
      consumos: Array.isArray(consumos) ? consumos : [],
    };
  });

  return NextResponse.json({ producciones });
}
