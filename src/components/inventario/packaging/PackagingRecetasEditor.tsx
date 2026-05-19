"use client";

import { FormatoRequisitosPanel } from "@/components/inventario/packaging/FormatoRequisitosPanel";
import { labelComponentePackaging } from "@/lib/inventario/packaging";
import type { FormatoProductoTerminado, LoteProductoTerminado } from "@/lib/inventario/producto-terminado";
import type { PackagingComponenteCatalogo } from "@/lib/inventario/packaging-componente";
import { usePackagingCatalogo } from "@/lib/hooks/use-packaging-catalogo";
import { useProductoTerminadoLotes } from "@/lib/hooks/use-producto-terminado-lotes";
import { FormEvent, useEffect, useState } from "react";
import { EmptyState, RefreshBanner } from "@/components/inventario/ui/InventarioSection";

const inputClass =
  "w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-base sm:text-sm dark:border-zinc-700 dark:bg-zinc-950";

const btnPrimary =
  "w-full rounded-xl bg-zinc-900 px-4 py-3 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60 sm:w-auto dark:bg-zinc-100 dark:text-zinc-900";

const btnSecondary =
  "w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm font-medium sm:w-auto dark:border-zinc-600 dark:bg-zinc-900";

function recetaFromFormato(formato: FormatoProductoTerminado) {
  return {
    kgTostado:
      formato.kg_tostado_por_unidad_gr != null ? String(formato.kg_tostado_por_unidad_gr) : "",
    porUnidad: Object.fromEntries(
      formato.requisitos.map((r) => [r.id, String(r.cantidad_por_unidad)]),
    ),
  };
}

export function PackagingRecetasEditor() {
  const { catalogo } = usePackagingCatalogo();
  const { lotes, initialLoading, refreshing, error, reload } = useProductoTerminadoLotes();
  const [expandedCodigo, setExpandedCodigo] = useState<string | null>(null);

  useEffect(() => {
    const onUpdate = () => reload();
    window.addEventListener("cafe-verde-updated", onUpdate);
    return () => window.removeEventListener("cafe-verde-updated", onUpdate);
  }, [reload]);

  if (initialLoading) return <p className="text-sm text-zinc-500">Cargando recetas…</p>;
  if (error) return <p className="rounded-xl bg-red-50 p-4 text-sm text-red-800">{error}</p>;
  if (lotes.length === 0) {
    return <EmptyState>Registrá café verde con formatos de venta para definir recetas.</EmptyState>;
  }

  return (
    <div className="space-y-4">
      <RefreshBanner show={refreshing} />
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Por cada café y formato: elegí qué componentes usa y cuánto necesita por unidad (tostado +
        packaging). El stock de componentes se gestiona solo en Componentes.
      </p>
      {lotes.map((lote) => (
        <LoteRecetas
          key={lote.codigo}
          lote={lote}
          catalogo={catalogo}
          expanded={expandedCodigo === lote.codigo}
          onToggle={() =>
            setExpandedCodigo((c) => (c === lote.codigo ? null : lote.codigo))
          }
          onChanged={reload}
        />
      ))}
    </div>
  );
}

function LoteRecetas({
  lote,
  catalogo,
  expanded,
  onToggle,
  onChanged,
}: {
  lote: LoteProductoTerminado;
  catalogo: PackagingComponenteCatalogo[];
  expanded: boolean;
  onToggle: () => void;
  onChanged: () => void;
}) {
  const definidas = lote.formatos.filter((f) => f.receta_bloqueada).length;

  return (
    <article className="overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-3 px-4 py-4 text-left sm:px-5"
      >
        <div>
          <p className="font-semibold text-zinc-900 dark:text-zinc-50">{lote.codigo}</p>
          <p className="text-sm text-zinc-500">{lote.varietal}</p>
        </div>
        <span className="text-xs text-zinc-500">
          {definidas}/{lote.formatos.length} recetas · {expanded ? "▲" : "▼"}
        </span>
      </button>
      {expanded ? (
        <div className="space-y-4 border-t border-zinc-100 p-4 sm:p-5 dark:border-zinc-800">
          {lote.formatos.map((f) => (
            <FormatoRecetaPanel key={f.id} formato={f} catalogo={catalogo} onChanged={onChanged} />
          ))}
        </div>
      ) : null}
    </article>
  );
}

