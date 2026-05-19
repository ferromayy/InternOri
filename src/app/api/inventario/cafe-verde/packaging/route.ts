import { labelFormatoVenta } from "@/lib/inventario/formato-venta";
import { stockFromRequisitoRow } from "@/lib/inventario/packaging-componente";
import type { ComponentePackaging, FormatoPackaging, LotePackaging, PackagingRequisito } from "@/lib/inventario/packaging";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

type RequisitoRow = {
  id: string;
  packaging_componente_id: string | null;
  componente: string;
  tipo: string;
  cantidad: number;
  packaging_componente: { cantidad: number } | { cantidad: number }[] | null;
};

type FormatoRow = {
  id: string;
  formato_venta: string;
  packaging_requisito: RequisitoRow[] | null;
};

type CafeVerdeRow = {
  codigo: string;
  varietal: string;
  cafe_verde_formatos_venta: FormatoRow[] | null;
};

function mapRequisito(r: RequisitoRow): PackagingRequisito {
  const stock = stockFromRequisitoRow(r);
  return {
    id: r.id,
    packaging_componente_id: r.packaging_componente_id ?? "",
    componente: r.componente as ComponentePackaging,
    tipo: r.tipo,
    cantidad: stock,
  };
}

function mapPackagingRows(rows: CafeVerdeRow[]): LotePackaging[] {
  return rows.map((lote) => ({
    codigo: lote.codigo,
    varietal: lote.varietal,
    formatos: (lote.cafe_verde_formatos_venta ?? []).map((f): FormatoPackaging => ({
      id: f.id,
      formato_venta: f.formato_venta,
      formato_label: labelFormatoVenta(f.formato_venta),
      requisitos: (f.packaging_requisito ?? []).map(mapRequisito),
    })),
  }));
}

const PACKAGING_SELECT = `
  codigo,
  varietal,
  cafe_verde_formatos_venta (
    id,
    formato_venta,
    packaging_requisito (
      id,
      packaging_componente_id,
      componente,
      tipo,
      cantidad,
      packaging_componente ( cantidad )
    )
  )
`;

export async function GET(request: Request) {
  const codigo = new URL(request.url).searchParams.get("codigo");
  const supabase = await createClient();

  let query = supabase
    .from("cafe_verde")
    .select(PACKAGING_SELECT)
    .is("deleted_at", null)
    .order("codigo", { ascending: true });

  if (codigo) {
    query = query.eq("codigo", codigo);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 502 });
  }

  return NextResponse.json({ lotes: mapPackagingRows((data ?? []) as CafeVerdeRow[]) });
}
