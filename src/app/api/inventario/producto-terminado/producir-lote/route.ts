import { producirLote, type ItemProduccionLote } from "@/lib/inventario/producir-producto-terminado";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  let body: { codigo?: string; cantidades?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const codigo = body.codigo?.trim();
  if (!codigo) {
    return NextResponse.json({ error: "ID de café verde requerido" }, { status: 400 });
  }

  if (!Array.isArray(body.cantidades)) {
    return NextResponse.json({ error: "Lista de cantidades inválida" }, { status: 400 });
  }

  const items: ItemProduccionLote[] = [];
  for (const row of body.cantidades) {
    if (!row || typeof row !== "object") continue;
    const r = row as Record<string, unknown>;
    const cafe_verde_formato_id =
      typeof r.cafe_verde_formato_id === "string" ? r.cafe_verde_formato_id.trim() : "";
    const cantidad = Number(r.cantidad);
    if (!cafe_verde_formato_id) continue;
    if (!Number.isFinite(cantidad) || cantidad < 0) {
      return NextResponse.json({ error: "Cantidad inválida" }, { status: 400 });
    }
    items.push({ cafe_verde_formato_id, cantidad: Math.floor(cantidad) });
  }

  const supabase = await createClient();
  const resultado = await producirLote(supabase, codigo, items);

  if ("error" in resultado) {
    const status =
      resultado.error.includes("Indicá") ||
      resultado.error.includes("inválid") ||
      resultado.error.includes("Guardá")
        ? 400
        : 502;
    return NextResponse.json({ error: resultado.error }, { status });
  }

  return NextResponse.json({ ok: true, resultados: resultado.resultados });
}
