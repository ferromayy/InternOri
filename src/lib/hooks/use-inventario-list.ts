"use client";

import { useCallback, useRef, useState } from "react";

/**
 * Carga inicial con spinner; recargas en segundo plano sin vaciar la lista.
 */
export function useInventarioList<T>(fetchList: () => Promise<{ ok: true; data: T } | { ok: false; error: string }>) {
  const [items, setItems] = useState<T | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasLoaded = useRef(false);

  const load = useCallback(async () => {
    if (!hasLoaded.current) setInitialLoading(true);
    else setRefreshing(true);
    setError(null);

    try {
      const result = await fetchList();
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setItems(result.data);
      hasLoaded.current = true;
    } catch {
      setError("Error de red");
    } finally {
      setInitialLoading(false);
      setRefreshing(false);
    }
  }, [fetchList]);

  return { items, initialLoading, refreshing, error, load, setItems };
}
