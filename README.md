# scraperalimentos · originación por sucesión

Dashboard del pipeline de adquisiciones: PyMEs alimenticias con probable problema de sucesión en
CABA, GBA y hasta ~200 km de Pilar.

## De dónde salen los datos

`data/empresas.json` lo genera el pipeline de originación (carpeta `sucesion/`, `python3 run.py exportar_json`)
cruzando SIFEGA (plantas elaboradoras), Boletín Oficial (historia societaria) y BCRA (Central de Deudores).
La app ya **no depende de Supabase**: lee el JSON versionado en el repo, así que no se rompe si la base está pausada.

Para actualizar: correr el pipeline en la Mac, copiar el JSON nuevo a `data/empresas.json` y hacer commit.

## Vistas

- **Panorama**: universo, candidatos por zona.
- **Top Targets**: filtros por zona, prioridad (A llamar / B revisar / X descartadas) y fuente.
- **Plantas Flexibles**: candidatos con 3+ rubros SIFEGA.
- **Marcas Dormidas**: pendiente del cruce con INPI.

Los scrapers viejos (`scrapers/`) y el esquema de Supabase (`sql/`) quedan como referencia.
