"use client";

import type { LotePackaging } from "@/lib/inventario/packaging";
import { useInventarioList } from "@/lib/hooks/use-inventario-list";
import { useCallback, useEffect } from "react";

export function usePackagingLotes() {
  const fetchLotes = useCallback(async () => {
    const res = await fetch("/api/inventario/cafe-verde/packaging");
    const data = await res.json();
    if (!res.ok) return { ok: false as const, error: data.error ?? "Error al cargar" };
    return { ok: true as const, data: (data.lotes ?? []) as LotePackaging[] };
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
