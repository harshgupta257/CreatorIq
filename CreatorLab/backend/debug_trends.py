"""
Debug script — inspect exact trends API response structure.
"""
import requests, json

API = "http://localhost:5000"
CHANNEL_NAME = "Think Again With Harsh"

print(f"Calling /api/trends?query={CHANNEL_NAME} ...")
r = requests.get(f"{API}/api/trends",
                 params={"query": CHANNEL_NAME},
                 timeout=60)
print("Status:", r.status_code)
d = r.json()

if not d.get("success"):
    print("FAILED:", d.get("error"))
    exit(1)

data = d["data"]

print("\n=== TOP-LEVEL KEYS ===")
for k, v in data.items():
    if isinstance(v, list):
        print(f"  {k}: list[{len(v)}]")
        if v:
            print("    First item:", json.dumps(v[0], indent=4, default=str)[:300])
    elif isinstance(v, dict):
        print(f"  {k}: dict keys={list(v.keys())}")
        print("    Value:", json.dumps(v, indent=4, default=str)[:400])
    else:
        print(f"  {k}:", v)

print("\n=== interest_over_time (first 3) ===")
iot = data.get("interest_over_time", [])
print(f"  Total entries: {len(iot)}")
if iot:
    print("  Sample:", json.dumps(iot[:3], indent=2, default=str))

print("\n=== related_queries ===")
rq = data.get("related_queries", {})
print("  Keys:", list(rq.keys()) if isinstance(rq, dict) else type(rq))
if isinstance(rq, dict):
    for section, items in rq.items():
        print(f"  [{section}] count={len(items) if isinstance(items, list) else '?'}")
        if isinstance(items, list) and items:
            print("    First:", json.dumps(items[0], indent=4, default=str)[:200])

print("\n=== geographic_interest ===")
geo = data.get("geographic_interest", {})
print("  Type:", type(geo).__name__)
print("  Keys:", list(geo.keys())[:10] if isinstance(geo, dict) else "")
if isinstance(geo, dict):
    for k, v in list(geo.items())[:5]:
        print(f"    {k}: {v}")
