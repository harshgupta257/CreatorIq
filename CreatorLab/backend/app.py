"""
CreatorIQ Analytics Platform — Main Flask Server
"""

import os
import logging
import secrets
import threading
from concurrent.futures import ThreadPoolExecutor
from functools import lru_cache
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

# ── load env vars ──────────────────────────────────────────────────────────────
load_dotenv()

# ── logging ────────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s — %(message)s",
)
logger = logging.getLogger("creatoriq.app")

# ── local modules ──────────────────────────────────────────────────────────────
from youtube_api import YouTubeAnalyzer, YouTubeAPIError, QuotaCapReached, CATEGORY_NAMES
from reddit_api import RedditSentimentCollector
from sentiment_analysis import SentimentAnalyzer
from google_trends import GoogleTrendsAnalyzer, extract_topic_phrases, tag_word_frequency, find_content_gaps
import shared_store
import performance
import snapshots
from news_scraper import NewsAnalyzer
from ml_models import EngagementPredictor
from instagram_api import InstagramAnalyzer

# ── app factory ────────────────────────────────────────────────────────────────
app = Flask(__name__)
app.secret_key = os.getenv("SECRET_KEY") or secrets.token_hex(32)
if not os.getenv("SECRET_KEY"):
    logger.warning("SECRET_KEY not set — using a random per-process key.")

# Comma-separated list of frontend origins allowed to call the API ("*" = any)
_DEFAULT_ORIGINS = (
    "http://localhost:3000,http://127.0.0.1:3000,"
    "http://localhost:5500,http://127.0.0.1:5500,"
    "https://creator-iq-gules.vercel.app"
)
ALLOWED_ORIGINS = [
    o.strip() for o in os.getenv("ALLOWED_ORIGINS", _DEFAULT_ORIGINS).split(",") if o.strip()
]
CORS(
    app,
    resources={r"/api/*": {"origins": "*" if "*" in ALLOWED_ORIGINS else ALLOWED_ORIGINS}},
)

# ── shared service instances (lazy-init so missing keys just log a warning) ────
@lru_cache(maxsize=None)
def _yt():
    return YouTubeAnalyzer()

@lru_cache(maxsize=None)
def _reddit():
    return RedditSentimentCollector()

@lru_cache(maxsize=None)
def _sentiment():
    return SentimentAnalyzer()

@lru_cache(maxsize=None)
def _trends():
    return GoogleTrendsAnalyzer()

@lru_cache(maxsize=None)
def _news():
    return NewsAnalyzer()

def _ml():
    # Not shared: the predictor holds per-channel training state.
    return EngagementPredictor()

@lru_cache(maxsize=None)
def _ig():
    return InstagramAnalyzer()

# pytrends keeps payload state on the client, so serialise access to it
_trends_lock = threading.Lock()


# ── utility ────────────────────────────────────────────────────────────────────
def error_response(message: str, code: int = 400):
    return jsonify({"success": False, "error": message}), code


def server_error(exc: Exception, where: str):
    """Log the full error server-side; return only a safe message to the client."""
    if isinstance(exc, YouTubeAPIError):
        logger.warning("%s: %s", where, exc)
        return error_response(str(exc), exc.status)
    logger.exception("%s error", where)
    return error_response("Internal server error.", 500)


class BadParam(ValueError):
    pass


def int_arg(name: str, default: int, lo: int, hi: int) -> int:
    """Read an integer query param clamped to [lo, hi]; raise BadParam if invalid."""
    raw = request.args.get(name)
    if raw is None or raw.strip() == "":
        return default
    try:
        value = int(raw)
    except ValueError:
        raise BadParam(f"Query param '{name}' must be an integer.") from None
    return max(lo, min(value, hi))


def ok_response(data, message: str = "OK"):
    return jsonify({"success": True, "message": message, "data": data})


# ══════════════════════════════════════════════════════════════════════════════
#  HEALTH
# ══════════════════════════════════════════════════════════════════════════════
@app.route("/api/health", methods=["GET"])
def health_check():
    """Simple health-check / liveness probe."""
    PLACEHOLDERS = ("your_", "placeholder", "xxx", "changeme", "example", "none", "insert")

    def is_real_key(env_var):
        val = (os.getenv(env_var) or "").strip().lower()
        return bool(val) and not any(val.startswith(p) for p in PLACEHOLDERS)

    keys_present = {
        "youtube":   is_real_key("YOUTUBE_API_KEY"),
        "reddit":    is_real_key("REDDIT_CLIENT_ID"),
        "instagram": is_real_key("INSTAGRAM_APP_ID"),
    }
    return ok_response(
        {
            "status": "healthy",
            "version": "1.0.0",
            "service": "CreatorIQ Analytics API",
            "api_keys_configured": keys_present,
        },
        message="Service is running",
    )


