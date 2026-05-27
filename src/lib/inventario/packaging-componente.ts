import { parseDetalleOpcional, parseMontoOpcional } from "@/lib/inventario/moneda";
import { isComponentePackaging, type ComponentePackaging } from "@/lib/inventario/packaging";

export type PackagingComponenteCatalogo = {
  id: string;
  componente: ComponentePackaging;
  tipo: string;
  cantidad: number;
  precio_compra_ars: number | null;
  precio_compra_usd: number | null;
  detalle: string | null;
};

type PrecioCompraInput = {
  precio_compra_ars: number | null;
  precio_compra_usd: number | null;
};

function parsePrecioCompraFields(b: Record<string, unknown>):
  | { ok: true; data: PrecioCompraInput }
  | { ok: false; error: string } {
  const precio_compra_ars = parseMontoOpcional(b.precio_compra_ars);
  const precio_compra_usd = parseMontoOpcional(b.precio_compra_usd);

  if (b.precio_compra_ars !== undefined && b.precio_compra_ars !== "" && precio_compra_ars === null) {
    return { ok: false, error: "Precio de compra en pesos inválido" };
  }
  if (b.precio_compra_usd !== undefined && b.precio_compra_usd !== "" && precio_compra_usd === null) {
    return { ok: false, error: "Precio de compra en dólares inválido" };
  }

  return { ok: true, data: { precio_compra_ars, precio_compra_usd } };
}

export function stockFromRequisitoRow(row: {
  cantidad?: number;
  packaging_componente?: { cantidad: number } | { cantidad: number }[] | null;
}): number {
  const nested = row.packaging_componente;
  if (Array.isArray(nested)) return Number(nested[0]?.cantidad ?? row.cantidad ?? 0);
  if (nested && typeof nested === "object") return Number(nested.cantidad);
  return Number(row.cantidad ?? 0);
}

export function validateComponenteCatalogoInput(body: unknown):
  | {
      ok: true;
      data: {
        componente: ComponentePackaging;
        tipo: string;
        cantidad: number;
        precio_compra_ars: number | null;
        precio_compra_usd: number | null;
        detalle: string | null;
      };
    }
  | { ok: false; error: string } {
  if (!body || typeof body !== "object") return { ok: false, error: "Datos inválidos" };

  const b = body as Record<string, unknown>;
  const componente = typeof b.componente === "string" ? b.componente.trim() : "";
  const tipo = typeof b.tipo === "string" ? b.tipo.trim() : "";
  const cantidad = b.cantidad === undefined ? 0 : Number(b.cantidad);

  if (!componente || !tipo) return { ok: false, error: "Componente y tipo son obligatorios" };
  if (!isComponentePackaging(componente)) return { ok: false, error: "Categoría inválida" };
  if (!Number.isFinite(cantidad) || cantidad < 0) {
    return { ok: false, error: "Stock inválido" };
  }

  const precios = parsePrecioCompraFields(b);
  if (!precios.ok) return precios;

  return {
    ok: true,
    data: { componente, tipo, cantidad, ...precios.data, detalle: parseDetalleOpcional(b.detalle) },
  };
}

export function validateComponenteCatalogoPatchInput(body: unknown):
  | {
      ok: true;
      data: Partial<{
        componente: ComponentePackaging;
        tipo: string;
        cantidad: number;
        precio_compra_ars: number | null;
        precio_compra_usd: number | null;
        detalle: string | null;
      }>;
    }
  | { ok: false; error: string } {
  if (!body || typeof body !== "object") return { ok: false, error: "Datos inválidos" };

  const b = body as Record<string, unknown>;
  const patch: Partial<{
    componente: ComponentePackaging;
    tipo: string;
    cantidad: number;
    precio_compra_ars: number | null;
    precio_compra_usd: number | null;
    detalle: string | null;
  }> = {};

  if (b.componente !== undefined) {
    const componente = typeof b.componente === "string" ? b.componente.trim() : "";
    if (!componente || !isComponentePackaging(componente)) {
      return { ok: false, error: "Categoría inválida" };
    }
    patch.componente = componente;
  }

  if (b.tipo !== undefined) {
    const tipo = typeof b.tipo === "string" ? b.tipo.trim() : "";
    if (!tipo) return { ok: false, error: "El tipo / nombre es obligatorio" };
    patch.tipo = tipo;
  }

  if (b.cantidad !== undefined) {
    const cantidad = Number(b.cantidad);
    if (!Number.isFinite(cantidad) || cantidad < 0) {
      return { ok: false, error: "Stock inválido" };
    }
    patch.cantidad = cantidad;
  }

  if (b.precio_compra_ars !== undefined) {
    const precio_compra_ars = parseMontoOpcional(b.precio_compra_ars);
    if (b.precio_compra_ars !== "" && precio_compra_ars === null) {
      return { ok: false, error: "Precio de compra en pesos inválido" };
    }
    patch.precio_compra_ars = precio_compra_ars;
  }

  if (b.precio_compra_usd !== undefined) {
    const precio_compra_usd = parseMontoOpcional(b.precio_compra_usd);
    if (b.precio_compra_usd !== "" && precio_compra_usd === null) {
      return { ok: false, error: "Precio de compra en dólares inválido" };
    }
    patch.precio_compra_usd = precio_compra_usd;
  }

  if (b.detalle !== undefined) {
    patch.detalle = parseDetalleOpcional(b.detalle);
  }

  if (Object.keys(patch).length === 0) {
    return { ok: false, error: "Indicá al menos un campo para actualizar" };
  }

  return { ok: true, data: patch };
}

export function validateRequisitoLinkInput(body: unknown):
  | {
      ok: true;
      data:
        | { cafe_verde_formato_id: string; packaging_componente_id: string }
        | {
            cafe_verde_formato_id: string;
            componente: ComponentePackaging;
            tipo: string;
            cantidad: number;
          };
    }
  | { ok: false; error: string } {
  if (!body || typeof body !== "object") return { ok: false, error: "Datos inválidos" };

  const b = body as Record<string, unknown>;
  const cafe_verde_formato_id =
    typeof b.cafe_verde_formato_id === "string" ? b.cafe_verde_formato_id.trim() : "";

  if (!cafe_verde_formato_id) return { ok: false, error: "Formato inválido" };

  const packaging_componente_id =
    typeof b.packaging_componente_id === "string" ? b.packaging_componente_id.trim() : "";

  if (packaging_componente_id) {
    return { ok: true, data: { cafe_verde_formato_id, packaging_componente_id } };
  }

  const parsed = validateComponenteCatalogoInput({
    componente: b.componente,
    tipo: b.tipo,
    cantidad: b.cantidad,
  });
  if (!parsed.ok) return parsed;

  return {
    ok: true,
    data: {
      cafe_verde_formato_id,
      ...parsed.data,
    },
  };
}
