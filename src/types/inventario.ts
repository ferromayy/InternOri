import type { FormatoVenta } from "@/lib/inventario/formato-venta";

export type CafeVerde = {
  id: string;
  codigo: string;
  varietal: string;
  origen: string;
  productor: string;
  proceso: string;
  fecha_ingreso: string;
  importador: string;
  lote: string;
  formatos_venta: FormatoVenta[];
  kg_iniciales_gr: number;
  kg_usados_gr: number;
  kg_actuales_gr: number;
  costo_total_ars: number | null;
  costo_total_usd: number | null;
  detalle: string | null;
  created_at: string;
  deleted_at: string | null;
};

export type CafeVerdeParaTostado = {
  codigo: string;
  varietal: string;
  origen: string;
  lote: string;
  kg_iniciales_gr: number;
  kg_actuales_gr: number;
};

export type CafeVerdeInput = {
  codigo: string;
  varietal: string;
  origen: string;
  productor: string;
  proceso: string;
  fecha_ingreso: string;
  importador: string;
  lote: string;
  formatos_venta: FormatoVenta[];
  kg_iniciales_gr: number;
  costo_total_ars?: number | null;
  costo_total_usd?: number | null;
  detalle?: string | null;
};

export type CafeTostado = {
  id: string;
  codigo: string;
  cafe_verde_codigo: string;
  fecha_tueste: string;
  perfil: string;
  kg_verde_tostado_gr: number;
  kg_despues_tostar_gr: number;
  merma_gr: number;
  kg_vendidos_gr: number;
  kg_existentes_gr: number;
  detalle: string | null;
  created_at: string;
  deleted_at: string | null;
};

export type CafeTostadoInput = {
  cafe_verde_codigo: string;
  fecha_tueste: string;
  perfil: string;
  kg_verde_tostado_gr: number;
  kg_despues_tostar_gr: number;
  detalle?: string | null;
};
