-- ============================================================
-- FILTROS GEOGRAFICOS - CORREDOR NOROESTE GBA
-- Define que es "tu zona" y normaliza partidos
-- ============================================================

-- Tabla de localidades del corredor objetivo
create table if not exists corredor_localidades (
  id bigserial primary key,
  partido text not null,
  localidad text not null,
  codigo_postal text,
  prioridad int default 1,                 -- 1 = core, 2 = aledano
  unique(partido, localidad)
);

-- CORE: tus 5 zonas pedidas + Fatima (es localidad de Pilar)
insert into corredor_localidades (partido, localidad, codigo_postal, prioridad) values
  -- PILAR
  ('PILAR', 'PILAR', '1629', 1),
  ('PILAR', 'DEL VISO', '1669', 1),
  ('PILAR', 'MANZANARES', '1633', 1),
  ('PILAR', 'VILLA ROSA', '1631', 1),
  ('PILAR', 'PRESIDENTE DERQUI', '1635', 1),
  ('PILAR', 'FATIMA', '1633', 1),
  ('PILAR', 'LA LONJA', '1631', 1),
  ('PILAR', 'TORTUGUITAS', '1667', 1),
  -- ESCOBAR
  ('ESCOBAR', 'BELEN DE ESCOBAR', '1625', 1),
  ('ESCOBAR', 'GARIN', '1619', 1),
  ('ESCOBAR', 'INGENIERO MASCHWITZ', '1623', 1),
  ('ESCOBAR', 'MAQUINISTA SAVIO', '1619', 1),
  ('ESCOBAR', 'LOMA VERDE', '1625', 1),
  ('ESCOBAR', 'MATHEU', '1627', 1),
  -- GENERAL RODRIGUEZ
  ('GENERAL RODRIGUEZ', 'GENERAL RODRIGUEZ', '1748', 1),
  ('GENERAL RODRIGUEZ', 'LAS MALVINAS', '1748', 1),
  -- LUJAN
  ('LUJAN', 'LUJAN', '6700', 1),
  ('LUJAN', 'OPEN DOOR', '6708', 1),
  ('LUJAN', 'JAUREGUI', '6706', 1),
  ('LUJAN', 'CORTINEZ', '6706', 1),
  ('LUJAN', 'OLIVERA', '6706', 1),
  ('LUJAN', 'TORRES', '6707', 1),
  ('LUJAN', 'CARLOS KEEN', '6706', 1),
  -- ALEDANOS (corredor logistico, mismo cluster)
  ('MORENO', 'FRANCISCO ALVAREZ', '1746', 2),
  ('MORENO', 'LA REJA', '1744', 2),
  ('MORENO', 'MORENO', '1744', 2),
  ('MARCOS PAZ', 'MARCOS PAZ', '1727', 2),
  ('MERCEDES', 'MERCEDES', '6720', 2),
  ('EXALTACION DE LA CRUZ', 'CAPILLA DEL SENOR', '2812', 2),
  ('EXALTACION DE LA CRUZ', 'LOS CARDALES', '2814', 2)
on conflict (partido, localidad) do nothing;

-- ============================================================
-- FUNCION: normalizar partido a partir de domicilio o CP
-- ============================================================
create or replace function normalizar_partido(p_domicilio text, p_cp text)
returns text language plpgsql as $$
declare
  v_partido text;
  v_dom_upper text := upper(coalesce(p_domicilio,''));
