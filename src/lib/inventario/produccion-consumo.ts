import { labelComponentePackaging, type ComponentePackaging } from "@/lib/inventario/packaging";
import type { FormatoProduccionRow } from "@/lib/inventario/producir-producto-terminado";

export type ProduccionConsumoRegistro = {
  id: string;
  produccion_id: string;
  es_tostado: boolean;
  componente: string | null;
  tipo: string;
  cantidad_por_unidad: number | null;
  cantidad_usada: number;
  unidad: "g" | "ud";
};

export type ConsumoProduccionInput = {
  es_tostado: boolean;
  componente: string | null;
  tipo: string;
  cantidad_por_unidad: number | null;
  cantidad_usada: number;
  unidad: "g" | "ud";
};

export function labelConsumoProduccion(c: ProduccionConsumoRegistro): string {
  if (c.es_tostado) return "Café tostado";
  if (c.componente) {
    return `${labelComponentePackaging(c.componente as ComponentePackaging)} — ${c.tipo}`;
  }
  return c.tipo;
}

export function buildConsumosProduccion(
  formato: FormatoProduccionRow,
  delta: number,
  cafeVerdeCodigo: string,
): ConsumoProduccionInput[] {
  if (delta <= 0) return [];

  const kgPorUnidad = Number(formato.kg_tostado_por_unidad_gr);
  const consumos: ConsumoProduccionInput[] = [
    {
      es_tostado: true,
      componente: null,
      tipo: cafeVerdeCodigo,
      cantidad_por_unidad: kgPorUnidad,
      cantidad_usada: kgPorUnidad * delta,
      unidad: "g",
    },
  ];

  for (const r of formato.packaging_requisito ?? []) {
    const porUnidad = Number(r.cantidad_por_unidad);
    if (porUnidad <= 0) continue;
    consumos.push({
      es_tostado: false,
      componente: r.componente,
      tipo: r.tipo,
      cantidad_por_unidad: porUnidad,
      cantidad_usada: porUnidad * delta,
      unidad: "ud",
    });
  }

  return consumos;
}
