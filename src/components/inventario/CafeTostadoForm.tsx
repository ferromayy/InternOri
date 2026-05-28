"use client";

import {
  btnPrimary,
  formCardClass,
  formStickyFooterClass,
  inputClass,
  selectClass,
} from "@/components/inventario/ui/form-styles";
import type { CafeVerdeParaTostado } from "@/types/inventario";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

const empty = {
  cafe_verde_codigo: "",
  fecha_tueste: "",
  perfil: "",
  kg_verde_tostado_gr: "",
  kg_despues_tostar_gr: "",
  detalle: "",
};

export function CafeTostadoForm() {
  const router = useRouter();
  const [form, setForm] = useState(empty);
  const [alogFiles, setAlogFiles] = useState<File[]>([]);
  const [lotesVerde, setLotesVerde] = useState<CafeVerdeParaTostado[]>([]);
  const [loadingLotes, setLoadingLotes] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const loteSeleccionado = lotesVerde.find((l) => l.codigo === form.cafe_verde_codigo);

  useEffect(() => {
    fetch("/api/inventario/cafe-verde/para-tostado")
      .then((res) => res.json())
      .then((data) => {
        setLotesVerde(data.items ?? []);
        setLoadingLotes(false);
      })
      .catch(() => {
        setError("No se pudieron cargar los lotes de café verde");
        setLoadingLotes(false);
      });
  }, []);

  function update(field: keyof typeof empty, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const res = await fetch("/api/inventario/cafe-tostado", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cafe_verde_codigo: form.cafe_verde_codigo,
          fecha_tueste: form.fecha_tueste,
          perfil: form.perfil,
          kg_verde_tostado_gr: Number(form.kg_verde_tostado_gr),
          kg_despues_tostar_gr: Number(form.kg_despues_tostar_gr),
          detalle: form.detalle,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "No se pudo guardar");
        return;
      }

      const ref = form.cafe_verde_codigo;
      const selected = alogFiles;
      setForm(empty);
      setAlogFiles([]);
      setSuccess(
        `Tueste ${data.codigo} registrado · café verde ${ref} · merma ${data.merma_gr} g`,
      );
      router.refresh();

      if (selected.length > 0) {
        setUploading(true);
        const fd = new FormData();
        for (const f of selected) fd.append("files", f);
        const upRes = await fetch(`/api/inventario/cafe-tostado/${data.id}/alog`, {
          method: "POST",
          body: fd,
        });
        const upData = await upRes.json();
        if (!upRes.ok) {
          setError(upData.error ?? "Tueste guardado pero falló la carga de archivos .alog");
        } else {
          setSuccess((prev) =>
            prev
              ? `${prev} · ${selected.length} archivo(s) .alog cargado(s)`
              : `${selected.length} archivo(s) .alog cargado(s)`,
          );
        }
        setUploading(false);
      }

      const lotesRes = await fetch("/api/inventario/cafe-verde/para-tostado");
      const lotesData = await lotesRes.json();
      setLotesVerde(lotesData.items ?? []);
    } catch {
      setError("Error de red");
    } finally {
      setLoading(false);
      setUploading(false);
    }
  }

  function onFilesChange(files: FileList | null) {
    if (!files) {
      setAlogFiles([]);
      return;
    }
    const list = Array.from(files);
    const onlyAlog = list.filter((f) => f.name.toLowerCase().endsWith(".alog"));
    const capped = onlyAlog.slice(0, 5);
    setAlogFiles(capped);
  }

  return (
    <form onSubmit={onSubmit} className={formCardClass}>
      <div>
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Nuevo tueste</h2>
        <p className="mt-1 text-sm text-zinc-500">
          Elegí un lote con stock disponible. La merma se calcula: verde a tostar − después de
          tostar.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="ID (café verde)" id="cafe_verde_codigo">
          <select
            id="cafe_verde_codigo"
            required
            value={form.cafe_verde_codigo}
            onChange={(e) => update("cafe_verde_codigo", e.target.value)}
            disabled={loadingLotes}
            className={selectClass}
          >
            <option value="">
              {loadingLotes ? "Cargando lotes…" : "Seleccionar lote de café verde"}
            </option>
            {lotesVerde.map((lote) => (
              <option key={lote.codigo} value={lote.codigo}>
                {lote.codigo} — {lote.varietal} ({lote.kg_actuales_gr} g disp.)
              </option>
            ))}
          </select>
          {loteSeleccionado ? (
            <div className="space-y-1 text-xs">
              <p className="text-zinc-500">
                {loteSeleccionado.origen} · lote {loteSeleccionado.lote} · iniciales{" "}
                {loteSeleccionado.kg_iniciales_gr} g
              </p>
              {loteSeleccionado.kg_iniciales_gr < 200 ? (
                <p className="text-amber-700 dark:text-amber-400">
                  Tiene menos de 200 g iniciales. Si querías registrar kilos (ej. 10 kg), editá el
                  lote en café verde y usá gramos (10000 g).
                </p>
              ) : null}
            </div>
          ) : null}
          {!loadingLotes && lotesVerde.length === 0 ? (
            <p className="text-xs text-amber-700 dark:text-amber-400">
              No hay lotes con gramos disponibles. Registrá café verde primero.
            </p>
          ) : null}
        </Field>

        <Field label="Fecha de tueste" id="fecha_tueste">
          <input
            id="fecha_tueste"
            type="date"
            required
            value={form.fecha_tueste}
            onChange={(e) => update("fecha_tueste", e.target.value)}
            className={inputClass}
          />
        </Field>

        <Field label="Perfil" id="perfil">
          <input
            id="perfil"
            required
            value={form.perfil}
            onChange={(e) => update("perfil", e.target.value)}
            placeholder="Ej: Espresso, Filtrado"
            className={inputClass}
          />
        </Field>

        <Field label="Kg verde a tostar (gr)" id="kg_verde_tostado_gr">
          <input
            id="kg_verde_tostado_gr"
            type="number"
            min="0.01"
            step="0.01"
            required
            value={form.kg_verde_tostado_gr}
            onChange={(e) => update("kg_verde_tostado_gr", e.target.value)}
            className={inputClass}
          />
        </Field>

        <Field label="Kg después de tostar (gr)" id="kg_despues_tostar_gr">
          <input
            id="kg_despues_tostar_gr"
            type="number"
            min="0.01"
            step="0.01"
            required
            value={form.kg_despues_tostar_gr}
            onChange={(e) => update("kg_despues_tostar_gr", e.target.value)}
            className={inputClass}
          />
        </Field>

        <Field label="Detalle (opcional)" id="detalle">
          <input
            id="detalle"
            value={form.detalle}
            onChange={(e) => update("detalle", e.target.value)}
            placeholder="Ej: Horno, lote de tueste, observaciones…"
            className={inputClass}
          />
        </Field>

        <div className="sm:col-span-2">
          <label htmlFor="alog_files" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Archivos .alog (1 a 5)
          </label>
          <input
            id="alog_files"
            type="file"
            accept=".alog"
            multiple
            onChange={(e) => onFilesChange(e.target.files)}
            className={`mt-1 ${inputClass}`}
          />
          <p className="mt-1 text-xs text-zinc-500">
            Se suben después de guardar el tueste. Si elegís más de 5 o archivos que no son .alog, se
            ignoran.
          </p>
          {alogFiles.length > 0 ? (
            <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
              Seleccionados: {alogFiles.length} archivo(s)
            </p>
          ) : null}
        </div>
      </div>

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
          disabled={loading || uploading || loadingLotes || lotesVerde.length === 0}
          className={btnPrimary}
        >
          {loading || uploading ? "Guardando…" : "Registrar café tostado"}
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
