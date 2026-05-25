#!/usr/bin/env python3
"""
cobratelo.es — Centro de Control
Uso: python3 control.py <comando> [args]

Comandos disponibles:
  stats              — Resumen general: usuarios, ayudas, suscripciones
  usuarios           — Lista usuarios registrados
  ayudas             — Resumen ayudas en BD
  suscripciones      — Suscripciones activas en Stripe
  deploy             — Forzar redeploy en Vercel
  env_get <key>      — Leer variable de entorno de Vercel
  env_set <k> <v>    — Actualizar variable de entorno en Vercel
  sql <query>        — Ejecutar SQL en Supabase
  stripe_productos   — Listar productos Stripe
  stripe_ingresos    — MRR y ARR estimados
  servidor           — Info del VPS Hetzner
  backfill           — Lanzar backfill de URLs del agente
  ingesta            — Lanzar ingesta de nuevas ayudas
  vault              — Mostrar credenciales del vault
"""

import os, sys, json, requests
from datetime import datetime
from supabase import create_client

# ── Credenciales ──────────────────────────────────────────────────────────────
SUPABASE_URL      = os.environ.get("SUPABASE_URL")
SUPABASE_KEY      = os.environ.get("SUPABASE_SERVICE_KEY")
VERCEL_TOKEN      = os.environ.get("VERCEL_TOKEN")
STRIPE_SK         = os.environ.get("STRIPE_SECRET_KEY")
HETZNER_API       = os.environ.get("HETZNER_API_TOKEN")
FORWARD_EMAIL_API = os.environ.get("FORWARD_EMAIL_API")
ANTHROPIC_KEY     = os.environ.get("ANTHROPIC_API_KEY")

VERCEL_PROJECT    = "prj_cobratelo"  # actualizar con el ID real del proyecto
VERCEL_BASE       = "https://api.vercel.com"
STRIPE_BASE       = "https://api.stripe.com/v1"
HETZNER_BASE      = "https://api.hetzner.cloud/v1"

def sb():
    return create_client(SUPABASE_URL, SUPABASE_KEY)

def stripe(endpoint, method="GET", data=None):
    r = requests.request(method, f"{STRIPE_BASE}/{endpoint}",
        auth=(STRIPE_SK, ""), data=data)
    return r.json()

def vercel(endpoint, method="GET", json_data=None):
    r = requests.request(method, f"{VERCEL_BASE}{endpoint}",
        headers={"Authorization": f"Bearer {VERCEL_TOKEN}"},
        json=json_data)
    return r.json()

def hetzner(endpoint):
    r = requests.get(f"{HETZNER_BASE}/{endpoint}",
        headers={"Authorization": f"Bearer {HETZNER_API}"})
    return r.json()

def hr():
    print("─" * 50)

# ── COMANDOS ──────────────────────────────────────────────────────────────────

def cmd_stats():
    print("\n📊 COBRATELO.ES — RESUMEN")
    hr()
    db = sb()

    # Usuarios
    users = db.table("usuarios").select("*", count="exact").execute()
    total_users = users.count or 0
    con_perfil  = len([u for u in (users.data or []) if u.get("perfil") and len(u["perfil"]) > 0])
    pagando     = len([u for u in (users.data or []) if u.get("plan") not in ("free", None, "")])
    print(f"👥 Usuarios totales:    {total_users}")
    print(f"   Con perfil completo: {con_perfil}")
    print(f"   Con plan de pago:    {pagando}")

    # Ayudas
    ayudas = db.table("ayudas").select("*", count="exact").execute()
    total_ayudas = ayudas.count or 0
    con_url = len([a for a in (ayudas.data or []) if a.get("url_oficial")])
    print(f"\n📋 Ayudas en BD:        {total_ayudas}")
    print(f"   Con URL oficial:     {con_url}")
    print(f"   Sin URL (pendiente): {total_ayudas - con_url}")

    # Stripe
    if STRIPE_SK:
        subs = stripe("subscriptions?status=active&limit=100")
        n_subs = len(subs.get("data", []))
        mrr = sum(
            s["items"]["data"][0]["price"]["unit_amount"] / 100
            for s in subs.get("data", [])
            if s.get("items", {}).get("data")
        )
        print(f"\n💳 Suscripciones activas: {n_subs}")
        print(f"   MRR estimado:          {mrr:.0f}€")
        print(f"   ARR estimado:          {mrr * 12:.0f}€")
    hr()

