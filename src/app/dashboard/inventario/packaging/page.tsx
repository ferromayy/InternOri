import { CafeVerdePackagingManager } from "@/components/inventario/CafeVerdePackagingManager";

export default function PackagingPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Packaging</h1>
        <p className="mt-1 text-zinc-600 dark:text-zinc-400">
          Por ID: definí componentes y tipo (se replican en todos los formatos). El stock es por
          formato. La cantidad por unidad y los gramos de tostado se definen en Producto terminado.
        </p>
      </header>

      <CafeVerdePackagingManager />
    </div>
  );
}
