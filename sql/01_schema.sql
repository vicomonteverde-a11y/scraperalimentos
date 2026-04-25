-- ============================================================
-- DEAL SOURCING ALIMENTOS - ESQUEMA SUPABASE
-- Corredor noroeste GBA: Pilar, Escobar, Gral. Rodriguez, Lujan
-- ============================================================

-- 1. ESTABLECIMIENTOS (SIFEGA - SENASA/ANMAT)
-- Universo de fabricas alimenticias habilitadas
create table if not exists establecimientos_sifega (
  id bigserial primary key,
  rne text unique not null,                -- Numero RNE (ej: "02-123456")
  jurisdiccion text,                        -- "BUENOS AIRES", "INAL", etc
  cuit text,
  razon_social text,
  nombre_fantasia text,
  domicilio text,
  localidad text,
  partido text,                             -- normalizado post-extraccion
  codigo_postal text,
  actividad text,                           -- "ELABORACION", "FRACCIONAMIENTO", etc
  rubro text,                               -- "ALIMENTOS FARINACEOS", etc
  condicion text,                           -- "REFRIGERADOS", "NO REFRIGERADOS"
  categoria text,
  vigencia text,                            -- "VIGENTE", "BAJA", "NO VIGENTE"
  fecha_alta date,
  fecha_baja date,
  director_tecnico text,
  raw_data jsonb,                           -- payload completo del scrape
  scraped_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_sifega_partido on establecimientos_sifega(partido);
create index if not exists idx_sifega_rubro on establecimientos_sifega(rubro);
create index if not exists idx_sifega_vigencia on establecimientos_sifega(vigencia);
create index if not exists idx_sifega_cuit on establecimientos_sifega(cuit);
create index if not exists idx_sifega_domicilio_trgm on establecimientos_sifega using gin (domicilio gin_trgm_ops);

-- 2. MARCAS (INPI)
-- Universo de marcas registradas en clases alimentarias
create table if not exists marcas_inpi (
  id bigserial primary key,
  acta text unique,                         -- numero de acta INPI
  denominacion text not null,
  clase int,                                -- 29, 30, 32 principalmente
  estado text,                              -- "Concedida", "Caduca", "Abandonada"
  vigente boolean,
  titular_nombre text,
  titular_cuit text,
  fecha_solicitud date,
  fecha_concesion date,
  fecha_vencimiento date,
  fecha_renovacion_ultima date,
  agente text,                              -- estudio que tramito
  url text,
  raw_data jsonb,
  scraped_at timestamptz default now()
);

create index if not exists idx_inpi_clase on marcas_inpi(clase);
create index if not exists idx_inpi_estado on marcas_inpi(estado);
create index if not exists idx_inpi_titular_cuit on marcas_inpi(titular_cuit);
create index if not exists idx_inpi_titular_nombre on marcas_inpi using gin (titular_nombre gin_trgm_ops);
create index if not exists idx_inpi_denominacion on marcas_inpi using gin (denominacion gin_trgm_ops);
create index if not exists idx_inpi_fecha_solicitud on marcas_inpi(fecha_solicitud);

-- 3. BROMATOLOGIAS MUNICIPALES
-- Establecimientos con habilitacion solo municipal/provincial (no aparecen en SIFEGA)
create table if not exists establecimientos_municipales (
  id bigserial primary key,
  partido text not null,                    -- "PILAR", "ESCOBAR", etc
  fuente text,                              -- "BROMATOLOGIA PILAR", etc
  fecha_pedido date,
  fecha_respuesta date,
  cuit text,
  razon_social text,
  nombre_fantasia text,
  domicilio text,
  localidad text,
  codigo_postal text,
  rubro text,
  estado text,
  observaciones text,
  raw_data jsonb,
  created_at timestamptz default now()
);

create index if not exists idx_munic_partido on establecimientos_municipales(partido);
create index if not exists idx_munic_cuit on establecimientos_municipales(cuit);

-- 4. EMPRESAS (consolidado por CUIT)
-- Vista unificada por dueno - aca vive el scoring
create table if not exists empresas (
  id bigserial primary key,
  cuit text unique not null,
  razon_social text,
  nombre_fantasia text,
  domicilio_principal text,
  partido_principal text,
  anio_fundacion int,                       -- estimado por antiguedad de marca o RNE
  rubro_principal text,
  
  -- counts de joins
  cantidad_rne int default 0,
  cantidad_marcas_vigentes int default 0,
  cantidad_marcas_caducas int default 0,
  rne_vigente boolean default false,
  rne_dado_baja boolean default false,
  
  -- senales de target
  marca_antigua boolean default false,      -- alguna marca > 20 anos
  multi_rubro boolean default false,        -- planta flexible (>=2 rubros RNE)
  big_player boolean default false,         -- es Arcor/Mondelez/etc - excluir
  
  -- scoring
  score_target numeric default 0,
  score_breakdown jsonb,
  
  -- workflow
  status text default 'nuevo',              -- nuevo / investigando / contactado / descartado / activo / cerrado
  prioridad text,                           -- A / B / C
  notas text,
  
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_empresas_partido on empresas(partido_principal);
create index if not exists idx_empresas_score on empresas(score_target desc);
create index if not exists idx_empresas_status on empresas(status);

-- 5. CONTACTOS Y SEGUIMIENTO
create table if not exists empresa_contactos (
  id bigserial primary key,
  empresa_id bigint references empresas(id) on delete cascade,
  nombre text,
  rol text,                                 -- "dueno", "gerente", "contador", "scout"
  telefono text,
  email text,
  fuente text,                              -- "scout pago X", "camara CEPIP", etc
  notas text,
  created_at timestamptz default now()
);

create table if not exists empresa_actividad (
  id bigserial primary key,
  empresa_id bigint references empresas(id) on delete cascade,
  fecha date default current_date,
  tipo text,                                -- "llamada", "reunion", "mail", "investigacion"
  resumen text,
  proximo_paso text,
  fecha_proximo_paso date,
  created_at timestamptz default now()
);

create index if not exists idx_actividad_empresa on empresa_actividad(empresa_id);

-- Extensiones necesarias
create extension if not exists pg_trgm;     -- para indices GIN sobre texto
