import { parseMontoOpcional } from "@/lib/inventario/moneda";
import type { ComponentePackaging } from "@/lib/inventario/packaging";
import { labelComponentePackaging } from "@/lib/inventario/packaging";

export type OrigenIngresoComponente = "manual" | "alta" | "ajuste";

export type PackagingComponenteIngreso = {
  id: string;
  packaging_componente_id: string;
  cantidad: number;
  stock_anterior: number;
  stock_nuevo: number;
  precio_compra_ars: number | null;
  precio_compra_usd: number | null;
  origen: OrigenIngresoComponente;
  notas: string | null;
  created_at: string;
  packaging_componente: {
    componente: ComponentePackaging;
    tipo: string;
  };
};

export const LABEL_ORIGEN_INGRESO: Record<OrigenIngresoComponente, string> = {
  manual: "Ingreso manual",
  alta: "Alta en catálogo",
  ajuste: "Ajuste al editar",
};

export function labelIngresoComponente(row: PackagingComponenteIngreso): string {
  const pc = row.packaging_componente;
  if (!pc) return "—";
  return `${labelComponentePackaging(pc.componente)} — ${pc.tipo}`;
}

export function validateIngresoComponenteInput(body: unknown):
  | {
      ok: true;
      data: {
        packaging_componente_id: string;
        cantidad: number;
        precio_compra_ars: number | null;
        precio_compra_usd: number | null;
        notas: string | null;
      };
    }
  | { ok: false; error: string } {
  if (!body || typeof body !== "object") return { ok: false, error: "Datos inválidos" };

  const b = body as Record<string, unknown>;
  const packaging_componente_id =
    typeof b.packaging_componente_id === "string" ? b.packaging_componente_id.trim() : "";
  const cantidad = Number(b.cantidad);

  if (!packaging_componente_id) return { ok: false, error: "Elegí un componente" };
  if (!Number.isFinite(cantidad) || cantidad <= 0) {
    return { ok: false, error: "La cantidad debe ser mayor a 0" };
  }

  const precio_compra_ars = parseMontoOpcional(b.precio_compra_ars);
  const precio_compra_usd = parseMontoOpcional(b.precio_compra_usd);
  if (b.precio_compra_ars !== undefined && b.precio_compra_ars !== "" && precio_compra_ars === null) {
    return { ok: false, error: "Precio en pesos inválido" };
  }
  if (b.precio_compra_usd !== undefined && b.precio_compra_usd !== "" && precio_compra_usd === null) {
    return { ok: false, error: "Precio en dólares inválido" };
  }

  const notasRaw = typeof b.notas === "string" ? b.notas.trim() : "";
  const notas = notasRaw === "" ? null : notasRaw;

  return {
    ok: true,
    data: {
      packaging_componente_id,
      cantidad,
      precio_compra_ars,
      precio_compra_usd,
      notas,
    },
  };
}

type SupabaseClient = Awaited<
  ReturnType<typeof import("@/lib/supabase/server").createClient>
>;

export async function registrarIngresoStock(
  supabase: SupabaseClient,
  params: {
    packaging_componente_id: string;
    cantidad: number;
    origen: OrigenIngresoComponente;
    precio_compra_ars?: number | null;
    precio_compra_usd?: number | null;
    notas?: string | null;
  },
): Promise<{ ok: true; stock_nuevo: number } | { error: string }> {
  const { packaging_componente_id, cantidad, origen } = params;
  if (cantidad <= 0) return { error: "La cantidad debe ser mayor a 0" };

  const { data: row, error: fetchError } = await supabase
    .from("packaging_componente")
    .select("cantidad")
    .eq("id", packaging_componente_id)
    .maybeSingle();

  if (fetchError) return { error: fetchError.message };
  if (!row) return { error: "Componente no encontrado" };

  const stock_anterior = Number(row.cantidad);
  const stock_nuevo = stock_anterior + cantidad;

  const { error: updateError } = await supabase
    .from("packaging_componente")
    .update({ cantidad: stock_nuevo })
    .eq("id", packaging_componente_id);

  if (updateError) return { error: updateError.message };

  const { error: ingresoError } = await supabase.from("packaging_componente_ingreso").insert({
    packaging_componente_id,
    cantidad,
    stock_anterior,
    stock_nuevo,
    precio_compra_ars: params.precio_compra_ars ?? null,
    precio_compra_usd: params.precio_compra_usd ?? null,
    origen,
    notas: params.notas ?? null,
  });

  if (ingresoError) {
    await supabase
      .from("packaging_componente")
      .update({ cantidad: stock_anterior })
      .eq("id", packaging_componente_id);
    return { error: ingresoError.message };
  }

  await supabase
    .from("packaging_requisito")
    .update({ cantidad: stock_nuevo })
    .eq("packaging_componente_id", packaging_componente_id);

  return { ok: true, stock_nuevo };
}
