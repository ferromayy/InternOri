import { validateRecetaInput } from "@/lib/inventario/producto-terminado";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const parsed = validateRecetaInput(body);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const { cafe_verde_formato_id, kg_tostado_por_unidad_gr, requisitos } = parsed.data;

  let actualizar = false;
  if (body && typeof body === "object" && (body as Record<string, unknown>).actualizar === true) {
    actualizar = true;
  }

  const supabase = await createClient();

  const { data: formato, error: formatoError } = await supabase
    .from("cafe_verde_formatos_venta")
    .select("id, receta_bloqueada")
    .eq("id", cafe_verde_formato_id)
    .maybeSingle();

  if (formatoError) {
    return NextResponse.json({ error: formatoError.message }, { status: 502 });
  }

  if (!formato) {
    return NextResponse.json({ error: "Formato no encontrado" }, { status: 404 });
  }

  if (formato.receta_bloqueada && !actualizar) {
    return NextResponse.json(
      { error: "La receta ya existe. Usá actualizar para modificarla." },
      { status: 409 },
    );
  }

  const { data: updatedFormato, error: updateFormatoError } = await supabase
    .from("cafe_verde_formatos_venta")
    .update({
      kg_tostado_por_unidad_gr,
      receta_bloqueada: true,
    })
    .eq("id", cafe_verde_formato_id)
    .select("id, receta_bloqueada, kg_tostado_por_unidad_gr")
    .maybeSingle();

  if (updateFormatoError) {
    return NextResponse.json({ error: updateFormatoError.message }, { status: 502 });
  }

  if (!updatedFormato?.receta_bloqueada) {
    return NextResponse.json(
      {
        error:
          "No se pudo guardar la receta. Ejecutá 010_cafe_verde_formatos_update.sql en Supabase (falta permiso de actualización).",
      },
      { status: 502 },
    );
  }

  for (const req of requisitos) {
    const { error } = await supabase
      .from("packaging_requisito")
      .update({ cantidad_por_unidad: req.cantidad_por_unidad })
      .eq("id", req.id)
      .eq("cafe_verde_formato_id", cafe_verde_formato_id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 502 });
    }
  }

  return NextResponse.json({ ok: true });
}
