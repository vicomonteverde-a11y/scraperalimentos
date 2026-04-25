import { supabase } from "@/lib/supabase";
import Stat from "@/components/Stat";
import EmptyState from "@/components/EmptyState";
import Link from "next/link";

export const revalidate = 60;

async function getStats() {
  const [
    { count: totalEmpresas },
    { count: prioA },
    { count: prioB },
    { count: prioC },
    { count: marcasDormidas },
    { count: plantasFlexibles },
    { count: totalSifega },
    { count: totalMarcas },
  ] = await Promise.all([
    supabase
      .from("empresas")
      .select("id", { count: "exact", head: true })
      .eq("big_player", false),
    supabase
      .from("empresas")
      .select("id", { count: "exact", head: true })
      .eq("prioridad", "A"),
    supabase
      .from("empresas")
      .select("id", { count: "exact", head: true })
      .eq("prioridad", "B"),
    supabase
      .from("empresas")
      .select("id", { count: "exact", head: true })
      .eq("prioridad", "C"),
    supabase
      .from("vw_marcas_dormidas")
      .select("id", { count: "exact", head: true }),
    supabase
      .from("vw_plantas_flexibles")
      .select("id", { count: "exact", head: true }),
    supabase
      .from("establecimientos_sifega")
      .select("id", { count: "exact", head: true }),
    supabase
      .from("marcas_inpi")
      .select("id", { count: "exact", head: true }),
  ]);

  const { data: porPartido } = await supabase
    .from("empresas")
    .select("partido_principal")
    .eq("big_player", false)
    .not("partido_principal", "is", null);

  const partidoMap = new Map<string, number>();
  porPartido?.forEach((r: any) => {
    if (r.partido_principal) {
      partidoMap.set(
        r.partido_principal,
        (partidoMap.get(r.partido_principal) || 0) + 1
      );
    }
  });

  return {
    totalEmpresas: totalEmpresas || 0,
    prioA: prioA || 0,
    prioB: prioB || 0,
    prioC: prioC || 0,
    marcasDormidas: marcasDormidas || 0,
    plantasFlexibles: plantasFlexibles || 0,
    totalSifega: totalSifega || 0,
    totalMarcas: totalMarcas || 0,
    porPartido: Array.from(partidoMap.entries())
      .map(([partido, n]) => ({ partido, n }))
      .sort((a, b) => b.n - a.n),
  };
}

