#!/usr/bin/env python3
"""
bdns_agent.py — Agente de ingesta BDNS para cobratelo.es
Recorre la API oficial de la Base de Datos Nacional de Subvenciones
y sincroniza convocatorias de personas físicas a Supabase.
Sin Claude API. Sin rate limits. Cobertura nacional completa.
Cron: 0 4 * * 1  (lunes 4am, tras el agente Claude)
"""

import os
import time
import json
import logging
import unicodedata
import re
import urllib.request
import urllib.error
from datetime import datetime
from supabase import create_client

# ── Configuración ───────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler('/var/log/bdns-agent.log'),
    ]
)
log = logging.getLogger(__name__)

SUPABASE_URL  = os.environ.get('SUPABASE_URL', '')
SUPABASE_KEY  = os.environ.get('SUPABASE_SERVICE_KEY', '')

BDNS_BASE     = 'https://www.infosubvenciones.es/bdnstrans/GE/es'
PAGE_SIZE     = 50
SLEEP_BETWEEN = 2      # segundos entre páginas (respetar servidor gobierno)
MAX_PAGES     = 200    # límite de seguridad (~10.000 convocatorias)

# tipoBeneficiario=1 → Personas físicas
# estado=1 → Abiertas | estado=2 → Cerradas (incluimos ambas, filtramos en mapa)
TIPOS_BENEFICIARIO = [1]  # Solo personas físicas

# ── Slugify ─────────────────────────────────────────────────────────────────
def slugify(text):
    text = unicodedata.normalize('NFD', text.lower())
    text = ''.join(c for c in text if unicodedata.category(c) != 'Mn')
    text = re.sub(r'[^a-z0-9]+', '-', text)
    return text.strip('-')[:100]

# ── Llamada a la API BDNS ───────────────────────────────────────────────────
def bdns_get(endpoint, params):
    query = '&'.join(f'{k}={v}' for k, v in params.items())
    url = f'{BDNS_BASE}/{endpoint}?{query}'
    req = urllib.request.Request(url, headers={
        'Accept': 'application/json',
        'User-Agent': 'cobratelo.es/1.0 (hola@cobratelo.es)',
    })
    try:
        with urllib.request.urlopen(req, timeout=20) as r:
            return json.loads(r.read().decode('utf-8'))
    except Exception as e:
        log.error(f'  Error BDNS {url}: {e}')
        return None

