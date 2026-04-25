import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(url, anon, {
  auth: { persistSession: false },
});

// Tipos
export type TopTarget = {
  id: number;
  cuit: string;
  razon_social: string | null;
  nombre_fantasia: string | null;
  partido_principal: string | null;
  domicilio_principal: string | null;
  score_target: number;
  prioridad: "A" | "B" | "C" | null;
  cantidad_marcas_vigentes: number;
  cantidad_marcas_caducas: number;
  marca_antigua: boolean;
  multi_rubro: boolean;
  rne_vigente: boolean;
  rne_dado_baja: boolean;
  marcas_vigentes: string | null;
  rubros: string | null;
  status: string;
  notas: string | null;
};

export type MarcaDormida = {
  id: number;
  marca: string;
  clase: number;
  fecha_solicitud: string | null;
  anios_marca: number | null;
  titular_nombre: string | null;
  titular_cuit: string | null;
  partido_principal: string | null;
  domicilio_principal: string | null;
  rne_vigente: boolean | null;
  rne_dado_baja: boolean | null;
  rubros_historicos: string | null;
};

export type PlantaFlexible = {
  id: number;
  cuit: string;
  razon_social: string | null;
  partido_principal: string | null;
  domicilio_principal: string | null;
  cantidad_rne: number;
  cantidad_rubros: number;
  rubros: string | null;
  condiciones: string | null;
  cantidad_marcas_vigentes: number;
  score_target: number;
};

export type DashboardStats = {
  total_empresas: number;
  prioridad_a: number;
  prioridad_b: number;
  prioridad_c: number;
  marcas_dormidas: number;
  plantas_flexibles: number;
  por_partido: { partido: string; n: number }[];
  ultima_actualizacion: string | null;
};
