#!/usr/bin/env python3
"""
Ayuda-ES — Agente v2
Busca ayudas con URL específica de convocatoria + backfill de existentes
Cron: 0 3 * * 1  (lunes 3am)
"""

import os
import unicodedata
import re
import json
import logging
import time
from datetime import datetime
import anthropic
from supabase import create_client

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.FileHandler("/var/log/ayuda-es-agent.log"),
        logging.StreamHandler()
    ]
)
log = logging.getLogger(__name__)

ANTHROPIC_API_KEY = os.environ["ANTHROPIC_API_KEY"]
SUPABASE_URL      = os.environ["SUPABASE_URL"]
SUPABASE_KEY      = os.environ["SUPABASE_SERVICE_KEY"]

def slugify(text):
    text = unicodedata.normalize("NFD", text.lower())
    text = "".join(c for c in text if unicodedata.category(c) != "Mn")
    text = re.sub(r"[^a-z0-9]+", "-", text)
    return text.strip("-")[:80]

CATEGORIAS = [
    {"tema": "familia e hijos",           "ambito": "estatal",    "keywords": "bono bebé prestación nacimiento hijo INSS 2026"},
    {"tema": "familia e hijos",           "ambito": "autonomico",  "keywords": "ayuda familia hijos Cataluña Generalitat 2026"},
    {"tema": "vivienda alquiler",          "ambito": "estatal",    "keywords": "bono alquiler jóvenes ayuda vivienda ministerio 2026"},
    {"tema": "vivienda alquiler",          "ambito": "autonomico",  "keywords": "ayuda alquiler habitatge Catalunya 2026"},
    {"tema": "desempleo y empleo",         "ambito": "estatal",    "keywords": "SEPE subsidio desempleo ayuda empleo autónomos 2026"},
    {"tema": "autónomos y pymes",          "ambito": "estatal",    "keywords": "ayuda autónomo kit digital bonificación cuota 2026"},
    {"tema": "autónomos y pymes",          "ambito": "autonomico",  "keywords": "subvención autónomo empresa Cataluña ACCIÓ 2026"},
    {"tema": "discapacidad y dependencia", "ambito": "estatal",    "keywords": "prestación discapacidad dependencia IMSERSO 2026"},
    {"tema": "energía y eficiencia",       "ambito": "estatal",    "keywords": "bono social eléctrico rehabilitación energética IDAE 2026"},
    {"tema": "educación y becas",          "ambito": "estatal",    "keywords": "beca MEC educación universitaria 2026"},
    {"tema": "digitalización pymes",       "ambito": "estatal",    "keywords": "Kit Digital Red.es bono digitalización pyme 2026"},
    {"tema": "tercera edad",               "ambito": "estatal",    "keywords": "pensión no contributiva complemento jubilación mayores 2026"},
    {"tema": "emprendimiento",             "ambito": "estatal",    "keywords": "ENISA ayuda emprendedor startup financiación 2026"},
    {"tema": "vivienda rehabilitación",    "ambito": "estatal",    "keywords": "ayuda rehabilitación vivienda PREE Next Generation EU 2026"},
    {"tema": "autónomos pymes Andalucía",  "ambito": "autonomico",  "keywords": "subvención autónomo empresa Andalucía Junta 2026"},
    {"tema": "familia empleo Valencia",    "ambito": "autonomico",  "keywords": "ayuda familia empleo Comunitat Valenciana GVA 2026"},
    {"tema": "ayudas País Vasco",          "ambito": "autonomico",  "keywords": "ayuda subvención Euskadi Gobierno Vasco 2026"},
    {"tema": "ayudas Galicia",             "ambito": "autonomico",  "keywords": "ayuda subvención Xunta Galicia 2026"},
]

