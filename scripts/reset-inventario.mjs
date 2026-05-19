/**
 * Borra todos los datos de inventario (café verde, tostado, packaging).
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

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.error("Faltan NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_ANON_KEY en .env.local");
  process.exit(1);
}

const supabase = createClient(url, key);

async function deleteAll(table) {
  const { error, count } = await supabase.from(table).delete({ count: "exact" }).neq("id", "00000000-0000-0000-0000-000000000000");
  if (error) throw new Error(`${table}: ${error.message}`);
  return count ?? 0;
}

async function main() {
  console.log("Reseteando inventario en Supabase…\n");

  const steps = [
    ["packaging_requisito", () => deleteAll("packaging_requisito")],
    ["packaging_componente", () => deleteAll("packaging_componente")],
    ["cafe_tostado", () => deleteAll("cafe_tostado")],
    ["cafe_verde_formatos_venta", () => deleteAll("cafe_verde_formatos_venta")],
    ["cafe_verde", () => deleteAll("cafe_verde")],
  ];

  for (const [name, fn] of steps) {
    const n = await fn();
    console.log(`  ${name}: ${n} fila(s) eliminada(s)`);
  }

  console.log("\nListo. Inventario vacío (formatos de venta se borran en cascada con café verde).");
}

main().catch((e) => {
  console.error("\nError:", e.message);
  console.error("\nSi falla por RLS, ejecutá supabase/scripts/reset-inventario.sql en el SQL Editor de Supabase.");
  process.exit(1);
});
