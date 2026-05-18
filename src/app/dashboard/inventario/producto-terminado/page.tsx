import { ProductoTerminadoManager } from "@/components/inventario/ProductoTerminadoManager";

export default function ProductoTerminadoPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Producto terminado</h1>
        <p className="mt-1 text-zinc-600 dark:text-zinc-400">
          Por cada ID y formato: definí la receta (una sola vez) y registrá unidades producidas. Al
          sumar +1 se descuentan packaging y café tostado según la receta.
        </p>
      </header>

      <ProductoTerminadoManager />
    </div>
  );
}
