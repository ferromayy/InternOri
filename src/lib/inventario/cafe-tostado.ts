import { parseDetalleOpcional } from "@/lib/inventario/moneda";
import type { CafeTostadoInput } from "@/types/inventario";
import type { createClient } from "@/lib/supabase/server";

type Supabase = Awaited<ReturnType<typeof createClient>>;

function parseKgTostadoFields(b: Record<string, unknown>):
  | { ok: true; kg_verde_tostado_gr: number; kg_despues_tostar_gr: number }
  | { ok: false; error: string } {
  const kg_verde_tostado_gr = Number(b.kg_verde_tostado_gr);
  if (!Number.isFinite(kg_verde_tostado_gr) || kg_verde_tostado_gr <= 0) {
    return { ok: false, error: "Kg verde a tostar debe ser mayor a 0" };
  }

  const kg_despues_tostar_gr = Number(b.kg_despues_tostar_gr);
  if (!Number.isFinite(kg_despues_tostar_gr) || kg_despues_tostar_gr <= 0) {
    return { ok: false, error: "Kg después de tostar debe ser mayor a 0" };
  }

  if (kg_despues_tostar_gr > kg_verde_tostado_gr) {
    return {
      ok: false,
      error: "Kg después de tostar no puede ser mayor que el kg verde a tostar",
    };
  }

  return { ok: true, kg_verde_tostado_gr, kg_despues_tostar_gr };
}

export function validateCafeTostadoInput(
  body: unknown,
): { ok: true; data: CafeTostadoInput } | { ok: false; error: string } {
  if (!body || typeof body !== "object") {
    return { ok: false, error: "Datos inválidos" };
  }

  const b = body as Record<string, unknown>;
  const text = (key: string) => (typeof b[key] === "string" ? b[key].trim() : "");

  const cafe_verde_codigo = text("cafe_verde_codigo");
  const fecha_tueste = text("fecha_tueste");
  const perfil = text("perfil");

  if (!cafe_verde_codigo || !fecha_tueste || !perfil) {
    return { ok: false, error: "Completá ID (café verde), fecha de tueste y perfil" };
  }

  const kg = parseKgTostadoFields(b);
  if (!kg.ok) return kg;

  return {
    ok: true,
    data: {
      cafe_verde_codigo,
      fecha_tueste,
      perfil,
      kg_verde_tostado_gr: kg.kg_verde_tostado_gr,
      kg_despues_tostar_gr: kg.kg_despues_tostar_gr,
      detalle: parseDetalleOpcional(b.detalle),
    },
  };
}

export function validateCafeTostadoUpdate(
  body: unknown,
): { ok: true; data: Partial<CafeTostadoInput> } | { ok: false; error: string } {
  if (!body || typeof body !== "object") {
    return { ok: false, error: "Datos inválidos" };
  }

  const b = body as Record<string, unknown>;
  const text = (key: string) => (typeof b[key] === "string" ? b[key].trim() : "");
  const patch: Partial<CafeTostadoInput> = {};

  if (b.fecha_tueste !== undefined) {
    const fecha_tueste = text("fecha_tueste");
    if (!fecha_tueste) return { ok: false, error: "La fecha de tueste es obligatoria" };
    patch.fecha_tueste = fecha_tueste;
  }

  if (b.perfil !== undefined) {
    const perfil = text("perfil");
    if (!perfil) return { ok: false, error: "El perfil es obligatorio" };
    patch.perfil = perfil;
  }

  if (b.cafe_verde_codigo !== undefined) {
    const cafe_verde_codigo = text("cafe_verde_codigo");
    if (!cafe_verde_codigo) return { ok: false, error: "El ID de café verde es obligatorio" };
    patch.cafe_verde_codigo = cafe_verde_codigo;
  }

  if (b.kg_verde_tostado_gr !== undefined || b.kg_despues_tostar_gr !== undefined) {
    const kg = parseKgTostadoFields(b);
    if (!kg.ok) return kg;
    patch.kg_verde_tostado_gr = kg.kg_verde_tostado_gr;
    patch.kg_despues_tostar_gr = kg.kg_despues_tostar_gr;
  }

  if (b.detalle !== undefined) {
    patch.detalle = parseDetalleOpcional(b.detalle);
  }

  if (Object.keys(patch).length === 0) {
    return { ok: false, error: "No hay cambios para guardar" };
  }

  return { ok: true, data: patch };
}

