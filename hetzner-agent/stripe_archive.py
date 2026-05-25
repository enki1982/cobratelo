import os, json, urllib.request, urllib.parse, base64

SK = os.environ.get("STRIPE_API_KEY", "")
auth = base64.b64encode(f"{SK}:".encode()).decode()
headers = {
    "Authorization": f"Basic {auth}",
    "Content-Type": "application/x-www-form-urlencoded"
}

TO_ARCHIVE = [
    "price_1TZAIyRcjgMq3SnypaEC0HA7",
    "price_1TZAIeRcjgMq3SnykxHk4jpU",
    "price_1TZAIJRcjgMq3SnyxE6pbqDd",
    "price_1TYOilRcjgMq3SnyIqNXpar7",
]

for pid in TO_ARCHIVE:
    body = urllib.parse.urlencode({"active": "false"}).encode()
    req = urllib.request.Request(
        f"https://api.stripe.com/v1/prices/{pid}",
        data=body, method="POST", headers=headers
    )
    try:
        r = urllib.request.urlopen(req)
        result = json.loads(r.read())
        print(f"✅ {pid} archivado — active={result.get('active')}")
    except urllib.error.HTTPError as e:
        err = json.loads(e.read().decode())
        print(f"❌ {pid} — {e.code}: {err.get('error',{}).get('message','?')}")
    except Exception as e:
        print(f"❌ {pid} — {e}")
