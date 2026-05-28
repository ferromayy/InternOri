"use client";

import type { CafeTostado, CafeTostadoInput, CafeVerdeParaTostado } from "@/types/inventario";
import { useRouter } from "next/navigation";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";

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
  const [alogCount, setAlogCount] = useState<Record<string, number>>({});
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
      const rows: CafeTostado[] = data.items ?? [];
      setItems(rows);

      // Cargar conteo de archivos .alog por tueste (best effort)
      const counts: Record<string, number> = {};
      await Promise.all(
        rows.map(async (r) => {
          try {
            const fr = await fetch(`/api/inventario/cafe-tostado/${r.id}/alog`);
            const fd = await fr.json();
            if (fr.ok) counts[r.id] = Array.isArray(fd.items) ? fd.items.length : 0;
          } catch {
            // ignore
          }
        }),
      );
      setAlogCount(counts);
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
                <th className="px-4 py-3">Archivos</th>
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
                    {alogCount[row.id] ? (
                      <DownloadAlogButton tostadoId={row.id} count={alogCount[row.id]} />
                    ) : (
                      <span className="text-xs text-zinc-500">—</span>
                    )}
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

function DownloadAlogButton({ tostadoId, count }: { tostadoId: string; count: number }) {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function downloadLatest() {
    setErr(null);
    setLoading(true);
    try {
      const listRes = await fetch(`/api/inventario/cafe-tostado/${tostadoId}/alog`);
      const listData = await listRes.json();
      if (!listRes.ok) {
        setErr(listData.error ?? "No se pudo cargar archivos");
        return;
      }
      const first = Array.isArray(listData.items) ? listData.items[0] : null;
      if (!first?.id) {
        setErr("No hay archivos");
        return;
      }

      const urlRes = await fetch(
        `/api/inventario/cafe-tostado/${tostadoId}/alog/${first.id}/download`,
        { method: "POST" },
      );
      const urlData = await urlRes.json();
      if (!urlRes.ok) {
        setErr(urlData.error ?? "No se pudo generar descarga");
        return;
      }

      window.open(urlData.url, "_blank", "noopener,noreferrer");
    } catch {
      setErr("Error de red");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-1">
      <button
        type="button"
        className={btnSecondary}
        disabled={loading}
        onClick={downloadLatest}
        title="Descarga el último .alog subido"
      >
        {loading ? "Generando…" : `Descargar (${count})`}
      </button>
      {err ? <p className="text-xs text-red-600">{err}</p> : null}
    </div>
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
  onSave: (patch: Partial<CafeTostadoInput>) => Promise<boolean>;
}) {
  const [lotesVerde, setLotesVerde] = useState<CafeVerdeParaTostado[]>([]);
  const [loadingLotes, setLoadingLotes] = useState(true);
  const [cafe_verde_codigo, setCafeVerdeCodigo] = useState(row.cafe_verde_codigo);
  const [fecha_tueste, setFechaTueste] = useState(row.fecha_tueste);
  const [perfil, setPerfil] = useState(row.perfil);
  const [kg_verde_tostado_gr, setKgVerdeTostado] = useState(String(row.kg_verde_tostado_gr));
  const [kg_despues_tostar_gr, setKgDespues] = useState(String(row.kg_despues_tostar_gr));
  const [detalle, setDetalle] = useState(row.detalle ?? "");
  const [formError, setFormError] = useState<string | null>(null);

  const lotesOpciones = useMemo(() => {
    const map = new Map<string, CafeVerdeParaTostado>();
    for (const l of lotesVerde) map.set(l.codigo, l);
    if (!map.has(row.cafe_verde_codigo)) {
      map.set(row.cafe_verde_codigo, {
        codigo: row.cafe_verde_codigo,
        varietal: "—",
        origen: "—",
        lote: "—",
        kg_iniciales_gr: 0,
        kg_actuales_gr: 0,
      });
    }
    return [...map.values()].sort((a, b) => a.codigo.localeCompare(b.codigo));
  }, [lotesVerde, row.cafe_verde_codigo]);

  const loteSeleccionado = lotesOpciones.find((l) => l.codigo === cafe_verde_codigo);
  const tieneProduccion = row.kg_vendidos_gr > 0;

  useEffect(() => {
    fetch("/api/inventario/cafe-verde/para-tostado")
      .then((res) => res.json())
      .then((data) => {
        setLotesVerde(data.items ?? []);
        setLoadingLotes(false);
      })
      .catch(() => setLoadingLotes(false));
  }, []);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);
    const ok = await onSave({
      cafe_verde_codigo,
      fecha_tueste,
      perfil,
      kg_verde_tostado_gr: Number(kg_verde_tostado_gr),
      kg_despues_tostar_gr: Number(kg_despues_tostar_gr),
      detalle,
    });
    if (!ok) setFormError("Revisá el mensaje de error arriba de la tabla.");
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
      <div
        role="dialog"
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-700 dark:bg-zinc-900"
      >
        <h3 className="text-lg font-semibold">Editar {row.codigo}</h3>
        <p className="mt-1 text-xs text-zinc-500">
          El código de tueste ({row.codigo}) no se modifica. Merma y kg existentes se recalculan al
          guardar.
        </p>
        {tieneProduccion ? (
          <p className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
            Este tueste ya usó {formatGr(row.kg_vendidos_gr)} g en producción. Los kg después de
            tostar no pueden ser menores a ese valor.
          </p>
        ) : null}
        <form onSubmit={submit} className="mt-4 space-y-3">
          <div>
            <label className="text-xs font-medium">ID (café verde)</label>
            <select
              required
              value={cafe_verde_codigo}
              onChange={(e) => setCafeVerdeCodigo(e.target.value)}
              disabled={loadingLotes}
              className={`mt-1 ${inputClass}`}
            >
              {lotesOpciones.map((lote) => (
                <option key={lote.codigo} value={lote.codigo}>
                  {lote.codigo}
                  {lote.varietal !== "—" ? ` — ${lote.varietal}` : ""}
                  {lote.kg_actuales_gr > 0 ? ` (${lote.kg_actuales_gr} g disp.)` : " (sin stock)"}
                </option>
              ))}
            </select>
            {loteSeleccionado && loteSeleccionado.varietal !== "—" ? (
              <p className="mt-1 text-xs text-zinc-500">
                {loteSeleccionado.origen} · lote {loteSeleccionado.lote}
              </p>
            ) : null}
          </div>
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
              placeholder="Ej: Espresso, Filtrado"
              className={`mt-1 ${inputClass}`}
            />
          </div>
          <div>
            <label className="text-xs font-medium">Kg verde a tostar (gr)</label>
            <input
              type="number"
              min="0.01"
              step="0.01"
              required
              value={kg_verde_tostado_gr}
              onChange={(e) => setKgVerdeTostado(e.target.value)}
              className={`mt-1 ${inputClass}`}
            />
          </div>
          <div>
            <label className="text-xs font-medium">Kg después de tostar (gr)</label>
            <input
              type="number"
              min="0.01"
              step="0.01"
              required
              value={kg_despues_tostar_gr}
              onChange={(e) => setKgDespues(e.target.value)}
              className={`mt-1 ${inputClass}`}
            />
          </div>
          <div>
            <label className="text-xs font-medium">Detalle (opcional)</label>
            <input
              value={detalle}
              onChange={(e) => setDetalle(e.target.value)}
              placeholder="Ej: Horno, lote de tueste, observaciones…"
              className={`mt-1 ${inputClass}`}
            />
          </div>
          {formError ? <p className="text-sm text-red-600">{formError}</p> : null}
          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              disabled={saving || loadingLotes}
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
