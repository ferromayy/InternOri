"use client";

import { labelComponentePackaging } from "@/lib/inventario/packaging";
import type { FormatoProductoTerminado, LoteProductoTerminado } from "@/lib/inventario/producto-terminado";
import { useInventarioList } from "@/lib/hooks/use-inventario-list";
import { FormEvent, useCallback, useEffect, useState } from "react";

const inputClass =
  "w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950";

const btnPrimary =
  "rounded-lg bg-emerald-800 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-900 disabled:opacity-60";

const btnSecondary =
  "rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800";

function recetaFromFormato(formato: FormatoProductoTerminado) {
  return {
    kgTostado:
      formato.kg_tostado_por_unidad_gr != null ? String(formato.kg_tostado_por_unidad_gr) : "",
    porUnidad: Object.fromEntries(
      formato.requisitos.map((r) => [r.id, String(r.cantidad_por_unidad)]),
    ),
  };
}

export function ProductoTerminadoManager() {
  const [expandedCodigo, setExpandedCodigo] = useState<string | null>(null);

  const fetchLotes = useCallback(async () => {
    const res = await fetch("/api/inventario/producto-terminado");
    const data = await res.json();
    if (!res.ok) return { ok: false as const, error: data.error ?? "Error al cargar" };
    return { ok: true as const, data: (data.lotes ?? []) as LoteProductoTerminado[] };
  }, []);

  const { items: lotes, initialLoading, refreshing, error, load } =
    useInventarioList(fetchLotes);

  useEffect(() => {
    load();
    const onUpdate = () => load();
    window.addEventListener("cafe-verde-updated", onUpdate);
    return () => window.removeEventListener("cafe-verde-updated", onUpdate);
  }, [load]);

  if (initialLoading) return <p className="text-sm text-zinc-500">Cargando…</p>;

  if (error) {
    return (
      <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
        {error}
        <span className="mt-1 block text-xs">
          Ejecutá <code className="rounded bg-red-100 px-1">009_producto_terminado.sql</code> en Supabase
        </span>
      </p>
    );
  }

  const lista = lotes ?? [];

  if (lista.length === 0) {
    return (
      <p className="text-sm text-zinc-500">
        Registrá café verde con formatos y packaging en las otras secciones primero.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {refreshing ? (
        <p className="text-xs text-zinc-500" aria-live="polite">
          Actualizando…
        </p>
      ) : null}
      {lista.map((lote) => {
        const recetasDefinidas = lote.formatos.filter((f) => f.receta_bloqueada).length;
        return (
          <div
            key={lote.codigo}
            className="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"
          >
            <button
              type="button"
              onClick={() => setExpandedCodigo((c) => (c === lote.codigo ? null : lote.codigo))}
              className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left hover:bg-zinc-50 dark:hover:bg-zinc-950/50"
            >
              <div>
                <p className="font-semibold text-zinc-900 dark:text-zinc-50">{lote.codigo}</p>
                <p className="text-sm text-zinc-500">{lote.varietal}</p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <span className="hidden text-xs text-zinc-500 sm:inline">
                  {recetasDefinidas}/{lote.formatos.length} recetas
                </span>
                <span className="text-sm text-zinc-400">
                  {expandedCodigo === lote.codigo ? "▲" : "▼"}
                </span>
              </div>
            </button>

            {expandedCodigo === lote.codigo ? (
              <div className="space-y-4 border-t border-zinc-200 p-5 dark:border-zinc-800">
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  Una receta por formato de venta. Después de guardarla podés verla, editarla o registrar
                  producción.
                </p>
                <RegistroProduccionLote lote={lote} onChanged={load} />
                {lote.formatos.map((formato) => (
                  <FormatoPanel key={formato.id} formato={formato} onChanged={load} />
                ))}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

function RegistroProduccionLote({
  lote,
  onChanged,
}: {
  lote: LoteProductoTerminado;
  onChanged: () => void;
}) {
  const formatosConReceta = lote.formatos.filter((f) => f.receta_bloqueada);
  const [abierto, setAbierto] = useState(false);
  const [cantidades, setCantidades] = useState<Record<string, string>>({});
  const [enviando, setEnviando] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  if (formatosConReceta.length === 0) return null;

  const totalUnidades = formatosConReceta.reduce(
    (s, f) => s + (Number(cantidades[f.id]) || 0),
    0,
  );
  const totalTostadoGr = formatosConReceta.reduce((s, f) => {
    const q = Number(cantidades[f.id]) || 0;
    return s + q * (f.kg_tostado_por_unidad_gr ?? 0);
  }, 0);
  const tostadoDisponible = formatosConReceta[0]?.kg_tostado_disponible_gr ?? 0;

  async function registrar(e: FormEvent) {
    e.preventDefault();
    if (totalUnidades <= 0) {
      setMsg("Indicá al menos una cantidad mayor a 0.");
      return;
    }

    setEnviando(true);
    setMsg(null);
    try {
      const res = await fetch("/api/inventario/producto-terminado/producir-lote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          codigo: lote.codigo,
          cantidades: formatosConReceta.map((f) => ({
            cafe_verde_formato_id: f.id,
            cantidad: Number(cantidades[f.id]) || 0,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMsg(data.error ?? "No se pudo registrar la producción");
        return;
      }
      setCantidades({});
      setMsg(`Producción registrada: ${totalUnidades} unidad${totalUnidades !== 1 ? "es" : ""} en total.`);
      window.dispatchEvent(new Event("cafe-verde-updated"));
      onChanged();
    } catch {
      setMsg("Error de red");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="rounded-xl border border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-950/50">
      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
      >
        <span className="font-medium text-zinc-900 dark:text-zinc-50">Registrar producción</span>
        <span className="text-sm text-zinc-500">{abierto ? "▲" : "▼"}</span>
      </button>

      {abierto ? (
        <form onSubmit={registrar} className="space-y-4 border-t border-zinc-200 p-4 dark:border-zinc-700">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Indicá cuántas unidades producís de cada formato. Se descuentan café tostado y packaging según
            cada receta.
          </p>

          <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900">
            <table className="w-full min-w-[320px] text-sm">
              <thead>
                <tr className="border-b border-zinc-200 text-left text-xs text-zinc-500 dark:border-zinc-700">
                  <th className="px-3 py-2 font-medium">Formato</th>
                  <th className="px-3 py-2 font-medium tabular-nums">Producidas</th>
                  <th className="px-3 py-2 font-medium tabular-nums">Añadir</th>
                  <th className="hidden px-3 py-2 font-medium sm:table-cell">Tostado/u</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {formatosConReceta.map((f) => (
                  <tr key={f.id}>
                    <td className="px-3 py-2.5 font-medium text-zinc-900 dark:text-zinc-50">
                      {f.formato_label}
                    </td>
                    <td className="px-3 py-2.5 tabular-nums text-zinc-600">{f.unidades_producidas}</td>
                    <td className="px-3 py-2.5">
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={cantidades[f.id] ?? ""}
                        placeholder="0"
                        onChange={(e) =>
                          setCantidades((c) => ({ ...c, [f.id]: e.target.value }))
                        }
                        className="w-20 rounded-lg border border-zinc-300 px-2 py-1.5 tabular-nums dark:border-zinc-600 dark:bg-zinc-950"
                      />
                    </td>
                    <td className="hidden px-3 py-2.5 tabular-nums text-zinc-500 sm:table-cell">
                      {f.kg_tostado_por_unidad_gr} g
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalUnidades > 0 ? (
            <div className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200">
              <p>
                Total: <strong>{totalUnidades}</strong> unidad{totalUnidades !== 1 ? "es" : ""} ·{" "}
                <strong>{totalTostadoGr} g</strong> de tostado
              </p>
              <p className="mt-1 text-xs text-emerald-800/80 dark:text-emerald-300/80">
                Disponible (ID): {tostadoDisponible} g
                {totalTostadoGr > tostadoDisponible ? (
                  <span className="ml-1 font-medium text-red-700 dark:text-red-300">
                    — tostado insuficiente
                  </span>
                ) : null}
              </p>
            </div>
          ) : null}

          <div className="flex flex-wrap gap-2">
            <button type="submit" disabled={enviando || totalUnidades <= 0} className={btnPrimary}>
              {enviando ? "Registrando…" : "Registrar producción"}
            </button>
            <button
              type="button"
              disabled={enviando}
              onClick={() => {
                setCantidades({});
                setMsg(null);
              }}
              className={btnSecondary}
            >
              Limpiar
            </button>
          </div>

          {msg ? (
            <p
              className={`rounded-lg px-3 py-2 text-sm ${
                msg.includes("registrada")
                  ? "bg-emerald-100 text-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-200"
                  : "bg-red-50 text-red-800 dark:bg-red-950/40 dark:text-red-200"
              }`}
            >
              {msg}
            </p>
          ) : null}
        </form>
      ) : null}
    </div>
  );
}

function RecetaResumen({ formato }: { formato: FormatoProductoTerminado }) {
  return (
    <div className="rounded-lg border border-emerald-200 bg-white dark:border-emerald-900/50 dark:bg-zinc-900">
      <div className="border-b border-emerald-100 px-4 py-2.5 dark:border-emerald-900/40">
        <p className="text-xs font-medium uppercase tracking-wide text-emerald-800 dark:text-emerald-300">
          Receta por unidad
        </p>
      </div>
      <dl className="divide-y divide-zinc-100 dark:divide-zinc-800">
        <div className="flex items-center justify-between gap-4 px-4 py-3">
          <dt className="text-sm text-zinc-600 dark:text-zinc-400">Granos tostados</dt>
          <dd className="text-sm font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
            {formato.kg_tostado_por_unidad_gr} g
          </dd>
        </div>
        {formato.requisitos.map((r) => (
          <div key={r.id} className="flex items-center justify-between gap-4 px-4 py-3">
            <dt className="text-sm text-zinc-600 dark:text-zinc-400">
              {labelComponentePackaging(r.componente)}
              <span className="mt-0.5 block text-xs text-zinc-500">{r.tipo}</span>
            </dt>
            <dd className="text-sm font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
              {r.cantidad_por_unidad} / u
            </dd>
          </div>
        ))}
      </dl>
      <p className="border-t border-zinc-100 px-4 py-2 text-xs text-zinc-500 dark:border-zinc-800">
        Tostado disponible (ID): {formato.kg_tostado_disponible_gr} g
      </p>
    </div>
  );
}

function FormatoPanel({
  formato,
  onChanged,
}: {
  formato: FormatoProductoTerminado;
  onChanged: () => void;
}) {
  const tieneReceta = formato.receta_bloqueada;
  const [editando, setEditando] = useState(false);
  const [kgTostado, setKgTostado] = useState(() => recetaFromFormato(formato).kgTostado);
  const [porUnidad, setPorUnidad] = useState(() => recetaFromFormato(formato).porUnidad);
  const [saving, setSaving] = useState(false);
  const [producing, setProducing] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const mostrarFormulario = !tieneReceta || editando;

  useEffect(() => {
    const { kgTostado: kg, porUnidad: pu } = recetaFromFormato(formato);
    if (!editando) {
      setKgTostado(kg);
      setPorUnidad(pu);
    }
  }, [formato, editando]);

  function iniciarEdicion() {
    const { kgTostado: kg, porUnidad: pu } = recetaFromFormato(formato);
    setKgTostado(kg);
    setPorUnidad(pu);
    setEditando(true);
    setMsg(null);
  }

  function cancelarEdicion() {
    const { kgTostado: kg, porUnidad: pu } = recetaFromFormato(formato);
    setKgTostado(kg);
    setPorUnidad(pu);
    setEditando(false);
    setMsg(null);
  }

  async function guardarReceta(e: FormEvent) {
    e.preventDefault();
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
      setEditando(false);
      setMsg(tieneReceta ? "Receta actualizada." : "Receta guardada. Ya podés registrar producción.");
      onChanged();
    } catch {
      setMsg("Error de red");
    } finally {
      setSaving(false);
    }
  }

  async function producir(delta: number) {
    setProducing(true);
    setMsg(null);
    try {
      const res = await fetch("/api/inventario/producto-terminado/producir", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cafe_verde_formato_id: formato.id, delta }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMsg(data.error ?? "No se pudo actualizar");
        return;
      }
      window.dispatchEvent(new Event("cafe-verde-updated"));
      onChanged();
    } catch {
      setMsg("Error de red");
    } finally {
      setProducing(false);
    }
  }

  if (formato.requisitos.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-zinc-300 p-4 text-sm text-zinc-500">
        <p className="font-medium text-zinc-800 dark:text-zinc-200">{formato.formato_label}</p>
        <p className="mt-1">
          Añadí requisitos en Inventario → Packaging (en cualquier formato de este ID).
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-emerald-200/80 bg-emerald-50/30 dark:border-emerald-900/40 dark:bg-emerald-950/15">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-emerald-200/60 px-4 py-3 dark:border-emerald-900/40">
        <h3 className="font-semibold text-emerald-950 dark:text-emerald-100">{formato.formato_label}</h3>
        {tieneReceta && !editando ? (
          <span className="rounded-full bg-emerald-800/10 px-2.5 py-0.5 text-xs font-medium text-emerald-900 dark:bg-emerald-400/10 dark:text-emerald-200">
            Receta definida
          </span>
        ) : editando ? (
          <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-900 dark:bg-amber-900/40 dark:text-amber-200">
            Editando
          </span>
        ) : (
          <span className="rounded-full bg-zinc-200/80 px-2.5 py-0.5 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
            Sin receta
          </span>
        )}
      </div>

      <div className="space-y-4 p-4">
        {mostrarFormulario ? (
          <form onSubmit={guardarReceta} className="space-y-4">
            {!tieneReceta ? (
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Completá la receta para este formato (una sola por presentación).
              </p>
            ) : (
              <p className="text-sm text-amber-800 dark:text-amber-200/90">
                Modificá los valores y guardá. Si ya produciste unidades, revisá que el stock coincida.
              </p>
            )}

            <div className="max-w-xs space-y-1">
              <label className="text-xs font-medium">Granos tostados a utilizar (g por unidad)</label>
              <input
                type="number"
                min="0.01"
                step="0.01"
                required
                value={kgTostado}
                onChange={(e) => setKgTostado(e.target.value)}
                className={inputClass}
              />
              <p className="text-xs text-zinc-500">
                Tostado disponible para este ID: {formato.kg_tostado_disponible_gr} g
              </p>
            </div>

            <ul className="space-y-2">
              {formato.requisitos.map((r) => (
                <li
                  key={r.id}
                  className="flex flex-wrap items-center gap-3 rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                >
                  <span className="min-w-[160px]">
                    <span className="font-medium text-zinc-900 dark:text-zinc-50">
                      {labelComponentePackaging(r.componente)}
                    </span>
                    <span className="mt-0.5 block text-xs text-zinc-500">{r.tipo}</span>
                  </span>
                  <span className="text-xs text-zinc-500">Stock: {r.cantidad_stock}</span>
                  <div className="ml-auto flex items-center gap-2">
                    <label className="text-xs font-medium">Por unidad</label>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={porUnidad[r.id] ?? "0"}
                      onChange={(e) => setPorUnidad((p) => ({ ...p, [r.id]: e.target.value }))}
                      className="w-20 rounded-lg border border-zinc-300 px-2 py-1.5 tabular-nums dark:border-zinc-600 dark:bg-zinc-950"
                    />
                  </div>
                </li>
              ))}
            </ul>

            <div className="flex flex-wrap gap-2">
              <button type="submit" disabled={saving} className={btnPrimary}>
                {saving ? "Guardando…" : tieneReceta ? "Guardar cambios" : "Guardar receta"}
              </button>
              {tieneReceta ? (
                <button type="button" onClick={cancelarEdicion} disabled={saving} className={btnSecondary}>
                  Cancelar
                </button>
              ) : null}
            </div>
          </form>
        ) : (
          <>
            <RecetaResumen formato={formato} />

            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={iniciarEdicion} className={btnSecondary}>
                Editar receta
              </button>
            </div>

            <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900">
              <p className="mb-3 text-xs font-medium uppercase tracking-wide text-zinc-500">
                Producción
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-sm text-zinc-700 dark:text-zinc-300">Unidades producidas</span>
                <div className="flex items-center gap-1 rounded-lg border border-zinc-200 bg-zinc-50 p-0.5 dark:border-zinc-600 dark:bg-zinc-950">
                  <button
                    type="button"
                    disabled={producing || formato.unidades_producidas <= 0}
                    onClick={() => producir(-1)}
                    className="flex h-9 w-9 items-center justify-center rounded-md text-lg hover:bg-white disabled:opacity-40 dark:hover:bg-zinc-800"
                    aria-label="Quitar una unidad"
                  >
                    −
                  </button>
                  <span className="min-w-[2.5rem] text-center text-lg font-semibold tabular-nums">
                    {formato.unidades_producidas}
                  </span>
                  <button
                    type="button"
                    disabled={producing || !formato.puede_producir}
                    onClick={() => producir(1)}
                    className="flex h-9 w-9 items-center justify-center rounded-md text-lg hover:bg-white disabled:opacity-40 dark:hover:bg-zinc-800"
                    aria-label="Añadir una unidad"
                  >
                    +
                  </button>
                </div>
                {!formato.puede_producir ? (
                  <span className="text-xs text-amber-700 dark:text-amber-400">
                    Sin stock suficiente para +1
                  </span>
                ) : null}
              </div>

              <ul className="mt-3 space-y-1 border-t border-zinc-100 pt-3 text-xs text-zinc-500 dark:border-zinc-800">
                {formato.requisitos.map((r) => (
                  <li key={r.id} className="flex justify-between gap-2">
                    <span>
                      {labelComponentePackaging(r.componente)} — {r.tipo}
                    </span>
                    <span className="tabular-nums">stock {r.cantidad_stock}</span>
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}

        {msg ? (
          <p
            className={`rounded-lg px-3 py-2 text-sm ${
              msg.includes("actualizada") || msg.includes("guardada")
                ? "bg-emerald-100 text-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-200"
                : "bg-red-50 text-red-800 dark:bg-red-950/40 dark:text-red-200"
            }`}
          >
            {msg}
          </p>
        ) : null}
      </div>
    </div>
  );
}

