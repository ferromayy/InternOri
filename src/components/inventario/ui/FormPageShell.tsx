type FormPageShellProps = {
  /** id del ancla (#formulario) */
  formAnchor?: string;
  header?: React.ReactNode;
  form: React.ReactNode;
  /** Tablas / historial debajo del formulario */
  below?: React.ReactNode;
};

/**
 * En móvil el formulario queda primero; en desktop mantiene el orden natural.
 * Usá id="formulario" y enlazá con ?focus=formulario (se conserva tras el login).
 */
export function FormPageShell({
  formAnchor = "formulario",
  header,
  form,
  below,
}: FormPageShellProps) {
  return (
    <div className="mx-auto max-w-6xl">
      {header ? <div className="mb-6 md:mb-8">{header}</div> : null}
      <div className="flex flex-col gap-6 md:gap-8">
        <section
          id={formAnchor}
          className="scroll-mt-24 order-1 min-w-0 md:order-none"
        >
          {form}
        </section>
        {below ? (
          <div className="order-2 min-w-0 space-y-6 md:order-none md:space-y-8">{below}</div>
        ) : null}
      </div>
    </div>
  );
}
