"""
CreatorIQ — Google Trends Analyzer (pytrends)
"""

import logging
import time

logger = logging.getLogger("creatoriq.trends")

# ── optional import ────────────────────────────────────────────────────────────
try:
    from pytrends.request import TrendReq
    from pytrends.exceptions import TooManyRequestsError
    _PYTRENDS_AVAILABLE = True
except ImportError:
    _PYTRENDS_AVAILABLE = False
    logger.warning("pytrends not installed; using demo data.")


# ══════════════════════════════════════════════════════════════════════════════
#  Demo / fallback data
# ══════════════════════════════════════════════════════════════════════════════
def _demo_interest() -> list[dict]:
    import random
    from datetime import date, timedelta
    rows = []
    d = date(2024, 1, 1)
    for _ in range(13):  # ~3 months weekly
        rows.append({"date": d.isoformat(), "value": random.randint(20, 100)})
        d += timedelta(weeks=1)
    return rows


_DEMO_RELATED = {
    "top": [
        {"query": "youtube analytics", "value": 100},
        {"query": "content creator tips", "value": 72},
        {"query": "youtube growth", "value": 61},
    ],
    "rising": [
        {"query": "shorts strategy", "value": 5000},
        {"query": "creator economy", "value": 3200},
    ],
}

_DEMO_GEO = {
    "US": 100, "GB": 78, "CA": 65, "AU": 54, "IN": 88,
    "DE": 42, "FR": 37, "BR": 51, "JP": 29, "MX": 44,
}

_DEMO_RISING = [
    {"topic": "AI content creation", "growth": "+900%"},
    {"topic": "YouTube Shorts monetisation", "growth": "+450%"},
    {"topic": "Podcast video format", "growth": "+320%"},
    {"topic": "Creator funds 2024", "growth": "+280%"},
    {"topic": "Live streaming tips", "growth": "+210%"},
]


