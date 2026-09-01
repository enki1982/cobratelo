#!/usr/bin/env python3
"""
reprocesar_opacas.py — Recupera ayudas 'opacas' (sin fecha_fin) re-consultando BDNS.

Contexto: el agente antiguo guardó ~17k convocatorias sin fecha de fin, marcadas
como 'permanente'. En el saneamiento se pasaron a activa=false con la marca
[saneo:sin_fecha_pendiente_verificar]. Muchas son ayudas legítimas a las que solo
les falta el plazo. Este script las re-visita en BDNS, recupera su fechaFinSolicitud
real, y devuelve a activa=true las que siguen vigentes y son concurrencia competitiva.

Es SEGURO e INCREMENTAL:
- Procesa por lotes (BATCH), con pausa entre llamadas a BDNS (SLEEP).
- Solo REACTIVA (activa=true) las que verifica como vigentes y solicitables.
- Las que confirma caducadas o no solicitables las deja retiradas, pero cambia su
  marca a [saneo:verificada_*] para no volver a procesarlas en la siguiente pasada.
- Se puede ejecutar muchas veces: cada pasada avanza sobre las que aún llevan la
  marca 'sin_fecha_pendiente_verificar'.

Uso:  export $(grep -v '^#' .env | xargs) && python3 reprocesar_opacas.py [max_a_procesar]
"""
import os, re, sys, time, logging, requests
from datetime import datetime
from supabase import create_client

logging.basicConfig(level=logging.INFO, format='%(asctime)s [%(levelname)s] %(message)s')
log = logging.getLogger('reprocesar')

SUPABASE_URL = os.environ['SUPABASE_URL']
SUPABASE_KEY = os.environ.get('SUPABASE_SERVICE_KEY') or os.environ['SUPABASE_KEY']
sb = create_client(SUPABASE_URL, SUPABASE_KEY)

BDNS_DETALLE = 'https://www.infosubvenciones.es/bdnstrans/api/convocatorias'
SLEEP        = 0.4      # pausa entre llamadas a BDNS (cortesía)
BATCH        = 200      # cuántas leer de Supabase por tanda
MARCA        = 'sin_fecha_pendiente_verificar'
HOY          = datetime.now().strftime('%Y-%m-%d')

# tope opcional por línea de comandos (por defecto: sin tope, procesa todas)
MAX_PROC = int(sys.argv[1]) if len(sys.argv) > 1 else 10**9


def id_bdns_de_url(url):
    """Extrae el id de convocatoria de la url_oficial (…/convocatoria?id=NNN)."""
    if not url:
        return None
    m = re.search(r'[?&]id=(\d+)', url)
    return m.group(1) if m else None


def bdns_detalle(num_conv):
    """Consulta el detalle de una convocatoria en BDNS."""
    try:
        r = requests.get(f'{BDNS_DETALLE}?vpd=GE&numConv={num_conv}',
                         timeout=20, headers={'Accept': 'application/json'})
        if r.status_code != 200:
            return None
        return r.json()
    except Exception as e:
        log.warning(f'  Sin detalle para {num_conv}: {e}')
        return None


def marcar_notas(notas, nueva):
    """Sustituye la marca de saneo por la nueva, conservando el resto de notas."""
    base = re.sub(r'\s*\[saneo:[^\]]+\]', '', notas or '').strip()
    return f'{base} [saneo:{nueva}]'.strip()


def procesar():
    reactivadas = caducadas = sin_fecha = no_solicitable = sin_id = errores = 0
    total = 0

    while total < MAX_PROC:
        # Traer un lote de las que aún llevan la marca pendiente
        res = (sb.table('ayudas')
               .select('id, nombre, url_oficial, notas_internas')
               .like('notas_internas', f'%{MARCA}%')
               .limit(BATCH)
               .execute())
        filas = res.data or []
        if not filas:
            log.info('No quedan opacas pendientes. Fin.')
            break

        for a in filas:
            if total >= MAX_PROC:
                break
            total += 1

            num_conv = id_bdns_de_url(a.get('url_oficial'))
            if not num_conv:
                # sin id no podemos re-verificar: la marcamos para no repetir
                sin_id += 1
                sb.table('ayudas').update({
                    'notas_internas': marcar_notas(a['notas_internas'], 'sin_id_no_verificable')
                }).eq('id', a['id']).execute()
                continue

            det = bdns_detalle(num_conv)
            time.sleep(SLEEP)

            if not det:
                errores += 1
                # no tocamos la marca: se reintentará en la próxima pasada
                continue

            tipo_conv = det.get('tipoConvocatoria') or ''
            fecha_fin = det.get('fechaFinSolicitud')  # 'YYYY-MM-DD' o None

            # ¿Es solicitable? (concurrencia competitiva)
            if 'Concurrencia competitiva' not in tipo_conv:
                no_solicitable += 1
                sb.table('ayudas').update({
                    'activa': False,
                    'notas_internas': marcar_notas(a['notas_internas'], 'verificada_no_solicitable')
                }).eq('id', a['id']).execute()
                continue

            if not fecha_fin:
                # sigue sin fecha en origen: convocatoria de plazo abierto/indefinido.
                # No la mostramos como vigente (criterio riguroso), pero la marcamos
                # como verificada para no reprocesarla en balde.
                sin_fecha += 1
                sb.table('ayudas').update({
                    'notas_internas': marcar_notas(a['notas_internas'], 'verificada_sin_fecha')
                }).eq('id', a['id']).execute()
                continue

            if fecha_fin >= HOY:
                # ¡Vigente! La recuperamos: fecha real, estado abierta, activa=true, sin marca de saneo
                importe = det.get('presupuestoTotal')
                upd = {
                    'fecha_fin': fecha_fin,
                    'estado': 'abierta',
                    'activa': True,
                    'notas_internas': re.sub(r'\s*\[saneo:[^\]]+\]', '', a['notas_internas'] or '').strip(),
                    'updated_at': datetime.now().isoformat(),
                }
                if isinstance(importe, (int, float)) and importe > 0:
                    upd['importe_max'] = importe
                sb.table('ayudas').update(upd).eq('id', a['id']).execute()
                reactivadas += 1
                log.info(f'  ✅ Reactivada (cierra {fecha_fin}): {a["nombre"][:60]}')
            else:
                # caducada de verdad
                caducadas += 1
                sb.table('ayudas').update({
                    'activa': False,
                    'fecha_fin': fecha_fin,
                    'estado': 'cerrada',
                    'notas_internas': marcar_notas(a['notas_internas'], 'verificada_caducada')
                }).eq('id', a['id']).execute()

        log.info(f'... procesadas {total} | reactivadas {reactivadas} | caducadas {caducadas} '
                 f'| sin_fecha {sin_fecha} | no_solicitable {no_solicitable} | sin_id {sin_id} | errores {errores}')

    log.info('=' * 60)
    log.info(f'FIN. Total procesadas: {total}')
    log.info(f'  ✅ Reactivadas (vigentes recuperadas): {reactivadas}')
    log.info(f'  ⏱  Caducadas confirmadas:             {caducadas}')
    log.info(f'  ◻  Sin fecha en origen:               {sin_fecha}')
    log.info(f'  ✗  No solicitables (concesión directa):{no_solicitable}')
    log.info(f'  ?  Sin id verificable:                {sin_id}')
    log.info(f'  ⚠  Errores (se reintentarán):         {errores}')
    log.info('=' * 60)


if __name__ == '__main__':
    procesar()
