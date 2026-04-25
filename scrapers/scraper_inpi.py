"""
INPI Scraper - Marcas registradas Argentina
Foco: clases 29, 30, 32 (alimentos y bebidas)

NOTA: el portal del INPI requiere login con AFIP/ARCA para acceso pleno.
La busqueda publica del frontend es limitada. Hay dos approaches:

  A) BUSQUEDA POR DENOMINACION: scrape pagina por pagina del buscador publico.
     Ideal cuando ya tenes una lista de marcas/titulares (output de SIFEGA).
     
  B) BUSQUEDA POR TITULAR (CUIT): mas efectivo para tu workflow.
     Tomas los CUITs del corredor (de SIFEGA) y buscas todas sus marcas.

Este script implementa el approach B: dado un set de CUITs (o nombres de
titular) ya en Supabase, los recorre y pobla marcas_inpi.

REQUISITOS:
  pip install playwright supabase python-dotenv
  playwright install chromium

USO:
  python scraper_inpi.py                    # toma CUITs de empresas
  python scraper_inpi.py --denominacion "BAGLEY"
  python scraper_inpi.py --titular "PEREZ HNOS"
"""

import os
import sys
import time
import json
import argparse
from datetime import datetime, date
from pathlib import Path

from dotenv import load_dotenv
from playwright.sync_api import sync_playwright, TimeoutError as PWTimeout
from supabase import create_client, Client

load_dotenv()

INPI_URL = "https://portaltramites.inpi.gob.ar/marcasconsultas/busqueda"
CLASES_OBJETIVO = [29, 30, 32]


def get_supabase() -> Client:
    return create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_SERVICE_KEY"])


def parse_date(s: str):
    if not s:
        return None
    s = s.strip()
    for fmt in ('%d/%m/%Y', '%Y-%m-%d', '%d-%m-%Y'):
        try:
            return datetime.strptime(s, fmt).date().isoformat()
        except ValueError:
            continue
    return None


def search_by_denominacion(page, denominacion: str, clase: int = None):
    """Busca marcas por denominacion. Devuelve lista de dicts."""
    page.goto(INPI_URL, wait_until="networkidle")
    
    # Expandir el panel del buscador (a veces esta colapsado)
    try:
        page.click('a:has-text("BUSCADOR DE MARCAS")', timeout=3000)
    except Exception:
        pass
    
    # Llenar denominacion
    page.fill('input[name="denominacion"], input[placeholder*="denominacion" i]', denominacion)
    
    # Clase (si se especifica)
    if clase:
        page.select_option('select[name="clase"]', value=str(clase))
    
    # Destildar "Solo Vigentes" para ver tambien caducas
    try:
        cb = page.query_selector('input[type="checkbox"][name*="vigente" i]')
        if cb and cb.is_checked():
            cb.click()
    except Exception:
        pass
    
    # Buscar
    page.click('button:has-text("Buscar")')
    
    try:
        page.wait_for_selector('table', timeout=20000)
    except PWTimeout:
        return []
    
    return _extract_marca_rows(page)


def search_by_titular(page, titular: str):
    """Busca marcas por nombre de titular."""
    page.goto(INPI_URL, wait_until="networkidle")
    try:
        page.click('a:has-text("BUSCADOR DE MARCAS")', timeout=3000)
    except Exception:
        pass
    
    page.fill('input[name="titular"], input[placeholder*="titular" i]', titular)
    
    # Sin filtrar vigencia (queremos ver caducas tambien)
    try:
        cb = page.query_selector('input[type="checkbox"][name*="vigente" i]')
        if cb and cb.is_checked():
            cb.click()
    except Exception:
        pass
    
    page.click('button:has-text("Buscar")')
    
    try:
        page.wait_for_selector('table', timeout=20000)
    except PWTimeout:
        return []
    
    return _extract_marca_rows(page)