type CafeTostadoRow = {
  id: string;
  codigo: string;
  cafe_verde_codigo: string;
  fecha_tueste: string;
  perfil: string;
  kg_verde_tostado_gr: number;
  kg_despues_tostar_gr: number;
  kg_vendidos_gr: number;
  detalle: string | null;
  deleted_at: string | null;
};

type CafeVerdeStockRow = {
  codigo: string;
  kg_usados_gr: number;
  kg_actuales_gr: number;
};

async function fetchCafeVerdeStock(
  supabase: Supabase,
  codigo: string,
): Promise<CafeVerdeStockRow | null> {
  const { data, error } = await supabase
    .from("cafe_verde")
    .select("codigo, kg_usados_gr, kg_actuales_gr")
    .eq("codigo", codigo)
    .is("deleted_at", null)
    .maybeSingle();

  if (error || !data) return null;
  return data;
}

async function setCafeVerdeUsados(
  supabase: Supabase,
  codigo: string,
  kg_usados_gr: number,
): Promise<{ ok: true } | { error: string }> {
  const { error } = await supabase
    .from("cafe_verde")
    .update({ kg_usados_gr })
    .eq("codigo", codigo)
    .is("deleted_at", null);

  if (error) return { error: error.message };
  return { ok: true };
}

async function syncCafeVerdeStockForTostadoEdit(
  supabase: Supabase,
  prev: { cafe_verde_codigo: string; kg_verde_tostado_gr: number },
  next: { cafe_verde_codigo: string; kg_verde_tostado_gr: number },
): Promise<{ ok: true } | { error: string }> {
  const codigoCambio = prev.cafe_verde_codigo !== next.cafe_verde_codigo;
  const kgCambio = prev.kg_verde_tostado_gr !== next.kg_verde_tostado_gr;

  if (!codigoCambio && !kgCambio) return { ok: true };

  if (codigoCambio) {
    const verdeAnterior = await fetchCafeVerdeStock(supabase, prev.cafe_verde_codigo);
    if (!verdeAnterior) {
      return { error: `Café verde «${prev.cafe_verde_codigo}» no encontrado` };
    }

    const revertido = await setCafeVerdeUsados(
      supabase,
      prev.cafe_verde_codigo,
      Math.max(0, Number(verdeAnterior.kg_usados_gr) - prev.kg_verde_tostado_gr),
    );
    if ("error" in revertido) return revertido;

    const verdeNuevo = await fetchCafeVerdeStock(supabase, next.cafe_verde_codigo);
    if (!verdeNuevo) {
      return { error: `Café verde «${next.cafe_verde_codigo}» no válido o eliminado` };
    }

    if (next.kg_verde_tostado_gr > Number(verdeNuevo.kg_actuales_gr)) {
      return {
        error: `Solo hay ${verdeNuevo.kg_actuales_gr} g disponibles en ${next.cafe_verde_codigo}`,
      };
    }

    return setCafeVerdeUsados(
      supabase,
      next.cafe_verde_codigo,
      Number(verdeNuevo.kg_usados_gr) + next.kg_verde_tostado_gr,
    );
  }

  const delta = next.kg_verde_tostado_gr - prev.kg_verde_tostado_gr;
  const verde = await fetchCafeVerdeStock(supabase, next.cafe_verde_codigo);
  if (!verde) {
    return { error: `Café verde «${next.cafe_verde_codigo}» no encontrado` };
  }

  if (delta > 0 && delta > Number(verde.kg_actuales_gr)) {
    return {
      error: `Solo hay ${verde.kg_actuales_gr} g disponibles en ${next.cafe_verde_codigo}`,
    };
  }

  return setCafeVerdeUsados(
    supabase,
    next.cafe_verde_codigo,
    Math.max(0, Number(verde.kg_usados_gr) + delta),
  );
}

