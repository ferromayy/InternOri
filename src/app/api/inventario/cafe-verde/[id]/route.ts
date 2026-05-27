import { mapCafeVerdeRows, validateCafeVerdeUpdate } from "@/lib/inventario/cafe-verde";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

const CAFE_VERDE_SELECT = `
  id,
  codigo,
  varietal,
  origen,
  productor,
  proceso,
  fecha_ingreso,
  importador,
  lote,
  kg_iniciales_gr,
  kg_usados_gr,
  kg_actuales_gr,
  costo_total_ars,
  costo_total_usd,
  detalle,
  created_at,
  deleted_at,
  cafe_verde_formatos_venta ( formato_venta )
`;

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

  const parsed = validateCafeVerdeUpdate(body);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const supabase = await createClient();

  const { data: existing, error: fetchError } = await supabase
    .from("cafe_verde")
    .select("id, kg_usados_gr, deleted_at")
    .eq("id", id)
    .maybeSingle();

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 502 });
  }

  if (!existing || existing.deleted_at) {
    return NextResponse.json({ error: "Registro no encontrado" }, { status: 404 });
  }

  const { formatos_venta, kg_iniciales_gr, ...scalarPatch } = parsed.data;

  if (kg_iniciales_gr !== undefined && Number(existing.kg_usados_gr) > 0) {
    return NextResponse.json(
      { error: "No se puede cambiar kg iniciales si ya hay café usado en tuestes" },
      { status: 409 },
    );
  }

  if (Object.keys(scalarPatch).length > 0 || kg_iniciales_gr !== undefined) {
    const { error: updateError } = await supabase
      .from("cafe_verde")
      .update({
        ...scalarPatch,
        ...(kg_iniciales_gr !== undefined ? { kg_iniciales_gr } : {}),
      })
      .eq("id", id)
      .is("deleted_at", null);

    if (updateError) {
      const isDuplicate = updateError.code === "23505";
      return NextResponse.json(
        { error: isDuplicate ? "Ya existe otro lote activo con ese valor de lote" : updateError.message },
        { status: isDuplicate ? 409 : 502 },
      );
    }
  }

  if (formatos_venta) {
    const { data: formatosActuales } = await supabase
      .from("cafe_verde_formatos_venta")
      .select("id, formato_venta")
      .eq("cafe_verde_id", id);

    const actuales = formatosActuales ?? [];
    const nuevosSet = new Set(formatos_venta);
    const actualesSet = new Set(actuales.map((f) => f.formato_venta));

    const aEliminar = actuales.filter((f) => !nuevosSet.has(f.formato_venta as (typeof formatos_venta)[number]));
    const aAgregar = formatos_venta.filter((fv) => !actualesSet.has(fv));

    for (const formato of aEliminar) {
      const { count } = await supabase
        .from("packaging_requisito")
        .select("id", { count: "exact", head: true })
        .eq("cafe_verde_formato_id", formato.id);

      if ((count ?? 0) > 0) {
        return NextResponse.json(
          {
            error: `No se puede quitar el formato ${formato.formato_venta}: tiene componentes en recetas. Quitálos primero en Packaging → Recetas.`,
          },
          { status: 409 },
        );
      }

      const { data: fmtRow } = await supabase
        .from("cafe_verde_formatos_venta")
        .select("unidades_producidas")
        .eq("id", formato.id)
        .single();

      if (fmtRow && Number(fmtRow.unidades_producidas) > 0) {
        return NextResponse.json(
          { error: `No se puede quitar el formato ${formato.formato_venta}: ya tiene producción registrada.` },
          { status: 409 },
        );
      }

      await supabase.from("cafe_verde_formatos_venta").delete().eq("id", formato.id);
    }

    if (aAgregar.length > 0) {
      const { error: insertFmtError } = await supabase.from("cafe_verde_formatos_venta").insert(
        aAgregar.map((formato_venta) => ({ cafe_verde_id: id, formato_venta })),
      );
      if (insertFmtError) {
        return NextResponse.json({ error: insertFmtError.message }, { status: 502 });
      }
    }
  }

  const { data: refreshed, error: refreshError } = await supabase
    .from("cafe_verde")
    .select(CAFE_VERDE_SELECT)
    .eq("id", id)
    .single();

  if (refreshError || !refreshed) {
    return NextResponse.json({ error: refreshError?.message ?? "No se pudo leer el registro" }, { status: 502 });
  }

  return NextResponse.json({ ok: true, item: mapCafeVerdeRows([refreshed])[0] });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: row, error: fetchError } = await supabase
    .from("cafe_verde")
    .select("id, codigo, deleted_at")
    .eq("id", id)
    .maybeSingle();

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 502 });
  }

  if (!row || row.deleted_at) {
    return NextResponse.json({ error: "Registro no encontrado" }, { status: 404 });
  }

  const { count: tostadosActivos } = await supabase
    .from("cafe_tostado")
    .select("id", { count: "exact", head: true })
    .eq("cafe_verde_codigo", row.codigo)
    .is("deleted_at", null);

  if ((tostadosActivos ?? 0) > 0) {
    return NextResponse.json(
      {
        error:
          "No se puede eliminar: hay tuestes activos vinculados. Eliminá primero los registros de café tostado.",
      },
      { status: 409 },
    );
  }

  const { error } = await supabase
    .from("cafe_verde")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
