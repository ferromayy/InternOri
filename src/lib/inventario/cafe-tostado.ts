import type { CafeTostadoInput } from "@/types/inventario";

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

  return {
    ok: true,
    data: { cafe_verde_codigo, fecha_tueste, perfil, kg_verde_tostado_gr, kg_despues_tostar_gr },
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

  if (Object.keys(patch).length === 0) {
    return { ok: false, error: "No hay cambios para guardar" };
  }

  return { ok: true, data: patch };
}

export function buildTostadoCodigo(cafeVerdeCodigo: string): string {
  const suffix = Date.now().toString(36).slice(-5).toUpperCase();
  return `T-${cafeVerdeCodigo}-${suffix}`;
}
