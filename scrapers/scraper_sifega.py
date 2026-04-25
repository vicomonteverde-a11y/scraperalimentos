"""
SIFEGA Scraper - SENASA/ANMAT establecimientos alimenticios
Corre la matriz completa de busquedas y persiste en Supabase.

REQUISITOS:
  pip install playwright supabase python-dotenv
  playwright install chromium

VARIABLES DE ENTORNO (.env):
  SUPABASE_URL=https://xxx.supabase.co
  SUPABASE_SERVICE_KEY=eyJ...   # service role, no la anon
  
USO:
  python scraper_sifega.py
  python scraper_sifega.py --rubro "ALIMENTOS FARINACEOS - CEREALES, HARINAS Y DERIVADOS"
  python scraper_sifega.py --vigencia BAJA
"""

import os
import sys
import time
import json
import argparse
from pathlib import Path
from datetime import datetime

from dotenv import load_dotenv
from playwright.sync_api import sync_playwright, TimeoutError as PWTimeout
from supabase import create_client, Client

load_dotenv()

SIFEGA_URL = "http://inal.sifega.anmat.gob.ar/consultadeRegistro/"
PROVINCIA_BS_AS = "2 - BUENOS AIRES"

# Rubros que matchean tu tesis (marca propia + planta flexible)
RUBROS_TESIS = [
    "ALIMENTOS FARINACEOS - CEREALES, HARINAS Y DERIVADOS",
    "ALIMENTOS AZUCARADOS",
    "ALIMENTOS LACTEOS",
    "PREPARACIONES CULINARIAS",
    "ALIMENTOS VEGETALES",
]

VIGENCIAS = ["VIGENTE", "BAJA", "NO VIGENTE"]
ACTIVIDAD = "Elaboracion"


def get_supabase() -> Client:
    url = os.environ["SUPABASE_URL"]
    key = os.environ["SUPABASE_SERVICE_KEY"]
    return create_client(url, key)


def scrape_combination(page, provincia: str, actividad: str, rubro: str, vigencia: str):
    """Ejecuta una busqueda y retorna lista de dicts con los resultados."""
    print(f"  [search] {rubro} | {vigencia}")
    page.goto(SIFEGA_URL, wait_until="networkidle")
    
    # Llenar form
    page.select_option('select[name="provincia"]', label=provincia)
    page.select_option('select[name="actividad"]', label=actividad)
    page.select_option('select[name="rubro"]', label=rubro)
    page.select_option('select[name="vigencia"]', label=vigencia)
    
    # Click Buscar
    page.click('button:has-text("Buscar"), input[type="submit"][value*="Buscar"]')
    
    try:
        page.wait_for_selector('table', timeout=30000)
    except PWTimeout:
        print(f"    -> sin resultados o timeout")
        return []
    
    # Extraer la tabla. SIFEGA usualmente devuelve una tabla con headers.
    # IMPORTANTE: la estructura puede variar - inspeccionar y ajustar.
    rows = page.query_selector_all('table tr')
    if len(rows) <= 1:
        return []
    
    # Headers
    header_cells = rows[0].query_selector_all('th, td')
    headers = [h.inner_text().strip().lower() for h in header_cells]
    
    results = []
    for row in rows[1:]:
        cells = row.query_selector_all('td')
        if not cells:
            continue
        row_data = {headers[i] if i < len(headers) else f'col_{i}': c.inner_text().strip()
                    for i, c in enumerate(cells)}
        row_data['_search_meta'] = {
            'provincia': provincia,
            'actividad': actividad,
            'rubro': rubro,
            'vigencia': vigencia,
            'scraped_at': datetime.utcnow().isoformat()
        }
        results.append(row_data)
    
    # Paginacion (si existe)
    while True:
        next_btn = page.query_selector('a:has-text("Siguiente"):not(.disabled), a[rel="next"]')
        if not next_btn:
            break
        try:
            next_btn.click()
            page.wait_for_load_state('networkidle', timeout=30000)
        except PWTimeout:
            break
        rows = page.query_selector_all('table tr')
        for row in rows[1:]:
            cells = row.query_selector_all('td')
            if not cells:
                continue
            row_data = {headers[i] if i < len(headers) else f'col_{i}': c.inner_text().strip()
                        for i, c in enumerate(cells)}
            row_data['_search_meta'] = {
                'provincia': provincia,
                'actividad': actividad,
                'rubro': rubro,
                'vigencia': vigencia,
                'scraped_at': datetime.utcnow().isoformat()
            }
            results.append(row_data)
    
    print(f"    -> {len(results)} establecimientos")
    return results