# ══════════════════════════════════════════════════════════════════════════════
#  YOUTUBE
# ══════════════════════════════════════════════════════════════════════════════
@app.route("/api/youtube/channel", methods=["GET"])
def youtube_channel():
    """
    GET /api/youtube/channel?url=<channel_url>
    Returns channel stats for the given URL or handle.
    """
    url = request.args.get("url", "").strip()
    if not url:
        return error_response("Query param 'url' is required.")
    try:
        yt = _yt()
        info = yt.get_channel_info(url)
        if info is None:
            return error_response("Channel not found or API key missing.", 404)
        snapshots.record(info)
        return ok_response(info)
    except Exception as exc:
        return server_error(exc, "youtube_channel")


@app.route("/api/youtube/videos", methods=["GET"])
def youtube_videos():
    """
    GET /api/youtube/videos?channel_id=<id>&max_results=<n>
    Returns paginated list of videos with stats.
    """
    channel_id = request.args.get("channel_id", "").strip()
    if not channel_id:
        return error_response("Query param 'channel_id' is required.")
    try:
        max_results = int_arg("max_results", 50, 1, 200)
    except BadParam as exc:
        return error_response(str(exc))
    try:
        yt = _yt()
        videos = yt.get_channel_videos(channel_id, max_results=max_results)
        engagement = yt.calculate_engagement_rate(videos)
        frequency = yt.get_posting_frequency(videos)
        best_times = yt.get_best_posting_times(videos)
        return ok_response(
            {
                "channel_id": channel_id,
                "video_count": len(videos),
                "videos": videos,
                "engagement_rate": engagement,
                "posting_frequency": frequency,
                "best_posting_times": best_times,
            }
        )
    except Exception as exc:
        return server_error(exc, "youtube_videos")


@app.route("/api/youtube/comments", methods=["GET"])
def youtube_comments():
    """
    GET /api/youtube/comments?video_id=<id>&max_results=<n>
    Returns top comments for a video.
    """
    video_id = request.args.get("video_id", "").strip()
    if not video_id:
        return error_response("Query param 'video_id' is required.")
    try:
        max_results = int_arg("max_results", 100, 1, 500)
    except BadParam as exc:
        return error_response(str(exc))
    try:
        yt = _yt()
        comments = yt.get_video_comments(video_id, max_results=max_results)
        return ok_response({"video_id": video_id, "comment_count": len(comments), "comments": comments})
    except Exception as exc:
        return server_error(exc, "youtube_comments")


# ══════════════════════════════════════════════════════════════════════════════
#  REDDIT
# ══════════════════════════════════════════════════════════════════════════════
@app.route("/api/reddit/sentiment", methods=["GET"])
def reddit_sentiment():
    """
    GET /api/reddit/sentiment?query=<channel_name>
    Returns Reddit mentions + sentiment breakdown.
    """
    query = request.args.get("query", "").strip()
    if not query:
        return error_response("Query param 'query' is required.")
    try:
        reddit = _reddit()
        sa = _sentiment()
        posts = reddit.collect_all_mentions(query)
        texts = reddit.extract_text_corpus(posts)
        sentiment = sa.analyze_reddit_mentions(posts)
        word_freq = sa.get_word_frequency(texts)
        return ok_response(
            {
                "query": query,
                "source_available": reddit.is_available(),
                "post_count": len(posts),
                "sentiment": sentiment,
                "top_words": word_freq[:30],
                "posts_sample": posts[:10],
            }
        )
    except Exception as exc:
        return server_error(exc, "reddit_sentiment")


# ══════════════════════════════════════════════════════════════════════════════
#  GOOGLE TRENDS
# ══════════════════════════════════════════════════════════════════════════════
# Dashboard date range → Google Trends timeframe
_TRENDS_TIMEFRAMES = {"7D": "now 7-d", "30D": "today 1-m", "90D": "today 3-m", "1Y": "today 12-m"}

