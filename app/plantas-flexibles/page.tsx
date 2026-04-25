import { supabase, type PlantaFlexible } from "@/lib/supabase";
import EmptyState from "@/components/EmptyState";
import Link from "next/link";

export const revalidate = 60;

async function getPlantas() {
  const { data } = await supabase
    .from("vw_plantas_flexibles")
    .select("*")
    .order("cantidad_rubros", { ascending: false })
    .limit(200);
  return (data ?? []) as PlantaFlexible[];
}

export default async function Page() {
  const plantas = await getPlantas();

  return (
    <div className="space-y-8">
      <header className="reveal">
        <div className="mb-2 text-[10px] uppercase tracking-[0.3em] text-accent">
          · Capacidad industrial · {plantas.length} plantas
        </div>
        <h1 className="font-serif text-4xl md:text-5xl">Plantas Flexibles</h1>
        <p className="mt-3 max-w-2xl text-muted">
          Establecimientos con RNE vigente y habilitación en 2+ rubros. Permiten
          fasón simultáneo + relanzamiento de marca propia. La capacidad ociosa
          financia la transición.
        </p>
      </header>

      {plantas.length === 0 ? (
        <EmptyState
          title="Sin plantas detectadas"
          description="Cuando los scrapers carguen los datos de SIFEGA y se ejecute refresh_empresas(), las plantas multi-rubro del corredor van a aparecer acá."
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-separate border-spacing-0">
            <thead>
              <tr className="text-left text-[10px] uppercase tracking-[0.2em] text-muted">
                <th className="border-b border-border pb-3 pr-4">Empresa</th>
                <th className="border-b border-border pb-3 pr-4">Partido</th>
                <th className="border-b border-border pb-3 pr-4 text-right">
                  Rubros
                </th>
                <th className="border-b border-border pb-3 pr-4">Detalle</th>
                <th className="border-b border-border pb-3 pr-4">Frío</th>
                <th className="border-b border-border pb-3 pr-4 text-right">
                  Marcas
                </th>
                <th className="border-b border-border pb-3 pr-4 text-right">
                  Score
                </th>
              </tr>
            </thead>
            <tbody>
              {plantas.map((p, i) => (
                <tr
                  key={p.id}
                  className="row-hover reveal"
                  style={{ animationDelay: `${Math.min(i * 30, 600)}ms` }}
                >
                  <td className="border-b border-border/50 py-4 pr-4">
                    <Link
                      href={`/empresa/${p.id}`}
                      className="editorial-link"
                    >
                      <div className="font-medium">
                        {p.razon_social || "(sin nombre)"}
                      </div>
                      <div className="font-mono text-[11px] text-muted">
                        {p.cuit}
                      </div>
                    </Link>
                  </td>
                  <td className="border-b border-border/50 py-4 pr-4 font-mono text-xs uppercase">
                    {p.partido_principal || "—"}
                  </td>
                  <td className="tabular border-b border-border/50 py-4 pr-4 text-right font-mono text-xl text-accent">
                    {p.cantidad_rubros}
                  </td>
                  <td className="border-b border-border/50 py-4 pr-4 max-w-[300px] text-xs text-muted">
                    <div className="truncate" title={p.rubros || ""}>
                      {p.rubros}
                    </div>
                  </td>
                  <td className="border-b border-border/50 py-4 pr-4 font-mono text-[10px] uppercase">
                    {p.condiciones || "—"}
                  </td>
                  <td className="tabular border-b border-border/50 py-4 pr-4 text-right font-mono">
                    {p.cantidad_marcas_vigentes}
                  </td>
                  <td className="tabular border-b border-border/50 py-4 pr-4 text-right font-mono">
                    {p.score_target}
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
