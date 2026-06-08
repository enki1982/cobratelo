#!/usr/bin/env python3
"""
bdns_agent.py — Agente de ingesta BDNS para cobratelo.es
Endpoint real: /bdnstrans/api/convocatorias/busqueda
634.499 convocatorias personas físicas en BDNS (jun 2026)
Cron: lunes 4am (tras agent.py a las 3am)
"""

import os, time, json, logging, unicodedata, re, urllib.request, urllib.error
from datetime import datetime, timedelta
from supabase import create_client

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler('/var/log/bdns-agent.log'),
    ]
)
log = logging.getLogger(__name__)

SUPABASE_URL = os.environ.get('SUPABASE_URL', '')
SUPABASE_KEY = os.environ.get('SUPABASE_SERVICE_KEY', '')

BDNS_SEARCH  = 'https://www.infosubvenciones.es/bdnstrans/api/convocatorias/busqueda'
BDNS_DETAIL  = 'https://www.infosubvenciones.es/bdnstrans/GE/es/convocatoria?id={id}'
PAGE_SIZE    = 50
SLEEP_PAGES  = 2       # segundos entre páginas
MAX_PAGES    = 500     # ~25.000 convocatorias por ejecución
DIAS_ATRAS   = 365     # solo convocatorias del último año en la primera pasada

HEADERS = {
    'Accept': 'application/json',
    'User-Agent': 'Mozilla/5.0 (compatible; cobratelo.es/1.0; +https://cobratelo.es)',
}

def slugify(text):
    text = unicodedata.normalize('NFD', text.lower())
    text = ''.join(c for c in text if unicodedata.category(c) != 'Mn')
    text = re.sub(r'[^a-z0-9]+', '-', text)
    return text.strip('-')[:120]

def bdns_get(page, fecha_desde):
    params = (
        f'vpd=GE&tipoBeneficiario=1'
        f'&page={page}&pageSize={PAGE_SIZE}'
        f'&order=fechaRecepcion&direccion=desc'
        f'&fechaDesde={fecha_desde}'
    )
    url = f'{BDNS_SEARCH}?{params}'
    req = urllib.request.Request(url, headers=HEADERS)
    try:
        with urllib.request.urlopen(req, timeout=20) as r:
            return json.loads(r.read().decode('utf-8'))
    except Exception as e:
        log.error(f'  Error BDNS página {page}: {e}')
        return None

def nivel_to_ambito(nivel1):
    n = (nivel1 or '').upper()
    if 'ESTATAL' in n or 'NACIONAL' in n:  return 'estatal'
    if 'AUTON' in n:                        return 'autonomico'
    if 'PROVIN' in n:                       return 'provincial'
    return 'local'

def mapear(conv):
    titulo    = (conv.get('descripcion') or '').strip()
    organismo = (conv.get('nivel3') or conv.get('nivel2') or '').strip()
    if not titulo or len(titulo) < 5:
        return None

    nivel1 = conv.get('nivel1', '')
    nivel2 = conv.get('nivel2', '')   # CCAA o provincia
    ambito = nivel_to_ambito(nivel1)

    # CCAA
    ccaa = nivel2 if ambito in ('autonomico', 'local', 'provincial') else 'Estatal'

    bdns_id     = conv.get('id') or conv.get('numeroConvocatoria')
    url_oficial = BDNS_DETAIL.format(id=bdns_id) if bdns_id else None
    fecha_rec   = conv.get('fechaRecepcion', '')

    return {
        'nombre':              titulo[:200],
        'descripcion':         titulo,          # sin detalle en search; usamos título
        'organismo':           organismo[:200],
        'ambito':              ambito,
        'comunidad_autonoma':  ccaa[:100],
        'slug':                slugify(f'{titulo[:80]}-{organismo[:40]}'),
        'tipo':                'subvencion',
        'estado':              'activa',
        'importe_max':         None,
        'importe_min':         None,
        'importe_descripcion': '',
        'url_oficial':         url_oficial,
        'fecha_fin':           None,
        'palabras_clave':      [],
        'fuente':              'bdns',
        'updated_at':          datetime.utcnow().isoformat(),
    }

def upsert(sb, ayuda):
    try:
        sb.table('ayudas').upsert(ayuda, on_conflict='nombre,organismo').execute()
        return True
    except Exception as e:
        log.error(f"  Upsert error '{ayuda.get('nombre','?')[:60]}': {e}")
        return False

def main():
    if not SUPABASE_URL or not SUPABASE_KEY:
        log.error('Faltan variables SUPABASE_URL o SUPABASE_SERVICE_KEY')
        return

    sb = create_client(SUPABASE_URL, SUPABASE_KEY)
    fecha_desde = (datetime.today() - timedelta(days=DIAS_ATRAS)).strftime('%d-%m-%Y')

    log.info('=' * 60)
    log.info(f'BDNS AGENT inicio — desde {fecha_desde}')
    log.info('=' * 60)

    total_proc = 0
    total_ok   = 0

    for page in range(MAX_PAGES):
        data = bdns_get(page, fecha_desde)
        if not data:
            log.warning(f'Página {page}: sin respuesta, parando')
            break

        content     = data.get('content', [])
        total_pages = data.get('totalPages', 1)
        total_el    = data.get('totalElements', '?')

        if not content:
            log.info(f'Página {page}: vacía, fin')
            break

        log.info(f'Página {page+1}/{total_pages} ({total_el} total) — {len(content)} registros')

        for conv in content:
            total_proc += 1
            ayuda = mapear(conv)
            if ayuda and upsert(sb, ayuda):
                total_ok += 1

        if page >= total_pages - 1:
            log.info('Última página')
            break

        time.sleep(SLEEP_PAGES)

    log.info('=' * 60)
    log.info(f'FIN — procesadas: {total_proc} | guardadas: {total_ok}')
    log.info('=' * 60)

if __name__ == '__main__':
    main()
