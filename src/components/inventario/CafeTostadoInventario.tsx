"use client";

import type { CafeTostado } from "@/types/inventario";
import { useRouter } from "next/navigation";
import { FormEvent, useCallback, useEffect, useState } from "react";

const inputClass =
  "w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950";

const btnSecondary =
  "rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-medium hover:bg-zinc-50 dark:border-zinc-600";

function formatGr(value: number) {
  return new Intl.NumberFormat("es-AR", { maximumFractionDigits: 2 }).format(value);
}

function formatDate(value: string) {
  return new Date(value + "T12:00:00").toLocaleDateString("es-AR");
}

export function CafeTostadoInventario() {
  const router = useRouter();
  const [items, setItems] = useState<CafeTostado[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<CafeTostado | null>(null);
  const [saving, setSaving] = useState(false);
  const [rowError, setRowError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/inventario/cafe-tostado");
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "No se pudo cargar");
        return;
      }
      setItems(data.items ?? []);
    } catch {
      setError("Error de red");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const onUpdate = () => load();
    window.addEventListener("cafe-verde-updated", onUpdate);
    return () => window.removeEventListener("cafe-verde-updated", onUpdate);
  }, [load]);

  async function eliminar(row: CafeTostado) {
    if (
      !window.confirm(
        `¿Eliminar el tueste «${row.codigo}»? Se devolverá el café verde usado al stock del ID ${row.cafe_verde_codigo}.`,
      )
    ) {
      return;
    }
    setRowError(null);
    const res = await fetch(`/api/inventario/cafe-tostado/${row.id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) {
      setRowError(data.error ?? "No se pudo eliminar");
      return;
    }
    window.dispatchEvent(new Event("cafe-verde-updated"));
    router.refresh();
    load();
  }

  if (loading) return <p className="text-sm text-zinc-500">Cargando inventario…</p>;

  if (error) {
    return (
      <p className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
        {error}
        <span className="mt-1 block text-xs">
          ¿Ejecutaste <code className="rounded bg-red-100 px-1">013_soft_delete_cafe.sql</code> en Supabase?
        </span>
      </p>
    );
  }

  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-zinc-200 bg-white p-8 text-center text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900">
        Todavía no hay registros de café tostado.
      </div>
    );
  }

  return (
    <>
      {rowError ? <p className="mb-3 text-sm text-red-600">{rowError}</p> : null}
      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-zinc-200 bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950">
              <tr>
                <th className="px-4 py-3">Tueste</th>
                <th className="px-4 py-3">ID verde</th>
                <th className="px-4 py-3">Fecha</th>
                <th className="px-4 py-3">Perfil</th>
                <th className="px-4 py-3 text-right">Kg verde (gr)</th>
                <th className="px-4 py-3 text-right">Kg después (gr)</th>
                <th className="px-4 py-3 text-right">Merma (gr)</th>
                <th className="px-4 py-3 text-right">Kg vendidos</th>
                <th className="px-4 py-3 text-right">Kg existentes</th>
                <th className="px-4 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {items.map((row) => (
                <tr key={row.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-950/50">
                  <td className="px-4 py-3 font-medium">{row.codigo}</td>
                  <td className="px-4 py-3">{row.cafe_verde_codigo}</td>
                  <td className="px-4 py-3">{formatDate(row.fecha_tueste)}</td>
                  <td className="px-4 py-3">{row.perfil}</td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {formatGr(row.kg_verde_tostado_gr)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {formatGr(row.kg_despues_tostar_gr)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-amber-800 dark:text-amber-300">
                    {formatGr(row.merma_gr)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-zinc-500">
                    {formatGr(row.kg_vendidos_gr)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums font-medium">
                    {formatGr(row.kg_existentes_gr)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <button type="button" className={btnSecondary} onClick={() => setEditing(row)}>
                        Editar
                      </button>
                      <button
                        type="button"
                        className="text-xs text-red-600 hover:underline"
                        onClick={() => eliminar(row)}
                      >
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {editing ? (
        <EditarCafeTostadoModal
          row={editing}
          saving={saving}
          onClose={() => setEditing(null)}
          onSave={async (patch) => {
            setSaving(true);
            setRowError(null);
            const res = await fetch(`/api/inventario/cafe-tostado/${editing.id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(patch),
            });
            const data = await res.json();
            setSaving(false);
            if (!res.ok) {
              setRowError(data.error ?? "No se pudo guardar");
              return false;
            }
            setEditing(null);
            window.dispatchEvent(new Event("cafe-verde-updated"));
            router.refresh();
            load();
            return true;
          }}
        />
      ) : null}
    </>
  );
}

function EditarCafeTostadoModal({
  row,
  saving,
  onClose,
  onSave,
}: {
  row: CafeTostado;
  saving: boolean;
  onClose: () => void;
  onSave: (patch: { fecha_tueste: string; perfil: string }) => Promise<boolean>;
}) {
  const [fecha_tueste, setFechaTueste] = useState(row.fecha_tueste);
  const [perfil, setPerfil] = useState(row.perfil);
  const [formError, setFormError] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);
    const ok = await onSave({ fecha_tueste, perfil });
    if (!ok) setFormError("Revisá el mensaje de error arriba de la tabla.");
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
      <div
        role="dialog"
        className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-700 dark:bg-zinc-900"
      >
        <h3 className="text-lg font-semibold">Editar {row.codigo}</h3>
        <p className="mt-1 text-xs text-zinc-500">
          Los kg de tueste no se editan aquí; eliminá y volvé a cargar si hubo un error de pesaje.
        </p>
        <form onSubmit={submit} className="mt-4 space-y-3">
          <div>
            <label className="text-xs font-medium">Fecha de tueste</label>
            <input
              required
              type="date"
              value={fecha_tueste}
              onChange={(e) => setFechaTueste(e.target.value)}
              className={`mt-1 ${inputClass}`}
            />
          </div>
          <div>
            <label className="text-xs font-medium">Perfil</label>
            <input
              required
              value={perfil}
              onChange={(e) => setPerfil(e.target.value)}
              className={`mt-1 ${inputClass}`}
            />
          </div>
          {formError ? <p className="text-sm text-red-600">{formError}</p> : null}
          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
            >
              {saving ? "Guardando…" : "Guardar"}
            </button>
            <button type="button" onClick={onClose} className={btnSecondary}>
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
