"""
CreatorIQ — Multi-Source Sentiment Analysis
Primary: VADER  |  Secondary: TextBlob
"""

import logging
import re
from collections import Counter
from datetime import datetime, timezone

logger = logging.getLogger("creatoriq.sentiment")

# ── optional imports ───────────────────────────────────────────────────────────
try:
    from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer as VaderAnalyzer
    _VADER_AVAILABLE = True
except ImportError:
    _VADER_AVAILABLE = False
    logger.warning("vaderSentiment not installed — VADER disabled.")

try:
    from textblob import TextBlob
    _TEXTBLOB_AVAILABLE = True
except ImportError:
    _TEXTBLOB_AVAILABLE = False
    logger.warning("textblob not installed — TextBlob disabled.")

# ── stop words (minimal, no NLTK dependency) ───────────────────────────────────
_STOP_WORDS = {
    "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for",
    "of", "with", "by", "from", "is", "it", "this", "that", "was", "are",
    "be", "been", "have", "has", "had", "do", "does", "did", "will", "would",
    "could", "should", "may", "might", "not", "no", "so", "if", "as", "we",
    "you", "i", "he", "she", "they", "them", "their", "our", "your", "my",
    "his", "her", "its", "me", "him", "us", "just", "also", "very", "really",
    "more", "much", "like", "get", "got", "can", "all", "one", "what", "how",
    "when", "where", "who", "which", "than", "then", "there", "here", "now",
    "up", "out", "about", "into", "over", "after",
}


# ══════════════════════════════════════════════════════════════════════════════
#  Helpers
# ══════════════════════════════════════════════════════════════════════════════
def _clean_text(text: str) -> str:
    """Remove URLs, mentions, HTML tags, extra whitespace."""
    text = re.sub(r"http\S+|www\.\S+", "", text)
    text = re.sub(r"@\w+", "", text)
    text = re.sub(r"<[^>]+>", "", text)
    text = re.sub(r"[^\w\s'.,!?-]", " ", text)
    return re.sub(r"\s+", " ", text).strip()


def _label_from_compound(compound: float) -> str:
    if compound >= 0.05:
        return "positive"
    if compound <= -0.05:
        return "negative"
    return "neutral"


def _safe_parse_date(date_str: str) -> datetime | None:
    for fmt in (
        "%Y-%m-%dT%H:%M:%S%z",
        "%Y-%m-%dT%H:%M:%SZ",
        "%Y-%m-%d %H:%M:%S",
        "%Y-%m-%d",
    ):
        try:
            return datetime.strptime(date_str, fmt)
        except Exception:
            pass
    try:
        return datetime.fromisoformat(date_str.replace("Z", "+00:00"))
    except Exception:
        return None


