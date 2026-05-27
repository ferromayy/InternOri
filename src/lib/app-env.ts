export type AppEnv = "development" | "production";

/** Entorno lógico de la app (dev vs prod). Configurar en Vercel por rama. */
export function getAppEnv(): AppEnv {
  const explicit = process.env.NEXT_PUBLIC_APP_ENV?.trim().toLowerCase();
  if (explicit === "production" || explicit === "development") {
    return explicit;
  }
  if (process.env.NODE_ENV === "development") {
    return "development";
  }
  return "production";
}

export function isDevelopmentEnv(): boolean {
  return getAppEnv() === "development";
}

export function getAppEnvLabel(): string {
  return getAppEnv() === "development" ? "Desarrollo" : "Producción";
}
