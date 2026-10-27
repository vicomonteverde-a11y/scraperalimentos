import PriorityBadge from "@/components/PriorityBadge";
import Link from "next/link";
import { notFound } from "next/navigation";
import { edadEstimada, empresa, empresas, situacionBCRA } from "@/lib/data";

export function generateStaticParams() {
  return empresas().map((e) => ({ id: e.id }));
}

export default function Page({ params }: { params: { id: string } }) {
  const e = empresa(params.id);
  if (!e) notFound();

  const filas: [string, React.ReactNode][] = [
    ["Zona", `${e.zona} · ${e.km_pilar ?? "?"} km de Pilar`],
    ["Partido(s)", e.partidos.join(", ")],
    ["Fuente del universo", e.fuente],
    ["CUIT", e.cuit ?? "no publicado en el BO — completar a mano"],
    ["Año de origen", e.anio_origen ?? "—"],
    ["Años con la misma conducción", e.anios_conduccion ?? "—"],
    ["Presidente (último aviso)", e.presidente ?? "—"],
    ["Edad estimada de la autoridad", edadEstimada(e)],
    ["Apellido de la familia", e.apellido_familia ?? "—"],
    ["Familia histórica / nueva generación", `${e.familia_historica} / ${e.nueva_generacion}`],
    ["Rubros SIFEGA", e.rubros_sifega || "—"],
    ["BCRA (peor situación)", situacionBCRA(e)],
    ["Deuda bancaria", e.deuda_millones != null ? `$${e.deuda_millones.toLocaleString("es-AR")} M` : "—"],
    ["Cheques rechazados 12 meses", e.cheques_12m ?? "—"],
    ["Avisos de concurso / quiebra / remate", e.avisos_distress],
  ];

  return (
    <div className="space-y-10">
      <Link href="/targets" className="editorial-link text-[11px] uppercase tracking-[0.2em] text-muted">
        ← Volver al pipeline
      </Link>

      <header className="reveal flex items-start gap-6 border-b border-border pb-8">
        <div className="pt-2">
          <PriorityBadge priority={e.prioridad} />
        </div>
        <div className="flex-1">
          <div className="mb-2 text-[10px] uppercase tracking-[0.3em] text-accent">
            · {e.prioridad === "A" ? "Llamar" : e.prioridad === "B" ? "Revisar" : "Descartada"} · score {e.score}
          </div>
          <h1 className="font-serif text-4xl md:text-5xl">{e.razon_social}</h1>
          <div className="mt-4 flex flex-wrap gap-1">
            {e.senales.map((s) => (
              <span
                key={s}
                className="inline-block rounded-sm border border-accent/60 bg-accent/10 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-accent"
              >
                {s}
              </span>
            ))}
          </div>
        </div>
      </header>

      <section className="reveal reveal-1 grid grid-cols-1 gap-8 md:grid-cols-3">
        <div className="md:col-span-2">
          <div className="mb-2 text-[10px] uppercase tracking-[0.22em] text-muted">Reseña</div>
          <p className="text-base leading-relaxed">
            {e.resena ?? "Todavía no investigada. Usá los links de LinkedIn y Google de la derecha para un primer vistazo."}
          </p>
          {e.nota_prioridad && (
            <p className="mt-3 text-sm italic text-accent">{e.nota_prioridad}</p>
          )}
          {e.productos.length > 0 && (
            <>
              <div className="mb-2 mt-6 text-[10px] uppercase tracking-[0.22em] text-muted">Productos destacados</div>
              <ul className="space-y-1 text-sm">
                {e.productos.map((p) => (
                  <li key={p} className="flex gap-2">
                    <span className="text-accent">·</span>
                    {p}
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
        <div className="space-y-3 rounded-sm border border-border bg-surface p-5 text-sm">
          <div className="text-[10px] uppercase tracking-[0.22em] text-muted">Referencias</div>
          {e.web && <ExtLink href={e.web}>Sitio web</ExtLink>}
          {e.linkedin ? (
            <ExtLink href={e.linkedin}>LinkedIn (perfil encontrado)</ExtLink>
          ) : (
            <ExtLink href={e.linkedin_busqueda}>Buscar la empresa en LinkedIn</ExtLink>
          )}
          <ExtLink href={e.linkedin_personas}>Gente vinculada en LinkedIn</ExtLink>
          <ExtLink href={e.google_linkedin}>Google: menciones en LinkedIn</ExtLink>
          {e.fuentes.length > 0 && (
            <>
              <div className="pt-2 text-[10px] uppercase tracking-[0.22em] text-muted">Fuentes</div>
              {e.fuentes.map((f) => (
                <ExtLink key={f} href={f} small>
                  {new URL(f).hostname.replace(/^www\./, "")}
                </ExtLink>
              ))}
            </>
          )}
        </div>
      </section>

      <section className="reveal reveal-2 grid grid-cols-1 gap-px bg-border/50 md:grid-cols-2">
        {filas.map(([k, v]) => (
          <div key={k} className="bg-surface p-5">
            <div className="mb-1 text-[10px] uppercase tracking-[0.22em] text-muted">{k}</div>
            <div className="font-mono text-sm">{v}</div>
          </div>
        ))}
      </section>

      <section className="reveal reveal-3 rounded-sm border border-dashed border-border bg-surface/50 p-6 text-sm text-muted">
        <div className="mb-2 font-serif text-xl text-text">Próximo paso</div>
        Validar con el contador, el banco o un proveedor si hay hijos en el negocio y si el dueño
        consideraría una salida. Edad estimada por número de DNI (±2-3 años) solo cuando el Boletín
        Oficial publicó el DNI.
        {e.cuit && (
          <>
            {" "}
            <a
              className="editorial-link text-accent"
              href={`https://api.bcra.gob.ar/CentralDeDeudores/v1.0/Deudas/${e.cuit}`}
              target="_blank"
              rel="noreferrer"
            >
              Ver Central de Deudores
            </a>
            .
          </>
        )}
      </section>
    </div>
  );
}

function ExtLink({ href, children, small }: { href: string; children: React.ReactNode; small?: boolean }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className={["editorial-link block text-accent", small ? "text-xs text-accent/80" : ""].join(" ")}
    >
      {children} ↗
    </a>
  );
}
