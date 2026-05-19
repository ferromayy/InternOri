"use client";

import { useProductoTerminadoLotes } from "@/lib/hooks/use-producto-terminado-lotes";
import Link from "next/link";
import { EmptyState, RefreshBanner } from "@/components/inventario/ui/InventarioSection";

export function PackagingCompatibilidadView() {
  const { lotes, initialLoading, refreshing, error } = useProductoTerminadoLotes();

  if (initialLoading) return <p className="text-sm text-zinc-500">Cargando…</p>;
  if (error) return <p className="rounded-xl bg-red-50 p-4 text-sm text-red-800">{error}</p>;

  return (
    <div className="space-y-6">
      <RefreshBanner show={refreshing} />
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Qué formatos de venta tiene cada café (SKU). Se define al registrar{" "}
        <Link href="/dashboard/inventario/cafe-verde" className="underline">
          café verde
        </Link>
        .
      </p>

      {lotes.length === 0 ? (
        <EmptyState>No hay cafés verdes registrados.</EmptyState>
      ) : (
        <ul className="space-y-4">
          {lotes.map((lote) => (
            <li
              key={lote.codigo}
              className="rounded-2xl border border-zinc-200 bg-white p-4 sm:p-5 dark:border-zinc-800 dark:bg-zinc-900"
            >
              <p className="font-semibold text-zinc-900 dark:text-zinc-50">{lote.codigo}</p>
              <p className="text-sm text-zinc-500">{lote.varietal}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {lote.formatos.map((f) => (
                  <span
                    key={f.id}
                    className="rounded-full border border-zinc-200 px-3 py-1 text-xs font-medium dark:border-zinc-700"
                  >
                    {f.formato_label}
                    {f.receta_bloqueada ? "" : " · sin receta"}
                  </span>
                ))}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
