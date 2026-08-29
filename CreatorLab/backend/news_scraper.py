"""
CreatorIQ — News RSS Scraper & Sentiment Analyzer (feedparser + Google News RSS)
"""

import logging
import re
import time
from datetime import datetime, timedelta, timezone
from email.utils import parsedate_to_datetime
from urllib.parse import quote_plus

logger = logging.getLogger("creatoriq.news")

# ── optional import ────────────────────────────────────────────────────────────
try:
    import feedparser
    _FEEDPARSER_AVAILABLE = True
except ImportError:
    _FEEDPARSER_AVAILABLE = False
    logger.warning("feedparser not installed; using demo news data.")

# ── lazy import of local sentiment ─────────────────────────────────────────────
_sentiment_analyzer = None

def _get_sa():
    global _sentiment_analyzer
    if _sentiment_analyzer is None:
        from sentiment_analysis import SentimentAnalyzer
        _sentiment_analyzer = SentimentAnalyzer()
    return _sentiment_analyzer


# ══════════════════════════════════════════════════════════════════════════════
#  Demo / fallback data
# ══════════════════════════════════════════════════════════════════════════════
_DEMO_ARTICLES = [
    {
        "title": f"Creator Spotlight: Growing audience with authenticity — article {i}",
        "summary": f"Content creators are finding new ways to engage their audiences in {2024 + i // 6}.",
        "url": f"https://example.com/news/article-{i}",
        "published": (datetime.now(tz=timezone.utc) - timedelta(days=i)).isoformat(),
        "source": "Tech News Daily",
    }
    for i in range(1, 11)
]


# ══════════════════════════════════════════════════════════════════════════════
#  Main class
# ══════════════════════════════════════════════════════════════════════════════
class NewsAnalyzer:
    """
    Fetches and analyses news articles from Google News RSS feed.
    Uses feedparser to parse RSS; falls back to demo data when unavailable.
    """

    _GOOGLE_NEWS_RSS = "https://news.google.com/rss/search?q={query}&hl=en-US&gl=US&ceid=US:en"

    def __init__(self):
        if _FEEDPARSER_AVAILABLE:
            logger.info("NewsAnalyzer ready with feedparser.")
        else:
            logger.warning("feedparser missing — demo data will be used.")

    # ── internal ───────────────────────────────────────────────────────────────
    def _fetch_rss(self, query: str, max_articles: int = 20) -> list[dict]:
        """Fetch + parse Google News RSS for `query`."""
        url = self._GOOGLE_NEWS_RSS.format(query=quote_plus(query))
        try:
            feed = feedparser.parse(url)
        except Exception as exc:
            logger.error("feedparser error: %s", exc)
            return []

        articles: list[dict] = []
        for entry in feed.entries[:max_articles]:
            published = ""
            try:
                published = parsedate_to_datetime(entry.get("published", "")).isoformat()
            except Exception:
                published = datetime.now(tz=timezone.utc).isoformat()

            articles.append(
                {
                    "title": entry.get("title", ""),
                    "summary": re.sub(r"<[^>]+>", "", entry.get("summary", "")),
                    "url": entry.get("link", ""),
                    "published": published,
                    "source": entry.get("source", {}).get("title", "Unknown")
                    if isinstance(entry.get("source"), dict)
                    else str(entry.get("source", "Unknown")),
                }
            )
        return articles

    def _within_last_n_days(self, iso_date: str, days: int) -> bool:
        try:
            dt = datetime.fromisoformat(iso_date.replace("Z", "+00:00"))
            cutoff = datetime.now(tz=timezone.utc) - timedelta(days=days)
            return dt >= cutoff
        except Exception:
            return False

    # ── public API ─────────────────────────────────────────────────────────────
    def search_news(self, query: str, max_articles: int = 20) -> list[dict]:
        """
        Fetch news articles mentioning `query`.
        Returns list of {title, summary, url, published, source, sentiment}.
        """
        if not _FEEDPARSER_AVAILABLE:
            articles = _DEMO_ARTICLES[:max_articles]
        else:
            articles = self._fetch_rss(query, max_articles)
            if not articles:
                logger.info("No news results found — returning demo data.")
                articles = _DEMO_ARTICLES[:max_articles]

        # Attach sentiment to each article
        sa = _get_sa()
        for article in articles:
            text = f"{article.get('title', '')}. {article.get('summary', '')}"
            article["sentiment"] = sa.analyze_text(text)

        return articles

    def extract_article_sentiment(self, article: dict) -> dict:
        """
        Analyse sentiment of a single article dict.
        Accepts keys: title, summary, description.
        """
        text = (
            f"{article.get('title', '')}. "
            f"{article.get('summary') or article.get('description', '')}"
        ).strip(". ")
        return _get_sa().analyze_text(text)

    def get_news_sentiment_summary(self, query: str) -> dict:
        """
        Fetch articles for `query` and return overall sentiment summary.
        """
        articles = self.search_news(query, max_articles=20)
        sentiments = [a["sentiment"] for a in articles if "sentiment" in a]

        if not sentiments:
            return {
                "overall_label": "neutral",
                "average_compound": 0.0,
                "positive_pct": 0.0,
                "negative_pct": 0.0,
                "neutral_pct": 0.0,
                "article_count": 0,
            }

        n = len(sentiments)
        avg_compound = sum(s["compound"] for s in sentiments) / n
        pos_pct = sum(1 for s in sentiments if s["label"] == "positive") / n * 100
        neg_pct = sum(1 for s in sentiments if s["label"] == "negative") / n * 100
        neu_pct = 100 - pos_pct - neg_pct

        label = "positive" if avg_compound >= 0.05 else "negative" if avg_compound <= -0.05 else "neutral"

        return {
            "overall_label": label,
            "average_compound": round(avg_compound, 4),
            "positive_pct": round(pos_pct, 2),
            "negative_pct": round(neg_pct, 2),
            "neutral_pct": round(neu_pct, 2),
            "article_count": n,
        }

    def get_recent_news(self, query: str, days: int = 7) -> list[dict]:
        """
        Return only articles published within the last `days` days.
        """
        articles = self.search_news(query, max_articles=40)
        recent = [a for a in articles if self._within_last_n_days(a.get("published", ""), days)]
        if not recent:
            # If nothing is recent (e.g., demo data), just return all
            recent = articles[:10]
        return recent