def cmd_usuarios():
    print("\n👥 USUARIOS")
    hr()
    db = sb()
    from supabase import create_client
    import anthropic as _a
    users_raw = db.auth.admin.list_users()
    db2 = sb()
    perfiles = {u["id"]: u for u in (db2.table("usuarios").select("id,plan,perfil,created_at").execute().data or [])}

    for user in (users_raw.users if hasattr(users_raw, 'users') else []):
        p = perfiles.get(user.id, {})
        plan = p.get("plan", "free") or "free"
        tiene_perfil = bool(p.get("perfil") and len(p.get("perfil", {})) > 0)
        print(f"  {user.email:<35} plan={plan:<10} perfil={'✅' if tiene_perfil else '❌'}  reg={str(user.created_at)[:10]}")
    hr()

def cmd_ayudas():
    print("\n📋 AYUDAS EN BD")
    hr()
    db = sb()
    data = db.table("ayudas").select("nombre,organismo,ambito,estado,url_oficial").order("created_at", desc=True).limit(20).execute()
    for a in (data.data or []):
        url = "✅" if a.get("url_oficial") else "❌"
        print(f"  {url} [{a.get('ambito','?')[:3]}] {a.get('nombre','?')[:50]}")
    print(f"\n  (mostrando 20 más recientes)")
    hr()

def cmd_deploy():
    print("\n🚀 REDEPLOY VERCEL")
    hr()
    # Obtener el proyecto
    projects = vercel("/v9/projects?teamId=miquels-projects-ca486332")
    cobratelo = next((p for p in projects.get("projects", []) if "cobratelo" in p.get("name", "")), None)
    if not cobratelo:
        print("❌ Proyecto cobratelo no encontrado")
        return
    pid = cobratelo["id"]
    # Obtener último deployment
    deploys = vercel(f"/v6/deployments?projectId={pid}&limit=1&teamId=miquels-projects-ca486332")
    last = deploys.get("deployments", [{}])[0]
    if not last:
        print("❌ No hay deployments previos")
        return
    # Crear nuevo deployment desde el mismo commit
    result = vercel("/v13/deployments", method="POST", json_data={
        "name": "cobratelo",
        "gitSource": {
            "type": "github",
            "repoId": last.get("meta", {}).get("githubRepoId"),
            "ref": "main",
            "sha": last.get("meta", {}).get("githubCommitSha")
        },
        "teamId": "miquels-projects-ca486332"
    })
    print(f"✅ Deploy iniciado: {result.get('url', result.get('id', '?'))}")
    hr()

def cmd_env_get(key=None):
    print(f"\n🔧 ENV VARS VERCEL" + (f" — {key}" if key else ""))
    hr()
    projects = vercel("/v9/projects?teamId=miquels-projects-ca486332")
    cobratelo = next((p for p in projects.get("projects", []) if "cobratelo" in p.get("name", "")), None)
    if not cobratelo:
        print("❌ Proyecto no encontrado")
        return
    pid = cobratelo["id"]
    envs = vercel(f"/v9/projects/{pid}/env?teamId=miquels-projects-ca486332")
    for e in envs.get("envs", []):
        if not key or key.lower() in e.get("key", "").lower():
            print(f"  {e.get('key'):<40} [{e.get('type')}]")
    hr()

def cmd_sql(query):
    print(f"\n🗄️  SQL")
    hr()
    print(f"Query: {query}")
    # Supabase no tiene SQL directo via REST para queries arbitrarias
    # Usamos el cliente Python
    db = sb()
    # Parsear query simple
    q = query.strip().lower()
    if q.startswith("select"):
        # Extraer tabla
        import re
        m = re.search(r'from\s+(\w+)', q)
        if m:
            tabla = m.group(1)
            result = db.table(tabla).select("*").limit(20).execute()
            for row in (result.data or []):
                print(json.dumps(row, default=str, ensure_ascii=False))
    else:
        print("⚠️  Solo SELECT soportado via control.py. Para DDL usa el SQL Editor de Supabase.")
    hr()

