#!/usr/bin/env python3
"""
bdns_agent.py — Agente de ingesta BDNS para cobratelo.es
Endpoint real: /bdnstrans/api/convocatorias/busqueda
634.499 convocatorias personas físicas en BDNS (jun 2026)
Cron: lunes 4am (tras agent.py a las 3am)
"""

import os, time, json, logging, unicodedata, re, urllib.request, urllib.error
from datetime import datetime
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
BDNS_DETALLE = 'https://www.infosubvenciones.es/bdnstrans/api/convocatorias'
BDNS_DETAIL  = 'https://www.infosubvenciones.es/bdnstrans/GE/es/convocatoria?id={id}'
PAGE_SIZE    = 50
SLEEP_PAGES  = 2
SLEEP_DETALLE = 0.4   # cortesía entre llamadas al detalle
MAX_PAGES    = 60    # ~3.000 convocatorias más recientes por pasada; corte temprano si ya están

HEADERS = {
    'Accept': 'application/json',
    'User-Agent': 'Mozilla/5.0 (compatible; cobratelo.es/1.0; +https://cobratelo.es)',
}

def slugify(text):
    text = unicodedata.normalize('NFD', text.lower())
    text = ''.join(c for c in text if unicodedata.category(c) != 'Mn')
    text = re.sub(r'[^a-z0-9]+', '-', text)
    return text.strip('-')[:120]

def bdns_get(page):
    params = (
        f'vpd=GE&tipoBeneficiario=1'
        f'&page={page}&pageSize={PAGE_SIZE}'
        f'&order=fechaRecepcion&direccion=desc'
    )
    url = f'{BDNS_SEARCH}?{params}'
    req = urllib.request.Request(url, headers=HEADERS)
    try:
        with urllib.request.urlopen(req, timeout=20) as r:
            return json.loads(r.read().decode('utf-8'))
    except Exception as e:
        log.error(f'  Error BDNS página {page}: {e}')
        return None

def bdns_detalle(num_conv):
    """Consulta el detalle de una convocatoria: trae tipoConvocatoria, fechas, beneficiarios, etc."""
    url = f'{BDNS_DETALLE}?vpd=GE&numConv={num_conv}'
    req = urllib.request.Request(url, headers=HEADERS)
    try:
        with urllib.request.urlopen(req, timeout=20) as r:
            return json.loads(r.read().decode('utf-8'))
    except Exception as e:
        log.warning(f'  Sin detalle para {num_conv}: {e}')
        return None

def nivel_to_ambito(nivel1):
    n = (nivel1 or '').upper()
    if 'ESTATAL' in n or 'NACIONAL' in n: return 'estatal'
    if 'AUTON'   in n:                    return 'autonomico'
    if 'PROVIN'  in n:                    return 'autonomico'
    return 'municipal'

PROV_A_CCAA = {
    'alava':'Pais Vasco','araba':'Pais Vasco','guipuzcoa':'Pais Vasco','gipuzkoa':'Pais Vasco',
    'vizcaya':'Pais Vasco','bizkaia':'Pais Vasco','navarra':'Navarra','nafarroa':'Navarra',
    'la rioja':'La Rioja','cantabria':'Cantabria','asturias':'Asturias',
    'galicia':'Galicia','a coruna':'Galicia','lugo':'Galicia','ourense':'Galicia','pontevedra':'Galicia',
    'burgos':'Castilla y Leon','leon':'Castilla y Leon','palencia':'Castilla y Leon',
    'salamanca':'Castilla y Leon','segovia':'Castilla y Leon','soria':'Castilla y Leon',
    'valladolid':'Castilla y Leon','zamora':'Castilla y Leon','avila':'Castilla y Leon',
    'madrid':'Comunidad de Madrid','comunidad de madrid':'Comunidad de Madrid',
    'albacete':'Castilla-La Mancha','ciudad real':'Castilla-La Mancha',
    'cuenca':'Castilla-La Mancha','guadalajara':'Castilla-La Mancha','toledo':'Castilla-La Mancha',
    'badajoz':'Extremadura','caceres':'Extremadura','extremadura':'Extremadura',
    'almeria':'Andalucia','cadiz':'Andalucia','cordoba':'Andalucia',
    'granada':'Andalucia','huelva':'Andalucia','jaen':'Andalucia','malaga':'Andalucia','sevilla':'Andalucia',
    'murcia':'Murcia','region de murcia':'Murcia',
    'valencia':'Comunidad Valenciana','alicante':'Comunidad Valenciana','castellon':'Comunidad Valenciana',
    'huesca':'Aragon','teruel':'Aragon','zaragoza':'Aragon',
    'barcelona':'Cataluna','girona':'Cataluna','lleida':'Cataluna','tarragona':'Cataluna',
    'illes balears':'Illes Balears','baleares':'Illes Balears',
    'las palmas':'Canarias','santa cruz de tenerife':'Canarias','canarias':'Canarias',
    'ceuta':'Ceuta','melilla':'Melilla',
}

def nivel2_a_ccaa(nivel2):
    if not nivel2: return None
    n = unicodedata.normalize('NFD', nivel2.lower())
    n = ''.join(c for c in n if unicodedata.category(c) != 'Mn')
    return PROV_A_CCAA.get(n.strip())

