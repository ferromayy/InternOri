/** Texto opcional (vacío → null). */
export function parseDetalleOpcional(value: unknown): string | null {
  if (value === undefined || value === null) return null;
  if (typeof value !== "string") return null;
  const t = value.trim();
  return t === "" ? null : t;
}

/** Parsea monto opcional (vacío → null). */
export function parseMontoOpcional(value: unknown): number | null {
  if (value === undefined || value === null || value === "") return null;
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return null;
  return n;
}

export function formatMoneda(value: number | null | undefined, moneda: "ARS" | "USD"): string {
  if (value == null || !Number.isFinite(value)) return "—";
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: moneda,
    maximumFractionDigits: 2,
  }).format(value);
}

/** Precio por kg a partir del total del lote y gramos (total ÷ kg). */
export function precioPorKg(
  total: number | null | undefined,
  gramos: number | null | undefined,
): number | null {
  if (total == null || !Number.isFinite(total)) return null;
  const g = Number(gramos);
  if (!Number.isFinite(g) || g <= 0) return null;
  return total / (g / 1000);
}

/** Precio por unidad (total ÷ cantidad). */
export function precioPorUnidad(
  total: number | null | undefined,
  cantidad: number | null | undefined,
): number | null {
  if (total == null || !Number.isFinite(total)) return null;
  const u = Number(cantidad);
  if (!Number.isFinite(u) || u <= 0) return null;
  return total / u;
}