function FormatoRecetaPanel({
  formato,
  catalogo,
  onChanged,
}: {
  formato: FormatoProductoTerminado;
  catalogo: PackagingComponenteCatalogo[];
  onChanged: () => void;
}) {
  const tieneReceta = formato.receta_bloqueada;
  const [editandoReceta, setEditandoReceta] = useState(!tieneReceta && formato.requisitos.length > 0);
  const [kgTostado, setKgTostado] = useState(() => recetaFromFormato(formato).kgTostado);
  const [porUnidad, setPorUnidad] = useState(() => recetaFromFormato(formato).porUnidad);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!editandoReceta) {
      const r = recetaFromFormato(formato);
      setKgTostado(r.kgTostado);
      setPorUnidad(r.porUnidad);
    }
  }, [formato, editandoReceta]);

  async function guardarReceta(e: FormEvent) {
    e.preventDefault();
    if (formato.requisitos.length === 0) {
      setMsg("Añadí al menos un componente antes de guardar la receta.");
      return;
    }
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch("/api/inventario/producto-terminado/receta", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cafe_verde_formato_id: formato.id,
          kg_tostado_por_unidad_gr: Number(kgTostado),
          actualizar: tieneReceta,
          requisitos: formato.requisitos.map((r) => ({
            id: r.id,
            cantidad_por_unidad: Number(porUnidad[r.id] ?? 0),
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMsg(data.error ?? "No se pudo guardar");
        return;
      }
      setEditandoReceta(false);
      setMsg("Receta guardada.");
      onChanged();
    } catch {
      setMsg("Error de red");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="space-y-5 rounded-xl border border-zinc-200 bg-zinc-50/80 p-4 dark:border-zinc-700 dark:bg-zinc-950/40">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-medium text-zinc-900 dark:text-zinc-50">{formato.formato_label}</h3>
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
            tieneReceta
              ? "bg-zinc-200 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200"
              : "bg-amber-100 text-amber-900"
          }`}
        >
          {tieneReceta ? "Receta definida" : "Pendiente"}
        </span>
      </div>

      <FormatoRequisitosPanel
        formatoId={formato.id}
        requisitos={formato.requisitos}
        catalogo={catalogo}
        onChanged={onChanged}
      />

      {formato.requisitos.length > 0 ? (
        <div className="space-y-3 border-t border-zinc-200 pt-4 dark:border-zinc-700">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            Cantidades por unidad
          </p>

          {editandoReceta ? (
            <form onSubmit={guardarReceta} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-zinc-600">Tostado (g por unidad)</label>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  required
                  value={kgTostado}
                  onChange={(e) => setKgTostado(e.target.value)}
                  className={`mt-1 ${inputClass}`}
                />
              </div>
              <ul className="space-y-2">
                {formato.requisitos.map((r) => (
                  <li
                    key={r.id}
                    className="flex flex-col gap-2 rounded-xl border border-zinc-200 bg-white p-3 sm:flex-row sm:items-center sm:justify-between dark:border-zinc-700 dark:bg-zinc-900"
                  >
                    <span className="text-sm">
                      <span className="font-medium">{labelComponentePackaging(r.componente)}</span>
                      <span className="mt-0.5 block text-xs text-zinc-500">{r.tipo}</span>
                    </span>
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-zinc-500">Por unidad</label>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={porUnidad[r.id] ?? "0"}
                        onChange={(e) => setPorUnidad((p) => ({ ...p, [r.id]: e.target.value }))}
                        className="w-24 rounded-lg border border-zinc-300 px-2 py-2 text-base tabular-nums dark:border-zinc-600 dark:bg-zinc-950"
                      />
                    </div>
                  </li>
                ))}
              </ul>
              <div className="flex flex-col gap-2 sm:flex-row">
                <button type="submit" disabled={saving} className={btnPrimary}>
                  {saving ? "Guardando…" : "Guardar receta"}
                </button>
                {tieneReceta ? (
                  <button
                    type="button"
                    onClick={() => setEditandoReceta(false)}
                    className={btnSecondary}
                  >
                    Cancelar
                  </button>
                ) : null}
              </div>
            </form>
          ) : (
            <div className="space-y-3">
              <dl className="grid gap-2 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-zinc-500">Tostado / u</dt>
                  <dd className="font-semibold tabular-nums">{formato.kg_tostado_por_unidad_gr} g</dd>
                </div>
                {formato.requisitos.map((r) => (
                  <div key={r.id}>
                    <dt className="text-zinc-500">
                      {labelComponentePackaging(r.componente)} · {r.tipo}
                    </dt>
                    <dd className="font-semibold tabular-nums">{r.cantidad_por_unidad} / u</dd>
                  </div>
                ))}
              </dl>
              <button type="button" onClick={() => setEditandoReceta(true)} className={btnSecondary}>
                Editar cantidades
              </button>
            </div>
          )}
        </div>
      ) : null}

      {msg ? <p className="text-sm text-zinc-600">{msg}</p> : null}
    </section>
  );
}
