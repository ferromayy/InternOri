import {
  registrarIngresoStock,
  validateIngresoComponenteInput,
} from "@/lib/inventario/packaging-componente-ingreso";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

const INGRESO_SELECT = `
  id,
  packaging_componente_id,
  cantidad,
  stock_anterior,
  stock_nuevo,
  precio_compra_ars,
  precio_compra_usd,
  origen,
  notas,
  created_at,
  packaging_componente ( componente, tipo )
`;

export async function GET() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("packaging_componente_ingreso")
    .select(INGRESO_SELECT)
    .order("created_at", { ascending: false })
    .limit(500);

  if (error) {
    const missingTable = error.message.includes("packaging_componente_ingreso");
    return NextResponse.json(
      {
        error: missingTable
          ? "Ejecutá 016_packaging_componente_ingreso.sql en Supabase"
          : error.message,
      },
      { status: 502 },
    );
  }

  return NextResponse.json({ ingresos: data ?? [] });
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const parsed = validateIngresoComponenteInput(body);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const supabase = await createClient();
  const resultado = await registrarIngresoStock(supabase, {
    ...parsed.data,
    origen: "manual",
  });

  if ("error" in resultado) {
    const status = resultado.error.includes("no encontrado") ? 404 : 502;
    return NextResponse.json({ error: resultado.error }, { status });
  }

  return NextResponse.json({ ok: true, stock_nuevo: resultado.stock_nuevo }, { status: 201 });
}
