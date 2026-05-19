"use client";

import { FORMATOS_VENTA, labelsFormatosVenta, type FormatoVenta } from "@/lib/inventario/formato-venta";
import { formatMoneda } from "@/lib/inventario/moneda";
import type { CafeVerde } from "@/types/inventario";
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

export function CafeVerdeInventario() {
  const router = useRouter();
  const [items, setItems] = useState<CafeVerde[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<CafeVerde | null>(null);
  const [saving, setSaving] = useState(false);
  const [rowError, setRowError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/inventario/cafe-verde");
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

  async function eliminar(row: CafeVerde) {
    if (
      !window.confirm(
        `¿Eliminar el café verde «${row.codigo}»? Se ocultará del inventario (borrado lógico).`,
      )
    ) {
      return;
    }
    setRowError(null);
    const res = await fetch(`/api/inventario/cafe-verde/${row.id}`, { method: "DELETE" });
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
        Todavía no hay lotes de café verde registrados.
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
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">Lote</th>
                <th className="px-4 py-3">Venta</th>
                <th className="px-4 py-3">Varietal</th>
                <th className="px-4 py-3">Origen</th>
                <th className="px-4 py-3">Ingreso</th>
                <th className="px-4 py-3 text-right">Kg actuales</th>
                <th className="px-4 py-3 text-right">Compra ARS</th>
                <th className="px-4 py-3 text-right">Compra USD</th>
                <th className="px-4 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {items.map((row) => (
                <tr key={row.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-950/50">
                  <td className="px-4 py-3 font-medium">{row.codigo}</td>
                  <td className="px-4 py-3">{row.lote}</td>
                  <td className="max-w-[180px] px-4 py-3 text-xs text-zinc-600">
                    {labelsFormatosVenta(row.formatos_venta)}
                  </td>
                  <td className="px-4 py-3">{row.varietal}</td>
                  <td className="px-4 py-3">{row.origen}</td>
                  <td className="px-4 py-3">{formatDate(row.fecha_ingreso)}</td>
                  <td className="px-4 py-3 text-right tabular-nums font-medium text-amber-800">
                    {formatGr(row.kg_actuales_gr)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-zinc-600">
                    {formatMoneda(row.costo_total_ars, "ARS")}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-zinc-600">
                    {formatMoneda(row.costo_total_usd, "USD")}
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
        <EditarCafeVerdeModal
          row={editing}
          saving={saving}
          onClose={() => setEditing(null)}
          onSave={async (patch) => {
            setSaving(true);
            setRowError(null);
            const res = await fetch(`/api/inventario/cafe-verde/${editing.id}`, {
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

function EditarCafeVerdeModal({
  row,
  saving,
  onClose,
  onSave,
}: {
  row: CafeVerde;
  saving: boolean;
  onClose: () => void;
  onSave: (patch: Record<string, unknown>) => Promise<boolean>;
}) {
  const [form, setForm] = useState({
    varietal: row.varietal,
    origen: row.origen,
    productor: row.productor,
    proceso: row.proceso,
    fecha_ingreso: row.fecha_ingreso,
    importador: row.importador,
    lote: row.lote,
    kg_iniciales_gr: String(row.kg_iniciales_gr),
    costo_total_ars:
      row.costo_total_ars != null ? String(row.costo_total_ars) : "",
    costo_total_usd:
      row.costo_total_usd != null ? String(row.costo_total_usd) : "",
  });
  const [formatosVenta, setFormatosVenta] = useState<FormatoVenta[]>(row.formatos_venta);
  const [formError, setFormError] = useState<string | null>(null);

  const puedeEditarKg = row.kg_usados_gr === 0;

  function toggleFormato(value: FormatoVenta) {
    setFormatosVenta((prev) =>
      prev.includes(value) ? prev.filter((f) => f !== value) : [...prev, value],
    );
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);
    const patch: Record<string, unknown> = {
      ...form,
      formatos_venta: formatosVenta,
      costo_total_ars: form.costo_total_ars === "" ? null : Number(form.costo_total_ars),
      costo_total_usd: form.costo_total_usd === "" ? null : Number(form.costo_total_usd),
    };
    if (puedeEditarKg) patch.kg_iniciales_gr = Number(form.kg_iniciales_gr);
    const ok = await onSave(patch);
    if (!ok) setFormError("Revisá el mensaje de error arriba de la tabla.");
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
      <div
        role="dialog"
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-700 dark:bg-zinc-900"
      >
        <h3 className="text-lg font-semibold">Editar {row.codigo}</h3>
        <p className="mt-1 text-xs text-zinc-500">El ID no se puede cambiar.</p>
        <form onSubmit={submit} className="mt-4 space-y-3">
          {(
            [
              ["varietal", "Varietal"],
              ["origen", "Origen"],
              ["productor", "Productor"],
              ["proceso", "Proceso"],
              ["fecha_ingreso", "Fecha ingreso", "date"],
              ["importador", "Importador"],
              ["lote", "Lote"],
            ] as const
          ).map(([key, label, type]) => (
            <div key={key}>
              <label className="text-xs font-medium">{label}</label>
              <input
                required
                type={type ?? "text"}
                value={form[key]}
                onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                className={`mt-1 ${inputClass}`}
              />
            </div>
          ))}
          <div>
            <label className="text-xs font-medium">Kg iniciales (g)</label>
            <input
              type="number"
              min="0.01"
              step="0.01"
              disabled={!puedeEditarKg}
              value={form.kg_iniciales_gr}
              onChange={(e) => setForm((f) => ({ ...f, kg_iniciales_gr: e.target.value }))}
              className={`mt-1 ${inputClass} disabled:opacity-50`}
            />
            {!puedeEditarKg ? (
              <p className="mt-1 text-xs text-zinc-500">No editable: ya hay café usado en tuestes.</p>
            ) : null}
          </div>
          <fieldset className="space-y-2 rounded-lg border border-zinc-200 p-3 dark:border-zinc-700">
            <legend className="px-1 text-xs font-medium">Precio de compra del lote</legend>
            <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-xs font-medium">Pesos (ARS)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.costo_total_ars}
                onChange={(e) => setForm((f) => ({ ...f, costo_total_ars: e.target.value }))}
                placeholder="Opcional"
                className={`mt-1 ${inputClass}`}
              />
            </div>
            <div>
              <label className="text-xs font-medium">Dólares (USD)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.costo_total_usd}
                onChange={(e) => setForm((f) => ({ ...f, costo_total_usd: e.target.value }))}
                placeholder="Opcional"
                className={`mt-1 ${inputClass}`}
              />
            </div>
            </div>
          </fieldset>
          <fieldset>
            <legend className="text-xs font-medium">Formatos de venta</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {FORMATOS_VENTA.map((f) => (
                <label
                  key={f.value}
                  className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-zinc-200 px-2 py-1 text-xs dark:border-zinc-700"
                >
                  <input
                    type="checkbox"
                    checked={formatosVenta.includes(f.value)}
                    onChange={() => toggleFormato(f.value)}
                  />
                  {f.label}
                </label>
              ))}
            </div>
          </fieldset>
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
