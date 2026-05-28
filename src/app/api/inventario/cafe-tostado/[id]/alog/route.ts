import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

const BUCKET = "cafe-tostado-alog";

function sanitizeFilename(name: string): string {
  return name
    .normalize("NFKD")
    .replace(/[^\w.\- ]+/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 80);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();

  const form = await request.formData();
  const files = form.getAll("files").filter((v): v is File => v instanceof File);

  if (files.length < 1 || files.length > 5) {
    return NextResponse.json({ error: "Subí entre 1 y 5 archivos .alog" }, { status: 400 });
  }

  for (const f of files) {
    const lower = (f.name || "").toLowerCase();
    if (!lower.endsWith(".alog")) {
      return NextResponse.json({ error: "Solo se permiten archivos .alog" }, { status: 400 });
    }
  }

  // Validar que exista el tueste
  const { data: tostado, error: tostadoErr } = await supabase
    .from("cafe_tostado")
    .select("id, deleted_at")
    .eq("id", id)
    .maybeSingle();

  if (tostadoErr) return NextResponse.json({ error: tostadoErr.message }, { status: 502 });
  if (!tostado || tostado.deleted_at) {
    return NextResponse.json({ error: "Registro no encontrado" }, { status: 404 });
  }

  const uploaded: { filename: string; storage_path: string }[] = [];

  for (const file of files) {
    const safeName = sanitizeFilename(file.name || "archivo.alog");
    const path = `${id}/${Date.now()}-${safeName}`;
    const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, file, {
      upsert: false,
      contentType: "application/octet-stream",
    });

    if (upErr) {
      return NextResponse.json({ error: upErr.message }, { status: 502 });
    }

    uploaded.push({ filename: file.name, storage_path: path });
  }

  const { error: insertErr } = await supabase.from("cafe_tostado_alog").insert(
    uploaded.map((u) => ({
      cafe_tostado_id: id,
      filename: u.filename,
      storage_path: u.storage_path,
    })),
  );

  if (insertErr) {
    // Best effort rollback: borrar lo subido
    await supabase.storage.from(BUCKET).remove(uploaded.map((u) => u.storage_path));
    return NextResponse.json({ error: insertErr.message }, { status: 502 });
  }

  return NextResponse.json({ ok: true, files: uploaded }, { status: 201 });
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("cafe_tostado_alog")
    .select("id, filename, storage_path, created_at")
    .eq("cafe_tostado_id", id)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 502 });
  return NextResponse.json({ items: data ?? [] });
}

