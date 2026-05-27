import { CafeTostadoForm } from "@/components/inventario/CafeTostadoForm";
import { CafeTostadoInventario } from "@/components/inventario/CafeTostadoInventario";
import { FormPageShell } from "@/components/inventario/ui/FormPageShell";

export default function CafeTostadoPage() {
  return (
    <FormPageShell
      header={
        <header>
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Café tostado</h1>
          <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400 md:text-base">
            Vinculado a café verde (≥ 200 g iniciales). Merma = kg verde a tostar − kg después de
            tostar.
          </p>
        </header>
      }
      form={<CafeTostadoForm />}
      below={
        <section className="space-y-3">
          <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-50">Inventario actual</h2>
          <CafeTostadoInventario />
        </section>
      }
    />
  );
}
