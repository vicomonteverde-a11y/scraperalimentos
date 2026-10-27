import EmptyState from "@/components/EmptyState";
import PriorityBadge from "@/components/PriorityBadge";
import Link from "next/link";
import { empresas } from "@/lib/data";

export default function Page() {
  const plantas = empresas()
    .filter((e) => e.prioridad !== "X" && e.rubros_sifega >= 3)
    .sort((a, b) => b.rubros_sifega - a.rubros_sifega || (b.score ?? 0) - (a.score ?? 0));

  return (
    <div className="space-y-8">
      <header className="reveal">
        <div className="mb-2 text-[10px] uppercase tracking-[0.3em] text-accent">
          · Capacidad industrial · {plantas.length} plantas
        </div>
        <h1 className="font-serif text-4xl md:text-5xl">Plantas Flexibles</h1>
        <p className="mt-3 max-w-2xl text-muted">
          Candidatos con planta habilitada en 3 o más rubros SIFEGA. Permiten fasón y relanzamiento de
          marca en paralelo: la capacidad ociosa financia la transición.
        </p>
      </header>

      {plantas.length === 0 ? (
        <EmptyState title="Sin plantas multi-rubro en la lista" description="Corré el pipeline para ampliar el universo." />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-separate border-spacing-0">
            <thead>
              <tr className="text-left text-[10px] uppercase tracking-[0.2em] text-muted">
                <th className="border-b border-border pb-3 pr-4">P</th>
                <th className="border-b border-border pb-3 pr-4">Empresa</th>
                <th className="border-b border-border pb-3 pr-4">Partido</th>
                <th className="border-b border-border pb-3 pr-4 text-right">Rubros</th>
                <th className="border-b border-border pb-3 pr-4 text-right">Score</th>
              </tr>
            </thead>
            <tbody>
              {plantas.map((p) => (
                <tr key={p.id} className="row-hover">
                  <td className="border-b border-border/50 py-4 pr-4">
                    <PriorityBadge priority={p.prioridad} />
                  </td>
                  <td className="border-b border-border/50 py-4 pr-4">
                    <Link href={`/empresa/${p.id}`} className="editorial-link font-medium">
                      {p.razon_social}
                    </Link>
                  </td>
                  <td className="border-b border-border/50 py-4 pr-4 font-mono text-xs uppercase">
                    {p.partidos.join(" / ")}
                  </td>
                  <td className="tabular border-b border-border/50 py-4 pr-4 text-right font-mono text-lg text-accent">
                    {p.rubros_sifega}
                  </td>
                  <td className="tabular border-b border-border/50 py-4 pr-4 text-right font-mono">{p.score}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
