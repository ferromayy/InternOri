/** Inputs táctiles (≥16px evita zoom en iOS). */
export const inputClass =
  "w-full min-h-[44px] rounded-xl border border-zinc-300 bg-white px-4 py-3 text-base text-zinc-900 outline-none focus:ring-2 focus:ring-amber-500/40 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50";

export const selectClass = inputClass;

export const textareaClass =
  "w-full min-h-[88px] rounded-xl border border-zinc-300 bg-white px-4 py-3 text-base text-zinc-900 outline-none focus:ring-2 focus:ring-amber-500/40 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50";

export const btnPrimary =
  "min-h-[44px] w-full rounded-xl bg-amber-700 px-4 py-3 text-base font-medium text-white transition hover:bg-amber-800 disabled:opacity-60 sm:w-auto sm:min-h-0 sm:py-2.5 sm:text-sm";

export const btnPrimaryDark =
  "min-h-[44px] w-full rounded-xl bg-zinc-900 px-4 py-3 text-base font-medium text-white transition hover:bg-zinc-800 disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 sm:w-auto sm:min-h-0 sm:py-2.5 sm:text-sm";

export const btnSecondary =
  "min-h-[44px] rounded-xl border border-zinc-300 bg-white px-4 py-3 text-base font-medium text-zinc-700 transition hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-200 sm:min-h-0 sm:py-2 sm:text-sm";

export const formCardClass =
  "space-y-5 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:p-6";

/** Barra fija de acción en móvil (padding inferior para safe area). */
export const formStickyFooterClass =
  "sticky bottom-0 -mx-4 mt-6 border-t border-zinc-200 bg-white/95 px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-900/95 md:static md:mx-0 md:mt-0 md:border-0 md:bg-transparent md:p-0 md:pb-0 md:backdrop-blur-none";
