import { validatePackagingRequisitoInput } from "@/lib/inventario/packaging";
import { syncPackagingRequisitosForFormatoId } from "@/lib/inventario/packaging-sync";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const parsed = validatePackagingRequisitoInput(body);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("packaging_requisito")
    .insert(parsed.data)
    .select("id, componente, tipo, cantidad")
    .single();

  if (error) {
    const isDuplicate = error.code === "23505";
    return NextResponse.json(
      {
        error: isDuplicate
          ? "Ya existe ese componente con el mismo tipo para este formato"
          : error.message,
      },
      { status: isDuplicate ? 409 : 502 },
    );
  }

  await syncPackagingRequisitosForFormatoId(supabase, parsed.data.cafe_verde_formato_id);

  return NextResponse.json({ ok: true, requisito: data }, { status: 201 });
}
