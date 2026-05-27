import { getAppEnvLabel, isDevelopmentEnv } from "@/lib/app-env";

export function EnvBanner() {
  if (!isDevelopmentEnv()) return null;

  return (
    <div
      className="border-b border-amber-300 bg-amber-100 px-4 py-2 text-center text-sm font-medium text-amber-950 dark:border-amber-800 dark:bg-amber-950/60 dark:text-amber-100"
      role="status"
    >
      Entorno de {getAppEnvLabel()} — los datos acá no son producción.
    </div>
  );
}
