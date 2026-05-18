"use client";

import { labelComponentePackaging, COMPONENTES_PACKAGING } from "@/lib/inventario/packaging";
import type {
  ComponentePackaging,
  LotePackaging,
  PackagingRequisito,
} from "@/lib/inventario/packaging";
import { useRouter } from "next/navigation";
import { FormEvent, useCallback, useEffect, useState } from "react";

const inputClass =
  "w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:ring-2 focus:ring-amber-500/40 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50";

export function CafeVerdePackagingManager() {
  const router = useRouter();
  const [lotes, setLotes] = useState<LotePackaging[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedCodigo, setExpandedCodigo] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/inventario/cafe-verde/packaging");
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "No se pudo cargar packaging");
        return;
      }
      setLotes(data.lotes ?? []);
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

  if (loading) {
    return <p className="text-sm text-zinc-500">Cargando packaging por formato…</p>;
  }

  if (error) {
    return (
      <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
        {error}
        <span className="mt-1 block text-xs">
          ¿Ejecutaste{" "}
          <code className="rounded bg-red-100 px-1">008_packaging_requisitos.sql</code> en Supabase?
        </span>
      </p>
    );
  }

  if (lotes.length === 0) {
    return (
      <p className="text-sm text-zinc-500">
        Registrá café verde con formatos de venta para configurar el packaging.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {lotes.map((lote) => (
        <div
          key={lote.codigo}
          className="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"
        >
          <button
            type="button"
            onClick={() =>
              setExpandedCodigo((c) => (c === lote.codigo ? null : lote.codigo))
            }
            className="flex w-full items-center justify-between px-5 py-4 text-left hover:bg-zinc-50 dark:hover:bg-zinc-950/50"
          >
            <div>
              <p className="font-semibold text-zinc-900 dark:text-zinc-50">{lote.codigo}</p>
              <p className="text-sm text-zinc-500">{lote.varietal}</p>
            </div>
            <span className="text-sm text-zinc-400">
              {lote.formatos.length} formato{lote.formatos.length !== 1 ? "s" : ""}{" "}
              {expandedCodigo === lote.codigo ? "▲" : "▼"}
            </span>
          </button>

          {expandedCodigo === lote.codigo ? (
            <div className="space-y-4 border-t border-zinc-200 p-5 dark:border-zinc-800">
              {lote.formatos.map((formato) => (
                <FormatoPackagingPanel
                  key={formato.id}
                  formato={formato}
                  onChanged={() => {
                    load();
                    router.refresh();
                  }}
                />
              ))}
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
}

function FormatoPackagingPanel({
  formato,
  onChanged,
}: {
  formato: LotePackaging["formatos"][number];
  onChanged: () => void;
}) {
  const [componente, setComponente] = useState<ComponentePackaging | "">("");
  const [tipo, setTipo] = useState("");
  const [cantidadInicial, setCantidadInicial] = useState("0");
  const [formError, setFormError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [showForm, setShowForm] = useState(false);

  async function addRequisito(e: FormEvent) {
    e.preventDefault();
    setFormError(null);
    setAdding(true);

    try {
      const res = await fetch("/api/inventario/cafe-verde/packaging/requisitos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cafe_verde_formato_id: formato.id,
          componente,
          tipo,
          cantidad: Number(cantidadInicial) || 0,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error ?? "No se pudo añadir");
        return;
      }
      setComponente("");
      setTipo("");
      setCantidadInicial("0");
      setShowForm(false);
      onChanged();
    } catch {
      setFormError("Error de red");
    } finally {
      setAdding(false);
    }
  }

  async function updateCantidad(requisitoId: string, cantidad: number): Promise<boolean> {
    const res = await fetch(`/api/inventario/cafe-verde/packaging/requisitos/${requisitoId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cantidad }),
    });
    if (res.ok) onChanged();
    return res.ok;
  }

  async function removeRequisito(requisitoId: string) {
    await fetch(`/api/inventario/cafe-verde/packaging/requisitos/${requisitoId}`, {
      method: "DELETE",
    });
    onChanged();
  }

  return (
    <div className="rounded-lg border border-amber-200/80 bg-amber-50/50 p-4 dark:border-amber-900/50 dark:bg-amber-950/20">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-medium text-amber-950 dark:text-amber-100">{formato.formato_label}</h3>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="rounded-lg bg-amber-800 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-900"
        >
          {showForm ? "Cerrar formulario" : "+ Añadir requisito"}
        </button>
      </div>

      {showForm ? (
        <form onSubmit={addRequisito} className="mb-4 grid gap-3 rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-950 sm:grid-cols-2">
          <div className="space-y-1">
            <label className="text-xs font-medium text-zinc-600">Componente</label>
            <select
              required
              value={componente}
              onChange={(e) => setComponente(e.target.value as ComponentePackaging)}
              className={inputClass}
            >
              <option value="">Seleccionar…</option>
              {COMPONENTES_PACKAGING.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-zinc-600">Tipo</label>
            <input
              required
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
              placeholder="Ej: Nombre principal, Origen"
              className={inputClass}
            />
          </div>
          <div className="space-y-1 sm:col-span-2">
            <label className="text-xs font-medium text-zinc-600">Stock inicial</label>
            <input
              type="number"
              min="0"
              step="1"
              value={cantidadInicial}
              onChange={(e) => setCantidadInicial(e.target.value)}
              className={inputClass}
            />
          </div>
          {formError ? (
            <p className="text-sm text-red-600 sm:col-span-2">{formError}</p>
          ) : null}
          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={adding}
              className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900"
            >
              {adding ? "Guardando…" : "Añadir al packaging"}
            </button>
          </div>
        </form>
      ) : null}

      {formato.requisitos.length === 0 ? (
        <p className="text-sm text-zinc-500">Sin requisitos. Usá el botón para añadir ítems.</p>
      ) : (
        <ul className="space-y-2">
          {formato.requisitos.map((req) => (
            <RequisitoRow
              key={req.id}
              requisito={req}
              onUpdateCantidad={updateCantidad}
              onRemove={() => removeRequisito(req.id)}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

const btnSecondary =
  "rounded-lg border border-zinc-300 bg-white px-2.5 py-1.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800";

function RequisitoRow({
  requisito,
  onUpdateCantidad,
  onRemove,
}: {
  requisito: PackagingRequisito;
  onUpdateCantidad: (id: string, cantidad: number) => Promise<boolean>;
  onRemove: () => void;
}) {
  const [cantidad, setCantidad] = useState(requisito.cantidad);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(requisito.cantidad));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setCantidad(requisito.cantidad);
    if (!editing) setDraft(String(requisito.cantidad));
  }, [requisito.cantidad, editing]);

  async function applyCantidad(next: number) {
    const safe = Math.max(0, Math.round(next));
    if (safe === cantidad) return true;

    setSaving(true);
    const ok = await onUpdateCantidad(requisito.id, safe);
    if (ok) setCantidad(safe);
    setSaving(false);
    return ok;
  }

  async function step(delta: number) {
    await applyCantidad(cantidad + delta);
  }

  async function saveEdit() {
    const next = Number(draft);
    if (!Number.isFinite(next)) return;
    const ok = await applyCantidad(next);
    if (ok) setEditing(false);
  }

  function cancelEdit() {
    setDraft(String(cantidad));
    setEditing(false);
  }

  return (
    <li className="rounded-lg border border-zinc-200 bg-white px-4 py-3 dark:border-zinc-700 dark:bg-zinc-900">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
            {labelComponentePackaging(requisito.componente)}
          </p>
          <p className="text-xs text-zinc-500">Tipo: {requisito.tipo}</p>
        </div>

        <button
          type="button"
          onClick={onRemove}
          disabled={saving}
          className="text-xs text-red-600 hover:underline disabled:opacity-50"
        >
          Quitar requisito
        </button>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-zinc-100 pt-3 dark:border-zinc-800">
        <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">Stock</span>

        {editing ? (
          <>
            <input
              type="number"
              min="0"
              step="1"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              className="w-24 rounded-lg border border-zinc-300 px-2 py-1.5 text-sm dark:border-zinc-600 dark:bg-zinc-950"
              disabled={saving}
            />
            <button type="button" onClick={saveEdit} disabled={saving} className={btnSecondary}>
              Guardar
            </button>
            <button
              type="button"
              onClick={cancelEdit}
              disabled={saving}
              className="text-sm text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300"
            >
              Cancelar
            </button>
          </>
        ) : (
          <>
            <div className="flex items-center gap-1 rounded-lg border border-zinc-200 bg-zinc-50 p-0.5 dark:border-zinc-600 dark:bg-zinc-950">
              <button
                type="button"
                onClick={() => step(-1)}
                disabled={saving || cantidad <= 0}
                aria-label="Quitar una unidad"
                className="flex h-8 w-8 items-center justify-center rounded-md text-lg font-medium text-zinc-700 hover:bg-white disabled:opacity-40 dark:text-zinc-200 dark:hover:bg-zinc-800"
              >
                −
              </button>
              <span className="min-w-[3rem] px-2 text-center text-sm font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">
                {cantidad}
              </span>
              <button
                type="button"
                onClick={() => step(1)}
                disabled={saving}
                aria-label="Añadir una unidad"
                className="flex h-8 w-8 items-center justify-center rounded-md text-lg font-medium text-zinc-700 hover:bg-white disabled:opacity-40 dark:text-zinc-200 dark:hover:bg-zinc-800"
              >
                +
              </button>
            </div>
            <button
              type="button"
              onClick={() => {
                setDraft(String(cantidad));
                setEditing(true);
              }}
              disabled={saving}
              className={btnSecondary}
            >
              Editar cantidad
            </button>
          </>
        )}

        {saving ? <span className="text-xs text-zinc-400">Guardando…</span> : null}
      </div>
    </li>
  );
}
