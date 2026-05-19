"use client";

import type { PackagingComponenteCatalogo } from "@/lib/inventario/packaging-componente";
import { useInventarioList } from "@/lib/hooks/use-inventario-list";
import { useCallback, useEffect } from "react";

export function usePackagingCatalogo() {
  const fetchCatalogo = useCallback(async () => {
    const res = await fetch("/api/inventario/packaging/componentes");
    const data = await res.json();
    if (!res.ok) return { ok: false as const, error: data.error ?? "Error al cargar catálogo" };
    return { ok: true as const, data: (data.componentes ?? []) as PackagingComponenteCatalogo[] };
  }, []);

  const { items, initialLoading, refreshing, error, load } = useInventarioList(fetchCatalogo);

  useEffect(() => {
    load();
    const onUpdate = () => load();
    window.addEventListener("cafe-verde-updated", onUpdate);
    return () => window.removeEventListener("cafe-verde-updated", onUpdate);
  }, [load]);

  return {
    catalogo: items ?? [],
    initialLoading,
    refreshing,
    error,
    reload: load,
  };
}
