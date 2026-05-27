import { CafeVerdeForm } from "@/components/inventario/CafeVerdeForm";
import { CafeVerdeInventario } from "@/components/inventario/CafeVerdeInventario";
import { FormPageShell } from "@/components/inventario/ui/FormPageShell";

export default function CafeVerdePage() {
  return (
    <FormPageShell
      header={
        <header>
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Café verde</h1>
          <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400 md:text-base">
            Registro de lotes en gramos. Los kg usados se actualizan con movimientos de producción.
            El packaging de cada formato se configura en{" "}
            <span className="font-medium text-amber-800 dark:text-amber-400">
              Inventario → Packaging
            </span>
            .
          </p>
        </header>
      }
      form={<CafeVerdeForm />}
      below={
        <section className="space-y-3">
          <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-50">Inventario actual</h2>
          <CafeVerdeInventario />
        </section>
      }
    />
  );
}
