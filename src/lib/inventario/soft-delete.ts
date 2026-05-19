/** Filtro Supabase: solo filas no eliminadas (borrado lógico). */
export const SOLO_ACTIVOS = { deleted_at: null } as const;

export function isActiveRow(row: { deleted_at?: string | null }): boolean {
  return row.deleted_at == null;
}
