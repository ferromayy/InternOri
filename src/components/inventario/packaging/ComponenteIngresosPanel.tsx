"use client";

import {
  LABEL_ORIGEN_INGRESO,
  labelIngresoComponente,
  type PackagingComponenteIngreso,
} from "@/lib/inventario/packaging-componente-ingreso";
import { formatMoneda, precioPorUnidad } from "@/lib/inventario/moneda";
import { labelComponentePackaging } from "@/lib/inventario/packaging";
import type { PackagingComponenteCatalogo } from "@/lib/inventario/packaging-componente";
import {
  btnPrimary,
  formCardClass,
  formStickyFooterClass,
  inputClass,
  selectClass,
} from "@/components/inventario/ui/form-styles";
import { usePackagingIngresos } from "@/lib/hooks/use-packaging-ingresos";
import { useSearchParams } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

function formatFecha(iso: string) {
  return new Date(iso).toLocaleString("es-AR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

function notifyUpdated() {
  window.dispatchEvent(new Event("cafe-verde-updated"));
}

export function ComponenteIngresosPanel({
  catalogo,
}: {
  catalogo: PackagingComponenteCatalogo[];
}) {
  const searchParams = useSearchParams();
  const { ingresos, initialLoading, refreshing, error, reload } = usePackagingIngresos();
  const [showForm, setShowForm] = useState(false);
  const [componenteId, setComponenteId] = useState("");
  const [cantidad, setCantidad] = useState("");
  const [precioArs, setPrecioArs] = useState("");
  const [precioUsd, setPrecioUsd] = useState("");
  const [notas, setNotas] = useState("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (searchParams.get("focus") === "ingreso") {
      setShowForm(true);
    }
  }, [searchParams]);

  async function registrar(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setFormError(null);
    try {
      const res = await fetch("/api/inventario/packaging/componentes/ingresos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          packaging_componente_id: componenteId,
          cantidad,
          precio_compra_ars: precioArs,
          precio_compra_usd: precioUsd,
          notas,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error ?? "No se pudo registrar");
        return;
      }
      setComponenteId("");
      setCantidad("");
      setPrecioArs("");
      setPrecioUsd("");
      setNotas("");
      setShowForm(false);
      notifyUpdated();
      reload();
    } catch {
      setFormError("Error de red");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section id="ingreso" className="scroll-mt-24 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
            Historial de ingresos de stock
          </h2>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Cada ingreso suma al stock del componente. Incluye altas con stock inicial y ajustes al
            subir el stock al editar.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          disabled={catalogo.length === 0}
          className="rounded-full border border-zinc-300 px-4 py-2 text-sm font-medium disabled:opacity-50 dark:border-zinc-600"
        >
          {showForm ? "Cerrar" : "+ Registrar ingreso"}
        </button>
      </div>

      {catalogo.length === 0 ? (
        <p className="text-sm text-zinc-500">Creá un componente en el catálogo antes de registrar ingresos.</p>
      ) : null}

      {showForm && catalogo.length > 0 ? (
        <form
          onSubmit={registrar}
          className={`grid grid-cols-1 gap-3 sm:grid-cols-2 ${formCardClass} border-emerald-200/60 bg-emerald-50/40 dark:border-emerald-900/40 dark:bg-emerald-950/20`}
        >
          <div className="sm:col-span-2">
            <label className="text-xs font-medium">Componente</label>
            <select
              required
              value={componenteId}
              onChange={(e) => setComponenteId(e.target.value)}
              className={`mt-1 ${selectClass}`}
            >
              <option value="">Seleccionar…</option>
              {catalogo.map((c) => (
                <option key={c.id} value={c.id}>
                  {labelComponentePackaging(c.componente)} — {c.tipo} (stock {c.cantidad})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium">Cantidad ingresada</label>
            <input
              type="number"
              min="0.01"
              step="0.01"
              required
              value={cantidad}
              onChange={(e) => setCantidad(e.target.value)}
              className={`mt-1 ${inputClass}`}
            />
          </div>
          <div>
            <label className="text-xs font-medium">Notas (opcional)</label>
            <input
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              placeholder="Ej: Factura #1234"
              className={`mt-1 ${inputClass}`}
            />
          </div>
          <div>
            <label className="text-xs font-medium">Precio compra ARS</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={precioArs}
              onChange={(e) => setPrecioArs(e.target.value)}
              placeholder="Opcional"
              className={`mt-1 ${inputClass}`}
            />
          </div>
          <div>
            <label className="text-xs font-medium">Precio compra USD</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={precioUsd}
              onChange={(e) => setPrecioUsd(e.target.value)}
              placeholder="Opcional"
              className={`mt-1 ${inputClass}`}
            />
          </div>
          {formError ? <p className="text-sm text-red-600 sm:col-span-2">{formError}</p> : null}
          <div className={`sm:col-span-2 ${formStickyFooterClass}`}>
            <button
              type="submit"
              disabled={saving}
              className={`${btnPrimary} !bg-emerald-800 hover:!bg-emerald-900`}
            >
              {saving ? "Guardando…" : "Registrar ingreso"}
            </button>
          </div>
        </form>
      ) : null}

      {refreshing ? <p className="text-xs text-zinc-500">Actualizando…</p> : null}

      {initialLoading ? (
        <p className="text-sm text-zinc-500">Cargando historial…</p>
      ) : error ? (
        <p className="rounded-xl bg-red-50 p-4 text-sm text-red-800">{error}</p>
      ) : ingresos.length === 0 ? (
        <p className="rounded-xl border border-dashed border-zinc-200 p-6 text-center text-sm text-zinc-500 dark:border-zinc-700">
          Todavía no hay ingresos registrados.
        </p>
      ) : (
        <IngresosTable rows={ingresos} />
      )}
    </section>
  );
}

function IngresosTable({ rows }: { rows: PackagingComponenteIngreso[] }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead className="border-b border-zinc-100 text-xs uppercase tracking-wide text-zinc-500 dark:border-zinc-800">
          <tr>
            <th className="px-4 py-3 font-medium">Fecha</th>
            <th className="px-4 py-3 font-medium">Componente</th>
            <th className="px-4 py-3 font-medium tabular-nums text-right">Cantidad</th>
            <th className="px-4 py-3 font-medium tabular-nums text-right">Stock</th>
            <th className="px-4 py-3 font-medium tabular-nums text-right">ARS</th>
            <th className="px-4 py-3 font-medium tabular-nums text-right">USD</th>
            <th className="px-4 py-3 font-medium tabular-nums text-right">Precio por U</th>
            <th className="px-4 py-3 font-medium">Origen</th>
            <th className="px-4 py-3 font-medium">Notas</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-50 dark:divide-zinc-800/80">
          {rows.map((row) => (
            <tr key={row.id} className="hover:bg-zinc-50/80 dark:hover:bg-zinc-950/40">
              <td className="whitespace-nowrap px-4 py-3 text-zinc-600">{formatFecha(row.created_at)}</td>
              <td className="px-4 py-3 font-medium">{labelIngresoComponente(row)}</td>
              <td className="px-4 py-3 text-right tabular-nums text-emerald-800 dark:text-emerald-300">
                +{row.cantidad}
              </td>
              <td className="px-4 py-3 text-right tabular-nums text-zinc-500">
                {row.stock_anterior} → {row.stock_nuevo}
              </td>
              <td className="px-4 py-3 text-right tabular-nums">
                {formatMoneda(row.precio_compra_ars, "ARS")}
              </td>
              <td className="px-4 py-3 text-right tabular-nums">
                {formatMoneda(row.precio_compra_usd, "USD")}
              </td>
              <td className="px-4 py-3 text-right text-xs tabular-nums text-zinc-600">
                <div>
                  {formatMoneda(
                    precioPorUnidad(row.precio_compra_ars, row.cantidad),
                    "ARS",
                  )}
                </div>
                <div className="text-zinc-400">
                  {formatMoneda(
                    precioPorUnidad(row.precio_compra_usd, row.cantidad),
                    "USD",
                  )}
                </div>
              </td>
              <td className="px-4 py-3 text-xs text-zinc-600">
                {LABEL_ORIGEN_INGRESO[row.origen] ?? row.origen}
              </td>
              <td className="max-w-[160px] truncate px-4 py-3 text-xs text-zinc-500" title={row.notas ?? ""}>
                {row.notas ?? "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
