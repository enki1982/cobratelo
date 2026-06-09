#!/usr/bin/env python3
"""enricher.py - Enriquece ayudas con metadatos de IA"""
import os, json, time, argparse
from anthropic import Anthropic
from supabase import create_client

SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_KEY = os.environ["SUPABASE_SERVICE_KEY"]
BATCH_SIZE = 20
SLEEP_BETWEEN = 3

client = Anthropic()
sb = create_client(SUPABASE_URL, SUPABASE_KEY)

def analizar_ayuda(ayuda):
    nombre = (ayuda.get("nombre") or "")[:300]
    organismo = (ayuda.get("organismo") or "")[:200]
    descripcion = (ayuda.get("descripcion") or "")[:400]

    prompt = f"""Analiza esta ayuda publica espanola y extrae metadatos.

AYUDA:
- Nombre: {nombre}
- Organismo: {organismo}
- Descripcion: {descripcion}
- Ambito: {ayuda.get("ambito","")}
- CCAA: {ayuda.get("comunidad_autonoma","")}

Devuelve SOLO este JSON (sin markdown):
{{
  "es_nominativa": false,
  "entidades_geo": [],
  "tipo_beneficiario": [],
  "sectores": [],
  "renta_max": null,
  "edad_min": null,
  "edad_max": null
}}

REGLAS:
- es_nominativa: true SOLO si va a una persona/empresa CONCRETA por nombre propio
- entidades_geo: municipios/comarcas/provincias CONCRETAS, NO CCAA genericas. Ej: ["Bilbao","Girones","A Coruna"]
- tipo_beneficiario: uno o mas de [autonomo,empresa,empleado,desempleado,pensionista,estudiante,persona_fisica,entidad_publica,ong,cualquiera]
- sectores: sectores especificos o [] si es general
- renta_max: euros/anio entero o null
- edad_min/edad_max: enteros o null"""

    resp = client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=300,
        messages=[{"role":"user","content":prompt}]
    )
    texto = resp.content[0].text.strip()
    if "```" in texto:
        texto = texto.split("```")[1]
        if texto.startswith("json"): texto = texto[4:]
    return json.loads(texto.strip())

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--batch", type=int, default=200)
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--reset", action="store_true")
    args = parser.parse_args()

    print(f"Enricher iniciado: batch={args.batch} dry={args.dry_run} reset={args.reset}")

    q = sb.table("ayudas").select("id", count="exact")
    if not args.reset:
        q = q.eq("ia_analizada", False)
    total = q.execute().count
    print(f"Ayudas pendientes: {total}")

    procesadas = 0
    offset = 0

    while procesadas < args.batch:
        size = min(BATCH_SIZE, args.batch - procesadas)
        q = sb.table("ayudas").select("id,nombre,organismo,descripcion,ambito,comunidad_autonoma")
        if not args.reset:
            q = q.eq("ia_analizada", False)
        result = q.limit(size).offset(offset).execute()
        ayudas = result.data
        if not ayudas:
            print("No hay mas ayudas pendientes")
            break

        print(f"\nBatch {offset//BATCH_SIZE+1} ({len(ayudas)} ayudas)...")
        for ayuda in ayudas:
            try:
                meta = analizar_ayuda(ayuda)
                if args.dry_run:
                    print(f"  [DRY] {ayuda['id'][:8]} nom={meta['es_nominativa']} geo={meta['entidades_geo']} bene={meta['tipo_beneficiario']}")
                else:
                    sb.table("ayudas").update({
                        "es_nominativa": meta.get("es_nominativa", False),
                        "entidades_geo": meta.get("entidades_geo", []),
                        "tipo_beneficiario": meta.get("tipo_beneficiario", []),
                        "sectores": meta.get("sectores", []),
                        "renta_max": meta.get("renta_max"),
                        "edad_min": meta.get("edad_min"),
                        "edad_max": meta.get("edad_max"),
                        "ia_analizada": True,
                        "ia_analizada_at": "now()"
                    }).eq("id", ayuda["id"]).execute()
                    print(f"  OK {ayuda['id'][:8]} {(ayuda.get('nombre') or '')[:55]}")
                procesadas += 1
            except Exception as e:
                print(f"  ERR {ayuda.get('id','?')[:8]}: {e}")

        if len(ayudas) < size:
            break
        if procesadas < args.batch and not args.dry_run:
            print(f"  Pausa {SLEEP_BETWEEN}s...")
            time.sleep(SLEEP_BETWEEN)
        if args.dry_run:
            offset += size

    print(f"\nCompletado: {procesadas} ayudas enriquecidas")

if __name__ == "__main__":
    main()
