import EmptyState from "@/components/EmptyState";

export default function Page() {
  return (
    <div className="space-y-8">
      <header className="reveal">
        <div className="mb-2 text-[10px] uppercase tracking-[0.3em] text-accent">· INPI</div>
        <h1 className="font-serif text-4xl md:text-5xl">Marcas Dormidas</h1>
        <p className="mt-3 max-w-2xl text-muted">
          Marcas vigentes cuyo titular ya no tiene planta habilitada.
        </p>
      </header>
      <EmptyState
        title="Pendiente de cruce con INPI"
        description="Esta vista dependía de la base de Supabase, hoy pausada. El cruce con marcas INPI se suma al pipeline de originación en la próxima iteración."
        hint="scrapers/scraper_inpi.py"
      />
    </div>
  );
}
