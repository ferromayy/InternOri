"use client";

import type { LoteProductoTerminado } from "@/lib/inventario/producto-terminado";
import { useInventarioList } from "@/lib/hooks/use-inventario-list";
import { useCallback, useEffect } from "react";

export function useProductoTerminadoLotes() {
  const fetchLotes = useCallback(async () => {
    const res = await fetch("/api/inventario/producto-terminado");
    const data = await res.json();
    if (!res.ok) return { ok: false as const, error: data.error ?? "Error al cargar" };
    return { ok: true as const, data: (data.lotes ?? []) as LoteProductoTerminado[] };
  }, []);

  const { items, initialLoading, refreshing, error, load } = useInventarioList(fetchLotes);

  useEffect(() => {
    load();
    const onUpdate = () => load();
    window.addEventListener("cafe-verde-updated", onUpdate);
    return () => window.removeEventListener("cafe-verde-updated", onUpdate);
  }, [load]);

  return {
    lotes: items ?? [],
    initialLoading,
    refreshing,
    error,
    reload: load,
  };
}
