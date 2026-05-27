import { parseDetalleOpcional, parseMontoOpcional } from "@/lib/inventario/moneda";
import type { PreciosVentaInput } from "@/lib/inventario/producir-producto-terminado";

function parsePrecioField(value: unknown, label: string): number | null | "invalid" {
  if (value === undefined || value === null || value === "") return null;
  const n = parseMontoOpcional(value);
  if (n === null) return "invalid";
  return n;
}

export function parsePreciosVentaBody(body: Record<string, unknown>):
  | { ok: true; precios: PreciosVentaInput }
  | { ok: false; error: string } {
  const precio_venta_ars = parsePrecioField(body.precio_venta_ars, "pesos");
  if (precio_venta_ars === "invalid") {
    return { ok: false, error: "Precio de venta en pesos inválido" };
  }

  const precio_venta_usd = parsePrecioField(body.precio_venta_usd, "dólares");
  if (precio_venta_usd === "invalid") {
    return { ok: false, error: "Precio de venta en dólares inválido" };
  }

  return {
    ok: true,
    precios: { precio_venta_ars, precio_venta_usd },
  };
}

export function parseDetalleBody(body: Record<string, unknown>): string | null {
  return parseDetalleOpcional(body.detalle);
}
