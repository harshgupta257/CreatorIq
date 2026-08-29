"""
CreatorIQ Analytics Platform — Main Flask Server
"""

import os
import logging
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
from youtube_api import YouTubeAnalyzer
from reddit_api import RedditSentimentCollector
from sentiment_analysis import SentimentAnalyzer
from google_trends import GoogleTrendsAnalyzer
from news_scraper import NewsAnalyzer
from ml_models import EngagementPredictor
from instagram_api import InstagramAnalyzer

# ── app factory ────────────────────────────────────────────────────────────────
app = Flask(__name__)
app.secret_key = os.getenv("SECRET_KEY", "dev-secret-key-change-in-prod")

CORS(
    app,
    resources={r"/api/*": {"origins": "*"}},
    supports_credentials=True,
)

# ── singleton helpers (lazy-init so missing keys just log a warning) ───────────
def _yt():
    return YouTubeAnalyzer()

def _reddit():
    return RedditSentimentCollector()

def _sentiment():
    return SentimentAnalyzer()

def _trends():
    return GoogleTrendsAnalyzer()

def _news():
    return NewsAnalyzer()

def _ml():
    return EngagementPredictor()

def _ig():
    return InstagramAnalyzer()


# ── utility ────────────────────────────────────────────────────────────────────
def error_response(message: str, code: int = 400):
    return jsonify({"success": False, "error": message}), code


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
        return ok_response(info)
    except Exception as exc:
        logger.exception("youtube_channel error")
        return error_response(str(exc), 500)


@app.route("/api/youtube/videos", methods=["GET"])
def youtube_videos():
    """
    GET /api/youtube/videos?channel_id=<id>&max_results=<n>
    Returns paginated list of videos with stats.
    """
    channel_id = request.args.get("channel_id", "").strip()
    if not channel_id:
        return error_response("Query param 'channel_id' is required.")
    max_results = min(int(request.args.get("max_results", 50)), 200)
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
        logger.exception("youtube_videos error")
        return error_response(str(exc), 500)


@app.route("/api/youtube/comments", methods=["GET"])
def youtube_comments():
    """
    GET /api/youtube/comments?video_id=<id>&max_results=<n>
    Returns top comments for a video.
    """
    video_id = request.args.get("video_id", "").strip()
    if not video_id:
        return error_response("Query param 'video_id' is required.")
    max_results = min(int(request.args.get("max_results", 100)), 500)
    try:
        yt = _yt()
        comments = yt.get_video_comments(video_id, max_results=max_results)
        return ok_response({"video_id": video_id, "comment_count": len(comments), "comments": comments})
    except Exception as exc:
        logger.exception("youtube_comments error")
        return error_response(str(exc), 500)


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
                "post_count": len(posts),
                "sentiment": sentiment,
                "top_words": word_freq[:30],
                "posts_sample": posts[:10],
            }
        )
    except Exception as exc:
        logger.exception("reddit_sentiment error")
        return error_response(str(exc), 500)


