import {
  registrarVentaStock,
  validateVentaInput,
} from "@/lib/inventario/producto-terminado-venta";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

const SELECT = `
  id,
  cafe_verde_formato_id,
  cantidad,
  unidades_restantes,
  precio_venta,
  tipo_cliente,
  fecha,
  detalle,
  created_at,
  cafe_verde_formatos_venta (
    formato_venta,
    cafe_verde ( codigo, varietal )
  )
`;

export async function GET() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("producto_terminado_venta")
    .select(SELECT)
    .order("fecha", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(500);

  if (error) {
    const missing = error.message.includes("producto_terminado_venta");
    return NextResponse.json(
      {
        error: missing
          ? "Ejecutá 018_producto_terminado_venta.sql en Supabase"
          : error.message,
      },
      { status: 502 },
    );
  }

  return NextResponse.json({ ventas: data ?? [] });
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const parsed = validateVentaInput(body);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const supabase = await createClient();
  const resultado = await registrarVentaStock(supabase, parsed.data);

  if ("error" in resultado) {
    const status =
      resultado.error.includes("insuficiente") || resultado.error.includes("no encontrado")
        ? 400
        : 502;
    return NextResponse.json({ error: resultado.error }, { status });
  }

  return NextResponse.json(
    { ok: true, unidades_restantes: resultado.unidades_restantes },
    { status: 201 },
  );
}
