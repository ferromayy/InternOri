import { producirFormato } from "@/lib/inventario/producir-producto-terminado";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  let body: { cafe_verde_formato_id?: string; delta?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const cafe_verde_formato_id = body.cafe_verde_formato_id?.trim();
  const delta = Number(body.delta);

  if (!cafe_verde_formato_id || !Number.isFinite(delta) || delta === 0 || !Number.isInteger(delta)) {
    return NextResponse.json({ error: "Solicitud inválida" }, { status: 400 });
  }

  const supabase = await createClient();
  const resultado = await producirFormato(supabase, cafe_verde_formato_id, delta);

  if ("error" in resultado) {
    const status = resultado.error.includes("Guardá la receta") ? 400 : 502;
    return NextResponse.json({ error: resultado.error }, { status });
  }

  return NextResponse.json({ ok: true, unidades_producidas: resultado.unidades_producidas });
}
