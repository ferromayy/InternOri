import { PlaceholderSection } from "@/components/inventario/PlaceholderSection";

export default function ActivosPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Activos</h1>
      </header>
      <PlaceholderSection title="Activos" />
    </div>
  );
}
