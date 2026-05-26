"""
Ampliar fuentes de ayudas — inserta directamente en Supabase
"""
import os, json, re, datetime, urllib.request
import anthropic
from supabase import create_client

client = anthropic.Anthropic(api_key=os.environ.get('ANTHROPIC_API_KEY'))
sb = create_client(os.environ['SUPABASE_URL'], os.environ['SUPABASE_SERVICE_KEY'])

FUENTES = [
    {
        'url': 'https://www.ico.es/web/ico/lineas-de-mediacion',
        'ccaa': None, 'ambito': 'estatal', 'org': 'ICO',
    },
    {
        'url': 'https://www.enisa.es/es/financiacion',
        'ccaa': None, 'ambito': 'estatal', 'org': 'ENISA',
    },
    {
        'url': 'https://sede.sepe.gob.es/es/portaltrabaja/resources/sede/pdfs/TREMgeneral.pdf',
        'ccaa': None, 'ambito': 'estatal', 'org': 'SEPE',
    },
    {
        'url': 'https://www.juntadeandalucia.es/institutodeestadisticaycartografia/badea/operaciones/consulta/anual/38396?CodOper=b3_2314&codConsulta=38396',
        'ccaa': 'Andalucía', 'ambito': 'autonomico', 'org': 'Junta de Andalucía',
    },
    {
        'url': 'https://dogv.gva.es/portal/ficha_disposicion_pc.jsp?sig=011186/2024&L=1',
        'ccaa': 'Comunidad Valenciana', 'ambito': 'autonomico', 'org': 'Generalitat Valenciana',
    },
    {
        'url': 'https://www.euskadi.eus/gobierno-vasco/-/servicio/buscador-subvenciones-y-ayudas/',
        'ccaa': 'País Vasco', 'ambito': 'autonomico', 'org': 'Gobierno Vasco',
    },
    {
        'url': 'https://ovd.work.gob.es/web/guest/inicio',
        'ccaa': None, 'ambito': 'estatal', 'org': 'Ministerio de Trabajo',
    },
]

PROMPT = """Eres un experto en ayudas públicas españolas. Analiza este contenido y extrae ayudas/subvenciones/líneas de financiación.

Por cada ayuda devuelve:
- nombre: nombre oficial
- descripcion: qué es y para quién (2-3 frases)  
- tipo: subvencion|prestacion|bonificacion|beca|credito|exencion|subsidio
- importe_descripcion: importe si aparece
- requisitos: requisitos principales si aparecen
- url_oficial: URL directa si la hay

Responde ÚNICAMENTE con un JSON array válido. Sin texto adicional. Sin markdown. Si no hay ayudas claras: []

Contenido:
{content}"""

def fetch(url):
    try:
        req = urllib.request.Request(url, headers={
            'User-Agent': 'Mozilla/5.0 (compatible; Cobratelo-Bot/1.0; +https://cobratelo.es)',
            'Accept': 'text/html,application/xhtml+xml',
            'Accept-Language': 'es-ES,es;q=0.9',
        })
        with urllib.request.urlopen(req, timeout=15) as r:
            html = r.read().decode('utf-8', errors='ignore')
        html = re.sub(r'<script[^>]*>.*?</script>', '', html, flags=re.DOTALL)
        html = re.sub(r'<style[^>]*>.*?</style>', '', html, flags=re.DOTALL)
        html = re.sub(r'<[^>]+>', ' ', html)
        html = re.sub(r'\s+', ' ', html).strip()
        return html[:8000] if len(html) > 100 else None
    except Exception as e:
        print(f'  ✗ fetch error: {e}')
        return None

def slugify(s):
    s = s.lower().strip()
    for a,b in [('á','a'),('é','e'),('í','i'),('ó','o'),('ú','u'),('ñ','n'),('ü','u')]:
        s = s.replace(a,b)
    s = re.sub(r'[^a-z0-9\s-]', '', s)
    s = re.sub(r'\s+', '-', s)
    return s[:100]

total = 0

for f in FUENTES:
    print(f"\n{'─'*50}")
    print(f"→ {f['org']} | {f['ccaa'] or 'Estatal'}")
    
    content = fetch(f['url'])
    if not content:
        print(f"  ✗ Sin contenido")
        continue
    print(f"  ✓ {len(content)} chars")

    try:
        msg = client.messages.create(
            model='claude-haiku-4-5-20251001',
            max_tokens=2000,
            messages=[{'role':'user','content': PROMPT.format(content=content)}]
        )
        raw = msg.content[0].text.strip()
        raw = re.sub(r'^```[a-z]*\n?', '', raw)
        raw = re.sub(r'\n?```$', '', raw)
        ayudas = json.loads(raw)
        print(f"  ✓ {len(ayudas)} ayudas encontradas")
    except Exception as e:
        print(f"  ✗ Claude error: {e}")
        continue

    for a in ayudas:
        if not a.get('nombre'): continue
        slug = slugify(a['nombre'])
        
        # Check duplicado en Supabase
        ex = sb.table('ayudas').select('id').eq('slug', slug).execute()
        if ex.data:
            print(f"    · Existe: {a['nombre'][:50]}")
            continue
        
        try:
            sb.table('ayudas').insert({
                'nombre': a.get('nombre',''),
                'slug': slug,
                'descripcion': a.get('descripcion',''),
                'tipo': a.get('tipo','subvencion'),
                'organismo': a.get('organismo', f['org']),
                'comunidad_autonoma': f['ccaa'],
                'ambito': f['ambito'],
                'importe_descripcion': a.get('importe_descripcion',''),
                'requisitos': a.get('requisitos',''),
                'url_oficial': a.get('url_oficial', f['url']),
                'estado': 'abierta',
            }).execute()
            total += 1
            print(f"    + {a['nombre'][:60]}")
        except Exception as e:
            print(f"    ✗ Insert error: {e}")

print(f"\n{'='*50}")
print(f"TOTAL NUEVAS AYUDAS AÑADIDAS: {total}")

# Stats finales
r = sb.table('ayudas').select('id', count='exact').execute()
print(f"TOTAL EN BD: {r.count}")
