"use client";

import { buildCapacidadSkus } from "@/lib/inventario/capacidad";
import { formatMoneda } from "@/lib/inventario/moneda";
import {
  fechaLocalHoy,
  labelTipoCliente,
  labelVentaRegistro,
  TIPOS_CLIENTE_VENTA,
  type VentaRegistro,
} from "@/lib/inventario/producto-terminado-venta";
import { useProductoTerminadoLotes } from "@/lib/hooks/use-producto-terminado-lotes";
import { useVentasHistorial } from "@/lib/hooks/use-ventas-historial";
import {
  btnPrimary,
  formCardClass,
  formStickyFooterClass,
  inputClass,
  selectClass,
} from "@/components/inventario/ui/form-styles";
import { FormEvent, useMemo, useState } from "react";

function formatFechaDisplay(fecha: string) {
  return new Date(fecha + "T12:00:00").toLocaleDateString("es-AR");
}

export function StockVentaPanel() {
  const { lotes, reload: reloadLotes } = useProductoTerminadoLotes();
  const { ventas, initialLoading, refreshing, error, reload: reloadVentas } = useVentasHistorial();

  const skus = useMemo(() => buildCapacidadSkus(lotes), [lotes]);
  const conStock = useMemo(
    () => skus.filter((s) => s.unidades_producidas > 0),
    [skus],
  );

  const [formatoId, setFormatoId] = useState("");
  const [cantidad, setCantidad] = useState("1");
  const [precioVenta, setPrecioVenta] = useState("");
  const [tipoCliente, setTipoCliente] = useState<string>("cliente_final");
  const [fecha, setFecha] = useState(fechaLocalHoy);
  const [detalle, setDetalle] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formOk, setFormOk] = useState<string | null>(null);

  const seleccionado = conStock.find((s) => s.formato_id === formatoId);

  async function registrarVenta(e: FormEvent) {
    e.preventDefault();
    setFormError(null);
    setFormOk(null);
    setEnviando(true);
    try {
      const res = await fetch("/api/inventario/producto-terminado/ventas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cafe_verde_formato_id: formatoId,
          cantidad,
          precio_venta: precioVenta,
          tipo_cliente: tipoCliente,
          fecha,
          detalle,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error ?? "No se pudo registrar la venta");
        return;
      }
      setFormOk(
        `Salida registrada. Quedan ${data.unidades_restantes} unidad${data.unidades_restantes !== 1 ? "es" : ""} en stock.`,
      );
      setCantidad("1");
      setPrecioVenta("");
      setDetalle("");
      setFormatoId("");
      window.dispatchEvent(new Event("cafe-verde-updated"));
      reloadLotes();
      reloadVentas();
    } catch {
      setFormError("Error de red");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="space-y-8">
      <section id="venta" className="scroll-mt-24 space-y-4">
        <div>
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
            Registrar venta / salida de stock
          </h2>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Descontá unidades del stock final cuando vendés un producto.
          </p>
        </div>

        {conStock.length === 0 ? (
          <p className="rounded-xl border border-dashed border-zinc-200 p-4 text-sm text-zinc-500 dark:border-zinc-700">
            No hay productos con stock. Producí unidades en la pestaña Producir.
          </p>
        ) : (
          <form
            onSubmit={registrarVenta}
            className={`${formCardClass} border-amber-200/70 bg-amber-50/30 dark:border-amber-900/40 dark:bg-amber-950/20`}
          >
            <div>
              <label className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                Producto
              </label>
              <select
                required
                value={formatoId}
                onChange={(e) => setFormatoId(e.target.value)}
                className={`mt-2 ${selectClass}`}
              >
                <option value="">Seleccionar…</option>
                {conStock.map((s) => (
                  <option key={s.formato_id} value={s.formato_id}>
                    {s.sku} — stock {s.unidades_producidas}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                  Cantidad de salida
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
                {seleccionado ? (
                  <p className="mt-1 text-xs text-zinc-500">
                    Máximo disponible: {seleccionado.unidades_producidas}
                  </p>
                ) : null}
              </div>
              <div>
                <label className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                  Precio de venta
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={precioVenta}
                  onChange={(e) => setPrecioVenta(e.target.value)}
                  placeholder="Opcional"
                  className={`mt-2 ${inputClass}`}
                />
              </div>
              <div>
                <label className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                  Tipo de cliente
                </label>
                <select
                  required
                  value={tipoCliente}
                  onChange={(e) => setTipoCliente(e.target.value)}
                  className={`mt-2 ${selectClass}`}
                >
                  {TIPOS_CLIENTE_VENTA.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                  Fecha
                </label>
                <input
                  type="date"
                  required
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                  className={`mt-2 ${inputClass}`}
                />
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                  Detalle
                </label>
                <input
                  value={detalle}
                  onChange={(e) => setDetalle(e.target.value)}
                  placeholder="Ej: Pedido web, factura, contacto…"
                  className={`mt-2 ${inputClass}`}
                />
              </div>
            </div>

            {formError ? <p className="text-sm text-red-600">{formError}</p> : null}
            {formOk ? <p className="text-sm text-emerald-800 dark:text-emerald-200">{formOk}</p> : null}

            <div className={formStickyFooterClass}>
              <button
                type="submit"
                disabled={enviando}
                className={`${btnPrimary} !bg-amber-800 hover:!bg-amber-900`}
              >
                {enviando ? "Registrando…" : "Registrar salida por venta"}
              </button>
            </div>
          </form>
        )}
      </section>

      <section className="space-y-3 border-t border-zinc-200 pt-8 dark:border-zinc-800">
        <h2 className="text-sm font-medium uppercase tracking-wide text-zinc-500">
          Historial de ventas
        </h2>
        {refreshing ? <p className="text-xs text-zinc-500">Actualizando…</p> : null}
        {initialLoading ? (
          <p className="text-sm text-zinc-500">Cargando…</p>
        ) : error ? (
          <p className="rounded-xl bg-red-50 p-4 text-sm text-red-800">{error}</p>
        ) : ventas.length === 0 ? (
          <p className="rounded-xl border border-dashed border-zinc-200 p-6 text-center text-sm text-zinc-500 dark:border-zinc-700">
            Todavía no hay ventas registradas.
          </p>
        ) : (
          <VentasTable rows={ventas} />
        )}
      </section>
    </div>
  );
}

function VentasTable({ rows }: { rows: VentaRegistro[] }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead className="border-b border-zinc-100 text-xs uppercase tracking-wide text-zinc-500 dark:border-zinc-800">
          <tr>
            <th className="px-4 py-3 font-medium">Fecha</th>
            <th className="px-4 py-3 font-medium">Producto</th>
            <th className="px-4 py-3 font-medium tabular-nums text-right">Salida</th>
            <th className="px-4 py-3 font-medium tabular-nums text-right">Quedó</th>
            <th className="px-4 py-3 font-medium tabular-nums text-right">Precio</th>
            <th className="px-4 py-3 font-medium">Cliente</th>
            <th className="px-4 py-3 font-medium">Detalle</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-50 dark:divide-zinc-800/80">
          {rows.map((row) => (
            <tr key={row.id} className="hover:bg-zinc-50/80 dark:hover:bg-zinc-950/40">
              <td className="whitespace-nowrap px-4 py-3 text-zinc-600">
                {formatFechaDisplay(row.fecha)}
              </td>
              <td className="px-4 py-3 font-medium">{labelVentaRegistro(row)}</td>
              <td className="px-4 py-3 text-right tabular-nums font-medium text-amber-800 dark:text-amber-300">
                −{row.cantidad}
              </td>
              <td className="px-4 py-3 text-right tabular-nums text-zinc-600">
                {row.unidades_restantes}
              </td>
              <td className="px-4 py-3 text-right tabular-nums">
                {row.precio_venta != null ? formatMoneda(row.precio_venta, "ARS") : "—"}
              </td>
              <td className="px-4 py-3 text-xs">{labelTipoCliente(row.tipo_cliente)}</td>
              <td
                className="max-w-[180px] truncate px-4 py-3 text-xs text-zinc-500"
                title={row.detalle ?? ""}
              >
                {row.detalle ?? "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
