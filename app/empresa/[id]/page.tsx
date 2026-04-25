import { supabase } from "@/lib/supabase";
import PriorityBadge from "@/components/PriorityBadge";
import Link from "next/link";
import { notFound } from "next/navigation";

export const revalidate = 30;

async function getEmpresa(id: string) {
  const { data: empresa } = await supabase
    .from("empresas")
    .select("*")
    .eq("id", id)
    .single();
  if (!empresa) return null;

  const [{ data: rnes }, { data: marcas }, { data: contactos }, { data: actividad }] =
    await Promise.all([
      supabase
        .from("establecimientos_sifega")
        .select("*")
        .eq("cuit", empresa.cuit)
        .order("vigencia"),
      supabase
        .from("marcas_inpi")
        .select("*")
        .eq("titular_cuit", empresa.cuit)
        .order("fecha_solicitud", { ascending: true }),
      supabase
        .from("empresa_contactos")
        .select("*")
        .eq("empresa_id", empresa.id),
      supabase
        .from("empresa_actividad")
        .select("*")
        .eq("empresa_id", empresa.id)
        .order("fecha", { ascending: false }),
    ]);

  return { empresa, rnes: rnes || [], marcas: marcas || [], contactos: contactos || [], actividad: actividad || [] };
}

export default async function Page({ params }: { params: { id: string } }) {
  const data = await getEmpresa(params.id);
  if (!data) notFound();
  const { empresa, rnes, marcas, contactos, actividad } = data;

  return (
    <div className="space-y-10">
      <Link
        href="/targets"
        className="editorial-link text-[11px] uppercase tracking-[0.2em] text-muted"
      >
        ← Volver al pipeline
      </Link>

      {/* Header */}
      <header className="reveal flex items-start gap-6 border-b border-border pb-8">
        <div className="pt-2">
          <PriorityBadge priority={empresa.prioridad} />
        </div>
        <div className="flex-1">
          <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.22em] text-muted">
            CUIT {empresa.cuit} · {empresa.partido_principal || "—"}
          </div>
          <h1 className="font-serif text-4xl leading-tight md:text-5xl">
            {empresa.razon_social || empresa.nombre_fantasia || "(sin nombre)"}
          </h1>
          {empresa.domicilio_principal && (
            <p className="mt-3 font-mono text-sm text-muted">
              {empresa.domicilio_principal}
            </p>
          )}
        </div>
        <div className="text-right">
          <div className="text-[10px] uppercase tracking-[0.22em] text-muted">
            Score
          </div>
          <div className="tabular font-serif text-6xl text-accent">
            {empresa.score_target}
          </div>
        </div>
      </header>

      {/* Score breakdown + flags */}
      <section className="reveal reveal-1 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Flag label="Marca antigua" value={empresa.marca_antigua} />
        <Flag label="Multi-rubro" value={empresa.multi_rubro} />
        <Flag label="RNE vigente" value={empresa.rne_vigente} />
        <Flag label="RNE en baja" value={empresa.rne_dado_baja} />
      </section>

      {/* Marcas INPI */}
      <section className="reveal reveal-2">
        <div className="mb-4 flex items-baseline justify-between">
          <h2 className="font-serif text-2xl">Marcas INPI</h2>
          <span className="text-[10px] uppercase tracking-[0.2em] text-muted">
            {marcas.length} registros
          </span>
        </div>
        {marcas.length === 0 ? (
          <p className="rounded-sm border border-dashed border-border bg-surface/50 p-6 text-center text-sm italic text-muted">
            Sin marcas cargadas. Correr scraper INPI con --titular o --from-empresas.
          </p>
        ) : (
          <div className="space-y-px overflow-hidden rounded-sm border border-border">
            {marcas.map((m: any) => (
              <div key={m.id} className="flex items-center gap-4 bg-surface px-5 py-3">
                <div className="font-mono text-[10px] uppercase tracking-wider text-muted w-8">
                  c{m.clase}
                </div>
                <div className="flex-1 font-serif text-lg italic">{m.denominacion}</div>
                <div className="font-mono text-xs text-muted">
                  {m.fecha_solicitud
                    ? new Date(m.fecha_solicitud).toLocaleDateString("es-AR")
                    : "—"}
                </div>
                <span
                  className={[
                    "rounded-sm border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider",
                    m.vigente
                      ? "border-success/40 bg-success/10 text-success"
                      : "border-border text-muted",
                  ].join(" ")}
                >
                  {m.estado}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* RNE / Establecimientos */}
      <section className="reveal reveal-3">
        <div className="mb-4 flex items-baseline justify-between">
          <h2 className="font-serif text-2xl">Establecimientos · SIFEGA</h2>
          <span className="text-[10px] uppercase tracking-[0.2em] text-muted">
            {rnes.length} habilitaciones
          </span>
        </div>
        {rnes.length === 0 ? (
          <p className="rounded-sm border border-dashed border-border bg-surface/50 p-6 text-center text-sm italic text-muted">
            Sin RNE cargado.
          </p>
        ) : (
          <div className="space-y-px overflow-hidden rounded-sm border border-border">
            {rnes.map((r: any) => (
              <div
                key={r.id}
                className="grid grid-cols-12 items-center gap-3 bg-surface px-5 py-3"
              >
                <div className="col-span-2 font-mono text-xs">{r.rne}</div>
                <div className="col-span-4 truncate text-xs">{r.rubro}</div>
                <div className="col-span-2 font-mono text-[10px] uppercase text-muted">
                  {r.actividad}
                </div>
                <div className="col-span-2 font-mono text-[10px] uppercase text-muted">
                  {r.condicion || "—"}
                </div>
                <div className="col-span-2 text-right">
                  <span
                    className={[
                      "rounded-sm border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider",
                      r.vigencia === "VIGENTE"
                        ? "border-success/40 bg-success/10 text-success"
                        : r.vigencia === "BAJA"
                        ? "border-warning/40 bg-warning/10 text-warning"
                        : "border-border text-muted",
                    ].join(" ")}
                  >
                    {r.vigencia}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Contactos */}
      <section className="reveal reveal-4 grid grid-cols-1 gap-8 md:grid-cols-2">
        <div>
          <h2 className="mb-4 font-serif text-2xl">Contactos</h2>
          {contactos.length === 0 ? (
            <p className="rounded-sm border border-dashed border-border bg-surface/50 p-6 text-center text-xs italic text-muted">
              Sin contactos. Cargar via SQL o agregar UI de edición.
            </p>
          ) : (
            <ul className="space-y-3">
              {contactos.map((c: any) => (
                <li
                  key={c.id}
                  className="rounded-sm border border-border bg-surface p-4"
                >
                  <div className="font-medium">{c.nombre}</div>
                  <div className="text-xs text-muted">
                    {c.rol} · {c.telefono} · {c.email}
                  </div>
                  {c.notas && (
                    <div className="mt-2 border-t border-border pt-2 text-xs italic text-muted">
                      {c.notas}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <h2 className="mb-4 font-serif text-2xl">Actividad</h2>
          {actividad.length === 0 ? (
            <p className="rounded-sm border border-dashed border-border bg-surface/50 p-6 text-center text-xs italic text-muted">
              Sin actividad cargada.
            </p>
          ) : (
            <ul className="space-y-3">
              {actividad.map((a: any) => (
                <li
                  key={a.id}
                  className="rounded-sm border border-border bg-surface p-4"
                >
                  <div className="flex items-baseline justify-between">
                    <span className="font-mono text-[10px] uppercase tracking-wider text-accent">
                      {a.tipo}
                    </span>
                    <span className="font-mono text-[10px] text-muted">
                      {new Date(a.fecha).toLocaleDateString("es-AR")}
                    </span>
                  </div>
                  <p className="mt-2 text-sm">{a.resumen}</p>
                  {a.proximo_paso && (
                    <p className="mt-2 border-t border-border pt-2 text-xs italic text-muted">
                      → {a.proximo_paso}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* Notas + status */}
      {(empresa.notas || empresa.status) && (
        <section className="reveal reveal-5 border-t border-border pt-8">
          {empresa.status && (
            <div className="mb-3 text-[10px] uppercase tracking-[0.22em] text-muted">
              Status:{" "}
              <span className="font-mono text-accent">{empresa.status}</span>
            </div>
          )}
          {empresa.notas && (
            <p className="font-serif text-lg italic leading-snug text-text">
              "{empresa.notas}"
            </p>
          )}
        </section>
      )}
    </div>
  );
}

function Flag({ label, value }: { label: string; value: boolean }) {
  return (
    <div
      className={[
        "rounded-sm border px-4 py-3",
        value
          ? "border-accent/40 bg-accent/5"
          : "border-border bg-surface",
      ].join(" ")}
    >
      <div className="text-[10px] uppercase tracking-[0.2em] text-muted">
        {label}
      </div>
      <div
        className={[
          "mt-1 font-serif text-2xl",
          value ? "text-accent" : "text-muted",
        ].join(" ")}
      >
        {value ? "sí" : "—"}
      </div>
    </div>
  );
}
