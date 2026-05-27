/**
 * Valida variables de entorno mínimas.
 * Uso: npm run env:check
 */

import { readFileSync, existsSync } from "fs";
import { resolve } from "path";

function loadEnvFile(filename) {
  const path = resolve(process.cwd(), filename);
  if (!existsSync(path)) return;
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

loadEnvFile(".env.local");
loadEnvFile(".env");

const required = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "AUTH_USERNAME",
  "AUTH_PASSWORD",
  "AUTH_SECRET",
];

const missing = required.filter((k) => !process.env[k]?.trim());

if (missing.length) {
  console.error("Faltan variables en .env.local:\n  - " + missing.join("\n  - "));
  console.error("\nCopiá .env.example y completá los valores (proyecto DEV).");
  process.exit(1);
}

const appEnv = process.env.NEXT_PUBLIC_APP_ENV?.trim().toLowerCase();
if (appEnv && appEnv !== "development" && appEnv !== "production") {
  console.error('NEXT_PUBLIC_APP_ENV debe ser "development" o "production".');
  process.exit(1);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
if (!url.includes(".supabase.co")) {
  console.warn("⚠️  NEXT_PUBLIC_SUPABASE_URL no parece una URL de Supabase.");
}

console.log("Variables OK.");
console.log(`  Entorno: ${appEnv || "(no definido; local usará development por NODE_ENV)"}`);
console.log(`  Supabase: ${url}`);

if (appEnv === "production" && process.env.INVENTARIO_RESET_ALLOWED === "true") {
  console.warn("\n⚠️  INVENTARIO_RESET_ALLOWED=true en producción — quitá esa variable en Vercel prod.");
}
