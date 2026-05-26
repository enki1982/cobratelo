"""
Ampliar el agente con nuevas fuentes CCAA:
- Andalucía: juntadeandalucia.es/boja
- Comunidad Valenciana: dogv.gva.es
- País Vasco: euskadi.eus
- Galicia: xunta.gal
- ICO: ico.es/web/ico
- ENISA: enisa.es
"""
import os, json, sqlite3, datetime, anthropic

client = anthropic.Anthropic(api_key=os.environ.get('ANTHROPIC_API_KEY'))

NUEVAS_FUENTES = [
    {
        'url': 'https://www.juntadeandalucia.es/servicios/sede/tramites/procedimientos/buscador-ayudas.html',
        'ccaa': 'Andalucía',
        'ambito': 'autonomico',
        'nombre_fuente': 'Junta de Andalucía',
    },
    {
        'url': 'https://www.gva.es/es/inicio/informacion-institucional/ayudas-subvenciones',
        'ccaa': 'Comunidad Valenciana',
        'ambito': 'autonomico',
        'nombre_fuente': 'Generalitat Valenciana',
    },
    {
        'url': 'https://www.euskadi.eus/contenidos/informacion/buscador_ayudas_subvenciones/es_def/index.shtml',
        'ccaa': 'País Vasco',
        'ambito': 'autonomico',
        'nombre_fuente': 'Gobierno Vasco',
    },
    {
        'url': 'https://www.xunta.gal/busca-subvencions',
        'ccaa': 'Galicia',
        'ambito': 'autonomico',
        'nombre_fuente': 'Xunta de Galicia',
    },
    {
        'url': 'https://www.ico.es/web/ico/lineas-de-mediacion',
        'ccaa': None,
        'ambito': 'estatal',
        'nombre_fuente': 'ICO',
    },
    {
        'url': 'https://www.enisa.es/es/financiacion',
        'ccaa': None,
        'ambito': 'estatal',
        'nombre_fuente': 'ENISA',
    },
]

PROMPT_EXTRACCION = """Eres un asistente especializado en ayudas públicas españolas.
Analiza este contenido de una web oficial y extrae las ayudas, subvenciones o líneas de financiación que encuentres.

Para cada ayuda extrae:
- nombre: nombre oficial de la ayuda/programa
- descripcion: qué es y para quién (2-3 frases)
- tipo: subvencion|prestacion|bonificacion|beca|credito|exencion
- organismo: quien la ofrece
- importe_descripcion: si aparece algún importe o rango
- requisitos: requisitos principales si aparecen
- url_oficial: URL directa a la ayuda si la hay

Responde SOLO con un JSON array. Si no encuentras ayudas claras, devuelve [].
Máximo 10 ayudas por fuente.

Contenido web:
{content}
"""

def get_slug(nombre):
    import re
    slug = nombre.lower()
    slug = slug.replace('á','a').replace('é','e').replace('í','i').replace('ó','o').replace('ú','u').replace('ñ','n')
    slug = re.sub(r'[^a-z0-9\s-]', '', slug)
    slug = re.sub(r'\s+', '-', slug.strip())
    return slug[:100]

def fetch_content(url):
    import urllib.request
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 Cobratelo-Bot/1.0'})
        with urllib.request.urlopen(req, timeout=15) as r:
            html = r.read().decode('utf-8', errors='ignore')
        # Limpiar HTML básico
        import re
        html = re.sub(r'<script[^>]*>.*?</script>', '', html, flags=re.DOTALL)
        html = re.sub(r'<style[^>]*>.*?</style>', '', html, flags=re.DOTALL)
        html = re.sub(r'<[^>]+>', ' ', html)
        html = re.sub(r'\s+', ' ', html)
        return html[:8000]
    except Exception as e:
        print(f'  Error fetch {url}: {e}')
        return None

conn = sqlite3.connect('/root/ayuda-es-agent/ayudas.db')
c_check = conn.cursor()
c_check.execute("SELECT name FROM sqlite_master WHERE type='table'")
tablas = [r[0] for r in c_check.fetchall()]
print(f'Tablas disponibles: {tablas}')
TABLA = 'ayudas' if 'ayudas' in tablas else (tablas[0] if tablas else 'ayudas')
print(f'Usando tabla: {TABLA}')
c = conn.cursor()

total_añadidas = 0

for fuente in NUEVAS_FUENTES:
    print(f"\n{'='*50}")
    print(f"Procesando: {fuente['nombre_fuente']} — {fuente['ccaa'] or 'Estatal'}")
    print(f"URL: {fuente['url']}")

    content = fetch_content(fuente['url'])
    if not content:
        print("  ✗ No se pudo obtener el contenido")
        continue

    print(f"  Contenido obtenido: {len(content)} chars")

    try:
        msg = client.messages.create(
            model='claude-opus-4-5-20251101',
            max_tokens=2000,
            messages=[{'role': 'user', 'content': PROMPT_EXTRACCION.format(content=content)}]
        )
        raw = msg.content[0].text.strip()
        # Limpiar markdown si hay
        if raw.startswith('```'):
            raw = raw.split('\n', 1)[1].rsplit('```', 1)[0]
        ayudas = json.loads(raw)
        print(f"  ✓ {len(ayudas)} ayudas encontradas")
    except Exception as e:
        print(f"  ✗ Error Claude: {e}")
        continue

    for ayuda in ayudas:
        if not ayuda.get('nombre'):
            continue
        slug = get_slug(ayuda['nombre'])
        # Verificar si ya existe
        c.execute(f'SELECT id FROM {TABLA} WHERE slug = ?', (slug,))
        if c.fetchone():
            print(f"    · Ya existe: {ayuda['nombre'][:50]}")
            continue
        try:
            c.execute(f'''INSERT INTO {TABLA} 
                (nombre, slug, descripcion, tipo, organismo, comunidad_autonoma, ambito,
                 importe_descripcion, requisitos, url_oficial, estado, created_at)
                VALUES (?,?,?,?,?,?,?,?,?,?,'abierta',?)''', (
                ayuda.get('nombre', ''),
                slug,
                ayuda.get('descripcion', ''),
                ayuda.get('tipo', 'subvencion'),
                ayuda.get('organismo', fuente['nombre_fuente']),
                fuente['ccaa'],
                fuente['ambito'],
                ayuda.get('importe_descripcion', ''),
                ayuda.get('requisitos', ''),
                ayuda.get('url_oficial', fuente['url']),
                datetime.datetime.now().isoformat(),
            ))
            total_añadidas += 1
            print(f"    + Añadida: {ayuda['nombre'][:60]}")
        except Exception as e:
            print(f"    ✗ Error insert: {e}")

conn.commit()
conn.close()

print(f"\n{'='*50}")
print(f"TOTAL AÑADIDAS: {total_añadidas}")
