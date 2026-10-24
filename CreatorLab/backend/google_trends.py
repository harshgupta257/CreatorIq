"""
CreatorIQ — Google Trends Analyzer (pytrends) + channel topic helpers
"""

import json
import logging
import re
import time
from collections import Counter, defaultdict

import shared_store

logger = logging.getLogger("creatoriq.trends")

# ── optional import ────────────────────────────────────────────────────────────
try:
    from pytrends.request import TrendReq
    _PYTRENDS_AVAILABLE = True
except ImportError:
    _PYTRENDS_AVAILABLE = False
    logger.warning("pytrends not installed; Google Trends disabled.")


# ══════════════════════════════════════════════════════════════════════════════
#  Topic extraction (from a channel's videos)
# ══════════════════════════════════════════════════════════════════════════════
# Common words that are not useful search topics
_TOPIC_STOPWORDS = {
    "the","and","for","with","how","what","this","that","are","you",
    "your","new","our","why","was","has","its","get","can","but","not",
    "have","from","they","will","been","more","than","also","just","into",
    "about","when","there","their","which","would","could","should",
    "a","an","in","on","of","to","is","it","at","by","be","or","my","me","i",
    # Hindi romanized stopwords
    "kya","hai","kyu","kyun","aap","main","mera","mere","kaise","kab",
    "yeh","iska","uska","hain","bhi","unka","wala","wali","nahi","iske",
    # Generic YouTube/video words
    "video","videos","hindi","english","channel","part","full","short","shorts",
    "live","subscribe","like","share","comment","watch","today","vlog","official",
    "2023","2024","2025","2026","2027",
}

# Generic words that inflate counts but carry no topic signal
_TOPIC_BLACKLIST = {
    "interstellar","inspired","think","yourself","leave","stop",
    "back","time","again","know","good","great","best","mind",
    "real","true","life","love","feel","make","work","need",
    "past","future","reality","people","world","human","things",
    "thing","does","doing","being","become","always",
    "never","every","other","power","point","right","wrong",
    "words","word","idea","each","even","still","only",
    "them","then","here","mine","episode","explained",
    "tips","ways","type","kind","fact","story",
    "show","talk","tell","said","says","ask","answer","read",
}

_MAX_PHRASE_WORDS = 4


def _norm(text: str) -> str:
    return " ".join(re.sub(r"[^\w\s'-]", " ", text.lower()).split())


def _significant_words(text: str) -> list[str]:
    return [w for w in _norm(text).split()
            if len(w) > 2 and w not in _TOPIC_STOPWORDS and not w.isdigit()]


def _is_useful_phrase(phrase: str, channel_name: str) -> bool:
    words = phrase.split()
    if not words or len(words) > _MAX_PHRASE_WORDS or len(phrase) < 3:
        return False
    sig = [w for w in _significant_words(phrase) if w not in _TOPIC_BLACKLIST]
    if not sig:
        return False
    # The channel's own name is not a topic
    squashed = phrase.replace(" ", "")
    return not (channel_name and (squashed in channel_name or channel_name in squashed))


def _overlaps(a: str, b: str) -> bool:
    """True if one phrase contains the other ("python" vs "python tutorial")."""
    return f" {a} " in f" {b} " or f" {b} " in f" {a} "