begin
  -- 1) intentar match por codigo postal exacto
  if p_cp is not null then
    select partido into v_partido
    from corredor_localidades
    where codigo_postal = p_cp
    limit 1;
    if v_partido is not null then return v_partido; end if;
  end if;
  
  -- 2) intentar match por substring en domicilio (orden de especificidad)
  -- Localidades primero (mas especificas), partidos despues
  if v_dom_upper ~ 'GARIN|MASCHWITZ|MAQUINISTA SAVIO|BELEN DE ESCOBAR|MATHEU' then return 'ESCOBAR';
  elsif v_dom_upper ~ 'DEL VISO|MANZANARES|VILLA ROSA|DERQUI|FATIMA|LA LONJA|TORTUGUITAS' then return 'PILAR';
  elsif v_dom_upper ~ 'OPEN DOOR|JAUREGUI|CORTINEZ|CARLOS KEEN|TORRES' then return 'LUJAN';
  elsif v_dom_upper ~ 'FRANCISCO ALVAREZ|LA REJA' then return 'MORENO';
  elsif v_dom_upper ~ 'CAPILLA DEL SENOR|LOS CARDALES' then return 'EXALTACION DE LA CRUZ';
  elsif v_dom_upper ~ 'MERCEDES' then return 'MERCEDES';
  elsif v_dom_upper ~ 'MARCOS PAZ' then return 'MARCOS PAZ';
  elsif v_dom_upper ~ 'PILAR' then return 'PILAR';
  elsif v_dom_upper ~ 'ESCOBAR' then return 'ESCOBAR';
  elsif v_dom_upper ~ 'GENERAL RODRIGUEZ|GRAL\.? RODRIGUEZ|GRAL RODRIGUEZ' then return 'GENERAL RODRIGUEZ';
  elsif v_dom_upper ~ 'LUJAN' then return 'LUJAN';
  elsif v_dom_upper ~ 'MORENO' then return 'MORENO';
  end if;
  
  return null;
end; $$;

-- Trigger para autocompletar partido al insertar/actualizar
create or replace function trg_set_partido()
returns trigger language plpgsql as $$
begin
  if new.partido is null then
    new.partido := normalizar_partido(new.domicilio, new.codigo_postal);
  end if;
  new.updated_at := now();
  return new;
end; $$;

drop trigger if exists set_partido_sifega on establecimientos_sifega;
create trigger set_partido_sifega
  before insert or update on establecimientos_sifega
  for each row execute function trg_set_partido();

-- ============================================================
-- VIEW: solo lo que cae en el corredor
-- ============================================================
create or replace view vw_sifega_corredor as
select s.*
from establecimientos_sifega s
where s.partido in (
  select distinct partido from corredor_localidades
);

-- ============================================================
-- BIG PLAYERS A EXCLUIR (no es tu target)
-- ============================================================
create table if not exists big_players_excluir (
  cuit_o_razon text primary key,
  nombre text,
  motivo text default 'big player'
);

insert into big_players_excluir (cuit_o_razon, nombre) values
  ('ARCOR', 'Arcor'),
  ('MONDELEZ', 'Mondelez (ex Kraft / Terrabusi / Bagley)'),
  ('MASTELLONE', 'Mastellone Hnos (La Serenisima)'),
  ('MOLINOS', 'Molinos Rio de la Plata'),
  ('LEDESMA', 'Ledesma'),
  ('GEORGALOS', 'Georgalos'),
  ('BIMBO', 'Bimbo'),
  ('PEPSICO', 'Pepsico'),
  ('NESTLE', 'Nestle'),
  ('UNILEVER', 'Unilever'),
  ('DANONE', 'Danone'),
  ('SANCOR', 'Sancor'),
  ('COTO', 'Coto'),
  ('CARREFOUR', 'Carrefour'),
  ('CENCOSUD', 'Cencosud'),
  ('ALICORP', 'Alicorp'),
  ('MOLTO', 'Molto'),
  ('FELFORT', 'Felfort'),
  ('LHERITIER', 'Lheritier'),
  ('BAGLEY', 'Bagley'),
  ('TERRABUSI', 'Terrabusi'),
  ('SAVORA', 'Savora'),
  ('FARGO', 'Fargo'),
  ('LACTEAR', 'Lactear'),
  ('LA CAMPAGNOLA', 'La Campagnola'),
  ('CARGILL', 'Cargill'),
  ('BUNGE', 'Bunge'),
  ('AGD', 'AGD - Aceitera General Deheza')
on conflict do nothing;
