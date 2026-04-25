# scraperalimentos

Pipeline de adquisiciones de PyMEs alimenticias - corredor noroeste GBA (Pilar, Escobar, General Rodríguez, Luján).

Dashboard Next.js + base de datos Supabase + scrapers Playwright para SENASA/ANMAT (SIFEGA) y INPI.

## Stack

- **DB**: Supabase Postgres (`fqcfyauxwpxldetxqnkm.supabase.co`)
- **Dashboard**: Next.js 14 App Router · TypeScript · Tailwind · deploy en Vercel
- **Scrapers**: Python + Playwright (corren local en tu Mac, escriben a Supabase)

## Quick start

### 1. Variables de entorno

Copiar `.env.example` a `.env.local` y completar:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://fqcfyauxwpxldetxqnkm.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...   # Settings → API → anon public key
SUPABASE_SERVICE_KEY=eyJ...            # Settings → API → service_role secret (solo para scrapers)
```

### 2. Dashboard local

```bash
npm install
npm run dev
# abrir http://localhost:3000
```

### 3. Schema en Supabase

Ya está aplicado en el proyecto `fqcfyauxwpxldetxqnkm`. Si necesitás reaplicarlo en otro proyecto, los archivos están en `sql/`:

- `sql/01_schema.sql` - tablas + índices
- `sql/02_geografia.sql` - corredor (30 localidades) + big players (28 marcas)
- `sql/03_scoring.sql` - función `refresh_empresas()` + 3 views

### 4. Scrapers

```bash
cd scrapers
python -m venv venv && source venv/bin/activate
pip install playwright supabase python-dotenv
playwright install chromium

# Scrape SIFEGA - 5 rubros × 3 vigencias (~30-60 min)
python scraper_sifega.py

# Recalcular en Supabase:
# select refresh_empresas();

# Scrape INPI sobre las empresas detectadas
python scraper_inpi.py --from-empresas

# Refrescar scoring final
# select refresh_empresas();
```

## Estructura

```
scraperalimentos/
├── app/                        # Next.js App Router
│   ├── page.tsx                # Panorama (home)
│   ├── targets/                # Top Targets con filtros
│   ├── marcas-dormidas/        # Caso premium - marcas vivas con planta dormida
│   ├── plantas-flexibles/      # Multi-rubro vigentes
│   └── empresa/[id]/           # Detalle de empresa
├── components/
│   ├── Nav.tsx                 # Top nav
│   ├── Stat.tsx                # Stat card
│   ├── PriorityBadge.tsx
│   └── EmptyState.tsx
├── lib/supabase.ts             # cliente + tipos
├── sql/                        # migraciones aplicadas
├── scrapers/                   # Python · Playwright
├── docs/
│   └── mail_bromatologias.md   # Template Ley 27.275
└── QUICKSTART.md               # Plan de 7 días
```

## Tesis (resumen)

PyME del corredor noroeste GBA, en producción y elaboración con valor agregado, con marca propia de trayectoria (idealmente decaída pero con awareness residual), planta industrial flexible (multi-rubro), dueño sin sucesión o con fatiga operativa. Entrada con cash mínimo: 20-30% al cierre, 40-50% vendor financing 36-48 m, 20-30% earn-out.

Ver `QUICKSTART.md` para el plan operativo de 7 días.

## Privacidad

- Datos de SIFEGA e INPI son públicos por ley.
- Pedidos a bromatologías municipales: Ley 27.275.
- Repo privado - no compartir.
