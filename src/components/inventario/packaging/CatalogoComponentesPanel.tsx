"use client";

import { formatMoneda } from "@/lib/inventario/moneda";
import { COMPONENTES_PACKAGING, labelComponentePackaging } from "@/lib/inventario/packaging";
import type { ComponentePackaging } from "@/lib/inventario/packaging";
import type { PackagingComponenteCatalogo } from "@/lib/inventario/packaging-componente";
import { usePackagingCatalogo } from "@/lib/hooks/use-packaging-catalogo";
import { FormEvent, useEffect, useState } from "react";

const inputClass =
  "w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-base sm:text-sm dark:border-zinc-700 dark:bg-zinc-950";

const btnSecondary =
  "rounded-lg border border-zinc-300 bg-white px-3 py-2 text-xs font-medium text-zinc-700 transition hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800";

function notifyUpdated() {
  window.dispatchEvent(new Event("cafe-verde-updated"));
}

export function CatalogoComponentesPanel() {
  const { catalogo, initialLoading, refreshing, error, reload } = usePackagingCatalogo();
  const [showForm, setShowForm] = useState(false);
  const [componente, setComponente] = useState<ComponentePackaging | "">("");
  const [tipo, setTipo] = useState("");
  const [cantidad, setCantidad] = useState("0");
  const [precioCompraArs, setPrecioCompraArs] = useState("");
  const [precioCompraUsd, setPrecioCompraUsd] = useState("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function crear(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setFormError(null);
    try {
      const res = await fetch("/api/inventario/packaging/componentes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          componente,
          tipo,
          cantidad: Number(cantidad) || 0,
          precio_compra_ars: precioCompraArs,
          precio_compra_usd: precioCompraUsd,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error ?? "No se pudo crear");
        return;
      }
      setComponente("");
      setTipo("");
      setCantidad("0");
      setPrecioCompraArs("");
      setPrecioCompraUsd("");
      setShowForm(false);
      notifyUpdated();
      reload();
    } catch {
      setFormError("Error de red");
    } finally {
      setSaving(false);
    }
  }

  if (initialLoading) return <p className="text-sm text-zinc-500">Cargando catálogo…</p>;
  if (error) {
    return (
      <p className="rounded-xl bg-red-50 p-4 text-sm text-red-800">
        {error}
        <span className="mt-1 block text-xs">
          Ejecutá <code className="rounded bg-red-100 px-1">011_packaging_componente_catalogo.sql</code> en
          Supabase
        </span>
      </p>
    );
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Crear, editar stock y eliminar componentes. El stock es compartido en todos los formatos que
          lo usen.
        </p>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
        >
          {showForm ? "Cerrar" : "+ Nuevo componente"}
        </button>
      </div>

      {refreshing ? <p className="text-xs text-zinc-500">Actualizando…</p> : null}

      {showForm ? (
        <form
          onSubmit={crear}
          className="grid gap-3 rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950/50 sm:grid-cols-2"
        >
          <div>
            <label className="text-xs font-medium">Categoría</label>
            <select
              required
              value={componente}
              onChange={(e) => setComponente(e.target.value as ComponentePackaging)}
              className={`mt-1 ${inputClass}`}
            >
              <option value="">Seleccionar…</option>
              {COMPONENTES_PACKAGING.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium">Tipo / nombre</label>
            <input
              required
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
              placeholder="Ej: Nombre principal, 1 kg"
              className={`mt-1 ${inputClass}`}
            />
          </div>
          <div className="sm:col-span-2">
            <label className="text-xs font-medium">Stock inicial</label>
            <input
              type="number"
              min="0"
              value={cantidad}
              onChange={(e) => setCantidad(e.target.value)}
              className={`mt-1 max-w-xs ${inputClass}`}
            />
          </div>
          <fieldset className="space-y-2 rounded-xl border border-zinc-200 bg-white p-3 sm:col-span-2 dark:border-zinc-700 dark:bg-zinc-900">
            <legend className="px-1 text-xs font-medium text-zinc-700 dark:text-zinc-300">
              Precio de compra
            </legend>
            <p className="text-xs text-zinc-500">Opcional. Costo unitario o del lote comprado.</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="text-xs font-medium">Pesos (ARS)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={precioCompraArs}
                  onChange={(e) => setPrecioCompraArs(e.target.value)}
                  placeholder="Ej: 1500"
                  className={`mt-1 ${inputClass}`}
                />
              </div>
              <div>
                <label className="text-xs font-medium">Dólares (USD)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={precioCompraUsd}
                  onChange={(e) => setPrecioCompraUsd(e.target.value)}
                  placeholder="Ej: 2.50"
                  className={`mt-1 ${inputClass}`}
                />
              </div>
            </div>
          </fieldset>
          {formError ? <p className="text-sm text-red-600 sm:col-span-2">{formError}</p> : null}
          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-60"
            >
              {saving ? "Guardando…" : "Crear en catálogo"}
            </button>
          </div>
        </form>
      ) : null}

      {catalogo.length === 0 ? (
        <p className="text-sm text-zinc-500">Sin componentes en el catálogo.</p>
      ) : (
        <ul className="divide-y divide-zinc-100 rounded-2xl border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
          {catalogo.map((c) => (
            <CatalogoRow key={c.id} item={c} onChanged={reload} />
          ))}
        </ul>
      )}
    </section>
  );
}

type CatalogoRowProps = {
  item: PackagingComponenteCatalogo;
  onChanged: () => void;
};