SYSTEM_PROMPT = """Eres un agente especializado en ayudas y subvenciones públicas de España.
Tu tarea es buscar información actualizada sobre ayudas vigentes y devolverla en JSON estricto.

FORMATO — devuelve SOLO este JSON, sin texto adicional:
{
  "ayudas": [
    {
      "nombre": "Nombre oficial completo de la ayuda",
      "organismo": "Nombre del organismo convocante",
      "ambito": "estatal|autonomico|municipal|comarcal",
      "tipo": "prestacion|subvencion|deduccion|servicio|bonificacion|prestamo",
      "importe_min": 0,
      "importe_max": 0,
      "importe_descripcion": "Descripción si el importe no es fijo",
      "estado": "abierta|cerrada|pendiente|permanente",
      "descripcion": "Descripción breve (máx 300 chars)",
      "url_oficial": "URL DIRECTA a la ficha o convocatoria oficial (sede.gob.es, dogc.cat, boe.es, etc.)",
      "fecha_fin": "YYYY-MM-DD o null",
      "comunidad_autonoma": "Cataluña|Madrid|Andalucía|... o null si es estatal",
      "palabras_clave": ["tag1", "tag2"]
    }
  ]
}

REGLAS CRÍTICAS:
- url_oficial DEBE ser la URL específica a la convocatoria/ficha (no la home del organismo)
  ✅ CORRECTO: https://sede.sepe.es/es/portaltrabempresa/Prestaciones/desempleo.html
  ✅ CORRECTO: https://www.boe.es/diario_boe/txt.php?id=BOE-A-2024-XXXXX
  ✅ CORRECTO: https://dogc.gencat.cat/ca/document-del-dogc/?documentId=XXXXX
  ❌ INCORRECTO: https://www.sepe.es  (demasiado genérico)
  ❌ INCORRECTO: https://www.gencat.cat  (home del organismo)
- Si NO tienes URL específica verificada, pon url_oficial = ""
- Solo ayudas con información verificada
- Entre 4 y 8 ayudas por búsqueda
- JSON válido, sin comentarios, sin markdown"""


def buscar_ayudas(ai: anthropic.Anthropic, categoria: dict) -> list:
    tema   = categoria["tema"]
    ambito = categoria["ambito"]
    kw     = categoria["keywords"]
    hoy    = datetime.now().strftime("%B %Y")

    prompt = (
        f"Busca ayudas públicas de España sobre '{tema}' de ámbito {ambito}. "
        f"Keywords: {kw}. Fecha: {hoy}. "
        f"Para cada ayuda DEBES incluir la URL directa a la convocatoria oficial, "
        f"no la home del organismo. Si no encuentras la URL exacta, deja url_oficial vacío. "
        f"Devuelve el JSON."
    )

    log.info(f"  Buscando: {tema} [{ambito}]")
    try:
        response = ai.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=2500,
            system=SYSTEM_PROMPT,
            tools=[{"type": "web_search_20250305", "name": "web_search"}],
            messages=[{"role": "user", "content": prompt}]
        )
        texto = ""
        for bloque in response.content:
            if bloque.type == "text":
                texto = bloque.text

        if not texto.strip():
            log.warning(f"  Sin respuesta para {tema}")
            return []

        texto = texto.strip()
        if texto.startswith("```"):
            texto = texto.split("```")[1]
            if texto.startswith("json"):
                texto = texto[4:]
        if texto.endswith("```"):
            texto = texto.rsplit("```", 1)[0]

        datos = json.loads(texto.strip())
        ayudas = datos.get("ayudas", [])
        log.info(f"  → {len(ayudas)} ayudas | con URL: {sum(1 for a in ayudas if a.get('url_oficial'))}")
        return ayudas

    except json.JSONDecodeError as e:
        log.error(f"  JSON inválido para {tema}: {e}")
        return []
    except Exception as e:
        log.error(f"  Error en {tema}: {e}")
        return []


