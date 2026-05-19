import { labelFormatoVenta } from "@/lib/inventario/formato-venta";
import { parseMontoOpcional } from "@/lib/inventario/moneda";
import type { createClient } from "@/lib/supabase/server";

type Supabase = Awaited<ReturnType<typeof createClient>>;

export const TIPOS_CLIENTE_VENTA = [
  { value: "cliente_final", label: "Cliente final" },
  { value: "mayorista", label: "Mayorista" },
  { value: "oficina", label: "Oficina" },
] as const;

export type TipoClienteVenta = (typeof TIPOS_CLIENTE_VENTA)[number]["value"];

export type VentaRegistro = {
  id: string;
  cafe_verde_formato_id: string;
  cantidad: number;
  unidades_restantes: number;
  precio_venta: number | null;
  tipo_cliente: TipoClienteVenta;
  fecha: string;
  detalle: string | null;
  created_at: string;
  cafe_verde_formatos_venta: {
    formato_venta: string;
    cafe_verde: { codigo: string; varietal: string } | { codigo: string; varietal: string }[] | null;
  };
};

export function labelTipoCliente(tipo: TipoClienteVenta): string {
  return TIPOS_CLIENTE_VENTA.find((t) => t.value === tipo)?.label ?? tipo;
}

export function labelVentaRegistro(row: VentaRegistro): string {
  const f = row.cafe_verde_formatos_venta;
  if (!f) return "—";
  const cv = Array.isArray(f.cafe_verde) ? f.cafe_verde[0] : f.cafe_verde;
  return `${cv?.codigo ?? "?"} · ${labelFormatoVenta(f.formato_venta)}`;
}

export function fechaLocalHoy(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function isTipoClienteVenta(value: string): value is TipoClienteVenta {
  return TIPOS_CLIENTE_VENTA.some((t) => t.value === value);
}

export function validateVentaInput(body: unknown):
  | {
      ok: true;
      data: {
        cafe_verde_formato_id: string;
        cantidad: number;
        precio_venta: number | null;
        tipo_cliente: TipoClienteVenta;
        fecha: string;
        detalle: string | null;
      };
    }
  | { ok: false; error: string } {
  if (!body || typeof body !== "object") return { ok: false, error: "Datos inválidos" };

  const b = body as Record<string, unknown>;
  const cafe_verde_formato_id =
    typeof b.cafe_verde_formato_id === "string" ? b.cafe_verde_formato_id.trim() : "";
  const cantidad = Number(b.cantidad);
  const tipo_cliente = typeof b.tipo_cliente === "string" ? b.tipo_cliente.trim() : "";
  const fechaRaw = typeof b.fecha === "string" ? b.fecha.trim() : "";

  if (!cafe_verde_formato_id) return { ok: false, error: "Elegí un producto" };
  if (!Number.isInteger(cantidad) || cantidad <= 0) {
    return { ok: false, error: "La cantidad debe ser un entero mayor a 0" };
  }
  if (!isTipoClienteVenta(tipo_cliente)) {
    return { ok: false, error: "Tipo de cliente inválido" };
  }

  const fecha = fechaRaw || fechaLocalHoy();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
    return { ok: false, error: "Fecha inválida" };
  }

  const precio_venta = parseMontoOpcional(b.precio_venta);
  if (b.precio_venta !== undefined && b.precio_venta !== "" && precio_venta === null) {
    return { ok: false, error: "Precio de venta inválido" };
  }

  const detalleRaw = typeof b.detalle === "string" ? b.detalle.trim() : "";
  const detalle = detalleRaw === "" ? null : detalleRaw;

  return {
    ok: true,
    data: {
      cafe_verde_formato_id,
      cantidad,
      precio_venta,
      tipo_cliente,
      fecha,
      detalle,
    },
  };
}

export async function registrarVentaStock(
  supabase: Supabase,
  input: {
    cafe_verde_formato_id: string;
    cantidad: number;
    precio_venta: number | null;
    tipo_cliente: TipoClienteVenta;
    fecha: string;
    detalle: string | null;
  },
): Promise<{ ok: true; unidades_restantes: number } | { error: string }> {
  const { data: formato, error: fetchError } = await supabase
    .from("cafe_verde_formatos_venta")
    .select("id, unidades_producidas")
    .eq("id", input.cafe_verde_formato_id)
    .maybeSingle();

  if (fetchError) return { error: fetchError.message };
  if (!formato) return { error: "Producto no encontrado" };

  const stockActual = Number(formato.unidades_producidas);
  if (stockActual < input.cantidad) {
    return {
      error: `Stock insuficiente (hay ${stockActual}, pediste ${input.cantidad})`,
    };
  }

  const unidades_restantes = stockActual - input.cantidad;

  const { error: updateError } = await supabase
    .from("cafe_verde_formatos_venta")
    .update({ unidades_producidas: unidades_restantes })
    .eq("id", input.cafe_verde_formato_id);

  if (updateError) return { error: updateError.message };

  const { error: ventaError } = await supabase.from("producto_terminado_venta").insert({
    cafe_verde_formato_id: input.cafe_verde_formato_id,
    cantidad: input.cantidad,
    unidades_restantes,
    precio_venta: input.precio_venta,
    tipo_cliente: input.tipo_cliente,
    fecha: input.fecha,
    detalle: input.detalle,
  });

  if (ventaError) {
    await supabase
      .from("cafe_verde_formatos_venta")
      .update({ unidades_producidas: stockActual })
      .eq("id", input.cafe_verde_formato_id);
    const missing = ventaError.message.includes("producto_terminado_venta");
    return {
      error: missing
        ? "Ejecutá 018_producto_terminado_venta.sql en Supabase"
        : ventaError.message,
    };
  }

  return { ok: true, unidades_restantes };
}
