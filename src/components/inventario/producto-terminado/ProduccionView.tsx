"use client";

import { buildCapacidadSkus, calcularCapacidadFormato } from "@/lib/inventario/capacidad";
import { labelComponentePackaging } from "@/lib/inventario/packaging";
import {
  btnPrimary,
  formCardClass,
  formStickyFooterClass,
  inputClass,
  selectClass,
} from "@/components/inventario/ui/form-styles";
import { useProductoTerminadoLotes } from "@/lib/hooks/use-producto-terminado-lotes";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { ProduccionHistorialPanel } from "@/components/inventario/producto-terminado/ProduccionHistorialPanel";
import { EmptyState, RefreshBanner } from "@/components/inventario/ui/InventarioSection";

export function ProduccionView() {
  const { lotes, initialLoading, refreshing, error, reload } = useProductoTerminadoLotes();
  const skus = useMemo(() => buildCapacidadSkus(lotes), [lotes]);

  const conReceta = skus.filter((s) => s.receta_completa);
  const [formatoId, setFormatoId] = useState("");
  const [cantidad, setCantidad] = useState("1");
  const [precioVentaArs, setPrecioVentaArs] = useState("");
  const [precioVentaUsd, setPrecioVentaUsd] = useState("");
  const [detalle, setDetalle] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const seleccionado = conReceta.find((s) => s.formato_id === formatoId);
  const formato = lotes
    .flatMap((l) => l.formatos)
    .find((f) => f.id === formatoId);

  const preview = formato
    ? calcularCapacidadFormato(formato)
    : { max: 0, cuello: null };

  useEffect(() => {
    if (!formato) {
      setPrecioVentaArs("");
      setPrecioVentaUsd("");
      return;
    }
    setPrecioVentaArs(
      formato.precio_venta_ars != null ? String(formato.precio_venta_ars) : "",
    );
    setPrecioVentaUsd(
      formato.precio_venta_usd != null ? String(formato.precio_venta_usd) : "",
    );
  }, [formatoId, formato?.precio_venta_ars, formato?.precio_venta_usd]);

  async function producir(e: FormEvent) {
    e.preventDefault();
    if (!formatoId) {
      setMsg("Elegí un producto.");
      return;
    }
    const q = Number(cantidad);
    if (!Number.isInteger(q) || q <= 0) {
      setMsg("Cantidad inválida.");
      return;
    }

    setEnviando(true);
    setMsg(null);
    try {
      const res = await fetch("/api/inventario/producto-terminado/producir", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cafe_verde_formato_id: formatoId,
          delta: q,
          precio_venta_ars: precioVentaArs,
          precio_venta_usd: precioVentaUsd,
          detalle,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMsg(data.error ?? "No se pudo producir");
        return;
      }
      setMsg(`+${q} unidad${q !== 1 ? "es" : ""} registrada${q !== 1 ? "s" : ""}.`);
      setCantidad("1");
      setDetalle("");
      window.dispatchEvent(new Event("cafe-verde-updated"));
      reload();
    } catch {
      setMsg("Error de red");
    } finally {
      setEnviando(false);
    }
  }

  if (initialLoading) return <p className="text-sm text-zinc-500">Cargando…</p>;
  if (error) return <p className="rounded-xl bg-red-50 p-4 text-sm text-red-800">{error}</p>;

  if (conReceta.length === 0) {
    return (
      <EmptyState>
        Definí recetas en Packaging → Recetas antes de producir.
      </EmptyState>
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <RefreshBanner show={refreshing} />

      <form
        id="formulario"
        onSubmit={producir}
        className={`scroll-mt-24 ${formCardClass} border-emerald-200/60 dark:border-emerald-900/30`}
      >
        <div>
          <label className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            Producto / formato
          </label>
          <select
            value={formatoId}
            onChange={(e) => setFormatoId(e.target.value)}
            className={`mt-2 ${selectClass}`}
            required
          >
            <option value="">Seleccionar…</option>
            {conReceta.map((s) => (
              <option key={s.formato_id} value={s.formato_id}>
                {s.sku}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            Cantidad a producir
          </label>
          <input
            type="number"
            min="1"
            step="1"
            required
            value={cantidad}
            onChange={(e) => setCantidad(e.target.value)}
            className={`mt-2 ${inputClass}`}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="text-xs font-medium uppercase tracking-wide text-zinc-500">
              Precio de venta (ARS)
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={precioVentaArs}
              onChange={(e) => setPrecioVentaArs(e.target.value)}
              placeholder="Opcional"
              className={`mt-2 ${inputClass}`}
            />
          </div>
          <div>
            <label className="text-xs font-medium uppercase tracking-wide text-zinc-500">
              Precio de venta (USD)
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={precioVentaUsd}
              onChange={(e) => setPrecioVentaUsd(e.target.value)}
              placeholder="Opcional"
              className={`mt-2 ${inputClass}`}
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            Detalle (opcional)
          </label>
          <input
            value={detalle}
            onChange={(e) => setDetalle(e.target.value)}
            placeholder="Ej: Lote de producción, turno, observaciones…"
            className={`mt-2 ${inputClass}`}
          />
        </div>

        {seleccionado && formato ? (
          <div className="rounded-xl bg-zinc-50 p-4 text-sm dark:bg-zinc-950/60">
            <p className="text-zinc-600 dark:text-zinc-400">
              Podés producir hasta{" "}
              <strong className="text-zinc-900 dark:text-zinc-50">{preview.max}</strong> unidades
            </p>
            {preview.cuello ? (
              <p className="mt-2 text-xs text-amber-800 dark:text-amber-200">
                Limitado por: {preview.cuello.label}
                {preview.cuello.detalle ? ` (${preview.cuello.detalle})` : ""}
              </p>
            ) : null}
            <ul className="mt-3 space-y-1 border-t border-zinc-200 pt-3 text-xs text-zinc-500 dark:border-zinc-800">
              <li>Tostado: {formato.kg_tostado_por_unidad_gr} g × {cantidad || 0}</li>
              {formato.requisitos.map((r) => (
                <li key={r.id}>
                  {labelComponentePackaging(r.componente)} — {r.tipo}: {r.cantidad_por_unidad} ×{" "}
                  {cantidad || 0}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className={formStickyFooterClass}>
          <button
            type="submit"
            disabled={enviando}
            className={`${btnPrimary} !bg-emerald-800 hover:!bg-emerald-900`}
          >
            {enviando ? "Procesando…" : "Registrar producción"}
          </button>
        </div>
      </form>

      {msg ? (
        <p
          className={`rounded-xl px-4 py-3 text-sm ${
            msg.startsWith("+")
              ? "bg-emerald-50 text-emerald-900"
              : "bg-red-50 text-red-800"
          }`}
        >
          {msg}
        </p>
      ) : null}

      <ProduccionLoteRapida lotes={lotes} onDone={reload} />

      <ProduccionHistorialPanel />
    </div>
  );
}

function ProduccionLoteRapida({
  lotes,
  onDone,
}: {
  lotes: ReturnType<typeof useProductoTerminadoLotes>["lotes"];
  onDone: () => void;
}) {
  const [abierto, setAbierto] = useState(false);
  const [codigo, setCodigo] = useState(lotes[0]?.codigo ?? "");
  const [cantidades, setCantidades] = useState<Record<string, string>>({});
  const [enviando, setEnviando] = useState(false);
  const [detalle, setDetalle] = useState("");

  const lote = lotes.find((l) => l.codigo === codigo);
  const formatos = lote?.formatos.filter((f) => f.receta_bloqueada) ?? [];

  async function enviar(e: FormEvent) {
    e.preventDefault();
    if (!lote) return;
    setEnviando(true);
    try {
      const res = await fetch("/api/inventario/producto-terminado/producir-lote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          codigo: lote.codigo,
          detalle,
          cantidades: formatos.map((f) => ({
            cafe_verde_formato_id: f.id,
            cantidad: Number(cantidades[f.id]) || 0,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) alert(data.error ?? "Error");
      else {
        setCantidades({});
        setDetalle("");
        window.dispatchEvent(new Event("cafe-verde-updated"));
        onDone();
      }
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800">
      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        className="w-full px-4 py-3 text-left text-sm font-medium"
      >
        Producción por lote (varios formatos) {abierto ? "▲" : "▼"}
      </button>
      {abierto ? (
        <form onSubmit={enviar} className="space-y-3 border-t border-zinc-100 p-4 dark:border-zinc-800">
          <select
            value={codigo}
            onChange={(e) => setCodigo(e.target.value)}
            className={inputClass}
          >
            {lotes.map((l) => (
              <option key={l.codigo} value={l.codigo}>
                {l.codigo}
              </option>
            ))}
          </select>
          {formatos.map((f) => (
            <label key={f.id} className="flex items-center justify-between gap-3 text-sm">
              <span>{f.formato_label}</span>
              <input
                type="number"
                min="0"
                placeholder="0"
                value={cantidades[f.id] ?? ""}
                onChange={(e) => setCantidades((c) => ({ ...c, [f.id]: e.target.value }))}
                className="w-20 rounded-lg border border-zinc-300 px-2 py-2 dark:border-zinc-600 dark:bg-zinc-950"
              />
            </label>
          ))}
          <div>
            <label className="text-xs font-medium text-zinc-500">Detalle (opcional)</label>
            <input
              value={detalle}
              onChange={(e) => setDetalle(e.target.value)}
              placeholder="Aplica a todas las líneas del lote"
              className={`mt-1 ${inputClass}`}
            />
          </div>
          <button
            type="submit"
            disabled={enviando}
            className="w-full rounded-xl border border-zinc-300 py-2.5 text-sm font-medium"
          >
            {enviando ? "…" : "Registrar lote"}
          </button>
        </form>
      ) : null}
    </div>
  );
}

