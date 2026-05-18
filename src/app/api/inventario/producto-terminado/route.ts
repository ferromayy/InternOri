import { labelFormatoVenta } from "@/lib/inventario/formato-venta";
import { syncPackagingRequisitosForCodigo } from "@/lib/inventario/packaging-sync";
import {
  puedeProducirUnidad,
  type FormatoProductoTerminado,
  type LoteProductoTerminado,
} from "@/lib/inventario/producto-terminado";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

type FormatoRow = {
  id: string;
  formato_venta: string;
  kg_tostado_por_unidad_gr: number | null;
  receta_bloqueada: boolean;
  unidades_producidas: number;
  packaging_requisito: {
    id: string;
    componente: string;
    tipo: string;
    cantidad: number;
    cantidad_por_unidad: number;
  }[] | null;
};

type CafeVerdeRow = {
  codigo: string;
  varietal: string;
  cafe_verde_formatos_venta: FormatoRow[] | null;
};

async function getTostadoDisponible(
  supabase: Awaited<ReturnType<typeof createClient>>,
  cafeVerdeCodigo: string,
) {
  const { data } = await supabase
    .from("cafe_tostado")
    .select("kg_existentes_gr")
    .eq("cafe_verde_codigo", cafeVerdeCodigo);

  return (data ?? []).reduce((sum, row) => sum + Number(row.kg_existentes_gr), 0);
}

function mapRows(rows: CafeVerdeRow[], tostadoPorCodigo: Record<string, number>): LoteProductoTerminado[] {
  return rows.map((lote) => ({
    codigo: lote.codigo,
    varietal: lote.varietal,
    formatos: (lote.cafe_verde_formatos_venta ?? []).map((f): FormatoProductoTerminado => {
      const requisitos = (f.packaging_requisito ?? []).map((r) => ({
        id: r.id,
        componente: r.componente as FormatoProductoTerminado["requisitos"][0]["componente"],
        tipo: r.tipo,
        cantidad_stock: Number(r.cantidad),
        cantidad_por_unidad: Number(r.cantidad_por_unidad),
      }));

      const formato: FormatoProductoTerminado = {
        id: f.id,
        formato_venta: f.formato_venta,
        formato_label: labelFormatoVenta(f.formato_venta),
        kg_tostado_por_unidad_gr: f.kg_tostado_por_unidad_gr,
        receta_bloqueada: f.receta_bloqueada,
        unidades_producidas: Number(f.unidades_producidas),
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

  const { data: codigos } = await supabase.from("cafe_verde").select("codigo");
  for (const row of codigos ?? []) {
    await syncPackagingRequisitosForCodigo(supabase, row.codigo);
  }

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
        packaging_requisito ( id, componente, tipo, cantidad, cantidad_por_unidad )
      )
    `,
    )
    .order("codigo", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 502 });
  }

  const rows = (data ?? []) as CafeVerdeRow[];
  const tostadoPorCodigo: Record<string, number> = {};
  for (const lote of rows) {
    tostadoPorCodigo[lote.codigo] = await getTostadoDisponible(supabase, lote.codigo);
  }

  return NextResponse.json({ lotes: mapRows(rows, tostadoPorCodigo) });
}
