import { supabase, type TopTarget } from "@/lib/supabase";
import PriorityBadge from "@/components/PriorityBadge";
import EmptyState from "@/components/EmptyState";
import Link from "next/link";

export const revalidate = 60;

const PARTIDOS = [
  "PILAR",
  "ESCOBAR",
  "GENERAL RODRIGUEZ",
  "LUJAN",
  "MORENO",
  "MARCOS PAZ",
  "MERCEDES",
  "EXALTACION DE LA CRUZ",
];

async function getTargets(partido?: string, prioridad?: string) {
  let q = supabase
    .from("vw_top_targets")
    .select("*")
    .order("score_target", { ascending: false })
    .limit(200);
  if (partido) q = q.eq("partido_principal", partido);
  if (prioridad) q = q.eq("prioridad", prioridad);
  const { data } = await q;
  return (data ?? []) as TopTarget[];
}

export default async function Page({
  searchParams,
}: {
  searchParams: { partido?: string; prioridad?: string };
}) {
  const targets = await getTargets(searchParams.partido, searchParams.prioridad);

  return (
    <div className="space-y-8">
      <header className="reveal">
        <div className="mb-2 text-[10px] uppercase tracking-[0.3em] text-accent">
          · Pipeline · {targets.length} candidatos
        </div>
        <h1 className="font-serif text-4xl md:text-5xl">Top Targets</h1>
        <p className="mt-3 max-w-2xl text-muted">
          Empresas ordenadas por score de adquisición. Mayor score = mejor match
          contra la tesis (marca antigua, planta flexible, distress, etc.).
        </p>
      </header>

      {/* Filtros */}
      <div className="reveal reveal-1 flex flex-wrap items-center gap-2 border-y border-border py-4">
        <span className="mr-2 text-[10px] uppercase tracking-[0.22em] text-muted">
          Partido
        </span>
        <FilterLink param="partido" value={undefined} current={searchParams.partido}>
          todos
        </FilterLink>
        {PARTIDOS.map((p) => (
          <FilterLink
            key={p}
            param="partido"
            value={p}
            current={searchParams.partido}
          >
            {p.toLowerCase()}
          </FilterLink>
        ))}
        <div className="ml-auto flex items-center gap-2">
          <span className="mr-2 text-[10px] uppercase tracking-[0.22em] text-muted">
            Prioridad
          </span>
          <FilterLink
            param="prioridad"
            value={undefined}
            current={searchParams.prioridad}
          >
            todas
          </FilterLink>
          {["A", "B", "C"].map((p) => (
            <FilterLink
              key={p}
              param="prioridad"
              value={p}
              current={searchParams.prioridad}
            >
              {p}
            </FilterLink>
          ))}
        </div>
      </div>

      {targets.length === 0 ? (
        <EmptyState
          title="Sin candidatos todavía"
          description="Cuando corras los scrapers y ejecutes refresh_empresas() en Supabase, los candidatos van a aparecer acá."
          hint="Asegurate de que las empresas tengan partido asignado y score ≥ 50."
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-separate border-spacing-0">
            <thead>
              <tr className="text-left text-[10px] uppercase tracking-[0.2em] text-muted">
                <th className="border-b border-border pb-3 pr-4">P</th>
                <th className="border-b border-border pb-3 pr-4">Empresa</th>
                <th className="border-b border-border pb-3 pr-4">Partido</th>
                <th className="border-b border-border pb-3 pr-4">Marcas</th>
                <th className="border-b border-border pb-3 pr-4">Señales</th>
                <th className="border-b border-border pb-3 pr-4 text-right">
                  Score
                </th>
                <th className="border-b border-border pb-3 pr-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {targets.map((t, i) => (
                <tr
                  key={t.id}
                  className="row-hover reveal"
                  style={{ animationDelay: `${Math.min(i * 30, 600)}ms` }}
                >
                  <td className="border-b border-border/50 py-4 pr-4">
                    <PriorityBadge priority={t.prioridad} />
                  </td>
                  <td className="border-b border-border/50 py-4 pr-4">
                    <Link
                      href={`/empresa/${t.id}`}
                      className="editorial-link block"
                    >
                      <div className="font-medium">
                        {t.razon_social || t.nombre_fantasia || "(sin nombre)"}
                      </div>
                      <div className="font-mono text-[11px] text-muted">
                        {t.cuit}
                        {t.marcas_vigentes && (
                          <span className="ml-2 text-accent/80">
                            · {t.marcas_vigentes.split(",").slice(0, 2).join(",")}
                            {t.marcas_vigentes.split(",").length > 2 && "…"}
                          </span>
                        )}
                      </div>
                    </Link>
                  </td>
                  <td className="border-b border-border/50 py-4 pr-4 font-mono text-xs uppercase">
                    {t.partido_principal || "—"}
                  </td>
                  <td className="border-b border-border/50 py-4 pr-4">
                    <div className="tabular font-mono text-sm">
                      <span className="text-success">{t.cantidad_marcas_vigentes}</span>
                      <span className="mx-1 text-muted">/</span>
                      <span className="text-muted">{t.cantidad_marcas_caducas}</span>
                    </div>
                    <div className="text-[10px] uppercase tracking-wider text-muted">
                      vig / cad
                    </div>
                  </td>
                  <td className="border-b border-border/50 py-4 pr-4">
                    <div className="flex flex-wrap gap-1">
                      {t.marca_antigua && <Pill>marca 20+</Pill>}
                      {t.multi_rubro && <Pill>multi-rubro</Pill>}
                      {t.rne_dado_baja && t.cantidad_marcas_vigentes > 0 && (
                        <Pill highlight>marca dormida</Pill>
                      )}
                      {t.rne_vigente && <Pill subtle>operativa</Pill>}
                    </div>
                  </td>
                  <td className="tabular border-b border-border/50 py-4 pr-4 text-right font-mono text-lg">
                    {t.score_target}
                  </td>
                  <td className="border-b border-border/50 py-4 pr-4">
                    <span className="rounded-sm border border-border bg-elevated px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-muted">
                      {t.status}
                    </span>
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
  param,
  value,
  current,
  children,
}: {
  param: string;
  value: string | undefined;
  current: string | undefined;
  children: React.ReactNode;
}) {
  const active = (current || "") === (value || "");
  const href = value ? `?${param}=${encodeURIComponent(value)}` : `?`;
  return (
    <Link
      href={href}
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

function Pill({
  children,
  highlight,
  subtle,
}: {
  children: React.ReactNode;
  highlight?: boolean;
  subtle?: boolean;
}) {
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
