# Quick Start - 7 dias para tener pipeline corriendo

## DIA 1 (HOY - sabado)

- [ ] Crear proyecto Supabase nuevo: `deal-sourcing-alimentos`, region sa-east-1
- [ ] Cargar `sql/01_schema.sql` en SQL Editor
- [ ] Cargar `sql/02_geografia.sql`
- [ ] Cargar `sql/03_scoring.sql`
- [ ] Verificar que las 5 tablas y las 4 views existen
- [ ] Verificar que `corredor_localidades` tiene 28 registros
- [ ] Verificar que `big_players_excluir` tiene 28 registros

## DIA 2 (domingo)

- [ ] Setup local: venv, pip install, playwright install
- [ ] Crear `.env` con SUPABASE_URL y SERVICE_KEY
- [ ] Correr SIFEGA en modo `--headed` con UNA combinacion para validar selectores
  ```bash
  python scrapers/scraper_sifega.py --headed --rubro "ALIMENTOS AZUCARADOS" --vigencia VIGENTE
  ```
- [ ] Si algo no matchea, ajustar selectores (30 min de trabajo)
- [ ] Confirmar que se inserta al menos 1 registro en Supabase

## DIA 3 (lunes)

### Mañana - 30 min
- [ ] Mandar mail formal a las 4 Bromatologias (Pilar, Escobar, GR, Lujan)
  - Ver `docs/mail_bromatologias.md`
  - Confirmar mails de cada municipio en sus webs antes de mandar
- [ ] Anotar numero de expediente en cada caso
- [ ] Set reminder dia 8 (proximo lunes) para seguimiento telefonico

### Tarde - mientras corre el scraper
- [ ] Correr el scrape full SIFEGA (puede demorar 30-60 min headless):
  ```bash
  python scrapers/scraper_sifega.py
  ```
- [ ] Mientras corre, agendar reunion con CEPIP (Camara Parque Industrial Pilar)
- [ ] Identificar 3 estudios contables medianos del corredor para reunion semana siguiente

## DIA 4 (martes)

- [ ] Correr `select refresh_empresas();` en Supabase
- [ ] Inspeccionar `vw_top_targets` - cuantos hay?
- [ ] Si hay menos de 50 empresas, validar que el filtro geografico no este perdiendo casos
  ```sql
  -- ver que partidos esta detectando el normalizador
  select partido, count(*) from establecimientos_sifega 
  group by partido order by count desc;
  
  -- ver casos que no matchearon el corredor (revisar para ver si son del corredor pero con domicilio raro)
  select domicilio, codigo_postal, count(*) from establecimientos_sifega 
  where partido is null
  group by 1,2 order by count desc limit 50;
  ```

## DIA 5 (miercoles)

- [ ] Correr scraper INPI sobre las empresas:
  ```bash
  python scrapers/scraper_inpi.py --from-empresas --limit 20
  ```
- [ ] Validar que las marcas se cargan correctamente
- [ ] Si todo bien, correr full sin limit (puede demorar varias horas):
  ```bash
  python scrapers/scraper_inpi.py --from-empresas
  ```

## DIA 6 (jueves)

- [ ] `select refresh_empresas();` para recalcular score con marcas
- [ ] Revisar las 3 views principales:
  ```sql
  select * from vw_top_targets;
  select * from vw_marcas_dormidas;
  select * from vw_plantas_flexibles;
  ```
- [ ] Identificar tus TOP 10 candidatos manualmente
- [ ] Para cada uno, hacer:
  - Google de la marca (sigue activa? hay quejas? web?)
  - Mercado Libre (productos en venta? vintage?)
  - LinkedIn (gerencia? sucesion?)
  - Boletin Oficial (concursos? juicios?)

## DIA 7 (viernes)

- [ ] Armar one-pager visual para mandar a tu red de scouts
  (basado en la tesis pulida que ya tenes)
- [ ] Mandarlo a 30-50 contactos de tu red:
  - Ex-ejecutivos retirados de la industria
  - Abogados y contadores zona norte
  - Banqueros relacionales (Galicia, Supervielle, ICBC sucursales corredor)
  - Inmobiliarios industriales
- [ ] Empezar a contactar a las top 5 empresas del scoring
  - NO con mail frio
  - Buscar conexion en LinkedIn / network mutual
  - O pedirle a tu scout / contador que haga la presentacion

## Semana 2-4

- [ ] Recibir respuestas de Bromatologias, cargar en `establecimientos_municipales`
- [ ] Reunion CEPIP
- [ ] Reuniones con 3-4 estudios contables del corredor
- [ ] Contratar primer scout (retainer + success fee)
- [ ] 2-3 reuniones presenciales con duenos de las top 5

## Mes 2-3

- [ ] Refinar pipeline con feedback de scouts
- [ ] Agregar fuentes adicionales:
  - Boletin Oficial (concursos preventivos por CUIT)
  - Causas judiciales (scw.pjn.gov.ar)
  - LinkedIn Sales Navigator (sucesion, gerentes)
- [ ] Pasar de "candidato" a "investigando" en Supabase 5-10 empresas
- [ ] Primera oferta no vinculante

## KPIs a trackear semanalmente

```sql
-- Tasa de avance del pipeline
select status, count(*), avg(score_target)
from empresas
group by status;

-- Velocidad de descubrimiento
select date_trunc('week', created_at) as semana,
       count(*) as nuevas_empresas
from empresas
group by 1 order by 1 desc;

-- Hit rate de scouts (cuando los tengas cargados)
select c.fuente, count(distinct c.empresa_id) as empresas_aportadas,
       avg(e.score_target) as score_promedio
from empresa_contactos c
join empresas e on e.id = c.empresa_id
group by c.fuente
order by score_promedio desc;
```