# Daily budget (YouTube quota units) for the "hot in your niche" searches.
# Each uncached search costs 101 of the project's 10,000 free daily units.
NICHE_SEARCH_DAILY_UNIT_CAP = int(os.getenv("NICHE_SEARCH_DAILY_UNIT_CAP", "6000"))
_NICHE_WINDOW_DAYS = 14


def _google_trends_part(phrases: list[str], timeframe: str) -> dict:
    try:
        with _trends_lock:
            return _trends().get_trends(phrases, timeframe=timeframe, gprop="youtube")
    except Exception:
        logger.exception("google trends part failed")
        return {"status": "unavailable", "interest_over_time": [], "keywords_in_data": [],
                "related": {"top": [], "rising": []}, "geo": [], "cached": False}


def _trending_part(videos: list[dict], channel_info: dict) -> dict:
    """What is trending on YouTube in the channel's main category and country."""
    region = (channel_info.get("country") or "US").upper()
    categories = [v.get("category_id") for v in videos if v.get("category_id")]
    category = max(set(categories), key=categories.count) if categories else ""
    try:
        res = _yt().get_trending_videos(region, category, max_results=10)
        cat = res.get("category_id", "")
        return {**res, "category_name": CATEGORY_NAMES.get(cat, ""), "status": "ok"}
    except YouTubeAPIError as exc:
        logger.warning("trending part failed: %s", exc)
        return {"region": region, "category_id": "", "category_name": "", "videos": [],
                "status": "quota_exceeded" if exc.status == 429 else "error"}
    except Exception:
        logger.exception("trending part failed")
        return {"region": region, "category_id": "", "category_name": "", "videos": [], "status": "error"}


def _niche_part(phrases: list[str], channel_id: str) -> dict:
    """Most-viewed recent videos from other channels for each of the channel's topics."""
    topics, status = [], "ok"
    for phrase in phrases:
        try:
            found = _yt().search_recent_videos(
                phrase, days=_NICHE_WINDOW_DAYS, max_results=8, daily_cap=NICHE_SEARCH_DAILY_UNIT_CAP
            )
        except QuotaCapReached:
            status = "quota_cap"
            break
        except YouTubeAPIError as exc:
            logger.warning("niche search failed for %r: %s", phrase, exc)
            status = "quota_exceeded" if exc.status == 429 else "error"
            if exc.status == 429:
                break
            continue
        except Exception:
            logger.exception("niche search failed for %r", phrase)
            status = "error"
            continue
        others = [v for v in found if v.get("channel_id") != channel_id][:5]
        topics.append({"topic": phrase, "videos": others})
    return {
        "window_days": _NICHE_WINDOW_DAYS,
        "topics":      topics,
        # Partial results are still shown; the status explains what is missing
        "status":      status,
        "resets_at":   shared_store.quota_resets_at() if status in ("quota_cap", "quota_exceeded") else None,
    }


@app.route("/api/trends", methods=["GET"])
def google_trends():
    """
    GET /api/trends?channel_id=<id>&query=<channel_name>&range=<7D|30D|90D|1Y>

    - Topics: the channel's main tag phrases ("python tutorial"), ranked by use and views
    - Google Trends (YouTube search interest) for those phrases — cached, may be rate limited
    - Trending on YouTube in the channel's category and country
    - Hot in the niche: most-viewed videos of the last two weeks per topic (daily capped)
    - Content gaps: niche/rising topics the channel has not covered yet
    """
    query      = request.args.get("query", "").strip()
    channel_id = request.args.get("channel_id", "").strip()
    range_key  = request.args.get("range", "90D").strip().upper()
    timeframe  = _TRENDS_TIMEFRAMES.get(range_key, "today 3-m")

    if not query and not channel_id:
        return error_response("Provide 'query' or 'channel_id'.")

    videos: list[dict] = []
    channel_info: dict = {}
    if channel_id:
        try:
            videos = _yt().get_channel_videos(channel_id, max_results=50)
            channel_info = _yt().get_channel_info(channel_id) or {}
        except Exception as exc:
            return server_error(exc, "google_trends")

    phrases = extract_topic_phrases(videos, channel_info.get("title") or query) or ([query] if query else [])

    try:
        with ThreadPoolExecutor(max_workers=3) as pool:
            f_gt = pool.submit(_google_trends_part, phrases, timeframe)
            f_trending = pool.submit(_trending_part, videos, channel_info)
            f_niche = pool.submit(_niche_part, phrases, channel_id)
            gt, trending, niche = f_gt.result(), f_trending.result(), f_niche.result()

        gaps = find_content_gaps(videos, niche["topics"], gt["related"]["rising"])

        return ok_response({
            "query":                query,
            "range":                range_key if range_key in _TRENDS_TIMEFRAMES else "90D",
            "timeframe":            timeframe,
            "topic_keywords":       phrases,
            "keyword_used":         phrases[0] if phrases else "",
            # Google Trends (YouTube search interest)
            "google_trends_status": gt["status"],
            "google_trends_cached": gt["cached"],
            "rate_limited":         gt["status"] == "rate_limited",
            "keywords_in_data":     gt["keywords_in_data"],
            "interest_over_time":   gt["interest_over_time"],
            "related_queries":      gt["related"],
            "geographic_interest":  gt["geo"],
            # YouTube-native signals
            "youtube_trending":     trending,
            "niche":                niche,
            "content_gaps":         gaps,
            "word_frequency":       tag_word_frequency(videos),
        })
    except Exception as exc:
        return server_error(exc, "google_trends")


