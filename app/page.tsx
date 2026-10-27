import Stat from "@/components/Stat";
import Link from "next/link";
import { empresas, meta, ZONAS } from "@/lib/data";

export default function Home() {
  const all = empresas();
  const { universo, generado } = meta();
  const vivas = all.filter((e) => e.prioridad !== "X");
  const a = all.filter((e) => e.prioridad === "A");
  const b = all.filter((e) => e.prioridad === "B");
  const familia = vivas.filter((e) => e.familia_historica > 0 && e.nueva_generacion === 0).length;
  const flexibles = vivas.filter((e) => e.rubros_sifega >= 3).length;

  const porZona = ZONAS.map((z) => ({
    zona: z,
    a: a.filter((e) => e.zona === z).length,
    b: b.filter((e) => e.zona === z).length,
  })).filter((r) => r.a + r.b > 0);
  const max = Math.max(...porZona.map((r) => r.a + r.b), 1);

  return (
    <div className="space-y-12">
      <header className="reveal pt-4">
        <div className="mb-2 text-[10px] uppercase tracking-[0.3em] text-accent">
          · Originación por sucesión · corrida {new Date(generado + "T12:00:00").toLocaleDateString("es-AR", {
            day: "2-digit",
            month: "long",
            year: "numeric",
          })}
        </div>
        <h1 className="font-serif text-5xl leading-[1.05] tracking-tight md:text-7xl">
          PyMEs alimenticias.
          <br />
          <span className="italic text-accent">Dueños sin sucesión.</span>
          <br />
          CABA, GBA y 200 km.
        </h1>
        <p className="mt-6 max-w-2xl text-base leading-relaxed text-muted md:text-lg">
          Plantas elaboradoras de SIFEGA y sociedades del Boletín Oficial cruzadas con su historia
          societaria y la Central de Deudores del BCRA, para encontrar empresas con{" "}
          <span className="text-text">conducción de larga data, familia fundadora sin recambio</span>{" "}
          y espacio para entrar con un management propio.
        </p>
      </header>

      <section className="grid grid-cols-2 gap-px bg-border/50 md:grid-cols-4">
        <div className="reveal reveal-1">
          <Stat label="Para llamar" value={a.length} hint="prioridad A" accent />
        </div>
        <div className="reveal reveal-2">
          <Stat label="Para revisar" value={b.length} hint="prioridad B" />
        </div>
        <div className="reveal reveal-3">
          <Stat label="Familia sin recambio" value={familia} hint="fundadores en el directorio, sin nueva generación" />
        </div>
        <div className="reveal reveal-4">
          <Stat label="Plantas flexibles" value={flexibles} hint="3+ rubros SIFEGA" />
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="reveal reveal-1">
          <Stat
            label="Universo SIFEGA"
            value={universo.establecimientos_sifega.toLocaleString("es-AR")}
            hint="establecimientos elaboradores de Buenos Aires"
          />
        </div>
        <div className="reveal reveal-2">
          <Stat
            label="Sociedades en zona"
            value={(universo.sociedades_gba_interior + universo.sociedades_caba).toLocaleString("es-AR")}
            hint={`${universo.sociedades_gba_interior.toLocaleString("es-AR")} GBA e interior · ${universo.sociedades_caba} CABA`}
          />
        </div>
        <div className="reveal reveal-3">
          <Stat
            label="Con historia societaria"
            value={universo.con_historia_bo.toLocaleString("es-AR")}
            hint="encontradas en el Boletín Oficial de la Nación"
          />
        </div>
      </section>

      <section className="reveal reveal-5">
        <div className="mb-4 flex items-baseline justify-between">
          <h2 className="font-serif text-2xl">Candidatos por zona</h2>
          <Link href="/targets" className="editorial-link text-[11px] uppercase tracking-[0.2em] text-accent">
            Ver pipeline →
          </Link>
        </div>
        <div className="space-y-3">
          {porZona.map((r) => (
            <Link key={r.zona} href={`/targets?zona=${encodeURIComponent(r.zona)}`} className="group block">
              <div className="flex items-center gap-4">
                <div className="w-32 shrink-0 font-mono text-xs uppercase text-muted group-hover:text-text">
                  {r.zona}
                </div>
                <div className="flex h-6 flex-1 overflow-hidden rounded-sm bg-surface">
                  <div className="bg-accent" style={{ width: `${(r.a / max) * 100}%` }} />
                  <div className="bg-accent/25" style={{ width: `${(r.b / max) * 100}%` }} />
                </div>
                <div className="tabular w-20 text-right font-mono text-sm">
                  <span className="text-accent">{r.a}</span>
                  <span className="text-muted"> / {r.b}</span>
                </div>
              </div>
            </Link>
          ))}
          <div className="pt-1 text-[10px] uppercase tracking-[0.2em] text-muted">
            <span className="text-accent">■</span> llamar · <span className="text-accent/40">■</span> revisar
          </div>
        </div>
      </section>
    </div>
  );
}