# ══════════════════════════════════════════════════════════════════════════════
#  GOOGLE TRENDS
# ══════════════════════════════════════════════════════════════════════════════
@app.route("/api/trends", methods=["GET"])
def google_trends():
    """
    GET /api/trends?query=<channel_name>&channel_id=<id>&timeframe=<tf>

    Strategy:
    - If channel_id is given, extract the most frequent tags from recent videos
      and query Google Trends for those topics (far more useful than the channel name).
    - Otherwise fall back to the raw query string.
    - Runs all 3 pytrends calls in one payload to reduce round-trips.
    """
    query      = request.args.get("query", "").strip()
    channel_id = request.args.get("channel_id", "").strip()
    timeframe  = request.args.get("timeframe", "today 3-m")

    if not query and not channel_id:
        return error_response("Provide 'query' or 'channel_id'.")

    # ── Step 1: decide which keyword to search ──────────────────────────────
    keyword_used  = query or "youtube"
    topic_keywords: list[str] = []

    if channel_id:
        try:
            yt     = _yt()
            videos = yt.get_channel_videos(channel_id, max_results=20)

            from collections import Counter
            word_counter: Counter = Counter()

            # Extended stopwords — common but not searchable on trends
            STOPWORDS = {
                "the","and","for","with","how","what","this","that","are","you",
                "your","new","our","why","was","has","its","get","can","but","not",
                "have","from","they","will","been","more","than","also","just","into",
                "about","when","there","their","which","would","could","should",
                # Hindi romanized stopwords
                "kya","hai","kyu","kyun","aap","main","mera","mere","kaise","kab",
                "yeh","iska","uska","hain","bhi","unka","wala","wali","nahi","iske",
                # Generic YouTube/video words
                "video","hindi","english","channel","part","full","short","live",
                "subscribe","like","share","comment","watch","today","2024","2025","2026",
            }

            # Split each tag into individual words — "stop overthinking" → "overthinking"
            for v in videos:
                for tag in (v.get("tags") or []):
                    for word in tag.lower().split():
                        word = word.strip(".,!?-\"'#@|()")
                        if len(word) > 3 and word not in STOPWORDS and word.isalpha():
                            word_counter[word] += 1

            # Also split title words
            for v in videos:
                for word in (v.get("title") or "").lower().split():
                    word = word.strip(".,!?-\"'#@|()?!")
                    if len(word) > 3 and word not in STOPWORDS and word.isalpha():
                        word_counter[word] += 1

            # Blacklist generic/entertainment words that inflate counts but have no trend signal
            BLACKLIST = {
                # Too generic — no trends signal
                "interstellar","inspired","think","yourself","leave","stop",
                "back","time","again","know","good","great","best","mind",
                "real","true","life","love","feel","make","work","need",
                # Common philosophical/motivational fillers
                "past","future","reality","people","world","human","things",
                "thing","does","doing","being","become","become","always",
                "never","every","other","power","point","right","wrong",
                "words","word","idea","each","even","still","only","every",
                "them","then","they","this","with","your","mine","here",
                # Content-generic
                "tips","ways","part","full","type","kind","fact","story",
                "show","talk","tell","said","says","ask","answer","read",
            }

            # Pick top 3 most frequent channel-specific words (4+ chars, not blacklisted)
            best = [(w, c) for w, c in word_counter.most_common(40)
                    if len(w) >= 4 and w not in BLACKLIST]

            top_tags = [w for w, _ in best[:3]]

            if top_tags:
                topic_keywords = top_tags
                keyword_used   = top_tags[0]
                logger.info("Trends keywords from video content: %s", topic_keywords)
            else:
                keyword_used = query or "youtube"
        except Exception as exc:
            logger.warning("Tag extraction failed: %s — falling back to query.", exc)
            keyword_used = query or "youtube"


    if not topic_keywords:
        topic_keywords = [keyword_used]

    # ── Step 2: query pytrends ──────────────────────────────────────────────
    try:
        gt = _trends()
        interest, kws_in_data, rl1 = gt.get_interest_over_time(topic_keywords, timeframe=timeframe)
        related,  rl2 = gt.get_related_queries(keyword_used)
        geo,      rl3 = gt.get_geographic_interest(keyword_used)
        rate_limited  = rl1 or rl2 or rl3

        return ok_response(
            {
                "query":               query,
                "keyword_used":        keyword_used,
                "topic_keywords":      topic_keywords,
                "keywords_in_data":    kws_in_data,
                "timeframe":           timeframe,
                "interest_over_time":  interest,
                "related_queries":     related,
                "geographic_interest": geo,
                "rate_limited":        rate_limited,
                # Word frequency from video tags for channel topic profile
                "word_frequency":      [{"word": w, "count": c}
                                        for w, c in __import__("collections").Counter(
                                            word
                                            for v in (locals().get("videos") or [])
                                            for tag in (v.get("tags") or [])
                                            for word in tag.lower().split()
                                            if len(word) > 3 and word.isalpha()
                                        ).most_common(25)],
            }
        )
    except Exception as exc:
        logger.exception("google_trends error")
        return error_response(str(exc), 500)




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
        articles = na.search_news(query)
        summary = na.get_news_sentiment_summary(query)
        recent = na.get_recent_news(query)
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
        logger.exception("news_sentiment error")
        return error_response(str(exc), 500)


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
            "reddit_connected":   len(reddit_posts) > 0,
            "news_sentiment":     news_sentiment,
            "combined_sentiment": combined,
            "sentiment_over_time": trend_over_time,
            "word_frequency":     word_freq,
        })
    except Exception as exc:
        logger.exception("combined_sentiment error")
        return error_response(str(exc), 500)



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
            channel_info = yt.get_channel_info(f"https://www.youtube.com/channel/{channel_id}")
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
        logger.exception("ml_predictions error")
        return error_response(str(exc), 500)





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
        logger.exception("instagram_connect error")
        return error_response(str(exc), 500)


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
        logger.exception("instagram_insights error")
        return error_response(str(exc), 500)


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
    debug = os.getenv("FLASK_DEBUG", "true").lower() == "true"
    logger.info("Starting CreatorIQ on port %s (debug=%s)", port, debug)
    app.run(host="0.0.0.0", port=port, debug=debug)
