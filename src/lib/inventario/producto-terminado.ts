import { labelFormatoVenta } from "@/lib/inventario/formato-venta";
import { labelComponentePackaging } from "@/lib/inventario/packaging";
import type { ComponentePackaging } from "@/lib/inventario/packaging";

export type RequisitoProductoTerminado = {
  id: string;
  componente: ComponentePackaging;
  tipo: string;
  cantidad_stock: number;
  cantidad_por_unidad: number;
};

export type FormatoProductoTerminado = {
  id: string;
  formato_venta: string;
  formato_label: string;
  kg_tostado_por_unidad_gr: number | null;
  receta_bloqueada: boolean;
  unidades_producidas: number;
  requisitos: RequisitoProductoTerminado[];
  kg_tostado_disponible_gr: number;
  puede_producir: boolean;
};

export type LoteProductoTerminado = {
  codigo: string;
  varietal: string;
  formatos: FormatoProductoTerminado[];
};

export function puedeProducirUnidad(formato: FormatoProductoTerminado): boolean {
  if (!formato.receta_bloqueada) return false;
  if (!formato.kg_tostado_por_unidad_gr || formato.kg_tostado_por_unidad_gr <= 0) return false;
  if (formato.kg_tostado_disponible_gr < formato.kg_tostado_por_unidad_gr) return false;

  return formato.requisitos.every((r) => r.cantidad_stock >= r.cantidad_por_unidad);
}

export type RecetaInput = {
  cafe_verde_formato_id: string;
  kg_tostado_por_unidad_gr: number;
  requisitos: { id: string; cantidad_por_unidad: number }[];
};

export function validateRecetaInput(body: unknown):
  | { ok: true; data: RecetaInput }
  | { ok: false; error: string } {
  if (!body || typeof body !== "object") return { ok: false, error: "Datos inválidos" };

  const b = body as Record<string, unknown>;
  const cafe_verde_formato_id =
    typeof b.cafe_verde_formato_id === "string" ? b.cafe_verde_formato_id.trim() : "";
  const kg_tostado_por_unidad_gr = Number(b.kg_tostado_por_unidad_gr);

  if (!cafe_verde_formato_id) return { ok: false, error: "Formato inválido" };
  if (!Number.isFinite(kg_tostado_por_unidad_gr) || kg_tostado_por_unidad_gr <= 0) {
    return { ok: false, error: "Kg de café tostado por unidad debe ser mayor a 0" };
  }

  if (!Array.isArray(b.requisitos) || b.requisitos.length === 0) {
    return { ok: false, error: "Definí al menos un requisito con cantidad por unidad" };
  }

  const requisitos: { id: string; cantidad_por_unidad: number }[] = [];
  for (const item of b.requisitos) {
    if (!item || typeof item !== "object") continue;
    const row = item as Record<string, unknown>;
    const id = typeof row.id === "string" ? row.id : "";
    const cantidad_por_unidad = Number(row.cantidad_por_unidad);
    if (!id) continue;
    if (!Number.isFinite(cantidad_por_unidad) || cantidad_por_unidad < 0) {
      return { ok: false, error: "Cantidades por unidad inválidas" };
    }
    requisitos.push({ id, cantidad_por_unidad });
  }

  if (requisitos.length === 0) {
    return { ok: false, error: "Definí cantidades para los requisitos" };
  }

  return { ok: true, data: { cafe_verde_formato_id, kg_tostado_por_unidad_gr, requisitos } };
}

export { labelFormatoVenta, labelComponentePackaging };
