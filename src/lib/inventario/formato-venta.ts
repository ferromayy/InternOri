export const FORMATOS_VENTA = [
  { value: "50g", label: "Bolsa 50 g" },
  { value: "100g", label: "Bolsa 100 g" },
  { value: "125g", label: "Bolsa 125 g" },
  { value: "150g", label: "Bolsa 150 g" },
  { value: "200g", label: "Bolsa 200 g" },
  { value: "250g", label: "Bolsa 250 g" },
  { value: "500g", label: "Bolsa 500 g" },
  { value: "1kg", label: "Bolsa 1 kg" },
] as const;

export type FormatoVenta = (typeof FORMATOS_VENTA)[number]["value"];

const valores = new Set(FORMATOS_VENTA.map((f) => f.value));

export function isFormatoVenta(value: string): value is FormatoVenta {
  return valores.has(value as FormatoVenta);
}

export function labelFormatoVenta(value: string): string {
  return FORMATOS_VENTA.find((f) => f.value === value)?.label ?? value;
}

export function labelsFormatosVenta(values: string[]): string {
  return values.map(labelFormatoVenta).join(", ");
}

export function parseFormatosVenta(input: unknown): FormatoVenta[] | null {
  if (!Array.isArray(input) || input.length === 0) return null;
  const unique = [...new Set(input.map((v) => String(v).trim()))];
  if (unique.some((v) => !isFormatoVenta(v))) return null;
  return unique as FormatoVenta[];
}
