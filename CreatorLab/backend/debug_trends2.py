"""
Debug: what keywords does the backend extract for this channel?
And what does pytrends actually return for those keywords?
"""
import sys
sys.path.insert(0, '.')

from youtube_api import YouTubeAnalyzer
from google_trends import GoogleTrendsAnalyzer
from collections import Counter
import json

CHANNEL_ID = "UCAxTVjkczLTAVRiwivm-z8g"

# Step 1: Get videos + extract keywords
print("=== Step 1: Fetching videos ===")
yt     = YouTubeAnalyzer()
videos = yt.get_channel_videos(CHANNEL_ID, max_results=20)
print(f"Got {len(videos)} videos")

tag_counter: Counter = Counter()
STOPWORDS = {"the","and","for","with","how","what","this","that","are","you",
             "your","new","our","why","was","has","its","get","can","but","kya","hai"}

for v in videos:
    print(f"  Title: {v.get('title', '')[:60]}")
    print(f"  Tags:  {v.get('tags', [])}")
    for tag in (v.get("tags") or []):
        tag = tag.strip().lower()
        if 3 < len(tag) < 30 and tag not in {"youtube", "video", "hindi", "english"}:
            tag_counter[tag] += 1
    for word in (v.get("title") or "").lower().split():
        word = word.strip(".,!?-\"'#@")
        if len(word) > 3 and word not in STOPWORDS:
            tag_counter[word] += 1

print("\n=== Top keywords extracted ===")
for k, v in tag_counter.most_common(10):
    print(f"  {k!r}: {v}")

top_tags = [tag for tag, _ in tag_counter.most_common(3)]
print(f"\nWill use: {top_tags}")

# Step 2: Test pytrends directly
if not top_tags:
    print("\nNo keywords extracted. Channel has no tags and titles are not keyword-rich.")
    exit(0)

keyword = top_tags[0]
print(f"\n=== Step 2: pytrends for '{keyword}' ===")
gt = GoogleTrendsAnalyzer()

print("  interest_over_time...")
iot = gt.get_interest_over_time(top_tags[:3], timeframe="today 3-m")
print(f"  Got {len(iot)} entries")
if iot:
    print(f"  First entry: {iot[0]}")
    print(f"  Last entry:  {iot[-1]}")
    # Check if it's demo data (starts in 2024)
    if iot[0].get('date', '').startswith('2024'):
        print("  ⚠️  THIS IS DEMO DATA (date starts 2024)")
    else:
        print("  ✅ This appears to be real data")

print("\n  related_queries...")
rel = gt.get_related_queries(keyword)
top_q = (rel or {}).get("top", [])
print(f"  Got {len(top_q)} top queries")
if top_q:
    print(f"  First: {top_q[0]}")

print("\n  geographic_interest...")
geo = gt.get_geographic_interest(keyword)
print(f"  Got {len(geo)} countries")
geo_items = sorted(geo.items(), key=lambda x: -x[1])[:5]
for code, val in geo_items:
    print(f"  {code}: {val}")
if geo_items and geo_items[0][0] in ("US", "GB", "CA", "AU", "IN"):
    # Check if it matches demo data exactly
    from google_trends import _DEMO_GEO
    if geo == _DEMO_GEO:
        print("  ⚠️  THIS IS DEMO GEO DATA")
    else:
        print("  ✅ This appears to be real geo data")
