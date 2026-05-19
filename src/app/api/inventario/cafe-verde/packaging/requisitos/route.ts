import { validateRequisitoLinkInput } from "@/lib/inventario/packaging-componente";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const parsed = validateRequisitoLinkInput(body);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const supabase = await createClient();
  let packaging_componente_id: string;

  if ("packaging_componente_id" in parsed.data) {
    packaging_componente_id = parsed.data.packaging_componente_id;
  } else {
    const { componente, tipo, cantidad } = parsed.data;
    const { data: existing } = await supabase
      .from("packaging_componente")
      .select("id")
      .eq("componente", componente)
      .eq("tipo", tipo)
      .maybeSingle();

    if (existing?.id) {
      packaging_componente_id = existing.id;
      if (cantidad > 0) {
        const { data: row } = await supabase
          .from("packaging_componente")
          .select("cantidad")
          .eq("id", existing.id)
          .single();
        if (row) {
          await supabase
            .from("packaging_componente")
            .update({ cantidad: Number(row.cantidad) + cantidad })
            .eq("id", existing.id);
        }
      }
    } else {
      const { data: created, error: createError } = await supabase
        .from("packaging_componente")
        .insert({ componente, tipo, cantidad })
        .select("id")
        .single();

      if (createError || !created) {
        return NextResponse.json(
          { error: createError?.message ?? "No se pudo crear el componente" },
          { status: 502 },
        );
      }
      packaging_componente_id = created.id;
    }
  }

  const { data: componenteRow } = await supabase
    .from("packaging_componente")
    .select("componente, tipo, cantidad")
    .eq("id", packaging_componente_id)
    .single();

  if (!componenteRow) {
    return NextResponse.json({ error: "Componente no encontrado" }, { status: 404 });
  }

  const { data, error } = await supabase
    .from("packaging_requisito")
    .insert({
      cafe_verde_formato_id: parsed.data.cafe_verde_formato_id,
      packaging_componente_id,
      componente: componenteRow.componente,
      tipo: componenteRow.tipo,
      cantidad: componenteRow.cantidad,
    })
    .select(
      `
      id,
      packaging_componente_id,
      componente,
      tipo,
      cantidad,
      packaging_componente ( id, componente, tipo, cantidad )
    `,
    )
    .single();

  if (error) {
    const isDuplicate = error.code === "23505";
    return NextResponse.json(
      {
        error: isDuplicate
          ? "Este formato ya usa ese componente"
          : error.message,
      },
      { status: isDuplicate ? 409 : 502 },
    );
  }

  return NextResponse.json({ ok: true, requisito: data }, { status: 201 });
}
