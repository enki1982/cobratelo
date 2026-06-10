#!/usr/bin/env python3
"""
enricher.py — Enriquece ayudas con metadatos IA
Modos:
  --batch N       Procesar N ayudas (una sola vez)
  --all           Procesar TODAS las pendientes en bucle (background)
  --dry-run       Sin escribir en BD
  --reset         Reprocesar todo
"""
import os, json, time, argparse, smtplib
from email.mime.text import MIMEText
from anthropic import Anthropic
from supabase import create_client

SUPABASE_URL  = os.environ["SUPABASE_URL"]
SUPABASE_KEY  = os.environ["SUPABASE_SERVICE_KEY"]
ANTHROPIC_KEY = os.environ["ANTHROPIC_API_KEY"]
SMTP_USER     = os.environ.get("FORWARD_EMAIL_API", "")  # API key = contraseña SMTP
FROM_EMAIL    = "hola@cobratelo.es"
TO_EMAIL      = "mikinogueras@gmail.com"

BATCH_SIZE    = 20
SLEEP_BATCH   = 3   # segundos entre batches de 20
LOTE_SIZE     = 500 # ayudas por lote (tras el cual se envía email)

client = Anthropic(api_key=ANTHROPIC_KEY)
sb     = create_client(SUPABASE_URL, SUPABASE_KEY)


def send_email(subject, body):
    try:
        msg = MIMEText(body, "plain", "utf-8")
        msg["Subject"] = subject
        msg["From"]    = FROM_EMAIL
        msg["To"]      = TO_EMAIL
        with smtplib.SMTP_SSL("smtp.forwardemail.net", 465, timeout=15) as s:
            s.login(FROM_EMAIL, SMTP_USER)
            s.sendmail(FROM_EMAIL, TO_EMAIL, msg.as_string())
        print(f"  📧 Email enviado: {subject}")
    except Exception as e:
        print(f"  ⚠️  Email falló: {e}")


def get_counts():
    a = sb.table("ayudas").select("id", count="exact").eq("ia_analizada", True).execute().count
    p = sb.table("ayudas").select("id", count="exact").eq("ia_analizada", False).execute().count
    return a, p


def analizar_ayuda(ayuda):
    nombre      = (ayuda.get("nombre") or "")[:300]
    organismo   = (ayuda.get("organismo") or "")[:200]
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
- tipo_beneficiario: de [autonomo,empresa,empleado,desempleado,pensionista,estudiante,persona_fisica,entidad_publica,ong,cualquiera]
- sectores: sectores especificos o [] si es general
- renta_max: euros/anio entero o null
- edad_min/edad_max: enteros o null"""

    resp = client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=300,
        messages=[{"role": "user", "content": prompt}]
    )
    texto = resp.content[0].text.strip()
    if "```" in texto:
        texto = texto.split("```")[1]
        if texto.startswith("json"):
            texto = texto[4:]
    return json.loads(texto.strip())


def procesar_ayudas(n, dry_run=False, reset=False):
    """Procesa n ayudas. Devuelve (ok, err)."""
    ok, err = 0, 0
    offset = 0

    while ok + err < n:
        size = min(BATCH_SIZE, n - ok - err)
        q = sb.table("ayudas").select("id,nombre,organismo,descripcion,ambito,comunidad_autonoma")
        if not reset:
            q = q.eq("ia_analizada", False)
        result = q.limit(size).offset(offset if dry_run else 0).execute()
        ayudas = result.data
        if not ayudas:
            break

        print(f"\n  Batch {(ok+err)//BATCH_SIZE + 1} ({len(ayudas)} ayudas)...")
        for ayuda in ayudas:
            try:
                meta = analizar_ayuda(ayuda)
                if dry_run:
                    print(f"    [DRY] {ayuda['id'][:8]} nom={meta['es_nominativa']} geo={meta['entidades_geo']}")
                else:
                    sb.table("ayudas").update({
                        "es_nominativa":    meta.get("es_nominativa", False),
                        "entidades_geo":    meta.get("entidades_geo", []),
                        "tipo_beneficiario":meta.get("tipo_beneficiario", []),
                        "sectores":         meta.get("sectores", []),
                        "renta_max":        meta.get("renta_max"),
                        "edad_min":         meta.get("edad_min"),
                        "edad_max":         meta.get("edad_max"),
                        "ia_analizada":     True,
                        "ia_analizada_at":  "now()"
                    }).eq("id", ayuda["id"]).execute()
                    print(f"    OK {ayuda['id'][:8]} {(ayuda.get('nombre') or '')[:55]}")
                ok += 1
            except Exception as e:
                print(f"    ERR {ayuda.get('id','?')[:8]}: {e}")
                err += 1

        if ok + err < n:
            time.sleep(SLEEP_BATCH)
        if dry_run:
            offset += size

    return ok, err


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--batch", type=int, default=0, help="Procesar N ayudas (una sola vez)")
    parser.add_argument("--all",   action="store_true",  help="Procesar todas en bucle con emails")
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--reset",   action="store_true")
    args = parser.parse_args()

    analizadas_inicio, pendientes_inicio = get_counts()
    total = analizadas_inicio + pendientes_inicio
    print(f"🔍 Enricher iniciado")
    print(f"   Analizadas: {analizadas_inicio} / {total} ({round(100*analizadas_inicio/total)}%)")
    print(f"   Pendientes: {pendientes_inicio}")

    if args.batch:
        ok, err = procesar_ayudas(args.batch, args.dry_run, args.reset)
        a, p = get_counts()
        print(f"\n✅ Completado: {ok} OK, {err} errores | Total analizadas: {a}/{total} ({round(100*a/total)}%)")

    elif args.all:
        lote = 1
        send_email(
            f"🚀 Enricher iniciado — {pendientes_inicio} ayudas pendientes",
            f"El proceso de enriquecimiento ha arrancado.\n\nAnalizadas: {analizadas_inicio}/{total}\nPendientes: {pendientes_inicio}\n\nRata: ~{LOTE_SIZE} ayudas por lote."
        )

        while True:
            a, p = get_counts()
            if p == 0:
                send_email(
                    "✅ Enricher completado — Todas las ayudas analizadas",
                    f"El proceso ha finalizado.\n\nTotal analizadas: {a}/{total} (100%)\nNinguna ayuda pendiente."
                )
                print("\n🎉 Todas las ayudas procesadas.")
                break

            print(f"\n{'='*50}")
            print(f"Lote {lote} — {p} pendientes ({round(100*a/total)}% completado)")
            n_este_lote = min(LOTE_SIZE, p)
            ok, err = procesar_ayudas(n_este_lote, args.dry_run, args.reset)

            a_new, p_new = get_counts()
            pct = round(100 * a_new / total)

            send_email(
                f"📦 Lote {lote} completado — {a_new}/{total} ayudas ({pct}%)",
                f"Lote {lote} finalizado.\n\n"
                f"  ✅ OK:    {ok}\n"
                f"  ❌ Err:   {err}\n"
                f"  📊 Total analizadas: {a_new}/{total} ({pct}%)\n"
                f"  ⏳ Pendientes: {p_new}\n\n"
                f"{'El proceso ha terminado.' if p_new == 0 else 'Continuando con el siguiente lote...'}"
            )

            lote += 1
            if p_new > 0:
                print("  Pausa 10s antes del siguiente lote...")
                time.sleep(10)

    else:
        print("Usa --batch N o --all")


if __name__ == "__main__":
    main()
