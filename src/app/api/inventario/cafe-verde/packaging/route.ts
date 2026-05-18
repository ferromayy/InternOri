import { labelFormatoVenta } from "@/lib/inventario/formato-venta";
import type { FormatoPackaging, LotePackaging, PackagingRequisito } from "@/lib/inventario/packaging";
import { syncPackagingRequisitosForCodigo } from "@/lib/inventario/packaging-sync";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

type FormatoRow = {
  id: string;
  formato_venta: string;
  packaging_requisito: {
    id: string;
    componente: string;
    tipo: string;
    cantidad: number;
  }[] | null;
};

type CafeVerdeRow = {
  codigo: string;
  varietal: string;
  cafe_verde_formatos_venta: FormatoRow[] | null;
};

function mapPackagingRows(rows: CafeVerdeRow[]): LotePackaging[] {
  return rows.map((lote) => ({
    codigo: lote.codigo,
    varietal: lote.varietal,
    formatos: (lote.cafe_verde_formatos_venta ?? []).map((f): FormatoPackaging => ({
      id: f.id,
      formato_venta: f.formato_venta,
      formato_label: labelFormatoVenta(f.formato_venta),
      requisitos: (f.packaging_requisito ?? []) as PackagingRequisito[],
    })),
  }));
}

export async function GET(request: Request) {
  const codigo = new URL(request.url).searchParams.get("codigo");
  const supabase = await createClient();

  let query = supabase
    .from("cafe_verde")
    .select(
      `
      codigo,
      varietal,
      cafe_verde_formatos_venta (
        id,
        formato_venta,
        packaging_requisito ( id, componente, tipo, cantidad )
      )
    `,
    )
    .order("codigo", { ascending: true });

  if (codigo) {
    query = query.eq("codigo", codigo);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 502 });
  }

  const rows = (data ?? []) as CafeVerdeRow[];
  for (const lote of rows) {
    await syncPackagingRequisitosForCodigo(supabase, lote.codigo);
  }

  const { data: refreshed, error: refreshError } = await query;

  if (refreshError) {
    return NextResponse.json({ error: refreshError.message }, { status: 502 });
  }

  return NextResponse.json({ lotes: mapPackagingRows((refreshed ?? []) as CafeVerdeRow[]) });
}