# ══════════════════════════════════════════════════════════════════════════════
#  NEWS
# ══════════════════════════════════════════════════════════════════════════════
@app.route("/api/news", methods=["GET"])
def news_sentiment():
    """
    GET /api/news?query=<channel_name>
    Returns news articles + sentiment summary.
    """
    query = request.args.get("query", "").strip()
    if not query:
        return error_response("Query param 'query' is required.")
    try:
        na = _news()
        # Fetch once; the summary and recent list are derived from the same articles
        articles = na.search_news(query, max_articles=40)
        summary = na.summarize_sentiment(articles)
        recent = na.filter_recent(articles)
        return ok_response(
            {
                "query": query,
                "article_count": len(articles),
                "articles": articles,
                "sentiment_summary": summary,
                "recent_news": recent,
            }
        )
    except Exception as exc:
        return server_error(exc, "news_sentiment")


# ══════════════════════════════════════════════════════════════════════════════
#  COMBINED SENTIMENT
# ══════════════════════════════════════════════════════════════════════════════
@app.route("/api/sentiment/analyze", methods=["GET"])
def combined_sentiment():
    """
    GET /api/sentiment/analyze?channel_id=<id>&channel_name=<name>
    Multi-source sentiment: YouTube comments + Reddit + News (weighted).
    """
    channel_id   = request.args.get("channel_id", "").strip()
    channel_name = request.args.get("channel_name", channel_id).strip()
    if not channel_id:
        return error_response("Query param 'channel_id' is required.")
    try:
        yt     = _yt()
        reddit = _reddit()
        na     = _news()
        sa     = _sentiment()

        videos = yt.get_channel_videos(channel_id, max_results=10)
        yt_comments: list = []
        for vid in videos[:3]:
            vid_comments = yt.get_video_comments(vid["video_id"], max_results=100)
            yt_comments.extend(vid_comments)
        yt_sentiment = sa.analyze_youtube_comments(yt_comments)

        reddit_posts     = reddit.collect_all_mentions(channel_name)
        reddit_sentiment = sa.analyze_reddit_mentions(reddit_posts)

        news_articles   = na.search_news(channel_name)
        news_sentiment  = sa.analyze_news_articles(news_articles)

        combined = sa.get_combined_sentiment(yt_sentiment, reddit_sentiment, news_sentiment)

        all_texts_dated: list = []
        for c in yt_comments:
            all_texts_dated.append({"text": c.get("text", ""), "date": c.get("published_at", "")})
        for p in reddit_posts:
            all_texts_dated.append({"text": p.get("text", ""), "date": p.get("created_utc", "")})
        trend_over_time = sa.get_sentiment_over_time(all_texts_dated)

        yt_texts  = [c.get("text", "") for c in yt_comments if c.get("text")]
        word_freq = sa.get_word_frequency(yt_texts, top_n=40)

        return ok_response({
            "channel_id":       channel_id,
            "channel_name":     channel_name,
            "youtube_sentiment":  yt_sentiment,
            "reddit_sentiment":   reddit_sentiment,
            "reddit_connected":   reddit.is_available(),
            "news_sentiment":     news_sentiment,
            "combined_sentiment": combined,
            "sentiment_over_time": trend_over_time,
            "word_frequency":     word_freq,
        })
    except Exception as exc:
        return server_error(exc, "combined_sentiment")



