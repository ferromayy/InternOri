import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

const BUCKET = "cafe-tostado-alog";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string; alogId: string }> },
) {
  const { id, alogId } = await params;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("cafe_tostado_alog")
    .select("id, cafe_tostado_id, filename, storage_path")
    .eq("id", alogId)
    .eq("cafe_tostado_id", id)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 502 });
  if (!data) return NextResponse.json({ error: "Archivo no encontrado" }, { status: 404 });

  const { data: signed, error: signErr } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(data.storage_path, 60); // 60s

  if (signErr) return NextResponse.json({ error: signErr.message }, { status: 502 });

  return NextResponse.json({ ok: true, url: signed.signedUrl, filename: data.filename });
}

