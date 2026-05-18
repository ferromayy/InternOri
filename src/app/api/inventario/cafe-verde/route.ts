import { mapCafeVerdeRows, validateCafeVerdeInput } from "@/lib/inventario/cafe-verde";
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
  created_at,
  cafe_verde_formatos_venta ( formato_venta )
`;

export async function GET() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("cafe_verde")
    .select(CAFE_VERDE_SELECT)
    .order("fecha_ingreso", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 502 });
  }

  return NextResponse.json({ items: mapCafeVerdeRows(data ?? []) });
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const parsed = validateCafeVerdeInput(body);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const { formatos_venta, ...cafeVerde } = parsed.data;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("cafe_verde")
    .insert({ ...cafeVerde, kg_usados_gr: 0 })
    .select("id")
    .single();

  if (error) {
    const isDuplicate = error.code === "23505";
    let duplicateMsg = error.message;
    if (isDuplicate) {
      if (error.message.includes("codigo")) {
        duplicateMsg = `Ya existe un registro con el ID «${cafeVerde.codigo}»`;
      } else if (error.message.includes("lote")) {
        duplicateMsg = `Ya existe un ingreso con el mismo valor en «Lote» («${cafeVerde.lote}»). El ID puede ser distinto (ej. MUCILAGO-G3), pero el número de lote no se puede repetir.`;
      } else {
        duplicateMsg = "Ya existe un registro con esos datos";
      }
    }
    return NextResponse.json(
      { error: duplicateMsg },
      { status: isDuplicate ? 409 : 502 },
    );
  }

  const formatosRows = formatos_venta.map((formato_venta) => ({
    cafe_verde_id: data.id,
    formato_venta,
  }));

  const { error: formatosError } = await supabase
    .from("cafe_verde_formatos_venta")
    .insert(formatosRows);

  if (formatosError) {
    await supabase.from("cafe_verde").delete().eq("id", data.id);
    return NextResponse.json({ error: formatosError.message }, { status: 502 });
  }

  return NextResponse.json({ ok: true, id: data.id }, { status: 201 });
}
