"""
Debug script — calls sentiment API and prints exact data structure
so we can see what the JS is receiving.
"""
import requests, json

API = "http://localhost:5000"
CHANNEL_ID   = "UCAxTVjkczLTAVRiwivm-z8g"   # Think Again With Harsh
CHANNEL_NAME = "Think Again With Harsh"

print("Calling /api/sentiment/analyze ...")
r = requests.get(f"{API}/api/sentiment/analyze",
                 params={"channel_id": CHANNEL_ID, "channel_name": CHANNEL_NAME},
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
        print(f"  {k}: list[{len(v)}]", json.dumps(v[:2], indent=2)[:200] if v else "[]")
    elif isinstance(v, dict):
        print(f"  {k}:", json.dumps(v, indent=2)[:300])
    else:
        print(f"  {k}:", v)

print("\n=== youtube_sentiment ===")
yt = data.get("youtube_sentiment", {})
print(json.dumps({k: v for k, v in yt.items() if k not in ("top_positive_comments","top_negative_comments")}, indent=2))
print("top_positive_comments count:", len(yt.get("top_positive_comments", [])))
print("top_negative_comments count:", len(yt.get("top_negative_comments", [])))
if yt.get("top_positive_comments"):
    print("  Sample pos comment:", json.dumps(yt["top_positive_comments"][0], indent=2))
if yt.get("top_negative_comments"):
    print("  Sample neg comment:", json.dumps(yt["top_negative_comments"][0], indent=2))

print("\n=== news_sentiment ===")
ns = data.get("news_sentiment", {})
print(json.dumps(ns, indent=2)[:500])

print("\n=== sentiment_over_time (first 3 entries) ===")
sot = data.get("sentiment_over_time", [])
print(f"Total entries: {len(sot)}")
print(json.dumps(sot[:3], indent=2))

print("\n=== word_frequency (first 5) ===")
wf = data.get("word_frequency", [])
print(f"Total words: {len(wf)}")
print(json.dumps(wf[:5], indent=2))

print("\n=== reddit_connected ===", data.get("reddit_connected"))
