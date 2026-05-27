import { registrarIngresoStock } from "@/lib/inventario/packaging-componente-ingreso";
import { validateComponenteCatalogoInput } from "@/lib/inventario/packaging-componente";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("packaging_componente")
    .select("id, componente, tipo, cantidad, precio_compra_ars, precio_compra_usd, detalle")
    .order("componente", { ascending: true })
    .order("tipo", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 502 });
  }

  return NextResponse.json({ componentes: data ?? [] });
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const parsed = validateComponenteCatalogoInput(body);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const { cantidad: stockInicial, ...insertBase } = parsed.data;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("packaging_componente")
    .insert({ ...insertBase, cantidad: 0 })
    .select("id, componente, tipo, cantidad, precio_compra_ars, precio_compra_usd, detalle")
    .single();

  if (error) {
    const isDuplicate = error.code === "23505";
    return NextResponse.json(
      { error: isDuplicate ? "Ya existe ese componente con el mismo tipo" : error.message },
      { status: isDuplicate ? 409 : 502 },
    );
  }

  if (stockInicial > 0) {
    const ingreso = await registrarIngresoStock(supabase, {
      packaging_componente_id: data.id,
      cantidad: stockInicial,
      origen: "alta",
      precio_compra_ars: parsed.data.precio_compra_ars,
      precio_compra_usd: parsed.data.precio_compra_usd,
      notas: "Stock inicial",
    });
    if ("error" in ingreso) {
      await supabase.from("packaging_componente").delete().eq("id", data.id);
      return NextResponse.json({ error: ingreso.error }, { status: 502 });
    }
    data.cantidad = ingreso.stock_nuevo;
  }

  return NextResponse.json({ ok: true, componente: data }, { status: 201 });
}
