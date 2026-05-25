import os, json, urllib.request, urllib.parse

SK = os.environ.get("STRIPE_API_KEY", "")
if not SK:
    print("ERROR: STRIPE_API_KEY no disponible")
    exit(1)

KEEP = ["price_1TatI9RcjgMq3SnyPhsdIxYC", "price_1TatJ8RcjgMq3Sny71IyZJGr"]

req = urllib.request.Request(
    "https://api.stripe.com/v1/prices?limit=20&active=true&expand[]=data.product",
    headers={"Authorization": f"Bearer {SK}"}
)
data = json.loads(urllib.request.urlopen(req).read())

print("=== PRECIOS ACTIVOS ===")
for p in data.get("data", []):
    amt = p.get("unit_amount", 0) // 100
    nm = p.get("product", {}).get("name", "?") if isinstance(p.get("product"), dict) else "?"
    tag = "MANTENER" if p["id"] in KEEP else "ARCHIVAR"
    print(f"  {amt}EUR | {nm} | {p['id']} [{tag}]")
    
    if p["id"] not in KEEP:
        body = urllib.parse.urlencode({"active": "false"}).encode()
        req2 = urllib.request.Request(
            f"https://api.stripe.com/v1/prices/{p['id']}",
            data=body, method="POST",
            headers={"Authorization": f"Bearer {SK}"}
        )
        try:
            urllib.request.urlopen(req2)
            print(f"    -> Archivado OK")
        except Exception as e:
            print(f"    -> Error: {e}")

print("\n=== HECHO ===")