# ══════════════════════════════════════════════════════════════════════════════
#  PERFORMANCE INSIGHTS
# ══════════════════════════════════════════════════════════════════════════════
_INSIGHTS_VIDEOS = 150   # uploads-playlist pages are cheap (~2 units per 50 videos)


@app.route("/api/insights", methods=["GET"])
def performance_insights():
    """
    GET /api/insights?channel_id=<id>&tz=<IANA timezone>
    Age-adjusted performance analysis, a validated "what drives views" model,
    and the channel's recorded growth history.
    """
    channel_id = request.args.get("channel_id", "").strip()
    tz = request.args.get("tz", "UTC").strip()[:64]
    if not channel_id:
        return error_response("Query param 'channel_id' is required.")
    try:
        yt = _yt()
        videos = yt.get_channel_videos(channel_id, max_results=_INSIGHTS_VIDEOS)
        channel_info = yt.get_channel_info(channel_id) or {}
        snapshots.record(channel_info)

        result = performance.analyze(videos, tz=tz)
        history = snapshots.history(channel_id)
        result["growth"] = {
            "storage":        snapshots.storage_kind(),
            "history":        history,
            "tracking_since": history[0]["date"] if history else None,
        }
        result["channel_id"] = channel_id
        return ok_response(result)
    except Exception as exc:
        return server_error(exc, "performance_insights")


@app.route("/api/snapshots/refresh", methods=["POST"])
def refresh_snapshots():
    """
    POST /api/snapshots/refresh  (header X-Refresh-Token: <SNAPSHOT_REFRESH_TOKEN>)
    Records today's snapshot for every channel analyzed in the last 30 days.
    Meant for a daily scheduled job; disabled unless SNAPSHOT_REFRESH_TOKEN is set.
    """
    expected = os.getenv("SNAPSHOT_REFRESH_TOKEN", "")
    if not expected:
        return error_response("Endpoint not found.", 404)
    if not secrets.compare_digest(request.headers.get("X-Refresh-Token", ""), expected):
        return error_response("Invalid refresh token.", 403)
    try:
        ids = snapshots.tracked_channel_ids()
        channels = _yt().get_channels_by_ids(ids) if ids else []
        saved = sum(1 for ch in channels if snapshots.record(ch))
        return ok_response({"tracked": len(ids), "recorded": saved, "storage": snapshots.storage_kind()})
    except Exception as exc:
        return server_error(exc, "refresh_snapshots")


