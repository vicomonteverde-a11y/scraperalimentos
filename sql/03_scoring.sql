-- ============================================================
-- SCORING Y QUERIES DE CANDIDATOS TOP
-- Como identificar los mejores targets del corredor
-- ============================================================

-- Refresh de la tabla "empresas" consolidando SIFEGA + INPI por CUIT
create or replace function refresh_empresas()
returns void language plpgsql as $$
begin
  -- 1) upsert empresas desde SIFEGA (corredor)
  insert into empresas (cuit, razon_social, domicilio_principal, partido_principal, rubro_principal)
  select 
    s.cuit,
    max(s.razon_social),
    max(s.domicilio),
    max(s.partido),
    mode() within group (order by s.rubro)
  from establecimientos_sifega s
  where s.cuit is not null
    and s.partido in (select distinct partido from corredor_localidades)
  group by s.cuit
  on conflict (cuit) do update set
    razon_social = coalesce(empresas.razon_social, excluded.razon_social),
    domicilio_principal = coalesce(empresas.domicilio_principal, excluded.domicilio_principal),
    partido_principal = coalesce(empresas.partido_principal, excluded.partido_principal),
    updated_at = now();
  
  -- 2) actualizar counts y flags
  update empresas e set
    cantidad_rne = (
      select count(*) from establecimientos_sifega s where s.cuit = e.cuit
    ),
    rne_vigente = exists(
      select 1 from establecimientos_sifega s 
      where s.cuit = e.cuit and s.vigencia = 'VIGENTE'
    ),
    rne_dado_baja = exists(
      select 1 from establecimientos_sifega s 
      where s.cuit = e.cuit and s.vigencia in ('BAJA','NO VIGENTE')
    ),
    multi_rubro = (
      select count(distinct s.rubro) >= 2 
      from establecimientos_sifega s where s.cuit = e.cuit
    ),
    cantidad_marcas_vigentes = (
      select count(*) from marcas_inpi m 
      where m.titular_cuit = e.cuit and m.vigente = true
    ),
    cantidad_marcas_caducas = (
      select count(*) from marcas_inpi m 
      where m.titular_cuit = e.cuit and m.vigente = false
    ),
    marca_antigua = exists(
      select 1 from marcas_inpi m
      where m.titular_cuit = e.cuit
        and m.fecha_solicitud is not null
        and m.fecha_solicitud < (current_date - interval '20 years')
    );
  
  -- 3) flag big players (match flexible por nombre)
  update empresas e set big_player = true
  where exists (
    select 1 from big_players_excluir bp
    where upper(e.razon_social) like '%' || bp.cuit_o_razon || '%'
       or upper(e.nombre_fantasia) like '%' || bp.cuit_o_razon || '%'
  );
  
  -- 4) calcular score
  update empresas e set
    score_target = (
      case when e.big_player then -1000 else 0 end +
      -- antiguedad de marca: muy importante
      case when e.marca_antigua then 30 else 0 end +
      -- multi-rubro = planta flexible
      case when e.multi_rubro then 20 else 0 end +
      -- tener al menos 1 marca registrada
      case when e.cantidad_marcas_vigentes >= 1 then 15 else 0 end +
      case when e.cantidad_marcas_vigentes >= 3 then 10 else 0 end +
      -- RNE en BAJA con marca vigente = MARCA DORMIDA (oro)
      case when e.rne_dado_baja and e.cantidad_marcas_vigentes >= 1 then 40 else 0 end +
      -- empresa funcionando con marca antigua
      case when e.rne_vigente and e.marca_antigua then 25 else 0 end +
      -- en zona core (Pilar, Escobar, GR, Lujan)
      case when e.partido_principal in ('PILAR','ESCOBAR','GENERAL RODRIGUEZ','LUJAN') then 10 else 0 end +
      -- penalizacion: marcas todas caducas y RNE de baja - probablemente difunto
      case when e.cantidad_marcas_vigentes = 0 and e.rne_dado_baja and not e.rne_vigente then -30 else 0 end
    ),
    score_breakdown = jsonb_build_object(
      'big_player', e.big_player,
      'marca_antigua', e.marca_antigua,
      'multi_rubro', e.multi_rubro,
      'marcas_vigentes', e.cantidad_marcas_vigentes,
      'marcas_caducas', e.cantidad_marcas_caducas,
      'rne_vigente', e.rne_vigente,
      'rne_baja', e.rne_dado_baja,
      'partido_core', e.partido_principal in ('PILAR','ESCOBAR','GENERAL RODRIGUEZ','LUJAN')
    );
  
  -- 5) asignar prioridad
  update empresas set
    prioridad = case
      when score_target >= 80 then 'A'
      when score_target >= 50 then 'B'
      when score_target >= 25 then 'C'
      else null
    end
  where big_player = false;
