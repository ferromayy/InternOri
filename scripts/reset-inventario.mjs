/**
 * Borra todos los datos de inventario (café verde, tostado, packaging, producción, ventas).
 * No modifica el esquema ni health_check.
 *
 * Uso: node scripts/reset-inventario.mjs
 * Requiere NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY en .env.local
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve } from "path";

function loadEnv() {
  const path = resolve(process.cwd(), ".env.local");
  const raw = readFileSync(path, "utf8");
  for (const line of raw.split("\n")) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (!m) continue;
    const key = m[1].trim();
    let val = m[2].trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = val;
  }
}

loadEnv();

const appEnv = (process.env.NEXT_PUBLIC_APP_ENV || process.env.APP_ENV || "").trim().toLowerCase();
if (appEnv === "production") {
  console.error("Reset bloqueado: NEXT_PUBLIC_APP_ENV=production.");
  console.error("Usá el proyecto Supabase de DEV y NEXT_PUBLIC_APP_ENV=development en .env.local");
  process.exit(1);
}

if (process.env.INVENTARIO_RESET_ALLOWED !== "true") {
  console.error("Reset bloqueado: agregá INVENTARIO_RESET_ALLOWED=true en .env.local (solo entorno dev).");
  process.exit(1);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.error("Faltan NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_ANON_KEY en .env.local");
  process.exit(1);
}

const supabase = createClient(url, key);

async function deleteAll(table) {
  const { data: rows, error: selectError } = await supabase.from(table).select("id");
  if (selectError) throw new Error(`${table}: ${selectError.message}`);
  if (!rows?.length) return 0;

  let deleted = 0;
  for (const row of rows) {
    const { error, count } = await supabase.from(table).delete({ count: "exact" }).eq("id", row.id);
    if (error) throw new Error(`${table}: ${error.message}`);
    deleted += count ?? 0;
  }

  const { count: remaining } = await supabase
    .from(table)
    .select("id", { count: "exact", head: true });
  if ((remaining ?? 0) > 0) {
    throw new Error(
      `${table}: quedaron ${remaining} fila(s). Ejecutá supabase/scripts/reset-inventario-completo.sql en el SQL Editor.`,
    );
  }
  return deleted;
}

async function main() {
  console.log("Reseteando inventario en Supabase…\n");

  const steps = [
    ["producto_terminado_produccion_consumo", () => deleteAll("producto_terminado_produccion_consumo")],
    ["producto_terminado_produccion", () => deleteAll("producto_terminado_produccion")],
    ["producto_terminado_venta", () => deleteAll("producto_terminado_venta")],
    ["packaging_componente_ingreso", () => deleteAll("packaging_componente_ingreso")],
    ["packaging_requisito", () => deleteAll("packaging_requisito")],
    ["packaging_componente", () => deleteAll("packaging_componente")],
    ["cafe_tostado", () => deleteAll("cafe_tostado")],
    ["cafe_verde_formatos_venta", () => deleteAll("cafe_verde_formatos_venta")],
    ["cafe_verde", () => deleteAll("cafe_verde")],
  ];

  for (const [name, fn] of steps) {
    try {
      const n = await fn();
      console.log(`  ${name}: ${n} fila(s) eliminada(s)`);
    } catch (e) {
      if (e.message.includes("does not exist") || e.message.includes("schema cache")) {
        console.log(`  ${name}: (tabla no existe — omitida)`);
      } else {
        throw e;
      }
    }
  }

  console.log("\nListo. Inventario vacío. Podés cargar datos reales desde cero.");
}

main().catch((e) => {
  console.error("\nError:", e.message);
  console.error(
    "\nSi falla por RLS o permisos, ejecutá supabase/scripts/reset-inventario.sql en el SQL Editor de Supabase.",
  );
  process.exit(1);
});
