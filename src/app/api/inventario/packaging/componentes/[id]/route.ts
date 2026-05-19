import { registrarIngresoStock } from "@/lib/inventario/packaging-componente-ingreso";
import {
  validateComponenteCatalogoPatchInput,
  type PackagingComponenteCatalogo,
} from "@/lib/inventario/packaging-componente";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

async function syncRequisitosDenormalizados(
  supabase: Awaited<ReturnType<typeof createClient>>,
  packaging_componente_id: string,
  fields: { componente?: string; tipo?: string; cantidad?: number },
) {
  const update: Record<string, string | number> = {};
  if (fields.componente !== undefined) update.componente = fields.componente;
  if (fields.tipo !== undefined) update.tipo = fields.tipo;
  if (fields.cantidad !== undefined) update.cantidad = fields.cantidad;

  if (Object.keys(update).length === 0) return;

  await supabase
    .from("packaging_requisito")
    .update(update)
    .eq("packaging_componente_id", packaging_componente_id);
}

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

  const parsed = validateComponenteCatalogoPatchInput(body);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const supabase = await createClient();
  const patch = { ...parsed.data };

  if (patch.cantidad !== undefined) {
    const { data: actual, error: fetchError } = await supabase
      .from("packaging_componente")
      .select("cantidad")
      .eq("id", id)
      .maybeSingle();

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 502 });
    }
    if (!actual) {
      return NextResponse.json({ error: "Componente no encontrado" }, { status: 404 });
    }

    const anterior = Number(actual.cantidad);
    const objetivo = patch.cantidad;
    delete patch.cantidad;

    if (objetivo > anterior) {
      const ingreso = await registrarIngresoStock(supabase, {
        packaging_componente_id: id,
        cantidad: objetivo - anterior,
        origen: "ajuste",
        notas: "Aumento al editar stock",
      });
      if ("error" in ingreso) {
        return NextResponse.json({ error: ingreso.error }, { status: 502 });
      }
    } else if (objetivo < anterior) {
      patch.cantidad = objetivo;
    }
  }

  if (Object.keys(patch).length === 0) {
    const { data: current, error: readError } = await supabase
      .from("packaging_componente")
      .select("id, componente, tipo, cantidad, precio_compra_ars, precio_compra_usd")
      .eq("id", id)
      .maybeSingle();

    if (readError) {
      return NextResponse.json({ error: readError.message }, { status: 502 });
    }
    if (!current) {
      return NextResponse.json({ error: "Componente no encontrado" }, { status: 404 });
    }
    return NextResponse.json({ ok: true, componente: current as PackagingComponenteCatalogo });
  }

  const { data, error } = await supabase
    .from("packaging_componente")
    .update(patch)
    .eq("id", id)
    .select("id, componente, tipo, cantidad, precio_compra_ars, precio_compra_usd")
    .single();

  if (error) {
    const isDuplicate = error.code === "23505";
    return NextResponse.json(
      { error: isDuplicate ? "Ya existe otro componente con esa categoría y tipo" : error.message },
      { status: isDuplicate ? 409 : 502 },
    );
  }

  if (!data) {
    return NextResponse.json({ error: "Componente no encontrado" }, { status: 404 });
  }

  await syncRequisitosDenormalizados(supabase, id, parsed.data);

  return NextResponse.json({ ok: true, componente: data as PackagingComponenteCatalogo });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();

  const { count, error: countError } = await supabase
    .from("packaging_requisito")
    .select("id", { count: "exact", head: true })
    .eq("packaging_componente_id", id);

  if (countError) {
    return NextResponse.json({ error: countError.message }, { status: 502 });
  }

  if ((count ?? 0) > 0) {
    return NextResponse.json(
      {
        error:
          "No se puede eliminar: está en uso en algún formato. Quitá los requisitos primero.",
      },
      { status: 409 },
    );
  }

  const { error } = await supabase.from("packaging_componente").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