def mapear(conv):
    titulo    = (conv.get('descripcion') or '').strip()
    organismo = (conv.get('nivel3') or conv.get('nivel2') or '').strip()
    if not titulo or len(titulo) < 5:
        return None

    num_conv = conv.get('numeroConvocatoria') or conv.get('id')
    if not num_conv:
        return None

    # --- Consultar el DETALLE para filtrar por solicitabilidad (clave de calidad) ---
    det = bdns_detalle(num_conv)
    if not det:
        return None  # sin detalle no podemos validar calidad; mejor descartar

    tipo_conv = (det.get('tipoConvocatoria') or '')
    # SOLO nos quedamos con concurrencia competitiva (abiertas a solicitud pública).
    # Descartamos "Concesión directa" (instrumental/canónica): convenios, nominativas,
    # transferencias a entes concretos... no son solicitables por el ciudadano.
    if 'Concurrencia competitiva' not in tipo_conv:
        return None

    # Fecha de fin real de solicitud (resuelve el "permanente" a ciegas)
    fecha_fin = det.get('fechaFinSolicitud')  # 'YYYY-MM-DD' o None
    # Estado: si tiene fecha de fin futura o está marcada abierta -> abierta; si no, permanente/cerrada
    hoy = datetime.now().strftime('%Y-%m-%d')
    if fecha_fin:
        estado = 'abierta' if fecha_fin >= hoy else 'cerrada'
    else:
        estado = 'permanente'  # sin fecha de fin: convocatoria de plazo abierto/permanente

    # Importe (presupuesto total de la convocatoria)
    presupuesto = det.get('presupuestoTotal')
    importe_max = presupuesto if isinstance(presupuesto, (int, float)) and presupuesto > 0 else None

    # Beneficiarios y finalidad (enriquecen el matching)
    beneficiarios = ', '.join(b.get('descripcion','') for b in (det.get('tiposBeneficiarios') or []) if b.get('descripcion'))
    finalidad = (det.get('descripcionFinalidad') or '').strip()

    nivel1 = conv.get('nivel1', '')
    nivel2 = conv.get('nivel2', '')
    ambito = nivel_to_ambito(nivel1)
    if ambito == 'estatal':
        ccaa = 'Estatal'
    elif ambito == 'autonomico':
        ccaa = nivel2
    else:
        ccaa = nivel2_a_ccaa(nivel2) or nivel2 or 'Estatal'

    bdns_id     = conv.get('id') or num_conv
    url_oficial = BDNS_DETAIL.format(id=bdns_id) if bdns_id else None

    descripcion_completa = titulo
    if finalidad and finalidad.lower() not in titulo.lower():
        descripcion_completa = f'{titulo} — {finalidad}'

    return {
        'nombre':              titulo[:200],
        'descripcion':         descripcion_completa[:1000],
        'organismo':           organismo[:200],
        'ambito':              ambito,
        'comunidad_autonoma':  ccaa[:100],
        'slug':                slugify(f'{titulo[:80]}-{organismo[:40]}'),
        'tipo':                'subvencion',
        'estado':              estado,
        'importe_max':         importe_max,
        'importe_min':         None,
        'importe_descripcion': beneficiarios[:200],
        'url_oficial':         url_oficial,
        'fecha_fin':           fecha_fin,
        'palabras_clave':      [],
        'fuente':              'bdns',
        'updated_at':          datetime.now().isoformat(),
    }

def upsert(sb, ayuda):
    """Inserta/actualiza la ayuda. Devuelve (ok, era_nueva)."""
    try:
        # ¿Ya existe? (para el corte temprano y métricas)
        era_nueva = True
        try:
            existing = sb.table('ayudas').select('id').eq('nombre', ayuda['nombre']).eq('organismo', ayuda['organismo']).limit(1).execute()
            if existing.data:
                era_nueva = False
        except Exception:
            pass
        sb.table('ayudas').upsert(ayuda, on_conflict='nombre,organismo').execute()
        return True, era_nueva
    except Exception as e:
        log.error(f"  Upsert error '{ayuda.get('nombre','?')[:60]}': {e}")
        return False, False

def main():
    if not SUPABASE_URL or not SUPABASE_KEY:
        log.error('Faltan SUPABASE_URL o SUPABASE_SERVICE_KEY')
        return

    sb = create_client(SUPABASE_URL, SUPABASE_KEY)
    log.info('=' * 60)
    log.info(f'BDNS AGENT inicio')
    log.info('=' * 60)

    total_proc = 0
    total_ok   = 0
    total_descartadas = 0
    ya_existentes_seguidas = 0
    CORTE_EXISTENTES = 100   # si encuentra 100 seguidas ya guardadas, asume que llegó a lo viejo y para

    for page in range(MAX_PAGES):
        data = bdns_get(page)
        if not data:
            log.warning(f'Página {page}: sin respuesta, parando')
            break

        content     = data.get('content', [])
        total_pages = data.get('totalPages', 1)
        total_el    = data.get('totalElements', '?')

        if not content:
            log.info('Fin de resultados')
            break

        log.info(f'Página {page+1}/{total_pages} ({total_el} total) — {len(content)} registros')

        for conv in content:
            total_proc += 1
            ayuda = mapear(conv)
            if ayuda is None:
                total_descartadas += 1
                continue
            ok, era_nueva = upsert(sb, ayuda)
            if ok:
                total_ok += 1
                if era_nueva:
                    ya_existentes_seguidas = 0
                else:
                    ya_existentes_seguidas += 1
            time.sleep(SLEEP_DETALLE)

        if ya_existentes_seguidas >= CORTE_EXISTENTES:
            log.info(f'Corte temprano: {ya_existentes_seguidas} convocatorias ya existentes seguidas. Parando.')
            break

        if page >= total_pages - 1:
            break

        time.sleep(SLEEP_PAGES)

    log.info(f'Descartadas (no solicitables): {total_descartadas}')

    log.info('=' * 60)
    log.info(f'FIN — procesadas: {total_proc} | guardadas: {total_ok}')
    log.info('=' * 60)

if __name__ == '__main__':
    main()
