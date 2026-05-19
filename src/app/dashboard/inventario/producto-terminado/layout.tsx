import {
  InventarioPageHeader,
  InventarioSubNav,
} from "@/components/inventario/ui/InventarioSection";

const BASE = "/dashboard/inventario/producto-terminado";

const subNav = [
  { href: BASE, label: "Resumen", exact: true },
  { href: `${BASE}/producir`, label: "Producir" },
  { href: `${BASE}/capacidad`, label: "Capacidad" },
  { href: `${BASE}/stock`, label: "Stock final" },
];

export default function ProductoTerminadoLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <InventarioPageHeader
        eyebrow="Operación · Inventario"
        title="Producto terminado"
        description="Centro operativo de producción. Registrá unidades, consultá capacidad y stock final sin tocar la configuración de recetas."
      />
      <InventarioSubNav basePath={BASE} items={subNav} />
      {children}
    </div>
  );
}
