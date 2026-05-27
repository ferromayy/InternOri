/** Rutas internas permitidas después del login (evita open redirect). */
export function safeRedirectPath(from: string | null | undefined): string {
  if (!from || typeof from !== "string") return "/dashboard";

  let path = from.trim();
  if (!path.startsWith("/")) return "/dashboard";
  if (path.startsWith("//")) return "/dashboard";
  if (path.includes("://")) return "/dashboard";

  // Solo rutas del dashboard (y subrutas)
  if (path === "/") return "/dashboard";
  if (!path.startsWith("/dashboard")) return "/dashboard";

  return path;
}

const ROUTE_LABELS: Record<string, string> = {
  "/dashboard": "Resumen",
  "/dashboard/inventario": "Inventario",
  "/dashboard/inventario/cafe-verde": "Café verde · Nuevo ingreso",
  "/dashboard/inventario/cafe-tostado": "Café tostado · Nuevo tueste",
  "/dashboard/inventario/packaging": "Packaging",
  "/dashboard/inventario/packaging/componentes": "Packaging · Componentes",
  "/dashboard/inventario/packaging/recetas": "Packaging · Recetas",
  "/dashboard/inventario/packaging/compatibilidad": "Packaging · Compatibilidad",
  "/dashboard/inventario/producto-terminado": "Producto terminado",
  "/dashboard/inventario/producto-terminado/producir": "Producir",
  "/dashboard/inventario/producto-terminado/capacidad": "Capacidad",
  "/dashboard/inventario/producto-terminado/stock": "Stock final",
};

export function labelRedirectPath(path: string): string {
  const base = path.split("#")[0] ?? path;
  if (ROUTE_LABELS[base]) return ROUTE_LABELS[base];
  if (base.startsWith("/dashboard/inventario")) return "Inventario";
  return "tu destino";
}

/** Enlaces para guardar en el celular (formularios de carga). */
/** ?focus= se conserva en el login (el #ancla no llega al servidor). */
export const QUICK_FORM_LINKS = [
  {
    href: "/dashboard/inventario/cafe-verde?focus=formulario",
    label: "Nuevo ingreso café verde",
  },
  {
    href: "/dashboard/inventario/cafe-tostado?focus=formulario",
    label: "Nuevo tueste",
  },
  {
    href: "/dashboard/inventario/packaging/componentes?focus=formulario",
    label: "Nuevo componente",
  },
  {
    href: "/dashboard/inventario/packaging/componentes?focus=ingreso",
    label: "Ingreso de stock packaging",
  },
  {
    href: "/dashboard/inventario/producto-terminado/producir?focus=formulario",
    label: "Producir",
  },
  {
    href: "/dashboard/inventario/producto-terminado/stock?focus=venta",
    label: "Registrar venta",
  },
] as const;
