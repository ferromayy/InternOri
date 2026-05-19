import {
  InventarioPageHeader,
  InventarioSubNav,
} from "@/components/inventario/ui/InventarioSection";

const BASE = "/dashboard/inventario/packaging";

const subNav = [
  { href: BASE, label: "Resumen", exact: true },
  { href: `${BASE}/componentes`, label: "Componentes" },
  { href: `${BASE}/recetas`, label: "Recetas" },
  { href: `${BASE}/compatibilidad`, label: "Compatibilidad" },
];

export default function PackagingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <InventarioPageHeader
        eyebrow="Configuración · Inventario"
        title="Packaging"
        description="Centro de componentes y recetas. Definí la estructura de cada presentación; la operación diaria vive en Producto terminado."
      />
      <InventarioSubNav basePath={BASE} items={subNav} />
      {children}
    </div>
  );
}
