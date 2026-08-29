"""Quick keyword extraction test — shows what words get picked with fixed logic."""
import sys, os
os.environ["PYTHONUTF8"] = "1"
sys.stdout.reconfigure(encoding='utf-8')
sys.path.insert(0, '.')

from youtube_api import YouTubeAnalyzer
from collections import Counter

CHANNEL_ID = "UCAxTVjkczLTAVRiwivm-z8g"

yt     = YouTubeAnalyzer()
videos = yt.get_channel_videos(CHANNEL_ID, max_results=20)
print(f"Videos fetched: {len(videos)}")

STOPWORDS = {
    "the","and","for","with","how","what","this","that","are","you",
    "your","new","our","why","was","has","its","get","can","but","not",
    "have","from","they","will","been","more","than","also","just","into",
    "about","when","there","their","which","would","could","should",
    "kya","hai","kyu","kyun","aap","main","mera","mere","kaise","kab",
    "yeh","iska","uska","hain","bhi","unka","wala","wali","nahi","iske",
    "video","hindi","english","channel","part","full","short","live",
    "subscribe","like","share","comment","watch","today","2024","2025","2026",
}
BLACKLIST = {"interstellar","inspired","think","yourself","leave","stop",
             "back","time","again","know","good","great","best","mind",
             "real","true","life","love","feel","make","work","need"}

word_counter: Counter = Counter()
for v in videos:
    for tag in (v.get("tags") or []):
        for word in tag.lower().split():
            word = word.strip(".,!?-\"'#@|()")
            if len(word) > 3 and word not in STOPWORDS and word.isalpha():
                word_counter[word] += 1
    for word in (v.get("title") or "").lower().split():
        word = word.strip(".,!?-\"'#@|()?!")
        if len(word) > 3 and word not in STOPWORDS and word.isalpha():
            word_counter[word] += 1

print("\nAll eligible words:")
for w, c in word_counter.most_common(20):
    blacklisted = "(BLACKLISTED)" if w in BLACKLIST else ""
    print(f"  {w!r:25s} count={c} {blacklisted}")

best = [(w, c) for w, c in word_counter.most_common(30)
        if len(w) >= 4 and w not in BLACKLIST]
print(f"\nFinal top 3 keywords = {[w for w,_ in best[:3]]}")
