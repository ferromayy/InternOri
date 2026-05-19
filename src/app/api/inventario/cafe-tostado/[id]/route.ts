import { validateCafeTostadoUpdate } from "@/lib/inventario/cafe-tostado";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const parsed = validateCafeTostadoUpdate(body);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const supabase = await createClient();

  const { data: existing, error: fetchError } = await supabase
    .from("cafe_tostado")
    .select("id, deleted_at")
    .eq("id", id)
    .maybeSingle();

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 502 });
  }

  if (!existing || existing.deleted_at) {
    return NextResponse.json({ error: "Registro no encontrado" }, { status: 404 });
  }

  const { error } = await supabase
    .from("cafe_tostado")
    .update(parsed.data)
    .eq("id", id)
    .is("deleted_at", null);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 502 });
  }

  const { data, error: readError } = await supabase
    .from("cafe_tostado")
    .select(
      "id, codigo, cafe_verde_codigo, fecha_tueste, perfil, kg_verde_tostado_gr, kg_despues_tostar_gr, merma_gr, kg_vendidos_gr, kg_existentes_gr, created_at, deleted_at",
    )
    .eq("id", id)
    .single();

  if (readError) {
    return NextResponse.json({ error: readError.message }, { status: 502 });
  }

  return NextResponse.json({ ok: true, item: data });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: row, error: fetchError } = await supabase
    .from("cafe_tostado")
    .select(
      "id, cafe_verde_codigo, kg_verde_tostado_gr, kg_vendidos_gr, kg_existentes_gr, deleted_at",
    )
    .eq("id", id)
    .maybeSingle();

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 502 });
  }

  if (!row || row.deleted_at) {
    return NextResponse.json({ error: "Registro no encontrado" }, { status: 404 });
  }

  if (Number(row.kg_vendidos_gr) > 0) {
    return NextResponse.json(
      {
        error:
          "No se puede eliminar: ya se usó café de este tueste en producción de producto terminado.",
      },
      { status: 409 },
    );
  }

  const { data: verde, error: verdeError } = await supabase
    .from("cafe_verde")
    .select("kg_usados_gr")
    .eq("codigo", row.cafe_verde_codigo)
    .is("deleted_at", null)
    .maybeSingle();

  if (verdeError) {
    return NextResponse.json({ error: verdeError.message }, { status: 502 });
  }

  const { error: softError } = await supabase
    .from("cafe_tostado")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);

  if (softError) {
    return NextResponse.json({ error: softError.message }, { status: 502 });
  }

  if (verde) {
    const nuevoUsado = Math.max(0, Number(verde.kg_usados_gr) - Number(row.kg_verde_tostado_gr));
    await supabase
      .from("cafe_verde")
      .update({ kg_usados_gr: nuevoUsado })
      .eq("codigo", row.cafe_verde_codigo)
      .is("deleted_at", null);
  }

  return NextResponse.json({ ok: true });
}
