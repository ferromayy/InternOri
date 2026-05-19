import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  let body: { cantidad?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const cantidad = Number(body.cantidad);
  if (!Number.isFinite(cantidad) || cantidad < 0) {
    return NextResponse.json({ error: "Cantidad inválida" }, { status: 400 });
  }

  const supabase = await createClient();

  const { data: requisito, error: reqError } = await supabase
    .from("packaging_requisito")
    .select("packaging_componente_id")
    .eq("id", id)
    .maybeSingle();

  if (reqError) {
    return NextResponse.json({ error: reqError.message }, { status: 502 });
  }

  if (!requisito?.packaging_componente_id) {
    return NextResponse.json(
      { error: "Ejecutá 011_packaging_componente_catalogo.sql en Supabase" },
      { status: 502 },
    );
  }

  const { error } = await supabase
    .from("packaging_componente")
    .update({ cantidad })
    .eq("id", requisito.packaging_componente_id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 502 });
  }

  await supabase
    .from("packaging_requisito")
    .update({ cantidad })
    .eq("packaging_componente_id", requisito.packaging_componente_id);

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();
  const { error } = await supabase.from("packaging_requisito").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