export async function applyCafeTostadoPatch(
  supabase: Supabase,
  id: string,
  patch: Partial<CafeTostadoInput>,
): Promise<{ ok: true; item: CafeTostadoRow & { merma_gr: number; kg_existentes_gr: number } } | { error: string }> {
  const { data: existing, error: fetchError } = await supabase
    .from("cafe_tostado")
    .select(
      "id, codigo, cafe_verde_codigo, fecha_tueste, perfil, kg_verde_tostado_gr, kg_despues_tostar_gr, kg_vendidos_gr, detalle, deleted_at",
    )
    .eq("id", id)
    .maybeSingle();

  if (fetchError) return { error: fetchError.message };
  if (!existing || existing.deleted_at) return { error: "Registro no encontrado" };

  const row = existing as CafeTostadoRow;
  const merged = {
    cafe_verde_codigo: patch.cafe_verde_codigo ?? row.cafe_verde_codigo,
    fecha_tueste: patch.fecha_tueste ?? row.fecha_tueste,
    perfil: patch.perfil ?? row.perfil,
    kg_verde_tostado_gr: patch.kg_verde_tostado_gr ?? Number(row.kg_verde_tostado_gr),
    kg_despues_tostar_gr: patch.kg_despues_tostar_gr ?? Number(row.kg_despues_tostar_gr),
    detalle: patch.detalle !== undefined ? patch.detalle : row.detalle,
  };

  if (merged.kg_despues_tostar_gr > merged.kg_verde_tostado_gr) {
    return {
      error: "Kg después de tostar no puede ser mayor que el kg verde a tostar",
    };
  }

  const kgVendidos = Number(row.kg_vendidos_gr);
  if (kgVendidos > 0 && merged.kg_despues_tostar_gr < kgVendidos) {
    return {
      error: `No podés bajar los kg tostados por debajo de lo ya usado en producción (${kgVendidos} g)`,
    };
  }

  const stock = await syncCafeVerdeStockForTostadoEdit(
    supabase,
    {
      cafe_verde_codigo: row.cafe_verde_codigo,
      kg_verde_tostado_gr: Number(row.kg_verde_tostado_gr),
    },
    {
      cafe_verde_codigo: merged.cafe_verde_codigo,
      kg_verde_tostado_gr: merged.kg_verde_tostado_gr,
    },
  );
  if ("error" in stock) return stock;

  const { error: updateError } = await supabase
    .from("cafe_tostado")
    .update({
      cafe_verde_codigo: merged.cafe_verde_codigo,
      fecha_tueste: merged.fecha_tueste,
      perfil: merged.perfil,
      kg_verde_tostado_gr: merged.kg_verde_tostado_gr,
      kg_despues_tostar_gr: merged.kg_despues_tostar_gr,
      detalle: merged.detalle,
    })
    .eq("id", id)
    .is("deleted_at", null);

  if (updateError) {
    await syncCafeVerdeStockForTostadoEdit(supabase, merged, {
      cafe_verde_codigo: row.cafe_verde_codigo,
      kg_verde_tostado_gr: Number(row.kg_verde_tostado_gr),
    });
    return { error: updateError.message };
  }

  const { data: item, error: readError } = await supabase
    .from("cafe_tostado")
    .select(
      "id, codigo, cafe_verde_codigo, fecha_tueste, perfil, kg_verde_tostado_gr, kg_despues_tostar_gr, merma_gr, kg_vendidos_gr, kg_existentes_gr, detalle, created_at, deleted_at",
    )
    .eq("id", id)
    .single();

  if (readError || !item) return { error: readError?.message ?? "No se pudo leer el registro" };

  return { ok: true, item };
}

export function buildTostadoCodigo(cafeVerdeCodigo: string): string {
  const suffix = Date.now().toString(36).slice(-5).toUpperCase();
  return `T-${cafeVerdeCodigo}-${suffix}`;
}
