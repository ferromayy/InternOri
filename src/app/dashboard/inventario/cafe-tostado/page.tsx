import { CafeTostadoForm } from "@/components/inventario/CafeTostadoForm";
import { CafeTostadoInventario } from "@/components/inventario/CafeTostadoInventario";

export default function CafeTostadoPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <header>
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Café tostado</h1>
        <p className="mt-1 text-zinc-600 dark:text-zinc-400">
          Vinculado a café verde (≥ 200 g iniciales). Merma = kg verde a tostar − kg después de
          tostar.
        </p>
      </header>

      <CafeTostadoForm />

      <section className="space-y-3">
        <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-50">Inventario actual</h2>
        <CafeTostadoInventario />
      </section>
    </div>
  );
}
