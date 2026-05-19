import { parseFormatosVenta } from "@/lib/inventario/formato-venta";
import { parseMontoOpcional } from "@/lib/inventario/moneda";
import type { CafeVerdeInput } from "@/types/inventario";

export function validateCafeVerdeInput(
  body: unknown,
): { ok: true; data: CafeVerdeInput } | { ok: false; error: string } {
  if (!body || typeof body !== "object") {
    return { ok: false, error: "Datos inválidos" };
  }

  const b = body as Record<string, unknown>;
  const text = (key: string) => (typeof b[key] === "string" ? b[key].trim() : "");

  const codigo = text("codigo");
  const varietal = text("varietal");
  const origen = text("origen");
  const productor = text("productor");
  const proceso = text("proceso");
  const fecha_ingreso = text("fecha_ingreso");
  const importador = text("importador");
  const lote = text("lote");

  const formatos_venta = parseFormatosVenta(b.formatos_venta);

  if (
    !codigo ||
    !varietal ||
    !origen ||
    !productor ||
    !proceso ||
    !fecha_ingreso ||
    !importador ||
    !lote
  ) {
    return { ok: false, error: "Completá todos los campos obligatorios" };
  }

  if (!formatos_venta) {
    return { ok: false, error: "Elegí al menos un formato de venta" };
  }

  const kg_iniciales_gr = Number(b.kg_iniciales_gr);
  if (!Number.isFinite(kg_iniciales_gr) || kg_iniciales_gr <= 0) {
    return { ok: false, error: "Kg iniciales debe ser un número mayor a 0" };
  }

  const costo_total_ars = parseMontoOpcional(b.costo_total_ars);
  const costo_total_usd = parseMontoOpcional(b.costo_total_usd);
  if (b.costo_total_ars !== undefined && b.costo_total_ars !== "" && costo_total_ars === null) {
    return { ok: false, error: "Costo en pesos inválido" };
  }
  if (b.costo_total_usd !== undefined && b.costo_total_usd !== "" && costo_total_usd === null) {
    return { ok: false, error: "Costo en dólares inválido" };
  }

  return {
    ok: true,
    data: {
      codigo,
      varietal,
      origen,
      productor,
      proceso,
      fecha_ingreso,
      importador,
      lote,
      formatos_venta,
      kg_iniciales_gr,
      costo_total_ars,
      costo_total_usd,
    },
  };
}

type CafeVerdeRow = {
  id: string;
  codigo: string;
  varietal: string;
  origen: string;
  productor: string;
  proceso: string;
  fecha_ingreso: string;
  importador: string;
  lote: string;
  kg_iniciales_gr: number;
  kg_usados_gr: number;
  kg_actuales_gr: number;
  costo_total_ars: number | null;
  costo_total_usd: number | null;
  created_at: string;
  deleted_at: string | null;
  cafe_verde_formatos_venta: { formato_venta: string }[] | null;
};

export function validateCafeVerdeUpdate(
  body: unknown,
): { ok: true; data: Partial<CafeVerdeInput> } | { ok: false; error: string } {
  if (!body || typeof body !== "object") {
    return { ok: false, error: "Datos inválidos" };
  }

  const b = body as Record<string, unknown>;
  const text = (key: string) => (typeof b[key] === "string" ? b[key].trim() : "");
  const patch: Partial<CafeVerdeInput> = {};

  const fields = [
    "varietal",
    "origen",
    "productor",
    "proceso",
    "fecha_ingreso",
    "importador",
    "lote",
  ] as const;

  for (const key of fields) {
    if (b[key] !== undefined) {
      const val = text(key);
      if (!val) return { ok: false, error: `El campo ${key} no puede estar vacío` };
      patch[key] = val;
    }
  }

  if (b.formatos_venta !== undefined) {
    const formatos_venta = parseFormatosVenta(b.formatos_venta);
    if (!formatos_venta) return { ok: false, error: "Elegí al menos un formato de venta" };
    patch.formatos_venta = formatos_venta;
  }

  if (b.kg_iniciales_gr !== undefined) {
    const kg_iniciales_gr = Number(b.kg_iniciales_gr);
    if (!Number.isFinite(kg_iniciales_gr) || kg_iniciales_gr <= 0) {
      return { ok: false, error: "Kg iniciales debe ser mayor a 0" };
    }
    patch.kg_iniciales_gr = kg_iniciales_gr;
  }

  if (b.costo_total_ars !== undefined) {
    const costo_total_ars = parseMontoOpcional(b.costo_total_ars);
    if (b.costo_total_ars !== "" && costo_total_ars === null) {
      return { ok: false, error: "Costo en pesos inválido" };
    }
    patch.costo_total_ars = costo_total_ars;
  }

  if (b.costo_total_usd !== undefined) {
    const costo_total_usd = parseMontoOpcional(b.costo_total_usd);
    if (b.costo_total_usd !== "" && costo_total_usd === null) {
      return { ok: false, error: "Costo en dólares inválido" };
    }
    patch.costo_total_usd = costo_total_usd;
  }

  if (Object.keys(patch).length === 0) {
    return { ok: false, error: "No hay cambios para guardar" };
  }

  return { ok: true, data: patch };
}

export function mapCafeVerdeRows(rows: CafeVerdeRow[]) {
  return rows.map((row) => {
    const { cafe_verde_formatos_venta, ...base } = row;
    return {
      ...base,
      formatos_venta: (cafe_verde_formatos_venta ?? []).map((f) => f.formato_venta),
    };
  });
}
