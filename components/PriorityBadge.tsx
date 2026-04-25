export default function PriorityBadge({
  priority,
}: {
  priority: "A" | "B" | "C" | null | undefined;
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
  } as const;
  return (
    <span
      className={[
        "inline-flex h-5 w-5 items-center justify-center rounded-full border font-mono text-[11px] font-medium tabular",
        styles[priority],
      ].join(" ")}
    >
      {priority}
    </span>
  );
}