def backfill_urls(ai: anthropic.Anthropic, sb) -> int:
    """Busca URLs para las ayudas que no las tienen."""
    log.info("── BACKFILL URLs ──────────────────────────────")
    
    res = sb.table("ayudas").select("id, nombre, organismo, descripcion").is_("url_oficial", "null").limit(50).execute()
    sin_url = res.data or []
    
    # También las que tienen url_oficial vacía
    res2 = sb.table("ayudas").select("id, nombre, organismo, descripcion").eq("url_oficial", "").limit(50).execute()
    sin_url += res2.data or []
    
    # Deduplicar
    vistas = set()
    sin_url_dedup = []
    for a in sin_url:
        if a["id"] not in vistas:
            vistas.add(a["id"])
            sin_url_dedup.append(a)
    
    log.info(f"  Ayudas sin URL: {len(sin_url_dedup)}")
    if not sin_url_dedup:
        return 0

    # Procesar en lotes de 5
    actualizadas = 0
    for i in range(0, len(sin_url_dedup), 5):
        lote = sin_url_dedup[i:i+5]
        lista = "\n".join([f"- {a['nombre']} ({a['organismo']})" for a in lote])
        
        prompt = f"""Para cada una de estas ayudas públicas españolas, busca y devuelve la URL oficial directa a su convocatoria o ficha:

{lista}

Devuelve SOLO este JSON:
{{
  "urls": [
    {{"nombre": "Nombre exacto de la ayuda", "url": "https://url-directa-convocatoria.es"}},
    ...
  ]
}}

IMPORTANTE:
- URL debe apuntar directamente a la ficha/convocatoria, no al portal general
- Si no encuentras la URL específica, devuelve url = ""
- Busca en BOE, DOGC, sede electrónica del organismo, portal de ayudas
"""
        try:
            response = ai.messages.create(
                model="claude-haiku-4-5-20251001",
                max_tokens=1500,
                tools=[{"type": "web_search_20250305", "name": "web_search"}],
                messages=[{"role": "user", "content": prompt}]
            )
            
            texto = ""
            for bloque in response.content:
                if bloque.type == "text":
                    texto = bloque.text
            
            if not texto.strip():
                continue
                
            texto = texto.strip().lstrip("```json").lstrip("```").rstrip("```")
            datos = json.loads(texto.strip())
            urls_map = {u["nombre"]: u["url"] for u in datos.get("urls", []) if u.get("url")}
            
            for ayuda in lote:
                # Buscar por nombre exacto o aproximado
                url = urls_map.get(ayuda["nombre"], "")
                if not url:
                    for k, v in urls_map.items():
                        if k.lower() in ayuda["nombre"].lower() or ayuda["nombre"].lower() in k.lower():
                            url = v
                            break
                
                if url:
                    sb.table("ayudas").update({"url_oficial": url}).eq("id", ayuda["id"]).execute()
                    actualizadas += 1
                    log.info(f"  ✅ URL añadida: {ayuda['nombre'][:50]}")
            
            time.sleep(15)  # Pausa entre lotes
            
        except Exception as e:
            log.error(f"  Error backfill lote {i}: {e}")
            continue
    
    log.info(f"  Backfill completado: {actualizadas} URLs añadidas")
    return actualizadas


def upsert_ayuda(sb, ayuda: dict) -> bool:
    try:
        payload = {
            "nombre":             ayuda.get("nombre", "")[:255],
            "organismo":          ayuda.get("organismo", "")[:255],
            "ambito":             ayuda.get("ambito", "estatal"),
            "tipo":               ayuda.get("tipo", "subvencion"),
            "importe_min":        ayuda.get("importe_min") or 0,
            "importe_max":        ayuda.get("importe_max") or 0,
            "importe_descripcion": ayuda.get("importe_descripcion", ""),
            "estado":             ayuda.get("estado", "cerrada"),
            "descripcion":        (ayuda.get("descripcion") or "")[:300],
            "url_oficial":        ayuda.get("url_oficial", "") or "",
            "fecha_fin":          ayuda.get("fecha_fin") or None,
            "activa":             bool(ayuda.get("fecha_fin") and str(ayuda.get("fecha_fin")) >= datetime.now().strftime("%Y-%m-%d")),
            "comunidad_autonoma": ayuda.get("comunidad_autonoma") or None,
            "palabras_clave":     ayuda.get("palabras_clave", []),
            "updated_at":         datetime.utcnow().isoformat(),
            "slug":               slugify(ayuda.get("nombre", "")),
        }
        sb.table("ayudas").upsert(payload, on_conflict="nombre,organismo").execute()
        return True
    except Exception as e:
        log.error(f"  Error upsert '{ayuda.get('nombre', '?')}': {e}")
        return False


def ejecutar_agente(modo="completo"):
    """
    modo="completo": busca nuevas ayudas + backfill URLs
    modo="backfill": solo backfill de URLs existentes
    modo="ingesta": solo buscar nuevas ayudas
    """
    log.info("=" * 60)
    log.info(f"AYUDA-ES AGENT v2 — {datetime.now().isoformat()} — modo: {modo}")
    log.info("=" * 60)

    ai = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)
    sb = create_client(SUPABASE_URL, SUPABASE_KEY)

    total_encontradas = 0
    total_guardadas   = 0
    urls_backfill     = 0

    if modo in ("completo", "ingesta"):
        for cat in CATEGORIAS:
            ayudas = buscar_ayudas(ai, cat)
            total_encontradas += len(ayudas)
            for ayuda in ayudas:
                if upsert_ayuda(sb, ayuda):
                    total_guardadas += 1
            time.sleep(60)

    if modo in ("completo", "backfill"):
        urls_backfill = backfill_urls(ai, sb)

    log.info("=" * 60)
    log.info(f"FIN — encontradas: {total_encontradas} | guardadas: {total_guardadas} | URLs backfill: {urls_backfill}")
    log.info("=" * 60)


if __name__ == "__main__":
    import sys
    modo = sys.argv[1] if len(sys.argv) > 1 else "completo"
    ejecutar_agente(modo)
