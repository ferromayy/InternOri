export const COMPONENTES_PACKAGING = [
  { value: "sticker", label: "Sticker" },
  { value: "bolsa_cafe", label: "Bolsa café" },
  { value: "bolsa_sosten", label: "Bolsa sosten" },
  { value: "caja", label: "Caja" },
  { value: "sobre", label: "Sobre" },
  { value: "tarjeta", label: "Tarjeta" },
] as const;

export type ComponentePackaging = (typeof COMPONENTES_PACKAGING)[number]["value"];

const componentesSet = new Set(COMPONENTES_PACKAGING.map((c) => c.value));

export function isComponentePackaging(value: string): value is ComponentePackaging {
  return componentesSet.has(value as ComponentePackaging);
}

export function labelComponentePackaging(value: string): string {
  return COMPONENTES_PACKAGING.find((c) => c.value === value)?.label ?? value;
}

export type PackagingRequisito = {
  id: string;
  componente: ComponentePackaging;
  tipo: string;
  cantidad: number;
};

export type FormatoPackaging = {
  id: string;
  formato_venta: string;
  formato_label: string;
  requisitos: PackagingRequisito[];
};

export type LotePackaging = {
  codigo: string;
  varietal: string;
  formatos: FormatoPackaging[];
};

export function validatePackagingRequisitoInput(body: unknown):
  | { ok: true; data: { cafe_verde_formato_id: string; componente: ComponentePackaging; tipo: string; cantidad: number } }
  | { ok: false; error: string } {
  if (!body || typeof body !== "object") {
    return { ok: false, error: "Datos inválidos" };
  }

  const b = body as Record<string, unknown>;
  const cafe_verde_formato_id =
    typeof b.cafe_verde_formato_id === "string" ? b.cafe_verde_formato_id.trim() : "";
  const componente = typeof b.componente === "string" ? b.componente.trim() : "";
  const tipo = typeof b.tipo === "string" ? b.tipo.trim() : "";
  const cantidad = b.cantidad === undefined ? 0 : Number(b.cantidad);

  if (!cafe_verde_formato_id || !componente || !tipo) {
    return { ok: false, error: "Elegí formato, componente y tipo" };
  }

  if (!isComponentePackaging(componente)) {
    return { ok: false, error: "Componente de packaging inválido" };
  }

  if (!Number.isFinite(cantidad) || cantidad < 0) {
    return { ok: false, error: "La cantidad debe ser mayor o igual a 0" };
  }

  return {
    ok: true,
    data: { cafe_verde_formato_id, componente, tipo, cantidad },
  };
}
