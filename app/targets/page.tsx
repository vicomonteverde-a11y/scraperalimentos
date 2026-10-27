import PriorityBadge from "@/components/PriorityBadge";
import EmptyState from "@/components/EmptyState";
import Link from "next/link";
import { empresas, situacionBCRA, ZONAS } from "@/lib/data";

type SP = { zona?: string; prioridad?: string; fuente?: string };

export default function Page({ searchParams }: { searchParams: SP }) {
  let targets = empresas();
  if (searchParams.zona) targets = targets.filter((t) => t.zona === searchParams.zona);
  if (searchParams.prioridad) targets = targets.filter((t) => t.prioridad === searchParams.prioridad);
  else targets = targets.filter((t) => t.prioridad !== "X");
  if (searchParams.fuente === "planta") targets = targets.filter((t) => t.fuente.startsWith("SIFEGA"));

  return (
    <div className="space-y-8">
      <header className="reveal">
        <div className="mb-2 text-[10px] uppercase tracking-[0.3em] text-accent">
          · Pipeline · {targets.length} candidatos
        </div>
        <h1 className="font-serif text-4xl md:text-5xl">Top Targets</h1>
        <p className="mt-3 max-w-2xl text-muted">
          Ordenadas por prioridad y score de sucesión. El score prioriza llamados; si hay sucesor lo
          confirma el contador, el banco o el proveedor.
        </p>
      </header>

      <div className="reveal reveal-1 space-y-3 border-y border-border py-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="mr-2 w-16 text-[10px] uppercase tracking-[0.22em] text-muted">Zona</span>
          <FilterLink sp={searchParams} param="zona" value={undefined}>todas</FilterLink>
          {ZONAS.map((z) => (
            <FilterLink key={z} sp={searchParams} param="zona" value={z}>
              {z.toLowerCase()}
            </FilterLink>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="mr-2 w-16 text-[10px] uppercase tracking-[0.22em] text-muted">Prioridad</span>
          <FilterLink sp={searchParams} param="prioridad" value={undefined}>a + b</FilterLink>
          <FilterLink sp={searchParams} param="prioridad" value="A">A · llamar</FilterLink>
          <FilterLink sp={searchParams} param="prioridad" value="B">B · revisar</FilterLink>
          <FilterLink sp={searchParams} param="prioridad" value="X">X · descartadas</FilterLink>
          <span className="ml-6 mr-2 text-[10px] uppercase tracking-[0.22em] text-muted">Fuente</span>
          <FilterLink sp={searchParams} param="fuente" value={undefined}>todas</FilterLink>
          <FilterLink sp={searchParams} param="fuente" value="planta">planta confirmada</FilterLink>
        </div>
      </div>

      {targets.length === 0 ? (
        <EmptyState title="Sin candidatos con este filtro" description="Probá con otra zona o prioridad." />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-separate border-spacing-0">
            <thead>
              <tr className="text-left text-[10px] uppercase tracking-[0.2em] text-muted">
                <th className="border-b border-border pb-3 pr-4">P</th>
                <th className="border-b border-border pb-3 pr-4">Empresa</th>
                <th className="border-b border-border pb-3 pr-4">Zona</th>
                <th className="border-b border-border pb-3 pr-4">Origen</th>
                <th className="border-b border-border pb-3 pr-4">Señales</th>
                <th className="border-b border-border pb-3 pr-4">BCRA · LinkedIn</th>
                <th className="border-b border-border pb-3 pr-4 text-right">Score</th>
              </tr>
            </thead>
            <tbody>
              {targets.map((t, i) => (
                <tr key={t.id} className="row-hover reveal" style={{ animationDelay: `${Math.min(i * 20, 500)}ms` }}>
                  <td className="border-b border-border/50 py-4 pr-4">
                    <PriorityBadge priority={t.prioridad} />
                  </td>
                  <td className="border-b border-border/50 py-4 pr-4">
                    <Link href={`/empresa/${t.id}`} className="editorial-link block">
                      <div className="font-medium">{t.razon_social}</div>
                      {t.resena && (
                        <div className="mt-1 max-w-md text-xs leading-snug text-muted">
                          {t.resena.length > 140 ? t.resena.slice(0, 140) + "…" : t.resena}
                        </div>
                      )}
                      <div className="font-mono text-[11px] text-muted">
                        {t.cuit ?? "sin CUIT"}
                        {t.presidente && <span className="ml-2 text-accent/80">· {t.presidente}</span>}
                      </div>
                    </Link>
                  </td>
                  <td className="border-b border-border/50 py-4 pr-4">
                    <div className="font-mono text-xs uppercase">{t.partidos.join(" / ")}</div>
                    <div className="text-[10px] uppercase tracking-wider text-muted">
                      {t.zona} · {t.km_pilar ?? "?"} km
                    </div>
                  </td>
                  <td className="tabular border-b border-border/50 py-4 pr-4 font-mono text-sm">
                    {t.anio_origen ?? "—"}
                  </td>
                  <td className="border-b border-border/50 py-4 pr-4">
                    <div className="flex flex-wrap gap-1">
                      {t.senales.map((s) => (
                        <Pill key={s} highlight={s.startsWith("familia") || s.startsWith("autoridad")}>
                          {s}
                        </Pill>
                      ))}
                      {!t.fuente.startsWith("SIFEGA") && <Pill subtle>sin planta confirmada</Pill>}
                    </div>
                  </td>
                  <td className="border-b border-border/50 py-4 pr-4 font-mono text-[11px] text-muted">
                    {situacionBCRA(t)}
                    <div className="mt-1">
                      <a
                        href={t.linkedin ?? t.linkedin_busqueda}
                        target="_blank"
                        rel="noreferrer"
                        className="text-accent/80 hover:text-accent"
                      >
                        {t.linkedin ? "LinkedIn ↗" : "buscar en LinkedIn ↗"}
                      </a>
                    </div>
                  </td>
                  <td className="tabular border-b border-border/50 py-4 pr-4 text-right font-mono text-lg">
                    {t.score}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function FilterLink({
  sp,
  param,
  value,
  children,
}: {
  sp: SP;
  param: keyof SP;
  value: string | undefined;
  children: React.ReactNode;
}) {
  const active = (sp[param] || "") === (value || "");
  const next = new URLSearchParams();
  Object.entries({ ...sp, [param]: value }).forEach(([k, v]) => v && next.set(k, v));
  const qs = next.toString();
  return (
    <Link
      href={qs ? `?${qs}` : "?"}
      className={[
        "rounded-sm px-2 py-1 font-mono text-[11px] uppercase tracking-wider transition-colors",
        active
          ? "bg-accent text-bg"
          : "border border-border bg-surface text-muted hover:border-accent/40 hover:text-text",
      ].join(" ")}
    >
      {children}
    </Link>
  );
}

function Pill({ children, highlight, subtle }: { children: React.ReactNode; highlight?: boolean; subtle?: boolean }) {
  return (
    <span
      className={[
        "inline-block rounded-sm border px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider",
        highlight
          ? "border-accent/60 bg-accent/10 text-accent"
          : subtle
          ? "border-border text-muted"
          : "border-border bg-elevated text-text",
      ].join(" ")}
    >
      {children}
    </span>
  );
}
