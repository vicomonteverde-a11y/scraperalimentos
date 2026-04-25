export default function EmptyState({
  title,
  description,
  hint,
}: {
  title: string;
  description: string;
  hint?: string;
}) {
  return (
    <div className="rounded-sm border border-dashed border-border bg-surface/50 p-12 text-center">
      <div className="mx-auto mb-6 h-px w-16 bg-accent/40" />
      <h3 className="mb-2 font-serif text-2xl text-text">{title}</h3>
      <p className="mx-auto max-w-md text-sm text-muted">{description}</p>
      {hint && (
        <p className="mx-auto mt-4 max-w-md text-xs italic text-muted/70">
          {hint}
        </p>
      )}
    </div>
  );
}
