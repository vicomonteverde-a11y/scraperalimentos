type Props = {
  label: string;
  value: number | string;
  hint?: string;
  accent?: boolean;
  className?: string;
};

export default function Stat({ label, value, hint, accent, className }: Props) {
  return (
    <div
      className={[
        "group relative overflow-hidden rounded-sm border border-border bg-surface p-6",
        "transition-colors hover:border-accent/40",
        className || "",
      ].join(" ")}
    >
      <div className="mb-3 text-[10px] uppercase tracking-[0.22em] text-muted">
        {label}
      </div>
      <div
        className={[
          "tabular font-serif text-5xl leading-none md:text-6xl",
          accent ? "text-accent" : "text-text",
        ].join(" ")}
      >
        {value}
      </div>
      {hint && (
        <div className="mt-3 text-xs text-muted">{hint}</div>
      )}
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-accent/20 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
    </div>
  );
}