def cmd_stripe_productos():
    print("\n💳 PRODUCTOS STRIPE")
    hr()
    products = stripe("products?active=true&limit=20")
    for p in products.get("data", []):
        prices = stripe(f"prices?product={p['id']}&active=true")
        for price in prices.get("data", []):
            amount = price.get("unit_amount", 0) / 100
            interval = price.get("recurring", {}).get("interval", "one_time")
            print(f"  {p['name']:<30} {amount:.0f}€/{interval}  id={price['id']}")
    hr()

def cmd_stripe_ingresos():
    print("\n💰 INGRESOS STRIPE")
    hr()
    subs = stripe("subscriptions?status=active&limit=100")
    data = subs.get("data", [])
    mrr = 0
    by_plan = {}
    for s in data:
        items = s.get("items", {}).get("data", [])
        if items:
            price = items[0]["price"]
            amount = price.get("unit_amount", 0) / 100
            name = price.get("nickname") or price.get("id", "?")
            mrr += amount
            by_plan[name] = by_plan.get(name, {"n": 0, "mrr": 0})
            by_plan[name]["n"] += 1
            by_plan[name]["mrr"] += amount

    for plan, info in by_plan.items():
        print(f"  {plan:<20} {info['n']} subs  {info['mrr']:.0f}€/mes")
    print(f"\n  MRR total:  {mrr:.0f}€")
    print(f"  ARR total:  {mrr * 12:.0f}€")
    hr()

def cmd_servidor():
    print("\n🖥️  SERVIDOR HETZNER")
    hr()
    servers = hetzner("servers")
    for s in servers.get("servers", []):
        status = s.get("status")
        name = s.get("name")
        ip = s.get("public_net", {}).get("ipv4", {}).get("ip")
        server_type = s.get("server_type", {}).get("name")
        datacenter = s.get("datacenter", {}).get("location", {}).get("name")
        print(f"  Nombre:     {name}")
        print(f"  Estado:     {status}")
        print(f"  IP:         {ip}")
        print(f"  Tipo:       {server_type}")
        print(f"  Ubicación:  {datacenter}")
    # Espacio en disco
    import subprocess
    df = subprocess.run(["df", "-h", "/"], capture_output=True, text=True)
    print(f"\n  Disco:")
    for line in df.stdout.strip().split("\n")[1:]:
        print(f"    {line}")
    hr()

def cmd_backfill():
    import subprocess
    print("\n🔄 BACKFILL URLs")
    hr()
    result = subprocess.run(
        ["python3", "agent.py", "backfill"],
        cwd="/root/ayuda-es-agent",
        capture_output=False  # muestra logs en tiempo real
    )
    hr()

def cmd_ingesta():
    import subprocess
    print("\n📥 INGESTA NUEVAS AYUDAS")
    hr()
    result = subprocess.run(
        ["python3", "agent.py", "ingesta"],
        cwd="/root/ayuda-es-agent",
        capture_output=False
    )
    hr()

def cmd_vault():
    print("\n🔐 VAULT")
    hr()
    try:
        with open("/root/.ark/v.txt") as f:
            print(f.read())
    except:
        print("❌ Vault no encontrado en /root/.ark/v.txt")
    hr()

# ── MAIN ──────────────────────────────────────────────────────────────────────

COMMANDS = {
    "stats":            (cmd_stats, []),
    "usuarios":         (cmd_usuarios, []),
    "ayudas":           (cmd_ayudas, []),
    "deploy":           (cmd_deploy, []),
    "env_get":          (cmd_env_get, ["key?"]),
    "sql":              (cmd_sql, ["query"]),
    "stripe_productos": (cmd_stripe_productos, []),
    "stripe_ingresos":  (cmd_stripe_ingresos, []),
    "servidor":         (cmd_servidor, []),
    "backfill":         (cmd_backfill, []),
    "ingesta":          (cmd_ingesta, []),
    "vault":            (cmd_vault, []),
}

if __name__ == "__main__":
    if len(sys.argv) < 2 or sys.argv[1] in ("-h", "--help", "help"):
        print(__doc__)
        sys.exit(0)

    cmd = sys.argv[1]
    args = sys.argv[2:]

    if cmd not in COMMANDS:
        print(f"❌ Comando desconocido: {cmd}")
        print(f"   Disponibles: {', '.join(COMMANDS.keys())}")
        sys.exit(1)

    fn, _ = COMMANDS[cmd]
    print(f"\n[{datetime.now().strftime('%H:%M:%S')}] cobratelo control — {cmd}")

    try:
        if args:
            fn(*args)
        else:
            fn()
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
