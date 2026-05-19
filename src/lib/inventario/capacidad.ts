import { labelComponentePackaging } from "@/lib/inventario/packaging";
import type { FormatoProductoTerminado, LoteProductoTerminado } from "@/lib/inventario/producto-terminado";

export type CuelloBotella = {
  tipo: "tostado" | "packaging";
  label: string;
  detalle?: string;
};

export type CapacidadSku = {
  codigo: string;
  varietal: string;
  formato_id: string;
  formato_label: string;
  sku: string;
  receta_completa: boolean;
  puede_producir: number;
  cuello_botella: CuelloBotella | null;
  unidades_producidas: number;
};

export function calcularCapacidadFormato(formato: FormatoProductoTerminado): {
  max: number;
  cuello: CuelloBotella | null;
} {
  if (!formato.receta_bloqueada) {
    return { max: 0, cuello: { tipo: "packaging", label: "Receta incompleta" } };
  }

  const kg = formato.kg_tostado_por_unidad_gr;
  if (!kg || kg <= 0) {
    return { max: 0, cuello: { tipo: "tostado", label: "Sin gramos de tostado en receta" } };
  }

  let max = Math.floor(formato.kg_tostado_disponible_gr / kg);
  let cuello: CuelloBotella | null =
    max === 0
      ? {
          tipo: "tostado",
          label: "Café tostado",
          detalle: `${formato.kg_tostado_disponible_gr} g disponibles`,
        }
      : null;

  for (const r of formato.requisitos) {
    if (r.cantidad_por_unidad <= 0) continue;
    const porStock = Math.floor(r.cantidad_stock / r.cantidad_por_unidad);
    if (porStock < max) {
      max = porStock;
      cuello = {
        tipo: "packaging",
        label: `${labelComponentePackaging(r.componente)} — ${r.tipo}`,
        detalle: `stock ${r.cantidad_stock}`,
      };
    }
  }

  return { max: Math.max(0, max), cuello };
}

export function buildCapacidadSkus(lotes: LoteProductoTerminado[]): CapacidadSku[] {
  const skus: CapacidadSku[] = [];
  for (const lote of lotes) {
    for (const formato of lote.formatos) {
      const { max, cuello } = calcularCapacidadFormato(formato);
      skus.push({
        codigo: lote.codigo,
        varietal: lote.varietal,
        formato_id: formato.id,
        formato_label: formato.formato_label,
        sku: `${lote.codigo} · ${formato.formato_label}`,
        receta_completa: formato.receta_bloqueada,
        puede_producir: max,
        cuello_botella: cuello,
        unidades_producidas: formato.unidades_producidas,
      });
    }
  }
  return skus.sort((a, b) => a.sku.localeCompare(b.sku));
}

export function totalUnidadesProducidas(lotes: LoteProductoTerminado[]): number {
  return lotes.reduce(
    (s, l) => s + l.formatos.reduce((fs, f) => fs + f.unidades_producidas, 0),
    0,
  );
}
