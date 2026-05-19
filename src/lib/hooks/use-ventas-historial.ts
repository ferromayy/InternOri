"use client";

import type { VentaRegistro } from "@/lib/inventario/producto-terminado-venta";
import { useInventarioList } from "@/lib/hooks/use-inventario-list";
import { useCallback, useEffect } from "react";

export function useVentasHistorial() {
  const fetchVentas = useCallback(async () => {
    const res = await fetch("/api/inventario/producto-terminado/ventas");
    const data = await res.json();
    if (!res.ok) return { ok: false as const, error: data.error ?? "Error al cargar ventas" };
    return { ok: true as const, data: (data.ventas ?? []) as VentaRegistro[] };
  }, []);

  const { items, initialLoading, refreshing, error, load } = useInventarioList(fetchVentas);

  useEffect(() => {
    load();
    const onUpdate = () => load();
    window.addEventListener("cafe-verde-updated", onUpdate);
    return () => window.removeEventListener("cafe-verde-updated", onUpdate);
  }, [load]);

  return {
    ventas: items ?? [],
    initialLoading,
    refreshing,
    error,
    reload: load,
  };
}
