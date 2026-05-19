import { labelFormatoVenta } from "@/lib/inventario/formato-venta";
import { stockFromRequisitoRow } from "@/lib/inventario/packaging-componente";
import {
  puedeProducirUnidad,
  type FormatoProductoTerminado,
  type LoteProductoTerminado,
} from "@/lib/inventario/producto-terminado";
import { getTostadoDisponiblePorCodigos } from "@/lib/inventario/tostado-disponible";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

type FormatoRow = {
  id: string;
  formato_venta: string;
  kg_tostado_por_unidad_gr: number | null;
  receta_bloqueada: boolean;
  unidades_producidas: number;
  precio_venta_ars: number | null;
  precio_venta_usd: number | null;
  packaging_requisito: {
    id: string;
    packaging_componente_id: string | null;
    componente: string;
    tipo: string;
    cantidad: number;
    cantidad_por_unidad: number;
    packaging_componente: { cantidad: number } | { cantidad: number }[] | null;
  }[] | null;
};

type CafeVerdeRow = {
  codigo: string;
  varietal: string;
  cafe_verde_formatos_venta: FormatoRow[] | null;
};

function mapRows(rows: CafeVerdeRow[], tostadoPorCodigo: Record<string, number>): LoteProductoTerminado[] {
  return rows.map((lote) => ({
    codigo: lote.codigo,
    varietal: lote.varietal,
    formatos: (lote.cafe_verde_formatos_venta ?? []).map((f): FormatoProductoTerminado => {
      const requisitos = (f.packaging_requisito ?? []).map((r) => ({
        id: r.id,
        packaging_componente_id: r.packaging_componente_id,
        componente: r.componente as FormatoProductoTerminado["requisitos"][0]["componente"],
        tipo: r.tipo,
        cantidad_stock: stockFromRequisitoRow(r),
        cantidad_por_unidad: Number(r.cantidad_por_unidad),
      }));

      const formato: FormatoProductoTerminado = {
        id: f.id,
        formato_venta: f.formato_venta,
        formato_label: labelFormatoVenta(f.formato_venta),
        kg_tostado_por_unidad_gr: f.kg_tostado_por_unidad_gr,
        receta_bloqueada: f.receta_bloqueada,
        unidades_producidas: Number(f.unidades_producidas),
        precio_venta_ars: f.precio_venta_ars != null ? Number(f.precio_venta_ars) : null,
        precio_venta_usd: f.precio_venta_usd != null ? Number(f.precio_venta_usd) : null,
        requisitos,
        kg_tostado_disponible_gr: tostadoPorCodigo[lote.codigo] ?? 0,
        puede_producir: false,
      };

      formato.puede_producir = puedeProducirUnidad(formato);
      return formato;
    }),
  }));
}

export async function GET() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("cafe_verde")
    .select(
      `
      codigo,
      varietal,
      cafe_verde_formatos_venta (
        id,
        formato_venta,
        kg_tostado_por_unidad_gr,
        receta_bloqueada,
        unidades_producidas,
        precio_venta_ars,
        precio_venta_usd,
        packaging_requisito (
          id,
          packaging_componente_id,
          componente,
          tipo,
          cantidad,
          cantidad_por_unidad,
          packaging_componente ( cantidad )
        )
      )
    `,
    )
    .is("deleted_at", null)
    .order("codigo", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 502 });
  }

  const rows = (data ?? []) as CafeVerdeRow[];
  const tostadoPorCodigo = await getTostadoDisponiblePorCodigos(
    supabase,
    rows.map((l) => l.codigo),
  );

  return NextResponse.json({ lotes: mapRows(rows, tostadoPorCodigo) });
}
