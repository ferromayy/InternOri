"use client";

import {
  btnPrimary,
  formCardClass,
  formStickyFooterClass,
  inputClass,
} from "@/components/inventario/ui/form-styles";
import { FORMATOS_VENTA, type FormatoVenta } from "@/lib/inventario/formato-venta";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

const empty = {
  codigo: "",
  varietal: "",
  origen: "",
  productor: "",
  proceso: "",
  fecha_ingreso: "",
  importador: "",
  lote: "",
  kg_iniciales_gr: "",
  costo_total_ars: "",
  costo_total_usd: "",
  detalle: "",
};

export function CafeVerdeForm() {
  const router = useRouter();
  const [form, setForm] = useState(empty);
  const [formatosVenta, setFormatosVenta] = useState<FormatoVenta[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function update(field: keyof typeof empty, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function toggleFormato(value: FormatoVenta) {
    setFormatosVenta((prev) =>
      prev.includes(value) ? prev.filter((f) => f !== value) : [...prev, value],
    );
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const res = await fetch("/api/inventario/cafe-verde", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          formatos_venta: formatosVenta,
          kg_iniciales_gr: Number(form.kg_iniciales_gr),
          costo_total_ars: form.costo_total_ars === "" ? null : Number(form.costo_total_ars),
          costo_total_usd: form.costo_total_usd === "" ? null : Number(form.costo_total_usd),
          detalle: form.detalle,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "No se pudo guardar");
        return;
      }

      const savedCodigo = form.codigo;
      setForm(empty);
      setFormatosVenta([]);
      setSuccess(
        `Registro guardado (ID: ${savedCodigo}). Configurá el packaging en Inventario → Packaging.`,
      );
      router.refresh();
      window.dispatchEvent(new CustomEvent("cafe-verde-updated"));
    } catch {
      setError("Error de red");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className={formCardClass}>
      <div>
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Nuevo ingreso</h2>
        <p className="mt-1 text-sm text-zinc-500">
          Podés elegir varios formatos de venta para el mismo lote.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="ID" id="codigo">
          <input
            id="codigo"
            required
            value={form.codigo}
            onChange={(e) => update("codigo", e.target.value)}
            placeholder="Ej: CV-2026-001"
            className={inputClass}
          />
        </Field>
        <Field label="Varietal" id="varietal">
          <input
            id="varietal"
            required
            value={form.varietal}
            onChange={(e) => update("varietal", e.target.value)}
            className={inputClass}
          />
        </Field>
        <Field label="Origen" id="origen">
          <input
            id="origen"
            required
            value={form.origen}
            onChange={(e) => update("origen", e.target.value)}
            className={inputClass}
          />
        </Field>
        <Field label="Productor" id="productor">
          <input
            id="productor"
            required
            value={form.productor}
            onChange={(e) => update("productor", e.target.value)}
            className={inputClass}
          />
        </Field>
        <Field label="Proceso" id="proceso">
          <input
            id="proceso"
            required
            value={form.proceso}
            onChange={(e) => update("proceso", e.target.value)}
            className={inputClass}
          />
        </Field>
        <Field label="Fecha de ingreso" id="fecha_ingreso">
          <input
            id="fecha_ingreso"
            type="date"
            required
            value={form.fecha_ingreso}
            onChange={(e) => update("fecha_ingreso", e.target.value)}
            className={inputClass}
          />
        </Field>
        <Field label="Importador" id="importador">
          <input
            id="importador"
            required
            value={form.importador}
            onChange={(e) => update("importador", e.target.value)}
            className={inputClass}
          />
        </Field>
        <Field label="Lote" id="lote">
          <input
            id="lote"
            required
            value={form.lote}
            onChange={(e) => update("lote", e.target.value)}
            placeholder="Único por ingreso (ej: 01, 02)"
            className={inputClass}
          />
          <p className="text-xs text-zinc-500">No confundir con ID: el lote no puede repetirse entre registros.</p>
        </Field>
        <Field label="Kg iniciales (gr)" id="kg_iniciales_gr">
          <input
            id="kg_iniciales_gr"
            type="number"
            min="0.01"
            step="0.01"
            required
            value={form.kg_iniciales_gr}
            onChange={(e) => update("kg_iniciales_gr", e.target.value)}
            className={inputClass}
          />
        </Field>
      </div>

      <fieldset className="space-y-3 rounded-xl border border-zinc-200 bg-zinc-50/80 p-4 dark:border-zinc-700 dark:bg-zinc-950/40">
        <legend className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Precio de compra del lote
        </legend>
        <p className="text-xs text-zinc-500">
          Costo total pagado por este ingreso. Opcional; podés completar solo una moneda.
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Pesos (ARS)" id="costo_total_ars">
            <input
              id="costo_total_ars"
              type="number"
              min="0"
              step="0.01"
              value={form.costo_total_ars}
              onChange={(e) => update("costo_total_ars", e.target.value)}
              placeholder="Ej: 450000"
              className={inputClass}
            />
          </Field>
          <Field label="Dólares (USD)" id="costo_total_usd">
            <input
              id="costo_total_usd"
              type="number"
              min="0"
              step="0.01"
              value={form.costo_total_usd}
              onChange={(e) => update("costo_total_usd", e.target.value)}
              placeholder="Ej: 1200"
              className={inputClass}
            />
          </Field>
        </div>
      </fieldset>

      <Field label="Detalle (opcional)" id="detalle">
        <input
          id="detalle"
          value={form.detalle}
          onChange={(e) => update("detalle", e.target.value)}
          placeholder="Ej: Proveedor, factura, notas del lote…"
          className={inputClass}
        />
      </Field>

      <fieldset className="space-y-3">
        <legend className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Formatos de venta <span className="text-red-600">*</span>
        </legend>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {FORMATOS_VENTA.map((f) => (
            <label
              key={f.value}
              className="flex cursor-pointer items-center gap-2 rounded-lg border border-zinc-200 px-3 py-2 text-sm transition hover:border-amber-400 has-checked:border-amber-600 has-checked:bg-amber-50 dark:border-zinc-700 dark:has-checked:bg-amber-950/30"
            >
              <input
                type="checkbox"
                checked={formatosVenta.includes(f.value)}
                onChange={() => toggleFormato(f.value)}
                className="rounded border-zinc-300 text-amber-700 focus:ring-amber-500"
              />
              {f.label}
            </label>
          ))}
        </div>
        {formatosVenta.length === 0 ? (
          <p className="text-xs text-zinc-500">Seleccioná al menos uno</p>
        ) : null}
      </fieldset>

      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
          {error}
        </p>
      ) : null}
      {success ? (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-100">
          {success}
        </p>
      ) : null}

      <div className={formStickyFooterClass}>
        <button
          type="submit"
          disabled={loading || formatosVenta.length === 0}
          className={btnPrimary}
        >
          {loading ? "Guardando…" : "Registrar café verde"}
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  id,
  children,
}: {
  label: string;
  id: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <label htmlFor={id} className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
        {label}
      </label>
      {children}
    </div>
  );
}