export default async function Home() {
  const s = await getStats();
  const empty = s.totalSifega === 0;

  return (
    <div className="space-y-12">
      {/* Hero / Editorial header */}
      <header className="reveal pt-4">
        <div className="mb-2 text-[10px] uppercase tracking-[0.3em] text-accent">
          · Pipeline de adquisiciones · {new Date().toLocaleDateString("es-AR", {
            day: "2-digit",
            month: "long",
            year: "numeric",
          })}
        </div>
        <h1 className="font-serif text-5xl leading-[1.05] tracking-tight md:text-7xl">
          PyMEs alimenticias.
          <br />
          <span className="italic text-accent">Marcas dormidas.</span>
          <br />
          Corredor noroeste.
        </h1>
        <p className="mt-6 max-w-2xl text-base leading-relaxed text-muted md:text-lg">
          Mapeo cruzado SENASA × ANMAT × INPI sobre los partidos de{" "}
          <span className="text-text">Pilar, Escobar, General Rodríguez y Luján</span>{" "}
          — para identificar empresas con marca propia de trayectoria,
          planta flexible y dueños sin sucesión.
        </p>
      </header>

      {empty ? (
        <EmptyState
          title="Esperando primera carga"
          description="El esquema está listo en Supabase. Cuando corras los scrapers (SIFEGA + INPI) y ejecutes refresh_empresas(), los candidatos aparecen acá automáticamente."
          hint="Setup local: ver README · scrapers/scraper_sifega.py"
        />
      ) : (
        <>
          {/* Top stats grid */}
          <section className="grid grid-cols-2 gap-px bg-border/50 md:grid-cols-4">
            <div className="reveal reveal-1">
              <Stat
                label="Empresas mapeadas"
                value={s.totalEmpresas.toLocaleString("es-AR")}
                hint="excluyendo big players"
              />
            </div>
            <div className="reveal reveal-2">
              <Stat
                label="Prioridad A"
                value={s.prioA}
                hint="score ≥ 80"
                accent
              />
            </div>
            <div className="reveal reveal-3">
              <Stat
                label="Prioridad B"
                value={s.prioB}
                hint="score 50–79"
              />
            </div>
            <div className="reveal reveal-4">
              <Stat
                label="Prioridad C"
                value={s.prioC}
                hint="score 25–49"
              />
            </div>
          </section>

          <section className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <Link href="/marcas-dormidas" className="reveal reveal-1 group block">
              <Stat
                label="Marcas dormidas"
                value={s.marcasDormidas}
                hint="vigentes · titular sin RNE activo"
                accent
              />
            </Link>
            <Link href="/plantas-flexibles" className="reveal reveal-2 group block">
              <Stat
                label="Plantas flexibles"
                value={s.plantasFlexibles}
                hint="multi-rubro · operativas"
              />
            </Link>
            <div className="reveal reveal-3">
              <Stat
                label="Universo base"
                value={`${s.totalSifega} / ${s.totalMarcas}`}
                hint="establecimientos SIFEGA / marcas INPI"
              />
            </div>
          </section>

          {/* Distribución por partido */}
          {s.porPartido.length > 0 && (
            <section className="reveal reveal-5">
              <div className="mb-4 flex items-baseline justify-between">
                <h2 className="font-serif text-2xl">
                  Distribución por partido
                </h2>
                <span className="text-[10px] uppercase tracking-[0.2em] text-muted">
                  empresas en pipeline
                </span>
              </div>
              <div className="space-y-px overflow-hidden rounded-sm border border-border">
                {s.porPartido.map((p, i) => {
                  const max = Math.max(...s.porPartido.map((x) => x.n));
                  const pct = (p.n / max) * 100;
                  return (
                    <div
                      key={p.partido}
                      className="flex items-center gap-4 bg-surface px-5 py-4"
                    >
                      <div className="w-48 truncate font-mono text-xs uppercase tracking-wider text-text">
                        {p.partido}
                      </div>
                      <div className="relative h-6 flex-1 overflow-hidden rounded-sm bg-elevated">
                        <div
                          className="absolute inset-y-0 left-0 bg-gradient-to-r from-accent/80 to-accent/40"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <div className="tabular w-12 text-right font-mono text-sm">
                        {p.n}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}
        </>
      )}

      {/* Tesis recordatoria - editorial */}
      <section className="reveal reveal-6 border-t border-border pt-12">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          <div>
            <div className="mb-3 text-[10px] uppercase tracking-[0.22em] text-accent">
              Tesis
            </div>
            <p className="font-serif text-xl italic leading-snug text-text">
              "Marca propia de trayectoria, planta flexible, dueño sin sucesión.
              Inversión, gestión, escala."
            </p>
          </div>
          <div>
            <div className="mb-3 text-[10px] uppercase tracking-[0.22em] text-accent">
              Rubros
            </div>
            <ul className="space-y-1 font-mono text-xs text-muted">
              <li>· Farináceos · panificados · pastelería</li>
              <li>· Azucarados · golosinas · alfajores</li>
              <li>· Lácteos · postres · dulce de leche</li>
              <li>· Preparaciones culinarias · snacks</li>
              <li>· Vegetales · conservas · mermeladas</li>
            </ul>
          </div>
          <div>
            <div className="mb-3 text-[10px] uppercase tracking-[0.22em] text-accent">
              Estructura
            </div>
            <ul className="space-y-1 font-mono text-xs text-muted">
              <li>· 20–30% cash al cierre</li>
              <li>· 40–50% vendor financing 36–48 m</li>
              <li>· 20–30% earn-out sobre EBITDA</li>
              <li>· Continuidad fundador 12–24 m</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
