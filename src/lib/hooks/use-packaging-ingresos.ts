"use client";

import type { PackagingComponenteIngreso } from "@/lib/inventario/packaging-componente-ingreso";
import { useInventarioList } from "@/lib/hooks/use-inventario-list";
import { useCallback, useEffect } from "react";

export function usePackagingIngresos() {
  const fetchIngresos = useCallback(async () => {
    const res = await fetch("/api/inventario/packaging/componentes/ingresos");
    const data = await res.json();
    if (!res.ok) return { ok: false as const, error: data.error ?? "Error al cargar ingresos" };
    return { ok: true as const, data: (data.ingresos ?? []) as PackagingComponenteIngreso[] };
  }, []);

  const { items, initialLoading, refreshing, error, load } = useInventarioList(fetchIngresos);

  useEffect(() => {
    load();
    const onUpdate = () => load();
    window.addEventListener("cafe-verde-updated", onUpdate);
    return () => window.removeEventListener("cafe-verde-updated", onUpdate);
  }, [load]);

  return {
    ingresos: items ?? [],
    initialLoading,
    refreshing,
    error,
    reload: load,
  };
}
