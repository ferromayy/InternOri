import { labelComponentePackaging } from "@/lib/inventario/packaging";
import type { PackagingComponenteCatalogo } from "@/lib/inventario/packaging-componente";
import { buildCapacidadSkus } from "@/lib/inventario/capacidad";
import type { LoteProductoTerminado } from "@/lib/inventario/producto-terminado";

export type ComponenteAgregado = {
  id: string;
  key: string;
  componente: string;
  tipo: string;
  label: string;
  stock_total: number;
  usos: number;
  critico: boolean;
};

const STOCK_CRITICO = 5;

export function mapCatalogoToAgregado(c: PackagingComponenteCatalogo): ComponenteAgregado {
  return {
    id: c.id,
    key: `${c.componente}\0${c.tipo}`,
    componente: c.componente,
    tipo: c.tipo,
    label: `${labelComponentePackaging(c.componente)} — ${c.tipo}`,
    stock_total: c.cantidad,
    usos: 0,
    critico: c.cantidad <= STOCK_CRITICO,
  };
}

/** Cuántos formatos de venta (SKU) tienen este componente en su lista de requisitos. No es cantidad_por_unidad. */
export function contarFormatosPorComponente(lotesPt: LoteProductoTerminado[]): Map<string, number> {
  const usos = new Map<string, number>();
  for (const lote of lotesPt) {
    for (const f of lote.formatos) {
      for (const r of f.requisitos) {
        if (r.packaging_componente_id) {
          usos.set(r.packaging_componente_id, (usos.get(r.packaging_componente_id) ?? 0) + 1);
        }
      }
    }
  }
  return usos;
}

export function metricasPackaging(
  catalogo: PackagingComponenteCatalogo[],
  lotesPt: LoteProductoTerminado[],
) {
  const usosMap = contarFormatosPorComponente(lotesPt);
  const componentes = catalogo.map((c) => ({
    ...mapCatalogoToAgregado(c),
    usos: usosMap.get(c.id) ?? 0,
  }));

  let recetasActivas = 0;
  let recetasIncompletas = 0;

  for (const lote of lotesPt) {
    for (const f of lote.formatos) {
      if (f.receta_bloqueada) recetasActivas += 1;
      else if (f.requisitos.length > 0) recetasIncompletas += 1;
    }
  }

  const skus = buildCapacidadSkus(lotesPt);
  const capacidadTotal = skus
    .filter((s) => s.receta_completa)
    .reduce((s, x) => s + x.puede_producir, 0);

  return {
    componentes,
    componentesCriticos: componentes.filter((c) => c.critico),
    recetasActivas,
    recetasIncompletas,
    capacidadTotal,
    skusConReceta: skus.filter((s) => s.receta_completa),
  };
}