end; $$;

-- ============================================================
-- QUERY 1: TOP TARGETS - PRIORIDAD A
-- Marca antigua + planta flexible + esta en el corredor
-- ============================================================
create or replace view vw_top_targets as
select 
  e.cuit,
  e.razon_social,
  e.nombre_fantasia,
  e.partido_principal,
  e.domicilio_principal,
  e.score_target,
  e.prioridad,
  e.cantidad_marcas_vigentes,
  e.cantidad_marcas_caducas,
  e.marca_antigua,
  e.multi_rubro,
  e.rne_vigente,
  e.rne_dado_baja,
  -- traer las marcas para inspeccion
  (select string_agg(distinct denominacion, ', ')
   from marcas_inpi m where m.titular_cuit = e.cuit and m.vigente = true) as marcas_vigentes,
  (select string_agg(distinct rubro, ', ')
   from establecimientos_sifega s where s.cuit = e.cuit) as rubros,
  e.status,
  e.notas
from empresas e
where e.big_player = false
  and e.score_target >= 50
order by e.score_target desc;

-- ============================================================
-- QUERY 2: MARCAS DORMIDAS - el caso premium de tu tesis
-- Marca vigente con titular que tuvo RNE pero ya no produce
-- ============================================================
create or replace view vw_marcas_dormidas as
select 
  m.denominacion as marca,
  m.clase,
  m.fecha_solicitud,
  extract(year from age(current_date, m.fecha_solicitud)) as anios_marca,
  m.titular_nombre,
  m.titular_cuit,
  e.partido_principal,
  e.domicilio_principal,
  e.rne_vigente,
  e.rne_dado_baja,
  (select string_agg(distinct rubro, ', ') 
   from establecimientos_sifega s 
   where s.cuit = m.titular_cuit) as rubros_historicos,
  m.fecha_renovacion_ultima
from marcas_inpi m
left join empresas e on e.cuit = m.titular_cuit
where m.vigente = true
  and m.clase in (29, 30, 32)
  and m.fecha_solicitud < (current_date - interval '20 years')
  and (e.rne_dado_baja = true or e.rne_vigente = false)
  and (e.big_player is null or e.big_player = false)
  and e.partido_principal in (select distinct partido from corredor_localidades)
order by anios_marca desc;

-- ============================================================
-- QUERY 3: PLANTAS FLEXIBLES VIGENTES
-- Multi-rubro, RNE vigente, en corredor - candidatos a fason + relanzamiento
-- ============================================================
create or replace view vw_plantas_flexibles as
select 
  e.cuit,
  e.razon_social,
  e.partido_principal,
  e.domicilio_principal,
  e.cantidad_rne,
  (select count(distinct rubro) 
   from establecimientos_sifega s 
   where s.cuit = e.cuit) as cantidad_rubros,
  (select string_agg(distinct rubro, ' | ') 
   from establecimientos_sifega s 
   where s.cuit = e.cuit) as rubros,
  (select string_agg(distinct condicion, ' | ') 
   from establecimientos_sifega s 
   where s.cuit = e.cuit and condicion is not null) as condiciones,
  e.cantidad_marcas_vigentes,
  e.score_target
from empresas e
where e.big_player = false
  and e.rne_vigente = true
  and e.multi_rubro = true
  and e.partido_principal in (select distinct partido from corredor_localidades)
order by cantidad_rubros desc, e.score_target desc;

-- ============================================================
-- QUERY 4: RUBROS DE INTERES (tu tesis)
-- Filtra solo establecimientos en panificados/snacks/golosinas/postres
-- ============================================================
create or replace view vw_rubros_tesis as
select 
  e.*,
  s.rubro,
  s.condicion,
  s.vigencia
from empresas e
join establecimientos_sifega s on s.cuit = e.cuit
where e.big_player = false
  and e.partido_principal in (select distinct partido from corredor_localidades)
  and s.rubro in (
    'ALIMENTOS FARINACEOS - CEREALES, HARINAS Y DERIVADOS',
    'ALIMENTOS AZUCARADOS',
    'ALIMENTOS LACTEOS',
    'PREPARACIONES CULINARIAS',
    'ALIMENTOS VEGETALES'
  )
  and s.actividad = 'ELABORACION'
order by e.score_target desc nulls last;
