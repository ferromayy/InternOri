type Props = {
  title: string;
  description?: string;
};

export function PlaceholderSection({ title, description }: Props) {
  return (
    <div className="rounded-xl border border-dashed border-zinc-300 bg-white p-10 text-center dark:border-zinc-700 dark:bg-zinc-900">
      <h2 className="text-lg font-medium text-zinc-800 dark:text-zinc-100">{title}</h2>
      <p className="mt-2 text-sm text-zinc-500">
        {description ?? "Esta sección se implementará próximamente."}
      </p>
    </div>
  );
}
