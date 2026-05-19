import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("cafe_verde")
    .select("codigo, varietal, origen, lote, kg_iniciales_gr, kg_actuales_gr")
    .is("deleted_at", null)
    .gt("kg_actuales_gr", 0)
    .order("codigo", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 502 });
  }

  return NextResponse.json({ items: data ?? [] });
}