# ── Mapeador BDNS → schema Supabase ────────────────────────────────────────
def mapear(conv):
    """Convierte un registro BDNS al schema de la tabla ayudas."""

    titulo    = (conv.get('descripcion') or conv.get('titulo') or '').strip()
    organismo = (conv.get('organoConvocante', {}) or {}).get('descripcion', '').strip()

    if not titulo or not organismo:
        return None

    # Ámbito territorial
    ccaa    = (conv.get('comunidadAutonoma', {}) or {}).get('descripcion', '')
    prov    = (conv.get('provincia', {}) or {}).get('descripcion', '')
    entidad = (conv.get('entidadConvocante', {}) or {}).get('descripcion', '')

    # Si no tiene CCAA es estatal
    if not ccaa:
        ambito = 'estatal'
        ccaa   = 'Estatal'
    elif prov and prov != ccaa:
        ambito = 'provincial'
    else:
        ambito = 'autonomico'

    # Estado convocatoria
    fecha_fin_raw = conv.get('fechaFinSolicitudes') or conv.get('fechaFin') or ''
    try:
        if fecha_fin_raw:
            fecha_fin = datetime.strptime(fecha_fin_raw[:10], '%Y-%m-%d').date()
            estado    = 'abierta' if fecha_fin >= datetime.today().date() else 'cerrada'
        else:
            estado    = 'permanente'
            fecha_fin = None
    except Exception:
        estado    = 'permanente'
        fecha_fin = None

    # Importes
    importe_max = None
    importe_min = None
    importe_desc = ''
    try:
        imp = conv.get('importeTotal') or conv.get('importe') or 0
        if imp and float(imp) > 0:
            importe_max  = float(imp)
            importe_desc = f'Hasta {int(importe_max):,}€'.replace(',', '.')
    except Exception:
        pass

    # URL oficial
    url_oficial = (conv.get('sedeElectronica') or '').strip()
    if not url_oficial:
        bdns_id = conv.get('id') or conv.get('numConvocatoria') or ''
        if bdns_id:
            url_oficial = f'https://www.infosubvenciones.es/bdnstrans/GE/es/convocatoria?id={bdns_id}'

    # Tipo
    tipo_raw = (conv.get('tipoConvocatoria', {}) or {}).get('descripcion', '')
    tipo = 'subvencion'
    if 'préstamo' in tipo_raw.lower() or 'prestamo' in tipo_raw.lower():
        tipo = 'prestamo'
    elif 'beca' in tipo_raw.lower():
        tipo = 'beca'
    elif 'bonif' in tipo_raw.lower():
        tipo = 'bonificacion'

    # Descripción (usamos el título largo si hay, o construimos)
    descripcion = (conv.get('objetivos') or conv.get('descripcion') or titulo)[:500]

    nombre  = titulo[:200]
    slug    = slugify(f'{nombre}-{organismo}')

    return {
        'nombre':              nombre,
        'descripcion':         descripcion,
        'organismo':           organismo[:200],
        'ambito':              ambito,
        'comunidad_autonoma':  ccaa[:100] if ccaa else None,
        'slug':                slug,
        'tipo':                tipo,
        'estado':              estado,
        'importe_max':         importe_max,
        'importe_min':         importe_min,
        'importe_descripcion': importe_desc[:200],
        'url_oficial':         url_oficial[:500] if url_oficial else None,
        'fecha_fin':           fecha_fin.isoformat() if fecha_fin else None,
        'palabras_clave':      [],
        'fuente':              'bdns',
        'updated_at':          datetime.utcnow().isoformat(),
    }

# ── Upsert en Supabase ──────────────────────────────────────────────────────
def upsert(sb, ayuda):
    try:
        sb.table('ayudas').upsert(ayuda, on_conflict='nombre,organismo').execute()
        return True
    except Exception as e:
        log.error(f"  Error upsert '{ayuda.get('nombre','?')[:60]}': {e}")
        return False

# ── Main ────────────────────────────────────────────────────────────────────
def main():
    if not SUPABASE_URL or not SUPABASE_KEY:
        log.error('Faltan SUPABASE_URL o SUPABASE_SERVICE_KEY')
        return

    sb = create_client(SUPABASE_URL, SUPABASE_KEY)
    log.info('=' * 60)
    log.info('BDNS AGENT — inicio')
    log.info('=' * 60)

    total_encontradas = 0
    total_guardadas   = 0

    for tipo_ben in TIPOS_BENEFICIARIO:
        log.info(f'tipoBeneficiario={tipo_ben} (personas físicas)')

        for page in range(MAX_PAGES):
            data = bdns_get('convocatorias', {
                'page':               page,
                'pageSize':           PAGE_SIZE,
                'tipoBeneficiario':   tipo_ben,
                'order':              'fechaModificacion',
                'direction':          'desc',
            })

            if not data:
                log.warning(f'  Página {page}: sin respuesta, parando')
                break

            content      = data.get('content', [])
            total_server = data.get('totalElements', 0)
            total_pages  = data.get('totalPages', 1)

            if not content:
                log.info(f'  Página {page}: vacía, fin')
                break

            log.info(f'  Página {page+1}/{total_pages} — {len(content)} convocatorias (total servidor: {total_server})')

            for conv in content:
                total_encontradas += 1
                ayuda = mapear(conv)
                if ayuda and upsert(sb, ayuda):
                    total_guardadas += 1

            if page >= total_pages - 1:
                log.info('  Última página alcanzada')
                break

            time.sleep(SLEEP_BETWEEN)

    log.info('=' * 60)
    log.info(f'FIN BDNS — encontradas: {total_encontradas} | guardadas: {total_guardadas}')
    log.info('=' * 60)

if __name__ == '__main__':
    main()
