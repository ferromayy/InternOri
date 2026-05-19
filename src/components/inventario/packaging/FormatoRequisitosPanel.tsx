"use client";

import { COMPONENTES_PACKAGING, labelComponentePackaging } from "@/lib/inventario/packaging";
import type { ComponentePackaging } from "@/lib/inventario/packaging";
import type { PackagingComponenteCatalogo } from "@/lib/inventario/packaging-componente";
import { FormEvent, useMemo, useState } from "react";

const inputClass =
  "w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950";

export type RequisitoFormato = {
  id: string;
  packaging_componente_id: string | null;
  componente: ComponentePackaging;
  tipo: string;
};

type Props = {
  formatoId: string;
  requisitos: RequisitoFormato[];
  catalogo: PackagingComponenteCatalogo[];
  onChanged: () => void;
};

export function FormatoRequisitosPanel({
  formatoId,
  requisitos,
  catalogo,
  onChanged,
}: Props) {
  const [modo, setModo] = useState<"existente" | "nuevo">("existente");
  const [componenteId, setComponenteId] = useState("");
  const [componente, setComponente] = useState<ComponentePackaging | "">("");
  const [tipo, setTipo] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const usados = useMemo(
    () => new Set(requisitos.map((r) => r.packaging_componente_id).filter(Boolean)),
    [requisitos],
  );

  const catalogoDisponible = useMemo(
    () => catalogo.filter((c) => !usados.has(c.id)),
    [catalogo, usados],
  );

  function notify() {
    window.dispatchEvent(new Event("cafe-verde-updated"));
    onChanged();
  }

  async function addRequisito(e: FormEvent) {
    e.preventDefault();
    setFormError(null);
    setAdding(true);

    const body =
      modo === "existente"
        ? { cafe_verde_formato_id: formatoId, packaging_componente_id: componenteId }
        : { cafe_verde_formato_id: formatoId, componente, tipo, cantidad: 0 };

    try {
      const res = await fetch("/api/inventario/cafe-verde/packaging/requisitos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error ?? "No se pudo añadir");
        return;
      }
      setComponenteId("");
      setComponente("");
      setTipo("");
      setShowForm(false);
      notify();
    } catch {
      setFormError("Error de red");
    } finally {
      setAdding(false);
    }
  }

  async function removeRequisito(requisitoId: string) {
    await fetch(`/api/inventario/cafe-verde/packaging/requisitos/${requisitoId}`, {
      method: "DELETE",
    });
    notify();
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Componentes</p>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-medium hover:bg-white dark:border-zinc-600"
        >
          {showForm ? "Cerrar" : "+ Añadir componente"}
        </button>
      </div>

      {showForm ? (
        <form
          onSubmit={addRequisito}
          className="grid gap-3 rounded-xl border border-zinc-200 bg-white p-3 dark:border-zinc-700 dark:bg-zinc-900 sm:grid-cols-2"
        >
          <div className="flex gap-2 sm:col-span-2">
            <button
              type="button"
              onClick={() => setModo("existente")}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium ${modo === "existente" ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900" : "border border-zinc-300"}`}
            >
              Del catálogo
            </button>
            <button
              type="button"
              onClick={() => setModo("nuevo")}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium ${modo === "nuevo" ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900" : "border border-zinc-300"}`}
            >
              Crear nuevo
            </button>
          </div>

          {modo === "existente" ? (
            <div className="space-y-1 sm:col-span-2">
              <label className="text-xs font-medium text-zinc-600">Del catálogo global</label>
              <select
                required
                value={componenteId}
                onChange={(e) => setComponenteId(e.target.value)}
                className={inputClass}
              >
                <option value="">Seleccionar…</option>
                {catalogoDisponible.map((c) => (
                  <option key={c.id} value={c.id}>
                    {labelComponentePackaging(c.componente)} — {c.tipo}
                  </option>
                ))}
              </select>
              {catalogoDisponible.length === 0 ? (
                <p className="mt-1 text-xs text-zinc-500">
                  Creá componentes en la pestaña Componentes o usá «Crear nuevo».
                </p>
              ) : null}
            </div>
          ) : (
            <>
              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-600">Categoría</label>
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
                <label className="text-xs font-medium text-zinc-600">Tipo / nombre</label>
                <input
                  required
                  value={tipo}
                  onChange={(e) => setTipo(e.target.value)}
                  placeholder="Ej: Nombre principal"
                  className={inputClass}
                />
              </div>
              <p className="text-xs text-zinc-500 sm:col-span-2">
                El stock se define en Componentes → Catálogo global.
              </p>
            </>
          )}

          {formError ? <p className="text-sm text-red-600 sm:col-span-2">{formError}</p> : null}
          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={adding}
              className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
            >
              {adding ? "Guardando…" : "Añadir"}
            </button>
          </div>
        </form>
      ) : null}

      {requisitos.length === 0 ? (
        <p className="text-sm text-zinc-500">Sin componentes. Añadí al menos uno para definir la receta.</p>
      ) : (
        <ul className="space-y-2">
          {requisitos.map((r) => (
            <li
              key={r.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-zinc-200 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
            >
              <span className="text-sm">
                <span className="font-medium">{labelComponentePackaging(r.componente)}</span>
                <span className="ml-2 text-zinc-500">{r.tipo}</span>
              </span>
              <button
                type="button"
                onClick={() => removeRequisito(r.id)}
                className="text-xs text-red-600 hover:underline"
              >
                Quitar
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
