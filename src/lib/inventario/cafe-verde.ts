import { parseFormatosVenta } from "@/lib/inventario/formato-venta";
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
  created_at: string;
  cafe_verde_formatos_venta: { formato_venta: string }[] | null;
};

export function mapCafeVerdeRows(rows: CafeVerdeRow[]) {
  return rows.map((row) => {
    const { cafe_verde_formatos_venta, ...base } = row;
    return {
      ...base,
      formatos_venta: (cafe_verde_formatos_venta ?? []).map((f) => f.formato_venta),
    };
  });
}
