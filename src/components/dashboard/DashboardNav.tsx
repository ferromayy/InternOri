"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const mainSections = [
  { href: "/dashboard", label: "Resumen", exact: true },
  {
    href: "/dashboard/inventario",
    label: "Inventario productivo",
    prefix: "/dashboard/inventario",
  },
  { href: "/dashboard/activos", label: "Activos", prefix: "/dashboard/activos" },
  {
    href: "/dashboard/insumos",
    label: "Insumos operativos",
    prefix: "/dashboard/insumos",
  },
] as const;

const inventarioFlujo = [
  { href: "/dashboard/inventario/cafe-verde", label: "Café verde" },
  { href: "/dashboard/inventario/cafe-tostado", label: "Café tostado" },
] as const;

const inventarioConfig = [
  {
    href: "/dashboard/inventario/packaging",
    label: "Packaging",
    prefix: "/dashboard/inventario/packaging",
  },
] as const;

const inventarioOperacion = [
  {
    href: "/dashboard/inventario/producto-terminado",
    label: "Producto terminado",
    prefix: "/dashboard/inventario/producto-terminado",
  },
] as const;

function isActive(pathname: string, href: string, exact?: boolean) {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavLink({
  href,
  label,
  active,
}: {
  href: string;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={`block rounded-lg px-3 py-2 text-sm transition ${
        active
          ? "bg-zinc-900 font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
          : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
      }`}
    >
      {label}
    </Link>
  );
}

export function DashboardNav() {
  const pathname = usePathname();
  const inInventario = pathname.startsWith("/dashboard/inventario");

  return (
    <nav className="flex flex-col gap-6">
      <div>
        <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">
          Secciones
        </p>
        <ul className="space-y-0.5">
          {mainSections.map((item) => {
            const active =
              "exact" in item && item.exact
                ? isActive(pathname, item.href, true)
                : isActive(pathname, "prefix" in item ? item.prefix! : item.href);

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`block rounded-lg px-3 py-2 text-sm transition ${
                    active
                      ? "bg-amber-100 font-medium text-amber-950 dark:bg-amber-950/50 dark:text-amber-100"
                      : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
                  }`}
                >
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>

      {inInventario ? (
        <div className="space-y-5">
          <div>
            <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Materia prima
            </p>
            <ul className="space-y-0.5">
              {inventarioFlujo.map((item) => (
                <li key={item.href}>
                  <NavLink
                    href={item.href}
                    label={item.label}
                    active={isActive(pathname, item.href)}
                  />
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Configuración
            </p>
            <ul className="space-y-0.5">
              {inventarioConfig.map((item) => (
                <li key={item.href}>
                  <NavLink
                    href={item.href}
                    label={item.label}
                    active={isActive(pathname, item.prefix)}
                  />
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Operación
            </p>
            <ul className="space-y-0.5">
              {inventarioOperacion.map((item) => (
                <li key={item.href}>
                  <NavLink
                    href={item.href}
                    label={item.label}
                    active={isActive(pathname, item.prefix)}
                  />
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}
    </nav>
  );
}