# ══════════════════════════════════════════════════════════════════════════════
#  Main class
# ══════════════════════════════════════════════════════════════════════════════
class SentimentAnalyzer:
    """
    Multi-model sentiment analysis engine.
    Uses VADER as primary, TextBlob as secondary cross-check.
    """

    def __init__(self):
        self._vader = VaderAnalyzer() if _VADER_AVAILABLE else None
        logger.info(
            "SentimentAnalyzer ready. VADER=%s, TextBlob=%s",
            _VADER_AVAILABLE,
            _TEXTBLOB_AVAILABLE,
        )

    # ── single-text ────────────────────────────────────────────────────────────
    def analyze_text(self, text: str) -> dict:
        """
        Analyse a single piece of text.
        Returns {positive, negative, neutral, compound, label, textblob_polarity}.
        """
        if not text or not text.strip():
            return {
                "positive": 0.0, "negative": 0.0, "neutral": 1.0,
                "compound": 0.0, "label": "neutral", "textblob_polarity": 0.0,
            }

        cleaned = _clean_text(text)

        # VADER
        if self._vader:
            scores = self._vader.polarity_scores(cleaned)
            compound = scores["compound"]
            pos, neg, neu = scores["pos"], scores["neg"], scores["neu"]
        else:
            # Fallback: very naive word-list sentiment
            pos_words = {"great", "good", "awesome", "love", "amazing", "excellent", "best"}
            neg_words = {"bad", "hate", "terrible", "worst", "awful", "horrible", "disappointing"}
            words = set(cleaned.lower().split())
            pos_count = len(words & pos_words)
            neg_count = len(words & neg_words)
            total = pos_count + neg_count or 1
            pos = pos_count / total
            neg = neg_count / total
            neu = 1 - pos - neg
            compound = (pos - neg)
            compound = max(-1.0, min(1.0, compound))

        label = _label_from_compound(compound)

        # TextBlob secondary
        tb_polarity = 0.0
        if _TEXTBLOB_AVAILABLE:
            try:
                tb_polarity = round(TextBlob(cleaned).sentiment.polarity, 4)
            except Exception:
                pass

        return {
            "positive": round(pos, 4),
            "negative": round(neg, 4),
            "neutral": round(neu, 4),
            "compound": round(compound, 4),
            "label": label,
            "textblob_polarity": tb_polarity,
        }

    # ── bulk ───────────────────────────────────────────────────────────────────
    def analyze_bulk(self, texts: list[str]) -> list[dict]:
        """Analyse a list of texts, return list of sentiment dicts."""
        return [self.analyze_text(t) for t in texts]

    # ── per-source helpers ─────────────────────────────────────────────────────
    def _summarize_sentiments(self, sentiments: list[dict]) -> dict:
        """Aggregate a list of per-text sentiment dicts into a summary."""
        if not sentiments:
            return {
                "overall_label": "neutral",
                "average_compound": 0.0,
                "positive_pct": 0.0,
                "negative_pct": 0.0,
                "neutral_pct": 0.0,
                "sample_count": 0,
            }
        n = len(sentiments)
        avg_compound = sum(s["compound"] for s in sentiments) / n
        pos_pct = sum(1 for s in sentiments if s["label"] == "positive") / n * 100
        neg_pct = sum(1 for s in sentiments if s["label"] == "negative") / n * 100
        neu_pct = 100 - pos_pct - neg_pct
        return {
            "overall_label": _label_from_compound(avg_compound),
            "average_compound": round(avg_compound, 4),
            "positive_pct": round(pos_pct, 2),
            "negative_pct": round(neg_pct, 2),
            "neutral_pct": round(neu_pct, 2),
            "sample_count": n,
        }

    def analyze_youtube_comments(self, comments: list[dict]) -> dict:
        """
        Analyse a list of YouTube comment dicts.
        Each dict must have a 'text' key.
        Returns breakdown + top positive (by likes) + top negative.
        """
        texts = [c.get("text", "") for c in comments if c.get("text")]
        sentiments = self.analyze_bulk(texts)
        summary = self._summarize_sentiments(sentiments)

        # Pair each comment dict with its sentiment
        paired = []
        text_idx = 0
        for c in comments:
            if not c.get("text"):
                continue
            if text_idx < len(sentiments):
                paired.append((sentiments[text_idx], c))
            text_idx += 1

        # Top positive comments — sorted by likes (most liked first)
        pos_comments = [c for s, c in paired if s["label"] == "positive"]
        pos_comments.sort(key=lambda c: c.get("likes", 0), reverse=True)
        top_pos = pos_comments[:5]

        # Top critical comments — most negative compound score first
        neg_scored = [(s["compound"], c) for s, c in paired if s["label"] == "negative"]
        neg_scored.sort(key=lambda x: x[0])  # most negative first
        top_neg = [c for _, c in neg_scored[:5]]

        return {**summary, "top_positive_comments": top_pos, "top_negative_comments": top_neg}

    def analyze_reddit_mentions(self, posts: list[dict]) -> dict:
        """
        Analyse Reddit post dicts.
        Pulls text from 'title', 'text', and 'comments'.
        """
        texts: list[str] = []
        for p in posts:
            if p.get("title"):
                texts.append(p["title"])
            if p.get("text") and p["text"] != p.get("title"):
                texts.append(p["text"])
            texts.extend(p.get("comments", []))
        sentiments = self.analyze_bulk(texts)
        summary = self._summarize_sentiments(sentiments)
        subreddit_breakdown = {}
        for p in posts:
            sub = p.get("subreddit", "unknown")
            sub_texts = [p.get("title", ""), p.get("text", "")]
            sub_texts = [t for t in sub_texts if t]
            if sub_texts:
                sub_sent = self.analyze_text(" ".join(sub_texts))
                subreddit_breakdown[sub] = sub_sent.get("label", "neutral")
        return {**summary, "subreddit_breakdown": subreddit_breakdown}

    def analyze_news_articles(self, articles: list[dict]) -> dict:
        """
        Analyse news article dicts.
        Each dict can have 'title', 'summary', 'description' keys.
        """
        texts: list[str] = []
        for a in articles:
            headline = a.get("title") or a.get("headline", "")
            body = a.get("summary") or a.get("description", "")
            combined = f"{headline}. {body}".strip(". ")
            if combined:
                texts.append(combined)
        sentiments = self.analyze_bulk(texts)
        return self._summarize_sentiments(sentiments)

    # ── combined score ─────────────────────────────────────────────────────────
    def get_combined_sentiment(
        self,
        yt_sentiment: dict,
        reddit_sentiment: dict,
        news_sentiment: dict,
    ) -> dict:
        """
        Weighted combination:  YouTube 40% + Reddit 40% + News 20%.
        """
        weights = {"youtube": 0.40, "reddit": 0.40, "news": 0.20}
        sources = {
            "youtube": yt_sentiment,
            "reddit": reddit_sentiment,
            "news": news_sentiment,
        }

        combined_compound = 0.0
        total_weight = 0.0
        for name, weight in weights.items():
            src = sources[name]
            if src and src.get("sample_count", 0) > 0:
                combined_compound += src.get("average_compound", 0.0) * weight
                total_weight += weight

        if total_weight > 0:
            combined_compound /= total_weight  # normalise for missing sources

        label = _label_from_compound(combined_compound)

        # Weighted positive / negative percentages
        def _wpct(key: str) -> float:
            vals, wts = [], []
            for name, weight in weights.items():
                src = sources[name]
                if src and src.get("sample_count", 0) > 0:
                    vals.append(src.get(key, 0.0))
                    wts.append(weight)
            if not vals:
                return 0.0
            return round(sum(v * w for v, w in zip(vals, wts)) / sum(wts), 2)

        return {
            "overall_label": label,
            "combined_compound": round(combined_compound, 4),
            "positive_pct": _wpct("positive_pct"),
            "negative_pct": _wpct("negative_pct"),
            "neutral_pct": _wpct("neutral_pct"),
            "weights_applied": weights,
            "source_scores": {
                "youtube": yt_sentiment.get("average_compound", None),
                "reddit": reddit_sentiment.get("average_compound", None),
                "news": news_sentiment.get("average_compound", None),
            },
        }

    # ── NLP helpers ────────────────────────────────────────────────────────────
    def get_word_frequency(self, texts: list[str], top_n: int = 50) -> list[dict]:
        """
        Return top-N words (excluding stop words) as [{word, count}, ...].
        """
        counter: Counter = Counter()
        for text in texts:
            words = re.findall(r"\b[a-z]{3,}\b", _clean_text(text).lower())
            counter.update(w for w in words if w not in _STOP_WORDS)
        return [{"word": w, "count": c} for w, c in counter.most_common(top_n)]

    def get_sentiment_over_time(self, texts_with_dates: list[dict]) -> list[dict]:
        """
        Compute monthly average sentiment compound score.
        Input: list of {text: str, date: str}.
        Output: list of {period: 'YYYY-MM', average_compound: float, count: int}.
        """
        monthly: dict[str, list[float]] = {}
        for item in texts_with_dates:
            text = item.get("text", "")
            date_str = item.get("date", "")
            if not text or not date_str:
                continue
            dt = _safe_parse_date(date_str)
            if dt is None:
                continue
            period = dt.strftime("%Y-%m")
            score = self.analyze_text(text)["compound"]
            monthly.setdefault(period, []).append(score)

        timeline = []
        for period in sorted(monthly.keys()):
            scores = monthly[period]
            avg = round(sum(scores) / len(scores), 4)
            timeline.append(
                {
                    "period": period,
                    "average_compound": avg,
                    "label": _label_from_compound(avg),
                    "count": len(scores),
                }
            )
        return timeline