def extract_topic_phrases(videos: list[dict], channel_name: str = "", top_n: int = 3) -> list[str]:
    """
    The channel's main topics as whole search phrases ("python tutorial",
    not "tutorial"). Tags are ranked by how many videos use them, then by the
    views those videos earned; titles are used when a channel has no tags.
    """
    channel = _norm(channel_name).replace(" ", "")
    freq: Counter = Counter()
    views: Counter = Counter()
    for v in videos:
        seen = {_norm(t) for t in (v.get("tags") or [])}
        for tag in seen:
            if _is_useful_phrase(tag, channel):
                freq[tag] += 1
                views[tag] += v.get("view_count", 0)

    min_freq = 2 if len(videos) >= 5 else 1
    # Alphabetical tie-break keeps the order identical in every worker process
    # (set iteration order varies with hash randomisation)
    ranked = sorted((t for t in freq if freq[t] >= min_freq),
                    key=lambda t: (-freq[t], -views[t], t))

    if not ranked:
        # No usable tags: fall back to two-word phrases from titles
        def keep(w: str) -> bool:
            return len(w) > 2 and w not in _TOPIC_STOPWORDS and w not in _TOPIC_BLACKLIST and not w.isdigit()

        bigrams: Counter = Counter()
        for v in videos:
            words = _norm(v.get("title") or "").split()
            # Only words that are actually adjacent in the title
            bigrams.update({f"{a} {b}" for a, b in zip(words, words[1:]) if keep(a) and keep(b)})
        ranked = [p for p, c in sorted(bigrams.items(), key=lambda pc: (-pc[1], pc[0]))[:20]
                  if c >= min_freq and _is_useful_phrase(p, channel)]

    picked: list[str] = []
    for phrase in ranked:
        if not any(_overlaps(phrase, p) for p in picked):
            picked.append(phrase)
        if len(picked) == top_n:
            break
    return picked


def tag_word_frequency(videos: list[dict], top_n: int = 25) -> list[dict]:
    """Word frequency across video tags, for the channel topic profile."""
    counter: Counter = Counter(
        word
        for v in videos
        for tag in (v.get("tags") or [])
        for word in _significant_words(tag)
        if word not in _TOPIC_BLACKLIST and word.isalpha()
    )
    return [{"word": w, "count": c} for w, c in counter.most_common(top_n)]


def find_content_gaps(
    channel_videos: list[dict],
    niche_topics: list[dict],
    rising_queries: list[dict],
    limit: int = 8,
) -> list[dict]:
    """
    Topics people are watching or searching for that this channel has not
    covered: tags shared by several hot niche videos from other channels, and
    Google "rising" searches. A topic counts as covered when all its main
    words already appear in the channel's titles or tags.
    """
    covered_words = set()
    for v in channel_videos:
        covered_words.update(_significant_words(v.get("title") or ""))
        for tag in (v.get("tags") or []):
            covered_words.update(_significant_words(tag))

    def is_covered(phrase: str) -> bool:
        words = [w for w in _significant_words(phrase) if w not in _TOPIC_BLACKLIST]
        return not words or all(w in covered_words for w in words)

    gaps: list[dict] = []

    # 1. Tags that recur across hot videos in the niche
    tag_videos: dict[str, dict[str, dict]] = defaultdict(dict)
    for topic in niche_topics:
        for v in topic.get("videos", []):
            for tag in {_norm(t) for t in (v.get("tags") or [])}:
                if _is_useful_phrase(tag, ""):
                    tag_videos[tag][v["video_id"]] = v
    niche_candidates = []
    for tag, vids in tag_videos.items():
        channels = {v.get("channel_id") for v in vids.values()}
        if len(vids) >= 2 and len(channels) >= 2 and not is_covered(tag):
            top = max(vids.values(), key=lambda v: v.get("view_count", 0))
            niche_candidates.append({
                "topic":       tag,
                "source":      "youtube_niche",
                "video_count": len(vids),
                "total_views": sum(v.get("view_count", 0) for v in vids.values()),
                "example":     {"video_id": top["video_id"], "title": top["title"],
                                "channel_title": top.get("channel_title", ""),
                                "view_count": top.get("view_count", 0)},
            })
    niche_candidates.sort(key=lambda g: g["total_views"], reverse=True)

    picked: list[str] = []
    for g in niche_candidates:
        if not any(_overlaps(g["topic"], p) for p in picked):
            gaps.append(g)
            picked.append(g["topic"])

    # 2. Rising Google searches the channel has not covered
    for q in rising_queries:
        text = " ".join(str(q.get("query", "")).lower().split())   # shown as searched
        key = _norm(text)
        if key and not is_covered(key) and not any(_overlaps(key, p) for p in picked):
            gaps.append({"topic": text, "source": "google_rising", "growth": q.get("value")})
            picked.append(key)

    return gaps[:limit]