# ══════════════════════════════════════════════════════════════════════════════
#  ML PREDICTIONS
# ══════════════════════════════════════════════════════════════════════════════
@app.route("/api/predictions", methods=["GET"])
def ml_predictions():

    """
    GET /api/predictions?channel_id=<id>
    ML-driven engagement predictions + recommendations.
    All predictions use REAL per-video features, not hardcoded values.
    """
    channel_id = request.args.get("channel_id", "").strip()
    if not channel_id:
        return error_response("Query param 'channel_id' is required.")
    try:
        yt = _yt()
        gt = _trends()
        ml = _ml()

        # Fetch up to 50 videos for training + analysis
        videos = yt.get_channel_videos(channel_id, max_results=50)

        # Fetch channel info for subscriber count (used in growth forecast)
        try:
            channel_info = yt.get_channel_info(channel_id) or {}
        except Exception:
            channel_info = {}

        video_count = len(videos)
        limited_data = video_count < 10

        # ── Train on real historical data ──────────────────────────────────────
        training_result = ml.train_model(videos)

        # ── Predict engagement using REAL per-video features (not hardcoded) ──
        predictions = []
        from ml_models import _extract_features
        for v in videos[:10]:
            real_features = _extract_features(v)   # ← uses actual publish_hour, duration, etc.
            pred = ml.predict_engagement(real_features)
            predictions.append({
                "video_id":   v.get("video_id"),
                "title":      v.get("title"),
                "thumbnail":  v.get("thumbnail"),
                "actual_views": v.get("view_count", 0),
                **pred,
            })

        # ── Sort predictions by expected views desc ────────────────────────────
        predictions.sort(key=lambda p: p.get("predicted_views", 0), reverse=True)

        # ── Run all 4 new analysis functions ──────────────────────────────────
        # 1. Channel-relative viral score (using channel's own avg as baseline)
        top_video = max(videos, key=lambda v: v.get("view_count", 0)) if videos else {}
        viral_score = ml.get_viral_potential_score(top_video, videos)

        # 2. Best posting time + heatmap data
        best_time = ml.recommend_posting_time(videos)

        # 3. Title pattern analysis
        title_insights = ml.analyze_title_patterns(videos)

        # 4. Topic performance (which tags avg most views)
        topic_performance = ml.get_topic_performance(videos)

        # 5. Optimal video duration
        duration_sweet_spot = ml.get_optimal_duration(videos)

        # 6. Growth forecast (linear regression)
        growth_forecast = ml.get_growth_forecast(videos, channel_info, weeks=12)

        # 7. Content recommendations
        try:
            with _trends_lock:
                rising = gt.get_rising_topics()
        except Exception:
            rising = []
        topics = ml.recommend_content_topics(videos, rising)

        # 8. Feature importance
        importance = ml.get_feature_importance()

        return ok_response({
            "channel_id":             channel_id,
            "video_count":            video_count,
            "limited_data":           limited_data,
            "training_result":        training_result,
            # ── Core predictions ──
            "video_predictions":      predictions,
            "viral_potential_score":  viral_score,
            # ── Posting strategy ──
            "recommended_posting_time": best_time,
            # ── New insights ──
            "title_pattern_insights": title_insights,
            "topic_performance":      topic_performance,
            "duration_sweet_spot":    duration_sweet_spot,
            "growth_forecast":        growth_forecast,
            # ── Recommendations ──
            "recommended_topics":     topics,
            "feature_importance":     importance,
        })
    except Exception as exc:
        return server_error(exc, "ml_predictions")





# ══════════════════════════════════════════════════════════════════════════════
#  INSTAGRAM
# ══════════════════════════════════════════════════════════════════════════════
@app.route("/api/instagram/connect", methods=["POST"])
def instagram_connect():
    """
    POST /api/instagram/connect  body: {"code": "<oauth_code>"}
    Exchanges OAuth code for access token.
    """
    body = request.get_json(silent=True) or {}
    code = body.get("code", "").strip()
    if not code:
        return error_response("Field 'code' is required in request body.")
    try:
        ig = _ig()
        token_data = ig.exchange_code_for_token(code)
        return ok_response(token_data, message="Instagram connected successfully")
    except Exception as exc:
        return server_error(exc, "instagram_connect")


@app.route("/api/instagram/insights", methods=["GET"])
def instagram_insights():
    """
    GET /api/instagram/insights?access_token=<token>
    Returns Instagram account insights + best posting times.
    """
    token = request.args.get("access_token", "").strip()
    if not token:
        return error_response("Query param 'access_token' is required.")
    try:
        ig = _ig()
        profile = ig.get_user_insights(token)
        media = ig.get_media_insights(token)
        audience = ig.get_audience_demographics(token)
        best_times = ig.get_best_posting_times(token)
        return ok_response(
            {
                "profile": profile,
                "media_insights": media,
                "audience_demographics": audience,
                "best_posting_times": best_times,
            }
        )
    except Exception as exc:
        return server_error(exc, "instagram_insights")


# ══════════════════════════════════════════════════════════════════════════════
#  ERROR HANDLERS
# ══════════════════════════════════════════════════════════════════════════════
@app.errorhandler(404)
def not_found(_err):
    return error_response("Endpoint not found.", 404)


@app.errorhandler(405)
def method_not_allowed(_err):
    return error_response("Method not allowed.", 405)


@app.errorhandler(500)
def internal_error(_err):
    return error_response("Internal server error.", 500)


# ══════════════════════════════════════════════════════════════════════════════
#  ENTRY POINT
# ══════════════════════════════════════════════════════════════════════════════
if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    debug = os.getenv("FLASK_DEBUG", "false").lower() == "true"
    logger.info("Starting CreatorIQ on port %s (debug=%s)", port, debug)
    app.run(host="0.0.0.0", port=port, debug=debug)
