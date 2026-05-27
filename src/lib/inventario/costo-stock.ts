import { precioPorUnidad as dividirPorUnidades } from "@/lib/inventario/moneda";
import type {
  FormatoProductoTerminado,
  LoteProductoTerminado,
} from "@/lib/inventario/producto-terminado";

export type CostoDual = {
  ars: number | null;
  usd: number | null;
};

type LoteCostoInput = Pick<
  LoteProductoTerminado,
  "costo_total_ars" | "costo_total_usd" | "kg_iniciales_gr"
>;

/** Costo de una unidad producida (café verde proporcional + packaging por receta). */
export function costoUnitarioFormato(
  lote: LoteCostoInput,
  formato: FormatoProductoTerminado,
): CostoDual {
  let ars = 0;
  let usd = 0;
  let tieneArs = false;
  let tieneUsd = false;

  const kgTostado = formato.kg_tostado_por_unidad_gr;
  const kgIniciales = Number(lote.kg_iniciales_gr);

  if (kgTostado != null && kgTostado > 0 && kgIniciales > 0) {
    if (lote.costo_total_ars != null) {
      ars += (lote.costo_total_ars / kgIniciales) * kgTostado;
      tieneArs = true;
    }
    if (lote.costo_total_usd != null) {
      usd += (lote.costo_total_usd / kgIniciales) * kgTostado;
      tieneUsd = true;
    }
  }

  for (const r of formato.requisitos) {
    const porUnidad = r.cantidad_por_unidad;
    const stock = r.cantidad_stock;
    if (porUnidad <= 0 || stock <= 0) continue;

    const arsCmp = dividirPorUnidades(r.precio_compra_ars, stock);
    if (arsCmp != null) {
      ars += arsCmp * porUnidad;
      tieneArs = true;
    }

    const usdCmp = dividirPorUnidades(r.precio_compra_usd, stock);
    if (usdCmp != null) {
      usd += usdCmp * porUnidad;
      tieneUsd = true;
    }
  }

  return {
    ars: tieneArs ? ars : null,
    usd: tieneUsd ? usd : null,
  };
}

export function costoTotalStock(unidades: number, unitario: CostoDual): CostoDual {
  if (unidades <= 0) return { ars: null, usd: null };
  return {
    ars: unitario.ars != null ? unitario.ars * unidades : null,
    usd: unitario.usd != null ? unitario.usd * unidades : null,
  };
}

/** Costo por unidad a partir del total del stock y cantidad de unidades. */
export function costoPorUnidadStock(costo: CostoDual, unidades: number): CostoDual {
  return {
    ars: dividirPorUnidades(costo.ars, unidades),
    usd: dividirPorUnidades(costo.usd, unidades),
  };
}

export function sumarCostosDual(...partes: CostoDual[]): CostoDual {
  let ars = 0;
  let usd = 0;
  let tieneArs = false;
  let tieneUsd = false;

  for (const p of partes) {
    if (p.ars != null) {
      ars += p.ars;
      tieneArs = true;
    }
    if (p.usd != null) {
      usd += p.usd;
      tieneUsd = true;
    }
  }

  return {
    ars: tieneArs ? ars : null,
    usd: tieneUsd ? usd : null,
  };
}
