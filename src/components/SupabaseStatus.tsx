"use client";

import { useEffect, useState } from "react";

type HealthResponse = {
  ok: boolean;
  supabase?: { connected: boolean };
  row?: { id: number; message: string } | null;
  error?: string;
  hint?: string | null;
};

export function SupabaseStatus() {
  const [status, setStatus] = useState<HealthResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/health")
      .then((res) => res.json())
      .then((data: HealthResponse) => {
        setStatus(data);
        setLoading(false);
      })
      .catch(() => {
        setStatus({ ok: false, error: "No se pudo contactar al API" });
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <p className="text-sm text-zinc-500" role="status">
        Comprobando conexión con Supabase…
      </p>
    );
  }

  if (!status?.ok) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
        <p className="font-medium">Sin conexión</p>
        <p className="mt-1">{status?.error}</p>
        {status?.hint ? <p className="mt-1 opacity-80">{status.hint}</p> : null}
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-100">
      <p className="font-medium">Supabase conectado</p>
      <p className="mt-1">{status.row?.message ?? "Tabla health_check respondió."}</p>
    </div>
  );
}