# ══════════════════════════════════════════════════════════════════════════════
#  Main class
# ══════════════════════════════════════════════════════════════════════════════
class GoogleTrendsAnalyzer:
    """
    Wraps pytrends with rate-limit handling and demo fallback.
    pytrends makes unauthenticated requests to trends.google.com — it can
    get temporarily blocked under heavy load; we retry with back-off.
    """

    _MAX_RETRIES = 3
    _BACKOFF_BASE = 5  # seconds

    def __init__(self):
        self._pytrends = None
        if _PYTRENDS_AVAILABLE:
            try:
                self._pytrends = TrendReq(hl="en-US", tz=0, timeout=(10, 30), retries=2)
                logger.info("pytrends client ready.")
            except Exception as exc:
                logger.warning("pytrends init failed: %s", exc)

    # ── internal ───────────────────────────────────────────────────────────────
    def _has_api(self) -> bool:
        return self._pytrends is not None

    def _safe_build_payload(self, keywords: list[str], timeframe: str):
        """Build pytrends payload with retry + back-off on 429."""
        for attempt in range(self._MAX_RETRIES):
            try:
                self._pytrends.build_payload(keywords, timeframe=timeframe, geo="")
                return True
            except Exception as exc:
                if "429" in str(exc) or (hasattr(exc, "__class__") and "TooManyRequests" in exc.__class__.__name__):
                    wait = self._BACKOFF_BASE * (2 ** attempt)
                    logger.warning("Google Trends rate limited — waiting %ds (attempt %d).", wait, attempt + 1)
                    time.sleep(wait)
                else:
                    logger.error("build_payload error: %s", exc)
                    return False
        return False

    # ── public API ─────────────────────────────────────────────────────────────
    def get_interest_over_time(
        self, keywords: list[str], timeframe: str = "today 3-m"
    ) -> tuple[list[dict], list[str], bool]:
        """
        Returns (rows, keywords_used, is_rate_limited).

        rows:           [{date, kw1_value, kw2_value, ...}] — one row per week
                        The keyword names are the actual words (not 'value').
        keywords_used:  The list of keywords that were actually queried.
        is_rate_limited: True when Google returned HTTP 429.

        Returns ([], [], False) when no data, ([], [], True) when rate-limited.
        """
        if not self._has_api():
            logger.warning("pytrends not available.")
            return [], [], False

        kws = keywords[:5]
        try:
            ok = self._safe_build_payload(kws, timeframe)
            if not ok:
                return [], [], True   # _safe_build_payload fails on 429

            df = self._pytrends.interest_over_time()
            if df is None or df.empty:
                return [], [], False

            # Build multi-series rows — one column per keyword
            rows = []
            for ts, row in df.iterrows():
                entry = {"date": ts.strftime("%Y-%m-%d")}
                for kw in kws:
                    entry[kw] = int(row.get(kw, 0))
                rows.append(entry)

            # Detect flat-line: if ALL values for ALL keywords are 0 → no real data
            all_zeros = all(
                entry[kw] == 0
                for entry in rows
                for kw in kws
                if kw in entry
            )
            if all_zeros:
                logger.warning("pytrends returned all-zero data for %s — treating as no data", kws)
                return [], [], False

            # Filter out near-zero keywords (max ≤ 3) — they appear as flat lines
            # and add noise. Only chart keywords with meaningful signal.
            kws_with_signal = [
                kw for kw in kws
                if max((entry.get(kw, 0) for entry in rows), default=0) > 3
            ]
            if not kws_with_signal:
                # All keywords are effectively flat after normalization
                logger.warning("pytrends returned only near-zero data for %s", kws)
                return [], [], False

            if len(kws_with_signal) < len(kws):
                dropped = set(kws) - set(kws_with_signal)
                logger.info("Dropped near-zero keywords from chart: %s", dropped)

            logger.info("pytrends returned %d weeks of data; charting %s", len(rows), kws_with_signal)
            return rows, kws_with_signal, False

        except Exception as exc:
            rate_limited = "429" in str(exc) or "too many" in str(exc).lower()
            logger.error("get_interest_over_time error: %s", exc)
            return [], [], rate_limited


    def get_related_queries(self, keyword: str) -> tuple[dict, bool]:
        """
        Returns (queries_dict, is_rate_limited).
        queries_dict = {top: [...], rising: [...]} or empty dicts.
        """
        if not self._has_api():
            return {"top": [], "rising": []}, False

        try:
            ok = self._safe_build_payload([keyword], "today 3-m")
            if not ok:
                return {"top": [], "rising": []}, True
            related = self._pytrends.related_queries()
            kw_data = related.get(keyword, {})

            def _df_to_list(df) -> list[dict]:
                if df is None or (hasattr(df, "empty") and df.empty):
                    return []
                return [
                    {"query": str(row["query"]), "value": int(row["value"])}
                    for _, row in df.iterrows()
                ]

            return {
                "top":    _df_to_list(kw_data.get("top")),
                "rising": _df_to_list(kw_data.get("rising")),
            }, False
        except Exception as exc:
            rate_limited = "429" in str(exc) or "too many" in str(exc).lower()
            logger.error("get_related_queries error: %s", exc)
            return {"top": [], "rising": []}, rate_limited

    def get_geographic_interest(self, keyword: str) -> tuple[dict, bool]:
        """
        Returns (country_dict, is_rate_limited).
        country_dict = {ISO2: score} or {} if no data/error.
        """
        if not self._has_api():
            return {}, False

        try:
            ok = self._safe_build_payload([keyword], "today 3-m")
            if not ok:
                return {}, True
            df = self._pytrends.interest_by_region(resolution="COUNTRY", inc_geo_code=False)
            if df is None or df.empty:
                return {}, False
            df_sorted = df.sort_values(by=keyword, ascending=False).head(20)
            return {idx: int(row[keyword]) for idx, row in df_sorted.iterrows() if int(row[keyword]) > 0}, False
        except Exception as exc:
            rate_limited = "429" in str(exc) or "too many" in str(exc).lower()
            logger.error("get_geographic_interest error: %s", exc)
            return {}, rate_limited


    def compare_creators(self, creator_list: list[str], timeframe: str = "today 3-m") -> dict:
        """
        Compare interest over time for multiple creator names.
        Returns {creator: [{date, value}, ...], ...}
        """
        if not creator_list:
            return {}

        kws = creator_list[:5]  # pytrends hard limit

        if not self._has_api():
            return {c: _demo_interest() for c in kws}

        try:
            ok = self._safe_build_payload(kws, timeframe)
            if not ok:
                return {c: _demo_interest() for c in kws}
            df = self._pytrends.interest_over_time()
            if df.empty:
                return {c: _demo_interest() for c in kws}
            result: dict[str, list[dict]] = {}
            for kw in kws:
                if kw in df.columns:
                    result[kw] = [
                        {"date": ts.strftime("%Y-%m-%d"), "value": int(row[kw])}
                        for ts, row in df.iterrows()
                    ]
                else:
                    result[kw] = _demo_interest()
            return result
        except Exception as exc:
            logger.error("compare_creators error: %s", exc)
            return {c: _demo_interest() for c in kws}

    def get_rising_topics(self, category: str = "entertainment") -> list[dict]:
        """
        Get currently trending topics (best-effort; pytrends trending_searches).
        Falls back to demo list on any error.
        """
        if not self._has_api():
            return _DEMO_RISING

        try:
            df = self._pytrends.trending_searches(pn="united_states")
            topics = df[0].tolist()[:10]
            return [{"topic": t, "growth": "trending"} for t in topics]
        except Exception as exc:
            logger.warning("get_rising_topics error: %s — returning demo.", exc)
            return _DEMO_RISING
