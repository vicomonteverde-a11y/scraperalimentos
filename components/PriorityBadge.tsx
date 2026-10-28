export default function PriorityBadge({
  priority,
}: {
  priority: "A" | "B" | "X" | "C" | null | undefined;
}) {
  if (!priority) {
    return (
      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-border text-[10px] text-muted">
        —
      </span>
    );
  }
  const styles = {
    A: "bg-accent text-bg border-accent",
    B: "bg-accent/20 text-accent border-accent/40",
    C: "bg-transparent text-muted border-border",
    X: "bg-transparent text-muted/60 border-border line-through",
  } as const;
  return (
    <span
      title={{ A: "Llamar", B: "Revisar", C: "Baja", X: "Descartada" }[priority]}
      className={[
        "inline-flex h-5 w-5 items-center justify-center rounded-full border font-mono text-[11px] font-medium tabular",
        styles[priority],
      ].join(" ")}
    >
      {priority}
    </span>
  );
}
