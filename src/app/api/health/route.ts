import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    return NextResponse.json(
      {
        ok: false,
        error: "Faltan NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_ANON_KEY en .env.local",
      },
      { status: 500 },
    );
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.from("health_check").select("id, message").limit(1);

    if (error) {
      return NextResponse.json(
        { ok: false, error: error.message, hint: error.hint },
        { status: 502 },
      );
    }

    return NextResponse.json({
      ok: true,
      supabase: { connected: true },
      row: data?.[0] ?? null,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error desconocido";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
