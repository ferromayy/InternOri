import { buildTostadoCodigo, validateCafeTostadoInput } from "@/lib/inventario/cafe-tostado";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("cafe_tostado")
    .select(
      "id, codigo, cafe_verde_codigo, fecha_tueste, perfil, kg_verde_tostado_gr, kg_despues_tostar_gr, merma_gr, kg_vendidos_gr, kg_existentes_gr, detalle, created_at, deleted_at",
    )
    .is("deleted_at", null)
    .order("fecha_tueste", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 502 });
  }

  return NextResponse.json({ items: data ?? [] });
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const parsed = validateCafeTostadoInput(body);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const {
    cafe_verde_codigo,
    kg_verde_tostado_gr,
    kg_despues_tostar_gr,
    fecha_tueste,
    perfil,
    detalle,
  } = parsed.data;
  const supabase = await createClient();

  const { data: verde, error: verdeError } = await supabase
    .from("cafe_verde")
    .select("codigo, kg_iniciales_gr, kg_actuales_gr, kg_usados_gr")
    .eq("codigo", cafe_verde_codigo)
    .is("deleted_at", null)
    .gt("kg_actuales_gr", 0)
    .maybeSingle();

  if (verdeError) {
    return NextResponse.json({ error: verdeError.message }, { status: 502 });
  }

  if (!verde) {
    return NextResponse.json(
      { error: "ID de café verde no válido o sin stock disponible" },
      { status: 400 },
    );
  }

  if (kg_verde_tostado_gr > Number(verde.kg_actuales_gr)) {
    return NextResponse.json(
      {
        error: `Solo hay ${verde.kg_actuales_gr} g disponibles en ese lote (actuales)`,
      },
      { status: 400 },
    );
  }

  const codigo = buildTostadoCodigo(cafe_verde_codigo);

  const { data, error } = await supabase
    .from("cafe_tostado")
    .insert({
      codigo,
      cafe_verde_codigo,
      fecha_tueste,
      perfil,
      kg_verde_tostado_gr,
      kg_despues_tostar_gr,
      kg_vendidos_gr: 0,
      detalle,
    })
    .select("id, codigo, cafe_verde_codigo, merma_gr")
    .single();

  if (error) {
    const isDuplicate = error.code === "23505";
    return NextResponse.json(
      { error: isDuplicate ? "Ya existe un registro con ese código" : error.message },
      { status: isDuplicate ? 409 : 502 },
    );
  }

  const nuevoUsado = Number(verde.kg_usados_gr) + kg_verde_tostado_gr;
  const { error: updateError } = await supabase
    .from("cafe_verde")
    .update({ kg_usados_gr: nuevoUsado })
    .eq("codigo", cafe_verde_codigo);

  if (updateError) {
    return NextResponse.json(
      {
        error: `Tueste guardado pero no se pudo descontar del café verde: ${updateError.message}`,
        partial: true,
        id: data.id,
      },
      { status: 502 },
    );
  }

  return NextResponse.json(
    {
      ok: true,
      id: data.id,
      codigo: data.codigo,
      cafe_verde_codigo: data.cafe_verde_codigo,
      merma_gr: data.merma_gr,
    },
    { status: 201 },
  );
}
