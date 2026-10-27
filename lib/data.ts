import raw from "@/data/empresas.json";

// Datos generados por el pipeline de originación (`python3 run.py exportar_json`).
// Se versionan en data/empresas.json: la app no depende de Supabase para mostrarse.

export type Prioridad = "A" | "B" | "X";

export type Empresa = {
  id: string;
  razon_social: string;
  prioridad: Prioridad;
  score: number | null;
  zona: string;
  km_pilar: number | null;
  partidos: string[];
  fuente: string;
  anio_origen: number | null;
  anios_conduccion: number | null;
  nac_estimado: number | null;
  familia_historica: number;
  nueva_generacion: number;
  apellido_familia: string | null;
  presidente: string | null;
  bcra_situacion: number | null;
  deuda_millones: number | null;
  cheques_12m: number | null;
  cuit: string | null;
  rubros_sifega: number;
  avisos_distress: number;
  senales: string[];
};

type Dataset = {
  generado: string;
  universo: {
    establecimientos_sifega: number;
    sociedades_gba_interior: number;
    sociedades_caba: number;
    con_historia_bo: number;
  };
  empresas: Empresa[];
};

const data = raw as Dataset;

export const ZONAS = ["CABA", "GBA norte", "GBA noroeste", "GBA oeste", "GBA sur", "Gran La Plata", "Interior"];

export function empresas(): Empresa[] {
  return [...data.empresas].sort(
    (a, b) => orden(a.prioridad) - orden(b.prioridad) || (b.score ?? 0) - (a.score ?? 0)
  );
}

export function empresa(id: string): Empresa | undefined {
  return data.empresas.find((e) => e.id === id);
}

export function meta() {
  return { generado: data.generado, universo: data.universo };
}

function orden(p: Prioridad) {
  return p === "A" ? 0 : p === "B" ? 1 : 2;
}

export function edadEstimada(e: Empresa): string {
  if (!e.nac_estimado) return "—";
  if (e.nac_estimado === 1948) return "≥70 (DNI bajo)";
  return `~${new Date().getFullYear() - e.nac_estimado}`;
}

export function situacionBCRA(e: Empresa): string {
  if (e.bcra_situacion == null) return e.cuit ? "s/d" : "sin CUIT";
  if (e.bcra_situacion === 0) return "sin deuda";
  return ["", "1 · normal", "2 · seguimiento", "3 · con problemas", "4 · alto riesgo", "5 · irrecuperable"][
    e.bcra_situacion
  ];
}
