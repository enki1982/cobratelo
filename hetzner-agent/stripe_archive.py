import os, json, urllib.request, urllib.parse, base64

SK = os.environ.get("STRIPE_API_KEY", "")
if not SK:
    print("ERROR: STRIPE_API_KEY no disponible")
    exit(1)

# Stripe usa Basic Auth: base64(SK:)
auth = base64.b64encode(f"{SK}:".encode()).decode()
headers = {"Authorization": f"Basic {auth}", "Content-Type": "application/x-www-form-urlencoded"}

KEEP = ["price_1TatI9RcjgMq3SnyPhsdIxYC", "price_1TatJ8RcjgMq3Sny71IyZJGr"]

req = urllib.request.Request(
    "https://api.stripe.com/v1/prices?limit=20&active=true&expand[]=data.product",
    headers=headers
)
data = json.loads(urllib.request.urlopen(req).read())

print("=== PRECIOS ACTIVOS ===")
to_archive = []
for p in data.get("data", []):
    amt = p.get("unit_amount", 0) // 100
    nm = p.get("product", {}).get("name", "?") if isinstance(p.get("product"), dict) else "?"
    tag = "MANTENER" if p["id"] in KEEP else "ARCHIVAR"
    print(f"  {amt}EUR | {nm} | {p['id']} [{tag}]")
    if p["id"] not in KEEP:
        to_archive.append(p["id"])

print(f"\n=== ARCHIVANDO {len(to_archive)} PRECIOS ===")
for pid in to_archive:
    body = urllib.parse.urlencode({"active": "false"}).encode()
    req2 = urllib.request.Request(
        f"https://api.stripe.com/v1/prices/{pid}",
        data=body, method="POST", headers=headers
    )
    try:
        r = urllib.request.urlopen(req2)
        result = json.loads(r.read())
        print(f"  {pid} -> Archivado OK (active={result.get('active')})")
    except urllib.error.HTTPError as e:
        body_err = e.read().decode()
        print(f"  {pid} -> Error {e.code}: {body_err[:200]}")

print("\n=== HECHO ===")
