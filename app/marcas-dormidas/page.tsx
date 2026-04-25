import { supabase, type MarcaDormida } from "@/lib/supabase";
import EmptyState from "@/components/EmptyState";

export const revalidate = 60;

async function getMarcas() {
  const { data } = await supabase
    .from("vw_marcas_dormidas")
    .select("*")
    .order("anios_marca", { ascending: false })
    .limit(200);
  return (data ?? []) as MarcaDormida[];
}

export default async function Page() {
  const marcas = await getMarcas();

  return (
    <div className="space-y-8">
      <header className="reveal">
        <div className="mb-2 text-[10px] uppercase tracking-[0.3em] text-accent">
          · Caso premium · {marcas.length} marcas detectadas
        </div>
        <h1 className="font-serif text-4xl md:text-5xl">
          Marcas <span className="italic text-accent">dormidas</span>
        </h1>
        <p className="mt-3 max-w-2xl text-muted">
          Marcas con registro INPI vigente, con 20+ años de antigüedad, cuyo
          titular tiene RNE dado de baja o no vigente. Memoria de consumidor +
          IP protegida + planta libre = relanzamiento.
        </p>
      </header>

      {marcas.length === 0 ? (
        <EmptyState
          title="Aún no hay marcas dormidas detectadas"
          description="Esta vista cruza marcas vigentes (INPI) en clases 29/30/32 con titulares que ya no tienen establecimiento activo (SIFEGA). Cuando corran ambos scrapers vas a ver los hits acá."
          hint="Es la categoría con mayor asymmetric payoff de la tesis."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {marcas.map((m, i) => (
            <article
              key={m.id}
              className="reveal group relative overflow-hidden rounded-sm border border-border bg-surface p-6 transition-colors hover:border-accent/40"
              style={{ animationDelay: `${Math.min(i * 40, 600)}ms` }}
            >
              <div className="mb-2 flex items-baseline justify-between gap-2">
                <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted">
                  Clase {m.clase} · {m.partido_principal || "—"}
                </div>
                <div className="tabular font-mono text-xs text-accent">
                  {m.anios_marca || "?"} años
                </div>
              </div>
              <h3 className="font-serif text-3xl leading-none">{m.marca}</h3>
              {m.titular_nombre && (
                <p className="mt-3 text-xs text-muted">
                  <span className="uppercase tracking-wider">Titular</span>{" "}
                  · {m.titular_nombre}
                </p>
              )}
              {m.domicilio_principal && (
                <p className="mt-1 font-mono text-[11px] text-muted">
                  {m.domicilio_principal}
                </p>
              )}
              {m.rubros_historicos && (
                <div className="mt-4 border-t border-border pt-4">
                  <div className="mb-1 text-[10px] uppercase tracking-[0.2em] text-muted">
                    Rubro histórico
                  </div>
                  <div className="text-xs text-text">{m.rubros_historicos}</div>
                </div>
              )}
              <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-accent/30 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