# ══════════════════════════════════════════════════════════════════════════════
#  Google Trends client
# ══════════════════════════════════════════════════════════════════════════════
_TRENDS_TTL_SECS = 6 * 3600          # trends move slowly; cache successful results
_RATE_LIMITED_TTL_SECS = 10 * 60     # back off from Google after a 429


def _is_rate_limit(exc: Exception) -> bool:
    text = str(exc).lower()
    return "429" in text or "too many" in text or "TooManyRequests" in type(exc).__name__


class GoogleTrendsAnalyzer:
    """
    Wraps pytrends (an unofficial Google Trends client). Google throttles it,
    especially from cloud servers, so results are cached and every method
    degrades to "no data" rather than failing.
    """

    _MAX_ATTEMPTS = 2
    _BACKOFF_SECS = 3
    _INIT_RETRY_SECS = 60  # wait between attempts to create the client

    def __init__(self):
        self._pytrends = None
        self._last_init_attempt = 0.0
        self._init_client()

    def _init_client(self) -> None:
        """Create the pytrends client (it fetches Google cookies, so it can fail)."""
        if not _PYTRENDS_AVAILABLE:
            return
        self._last_init_attempt = time.monotonic()
        try:
            # retries/backoff must stay 0: pytrends 4.9.2 passes `method_whitelist`
            # to urllib3's Retry, which urllib3 2.x rejects, so every request
            # would fail. Rate limits are retried in _build_payload instead.
            self._pytrends = TrendReq(hl="en-US", tz=0, timeout=(5, 15), retries=0, backoff_factor=0)
            logger.info("pytrends client ready.")
        except Exception as exc:
            logger.warning("pytrends init failed: %s — will retry later.", exc)

    # ── internal ───────────────────────────────────────────────────────────────
    def _has_api(self) -> bool:
        # This instance is shared for the life of the process, so a failed
        # start must not disable Trends until the next restart: retry it.
        if (
            self._pytrends is None
            and time.monotonic() - self._last_init_attempt >= self._INIT_RETRY_SECS
        ):
            self._init_client()
        return self._pytrends is not None

    def _build_payload(self, keywords: list[str], timeframe: str, gprop: str) -> None:
        """Build the request payload, retrying once after a short pause on 429."""
        for attempt in range(self._MAX_ATTEMPTS):
            try:
                self._pytrends.build_payload(keywords, timeframe=timeframe, geo="", gprop=gprop)
                return
            except Exception as exc:
                if not _is_rate_limit(exc) or attempt == self._MAX_ATTEMPTS - 1:
                    raise
                logger.warning("Google Trends rate limited — retrying in %ds.", self._BACKOFF_SECS)
                time.sleep(self._BACKOFF_SECS)

    # ── public API ─────────────────────────────────────────────────────────────
    def get_trends(self, keywords: list[str], timeframe: str = "today 3-m", gprop: str = "youtube") -> dict:
        """
        Interest over time, related queries and interest by country for up to
        five keywords, from a single payload. gprop="youtube" measures YouTube
        searches rather than web searches.

        Returns {status, interest_over_time, keywords_in_data, related, geo, cached}
        where status is "ok", "no_data", "rate_limited" or "unavailable".
        """
        kws = [k for k in keywords if k][:5]
        result = {"status": "no_data", "interest_over_time": [], "keywords_in_data": [],
                  "related": {"top": [], "rising": []}, "geo": [], "cached": False}
        if not kws:
            return result

        cache_key = json.dumps([kws, timeframe, gprop])
        cached = shared_store.cache_get("gtrends", cache_key, _TRENDS_TTL_SECS)
        if cached is not None:
            if cached["status"] != "rate_limited" or shared_store.cache_get(
                "gtrends", cache_key, _RATE_LIMITED_TTL_SECS
            ) is not None:
                return {**cached, "cached": True}

        if not self._has_api():
            return {**result, "status": "unavailable"}

        try:
            self._build_payload(kws, timeframe, gprop)
        except Exception as exc:
            limited = _is_rate_limit(exc)
            logger.warning("Google Trends payload failed: %s", exc)
            result["status"] = "rate_limited" if limited else "unavailable"
            if limited:
                shared_store.cache_set("gtrends", cache_key, result)
            return result

        rate_limited = False
        hourly = timeframe.startswith("now")

        # 1. Interest over time — one column per keyword
        try:
            df = self._pytrends.interest_over_time()
            if df is not None and not df.empty:
                fmt = "%Y-%m-%dT%H:%M" if hourly else "%Y-%m-%d"
                rows = [{"date": ts.strftime(fmt), **{kw: int(row.get(kw, 0)) for kw in kws}}
                        for ts, row in df.iterrows()]
                # Only chart keywords with a meaningful signal (flat lines add noise)
                with_signal = [kw for kw in kws if max((r[kw] for r in rows), default=0) > 3]
                if with_signal:
                    result["interest_over_time"] = rows
                    result["keywords_in_data"] = with_signal
        except Exception as exc:
            rate_limited |= _is_rate_limit(exc)
            logger.warning("interest_over_time failed: %s", exc)

        # 2. Related queries — merged across all keywords
        try:
            related = self._pytrends.related_queries() or {}
            for kind in ("top", "rising"):
                merged: dict[str, dict] = {}
                for kw in kws:
                    df = (related.get(kw) or {}).get(kind)
                    if df is None or df.empty:
                        continue
                    for _, row in df.iterrows():
                        q = str(row["query"])
                        val = int(row["value"])
                        if q not in merged or val > merged[q]["value"]:
                            merged[q] = {"query": q, "value": val, "keyword": kw}
                result["related"][kind] = sorted(merged.values(), key=lambda r: r["value"], reverse=True)[:10]
        except Exception as exc:
            rate_limited |= _is_rate_limit(exc)
            logger.warning("related_queries failed: %s", exc)

        # 3. Interest by country (average across keywords), with ISO codes for flags
        try:
            df = self._pytrends.interest_by_region(resolution="COUNTRY", inc_low_vol=False, inc_geo_code=True)
            if df is not None and not df.empty:
                cols = [kw for kw in kws if kw in df.columns]
                geo = []
                for name, row in df.iterrows():
                    value = round(sum(int(row[c]) for c in cols) / max(1, len(cols)))
                    if value > 0:
                        geo.append({"country": str(name), "code": str(row.get("geoCode", "")), "value": value})
                result["geo"] = sorted(geo, key=lambda g: g["value"], reverse=True)[:10]
        except Exception as exc:
            rate_limited |= _is_rate_limit(exc)
            logger.warning("interest_by_region failed: %s", exc)

        has_data = bool(result["interest_over_time"] or result["related"]["top"]
                        or result["related"]["rising"] or result["geo"])
        result["status"] = "ok" if has_data else ("rate_limited" if rate_limited else "no_data")
        shared_store.cache_set("gtrends", cache_key, result)
        return result

    def get_rising_topics(self, category: str = "entertainment") -> list[dict]:
        """
        Get currently trending topics (best-effort; pytrends trending_searches).
        Returns an empty list on any error — never placeholder topics.
        """
        if not self._has_api():
            return []

        try:
            df = self._pytrends.trending_searches(pn="united_states")
            topics = df[0].tolist()[:10]
            return [{"topic": t, "growth": "trending"} for t in topics]
        except Exception as exc:
            logger.warning("get_rising_topics error: %s", exc)
            return []