def _extract_marca_rows(page):
    """Extrae filas de la tabla de resultados del INPI."""
    rows = page.query_selector_all('table tr')
    if len(rows) <= 1:
        return []
    
    headers = [h.inner_text().strip().lower() 
               for h in rows[0].query_selector_all('th, td')]
    
    out = []
    for row in rows[1:]:
        cells = row.query_selector_all('td')
        if not cells:
            continue
        d = {headers[i] if i < len(headers) else f'col_{i}': c.inner_text().strip()
             for i, c in enumerate(cells)}
        out.append(d)
    
    # Paginacion
    while True:
        nxt = page.query_selector('a.page-next:not(.disabled), a:has-text("Siguiente"):not(.disabled)')
        if not nxt:
            break
        try:
            nxt.click()
            page.wait_for_load_state('networkidle', timeout=15000)
        except PWTimeout:
            break
        rows = page.query_selector_all('table tr')
        for row in rows[1:]:
            cells = row.query_selector_all('td')
            if not cells:
                continue
            d = {headers[i] if i < len(headers) else f'col_{i}': c.inner_text().strip()
                 for i, c in enumerate(cells)}
            out.append(d)
    
    return out


def normalize_marca(raw: dict, titular_cuit: str = None) -> dict:
    estado = (raw.get('estado') or raw.get('resolucion') or '').strip()
    fecha_sol = parse_date(raw.get('fecha solicitud') or raw.get('f. solicitud'))
    fecha_con = parse_date(raw.get('fecha concesion') or raw.get('f. concesion'))
    
    try:
        clase = int(raw.get('clase', '0'))
    except (TypeError, ValueError):
        clase = None
    
    return {
        'acta': raw.get('acta') or raw.get('numero') or raw.get('n° acta'),
        'denominacion': raw.get('denominacion') or raw.get('marca'),
        'clase': clase,
        'estado': estado,
        'vigente': estado.lower() in ('concedida', 'en tramite', 'vigente'),
        'titular_nombre': raw.get('titular'),
        'titular_cuit': titular_cuit,
        'fecha_solicitud': fecha_sol,
        'fecha_concesion': fecha_con,
        'raw_data': raw,
    }


def upsert_marcas(supabase: Client, marcas: list[dict]):
    payload = [m for m in marcas if m.get('acta')]
    if not payload:
        return 0
    supabase.table('marcas_inpi').upsert(payload, on_conflict='acta').execute()
    return len(payload)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--denominacion', help='buscar marca especifica')
    parser.add_argument('--titular', help='buscar todas las marcas de un titular')
    parser.add_argument('--from-empresas', action='store_true',
                        help='recorrer empresas del corredor en Supabase')
    parser.add_argument('--headed', action='store_true')
    parser.add_argument('--limit', type=int, default=None)
    args = parser.parse_args()
    
    supabase = get_supabase()
    
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=not args.headed)
        page = browser.new_context().new_page()
        
        total = 0
        
        if args.denominacion:
            for clase in CLASES_OBJETIVO:
                results = search_by_denominacion(page, args.denominacion, clase)
                marcas = [normalize_marca(r) for r in results]
                total += upsert_marcas(supabase, marcas)
                time.sleep(2)
        
        elif args.titular:
            results = search_by_titular(page, args.titular)
            marcas = [normalize_marca(r) for r in results]
            total += upsert_marcas(supabase, marcas)
        
        elif args.from_empresas:
            # Recorrer empresas del corredor que aun no tienen marcas en DB
            q = supabase.table('empresas').select('cuit, razon_social') \
                .eq('big_player', False) \
                .order('cuit')
            if args.limit:
                q = q.limit(args.limit)
            empresas = q.execute().data
            
            print(f"[INPI] procesando {len(empresas)} empresas")
            for i, emp in enumerate(empresas):
                if not emp.get('razon_social'):
                    continue
                print(f"  [{i+1}/{len(empresas)}] {emp['razon_social']}")
                try:
                    results = search_by_titular(page, emp['razon_social'])
                    marcas = [normalize_marca(r, titular_cuit=emp['cuit']) 
                              for r in results]
                    n = upsert_marcas(supabase, marcas)
                    total += n
                    print(f"    -> {n} marcas")
                except Exception as e:
                    print(f"    [error] {e}")
                time.sleep(2)
        else:
            print("Especifica --denominacion, --titular, o --from-empresas")
            sys.exit(1)
        
        browser.close()
        print(f"\n[OK] total upserted: {total} marcas")


if __name__ == '__main__':
    main()