def normalize_record(raw: dict) -> dict:
    """Mapea las columnas crudas de SIFEGA a las columnas de la tabla."""
    # OJO: los nombres exactos de columnas de SIFEGA hay que confirmarlos
    # cuando hagas el primer scrape. Estos son los esperados.
    meta = raw.get('_search_meta', {})
    return {
        'rne': raw.get('numero rne') or raw.get('rne') or raw.get('n° rne'),
        'jurisdiccion': raw.get('provincia') or meta.get('provincia'),
        'cuit': raw.get('cuit'),
        'razon_social': raw.get('empresa') or raw.get('razon social'),
        'nombre_fantasia': raw.get('nombre de fantasia') or raw.get('nombre fantasia'),
        'domicilio': raw.get('domicilio') or raw.get('direccion'),
        'localidad': raw.get('localidad'),
        'codigo_postal': raw.get('codigo postal') or raw.get('cp'),
        'actividad': raw.get('actividad') or meta.get('actividad'),
        'rubro': raw.get('rubro') or meta.get('rubro'),
        'condicion': raw.get('condicion'),
        'categoria': raw.get('categoria'),
        'vigencia': raw.get('vigencia') or meta.get('vigencia'),
        'director_tecnico': raw.get('director tecnico') or raw.get('director t.'),
        'raw_data': raw,
    }


def upsert_records(supabase: Client, records: list[dict]):
    if not records:
        return
    payload = []
    for r in records:
        n = normalize_record(r)
        if not n.get('rne'):
            continue
        payload.append(n)
    if not payload:
        return
    # Upsert por RNE
    result = supabase.table('establecimientos_sifega').upsert(
        payload, on_conflict='rne'
    ).execute()
    print(f"    [db] upserted {len(payload)}")


def save_local_backup(records: list[dict], rubro: str, vigencia: str):
    """Guarda copia local en JSON por las dudas."""
    out_dir = Path('./scrapes')
    out_dir.mkdir(exist_ok=True)
    safe_rubro = rubro.replace(' ', '_').replace(',', '').replace('-', '')[:30]
    fn = out_dir / f"{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}_{safe_rubro}_{vigencia}.json"
    with open(fn, 'w', encoding='utf-8') as f:
        json.dump(records, f, ensure_ascii=False, indent=2)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--rubro', help='filtrar a un solo rubro')
    parser.add_argument('--vigencia', help='filtrar a un solo estado de vigencia')
    parser.add_argument('--headed', action='store_true', help='ver el browser')
    parser.add_argument('--no-db', action='store_true', help='solo guardar local')
    args = parser.parse_args()
    
    rubros = [args.rubro] if args.rubro else RUBROS_TESIS
    vigencias = [args.vigencia] if args.vigencia else VIGENCIAS
    
    supabase = None if args.no_db else get_supabase()
    
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=not args.headed)
        ctx = browser.new_context(
            user_agent='Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
        )
        page = ctx.new_page()
        
        total = 0
        for rubro in rubros:
            for vigencia in vigencias:
                try:
                    results = scrape_combination(
                        page, PROVINCIA_BS_AS, ACTIVIDAD, rubro, vigencia
                    )
                    save_local_backup(results, rubro, vigencia)
                    if supabase:
                        upsert_records(supabase, results)
                    total += len(results)
                    time.sleep(2)  # rate limit, ser amables con el servidor
                except Exception as e:
                    print(f"    [error] {e}")
                    continue
        
        browser.close()
        print(f"\n[OK] total: {total} establecimientos procesados")


if __name__ == '__main__':
    main()
