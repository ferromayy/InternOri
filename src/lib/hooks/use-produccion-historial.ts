"use client";

import type { ProduccionRegistro } from "@/lib/inventario/produccion-registro";
import { useInventarioList } from "@/lib/hooks/use-inventario-list";
import { useCallback, useEffect } from "react";

export function useProduccionHistorial() {
  const fetchHistorial = useCallback(async () => {
    const res = await fetch("/api/inventario/producto-terminado/producciones");
    const data = await res.json();
    if (!res.ok) {
      return { ok: false as const, error: data.error ?? "Error al cargar historial" };
    }
    return { ok: true as const, data: (data.producciones ?? []) as ProduccionRegistro[] };
  }, []);

  const { items, initialLoading, refreshing, error, load } = useInventarioList(fetchHistorial);

  useEffect(() => {
    load();
    const onUpdate = () => load();
    window.addEventListener("cafe-verde-updated", onUpdate);
    return () => window.removeEventListener("cafe-verde-updated", onUpdate);
  }, [load]);

  return {
    producciones: items ?? [],
    initialLoading,
    refreshing,
    error,
    reload: load,
  };
}