function CatalogoRow({ item, onChanged }: CatalogoRowProps) {
  const [editing, setEditing] = useState(false);
  const [componente, setComponente] = useState(item.componente);
  const [tipo, setTipo] = useState(item.tipo);
  const [cantidad, setCantidad] = useState(String(item.cantidad));
  const [precioCompraArs, setPrecioCompraArs] = useState(
    item.precio_compra_ars != null ? String(item.precio_compra_ars) : "",
  );
  const [precioCompraUsd, setPrecioCompraUsd] = useState(
    item.precio_compra_usd != null ? String(item.precio_compra_usd) : "",
  );
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [rowError, setRowError] = useState<string | null>(null);

  useEffect(() => {
    if (!editing) {
      setComponente(item.componente);
      setTipo(item.tipo);
      setCantidad(String(item.cantidad));
      setPrecioCompraArs(item.precio_compra_ars != null ? String(item.precio_compra_ars) : "");
      setPrecioCompraUsd(item.precio_compra_usd != null ? String(item.precio_compra_usd) : "");
    }
  }, [item, editing]);

  async function guardar() {
    setSaving(true);
    setRowError(null);
    try {
      const res = await fetch(`/api/inventario/packaging/componentes/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          componente,
          tipo,
          cantidad: Number(cantidad) || 0,
          precio_compra_ars: precioCompraArs,
          precio_compra_usd: precioCompraUsd,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setRowError(data.error ?? "No se pudo guardar");
        return;
      }
      setEditing(false);
      notifyUpdated();
      onChanged();
    } catch {
      setRowError("Error de red");
    } finally {
      setSaving(false);
    }
  }

  async function eliminar() {
    if (
      !window.confirm(
        `¿Eliminar "${labelComponentePackaging(item.componente)} — ${item.tipo}" del catálogo?`,
      )
    ) {
      return;
    }
    setDeleting(true);
    setRowError(null);
    try {
      const res = await fetch(`/api/inventario/packaging/componentes/${item.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        setRowError(data.error ?? "No se pudo eliminar");
        return;
      }
      notifyUpdated();
      onChanged();
    } catch {
      setRowError("Error de red");
    } finally {
      setDeleting(false);
    }
  }

  if (editing) {
    return (
      <li className="space-y-3 px-4 py-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="text-xs font-medium text-zinc-500">Categoría</label>
            <select
              value={componente}
              onChange={(e) => setComponente(e.target.value as ComponentePackaging)}
              className={`mt-1 ${inputClass}`}
            >
              {COMPONENTES_PACKAGING.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-zinc-500">Tipo / nombre</label>
            <input
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
              className={`mt-1 ${inputClass}`}
            />
          </div>
          <div className="sm:col-span-2">
            <label className="text-xs font-medium text-zinc-500">Stock</label>
            <input
              type="number"
              min="0"
              value={cantidad}
              onChange={(e) => setCantidad(e.target.value)}
              className={`mt-1 max-w-xs ${inputClass}`}
            />
          </div>
          <fieldset className="space-y-2 rounded-lg border border-zinc-200 p-3 sm:col-span-2 dark:border-zinc-700">
            <legend className="px-1 text-xs font-medium text-zinc-500">Precio de compra</legend>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="text-xs font-medium text-zinc-500">Pesos (ARS)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={precioCompraArs}
                  onChange={(e) => setPrecioCompraArs(e.target.value)}
                  placeholder="Opcional"
                  className={`mt-1 ${inputClass}`}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-zinc-500">Dólares (USD)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={precioCompraUsd}
                  onChange={(e) => setPrecioCompraUsd(e.target.value)}
                  placeholder="Opcional"
                  className={`mt-1 ${inputClass}`}
                />
              </div>
            </div>
          </fieldset>
        </div>
        {rowError ? <p className="text-sm text-red-600">{rowError}</p> : null}
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={saving}
            onClick={guardar}
            className="rounded-lg bg-zinc-900 px-3 py-2 text-xs font-medium text-white disabled:opacity-60"
          >
            {saving ? "Guardando…" : "Guardar"}
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={() => {
              setRowError(null);
              setEditing(false);
            }}
            className={btnSecondary}
          >
            Cancelar
          </button>
        </div>
      </li>
    );
  }

  return (
    <li className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="font-medium text-zinc-900 dark:text-zinc-50">
          {labelComponentePackaging(item.componente)}
        </p>
        <p className="text-sm text-zinc-500">{item.tipo}</p>
        <p className="mt-1 text-xs text-zinc-400">Stock: {item.cantidad}</p>
        {(item.precio_compra_ars != null || item.precio_compra_usd != null) && (
          <p className="mt-1 text-xs text-zinc-500">
            Compra: {formatMoneda(item.precio_compra_ars, "ARS")}
            {item.precio_compra_ars != null && item.precio_compra_usd != null ? " · " : ""}
            {formatMoneda(item.precio_compra_usd, "USD")}
          </p>
        )}
        {rowError ? <p className="mt-1 text-sm text-red-600">{rowError}</p> : null}
      </div>
      <div className="flex shrink-0 flex-wrap gap-2">
        <button type="button" onClick={() => setEditing(true)} className={btnSecondary}>
          Editar
        </button>
        <button
          type="button"
          disabled={deleting}
          onClick={eliminar}
          className="rounded-lg border border-red-200 px-3 py-2 text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950/40"
        >
          {deleting ? "…" : "Eliminar"}
        </button>
      </div>
    </li>
  );
}
