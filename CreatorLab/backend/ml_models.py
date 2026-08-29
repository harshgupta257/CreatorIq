"""
CreatorIQ — ML Engagement Predictor
Uses RandomForestRegressor + GradientBoostingRegressor (scikit-learn)
"""

import logging
import re
from collections import Counter, defaultdict
from datetime import datetime, timezone, timedelta

logger = logging.getLogger("creatoriq.ml")

# ── optional imports ───────────────────────────────────────────────────────────
try:
    import numpy as np
    import pandas as pd
    from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
    from sklearn.linear_model import LinearRegression
    from sklearn.preprocessing import StandardScaler
    from sklearn.model_selection import train_test_split
    from sklearn.metrics import mean_absolute_error, r2_score
    _SKLEARN_AVAILABLE = True
except ImportError:
    _SKLEARN_AVAILABLE = False
    logger.warning("scikit-learn / numpy / pandas not installed — ML features disabled.")


# ══════════════════════════════════════════════════════════════════════════════
#  Helpers
# ══════════════════════════════════════════════════════════════════════════════
def _parse_iso(iso: str) -> datetime:
    try:
        return datetime.fromisoformat(iso.replace("Z", "+00:00"))
    except Exception:
        return datetime.now(tz=timezone.utc)


def _parse_duration_seconds(duration: str) -> int:
    """ISO-8601 duration → seconds."""
    pattern = r"PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?"
    m = re.match(pattern, duration or "")
    if not m:
        return 0
    h, mn, s = (int(v or 0) for v in m.groups())
    return h * 3600 + mn * 60 + s


def _extract_features(video: dict) -> dict:
    """
    Extract ML feature dict from a video dict.
    Uses REAL per-video data (not hardcoded values).
    """
    published = video.get("published_at", "")
    dt = _parse_iso(published) if published else datetime.now(tz=timezone.utc)
    duration_secs = _parse_duration_seconds(video.get("duration", ""))

    title = video.get("title", "")
    # Simple sentiment proxy: count positive/negative words in title
    POSITIVE_WORDS = {"best", "amazing", "incredible", "truth", "secret", "revealed",
                      "must", "change", "powerful", "real", "understand", "discover"}
    NEGATIVE_WORDS = {"worst", "fail", "mistake", "wrong", "never", "stop", "avoid"}
    title_words = set(title.lower().split())
    pos_count = len(title_words & POSITIVE_WORDS)
    neg_count = len(title_words & NEGATIVE_WORDS)
    sentiment_proxy = (pos_count - neg_count) / max(1, len(title_words))

    return {
        "video_length":    duration_secs,
        "publish_hour":    dt.hour,
        "publish_day":     dt.weekday(),          # 0=Monday … 6=Sunday
        "title_length":    len(title),
        "tag_count":       len(video.get("tags", [])),
        "has_thumbnail":   1 if video.get("thumbnail") else 0,
        "sentiment_score": round(sentiment_proxy, 4),
    }


_FEATURE_NAMES = [
    "video_length", "publish_hour", "publish_day",
    "title_length", "tag_count", "has_thumbnail", "sentiment_score",
]

_MIN_VIDEOS_FULL = 10   # full ML mode
_MIN_VIDEOS_HEURISTIC = 3  # heuristic mode with warning


# ══════════════════════════════════════════════════════════════════════════════
#  Main class
# ══════════════════════════════════════════════════════════════════════════════
class EngagementPredictor:
    """
    Trains an ensemble of RF + GBR to predict video engagement.
    Falls back to heuristic estimates when sklearn is unavailable or
    insufficient training data exists.
    """

    def __init__(self):
        self._rf    = None
        self._gbr   = None
        self._scaler = None
        self._trained = False
        self._feature_importances: dict = {}
        self._training_metrics: dict = {}
        self._channel_avg_views: float = 0.0
        self._channel_avg_engagement: float = 0.0

    # ── training ───────────────────────────────────────────────────────────────
    def train_model(self, videos_data: list) -> dict:
        """
        Train RF + GBR on historical video data.
        Target: view_count (log-scaled for better distribution).
        Returns training metrics dict.
        """
        valid = [v for v in videos_data if v.get("view_count", 0) > 0]

        # Store channel averages for relative comparisons
        if valid:
            views_list = [v["view_count"] for v in valid]
            self._channel_avg_views = sum(views_list) / len(views_list)
            engagement_list = []
            for v in valid:
                likes    = v.get("like_count", 0) or 0
                comments = v.get("comment_count", 0) or 0
                views    = v.get("view_count", 1) or 1
                engagement_list.append((likes + comments) / views * 100)
            self._channel_avg_engagement = sum(engagement_list) / len(engagement_list)

        if not _SKLEARN_AVAILABLE:
            logger.warning("sklearn unavailable — skipping training.")
            return {"status": "sklearn_unavailable"}

        if len(valid) < _MIN_VIDEOS_FULL:
            logger.warning(
                "Insufficient training data (%d samples, need %d).",
                len(valid), _MIN_VIDEOS_FULL,
            )
            return {"status": "insufficient_data", "samples": len(valid)}

        try:
            features = [list(_extract_features(v).values()) for v in valid]
            targets_views = [v["view_count"] for v in valid]

            X = np.array(features, dtype=float)
            y = np.log1p(np.array(targets_views, dtype=float))

            self._scaler = StandardScaler()
            X_scaled = self._scaler.fit_transform(X)

            X_tr, X_te, y_tr, y_te = train_test_split(
                X_scaled, y, test_size=0.2, random_state=42
            )

            self._rf = RandomForestRegressor(n_estimators=100, random_state=42, n_jobs=-1)
            self._rf.fit(X_tr, y_tr)

            self._gbr = GradientBoostingRegressor(
                n_estimators=100, learning_rate=0.1, random_state=42
            )
            self._gbr.fit(X_tr, y_tr)

            y_pred_rf  = self._rf.predict(X_te)
            y_pred_gbr = self._gbr.predict(X_te)
            y_pred_ens = (y_pred_rf + y_pred_gbr) / 2

            mae = float(mean_absolute_error(y_te, y_pred_ens))
            r2  = float(r2_score(y_te, y_pred_ens))

            imp_rf  = self._rf.feature_importances_
            imp_gbr = self._gbr.feature_importances_
            avg_imp = (imp_rf + imp_gbr) / 2
            self._feature_importances = {
                name: round(float(imp), 4)
                for name, imp in zip(_FEATURE_NAMES, avg_imp)
            }

            self._trained = True
            self._training_metrics = {
                "status":              "trained",
                "samples":             len(valid),
                "mae_log":             round(mae, 4),
                "r2_score":            round(r2, 4),
                "feature_importances": self._feature_importances,
            }
            logger.info("Model trained: R²=%.3f, MAE_log=%.3f", r2, mae)
            return self._training_metrics

        except Exception as exc:
            logger.exception("train_model error: %s", exc)
            return {"status": "error", "message": str(exc)}

    # ── prediction ─────────────────────────────────────────────────────────────
    def predict_engagement(self, video_features: dict) -> dict:
        """
        Predict expected views and engagement rate for given feature dict.
        Returns {predicted_views, predicted_engagement_rate, confidence, model}.
        """
        if not _SKLEARN_AVAILABLE or not self._trained:
            base       = max(self._channel_avg_views, 5000) if self._channel_avg_views else 10_000
            hour_bonus = 1.3 if 14 <= video_features.get("publish_hour", 0) <= 18 else 1.0
            day_bonus  = 1.2 if video_features.get("publish_day", 0) in (1, 2, 3) else 1.0
            length     = video_features.get("video_length", 300)
            length_factor = 1.2 if 300 <= length <= 900 else 0.9
            views = int(base * hour_bonus * day_bonus * length_factor)
            return {
                "predicted_views":           views,
                "predicted_engagement_rate": round(self._channel_avg_engagement or 3.5, 2),
                "confidence":                0.45,
                "model":                     "heuristic_fallback",
            }

        try:
            feat_values = [
                video_features.get(name, 0.0) for name in _FEATURE_NAMES
            ]
            X        = np.array([feat_values], dtype=float)
            X_scaled = self._scaler.transform(X)

            pred_rf  = self._rf.predict(X_scaled)[0]
            pred_gbr = self._gbr.predict(X_scaled)[0]
            pred_log = (pred_rf + pred_gbr) / 2
            predicted_views = int(np.expm1(pred_log))

            tree_preds = np.array(
                [tree.predict(X_scaled)[0] for tree in self._rf.estimators_]
            )
            std        = float(np.std(tree_preds))
            confidence = round(max(0.0, min(1.0, 1.0 - std / (abs(pred_log) + 1e-9))), 3)

            return {
                "predicted_views":           max(0, predicted_views),
                "predicted_engagement_rate": round(
                    min(20.0, max(0.0, (pred_log / 10) * 4)), 2
                ),
                "confidence":  confidence,
                "model":       "rf_gbr_ensemble",
            }
        except Exception as exc:
            logger.error("predict_engagement error: %s", exc)
            return {
                "predicted_views": int(self._channel_avg_views or 10_000),
                "predicted_engagement_rate": round(self._channel_avg_engagement or 3.5, 2),
                "confidence": 0.4,
                "model": "fallback_after_error",
            }

    # ── viral potential score (channel-relative) ───────────────────────────────
    def get_viral_potential_score(self, video_data: dict, channel_data: dict) -> dict:
        """
        Returns a 0-100 viral-potential score based on channel-relative heuristics.
        Compares video features against the channel's own historical averages.
        """
        videos = channel_data if isinstance(channel_data, list) else []
        avg_views    = self._channel_avg_views or 10_000
        avg_eng      = self._channel_avg_engagement or 3.5

        # Use channel average title length as baseline
        if videos:
            avg_title_len = sum(len(v.get("title", "")) for v in videos) / len(videos)
            avg_tag_count = sum(len(v.get("tags", [])) for v in videos) / len(videos)
            avg_duration  = sum(_parse_duration_seconds(v.get("duration", "")) for v in videos) / len(videos)
        else:
            avg_title_len = 60
            avg_tag_count = 10
            avg_duration  = 600

        score = 50.0  # baseline

        # Title length: penalize if very different from channel's own average
        title_len = len(video_data.get("title", ""))
        if abs(title_len - avg_title_len) < 15:
            score += 8   # consistent with your style
        elif 40 <= title_len <= 70:
            score += 5   # global sweet-spot
        elif title_len < 15 or title_len > 100:
            score -= 10

        # Tag count vs channel average
        tag_count = len(video_data.get("tags", []))
        if tag_count >= avg_tag_count:
            score += 10
        else:
            score += max(0, (tag_count / max(1, avg_tag_count)) * 10)

        # Thumbnail
        if video_data.get("thumbnail"):
            score += 5

        # Sentiment from title
        title = video_data.get("title", "")
        POSITIVE_WORDS = {"best", "amazing", "incredible", "truth", "secret", "revealed",
                          "must", "change", "powerful", "real", "understand", "discover",
                          "hidden", "exposed", "shocking", "never", "always"}
        title_words = set(title.lower().split())
        pos_hits = len(title_words & POSITIVE_WORDS)
        score += min(pos_hits * 4, 12)

        # Duration vs channel average (within 30% of avg = good)
        duration = _parse_duration_seconds(video_data.get("duration", ""))
        if duration > 0 and avg_duration > 0:
            ratio = duration / avg_duration
            if 0.7 <= ratio <= 1.4:
                score += 8
            elif duration < 60:
                score -= 15  # very short (not a Short)

        # Posting time bonus
        dt_str = video_data.get("published_at", "")
        if dt_str:
            hour = _parse_iso(dt_str).hour
            if 14 <= hour <= 19:
                score += 5

        score = round(max(0.0, min(100.0, score)), 1)
        label = "High 🔥" if score >= 70 else "Medium ⚡" if score >= 40 else "Low 📉"

        return {
            "score":    score,
            "label":    label,
            "out_of":   100,
            "channel_avg_views": int(avg_views),
            "limited_data": len(videos) < _MIN_VIDEOS_FULL,
        }

    # ── best posting time ──────────────────────────────────────────────────────
    def recommend_posting_time(self, channel_data: list) -> dict:
        """
        Determine best hour (UTC) and day of week based on REAL historical engagement.
        Returns hour×day performance data for the heatmap.
        """
        DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

        if not channel_data or len(channel_data) < _MIN_VIDEOS_HEURISTIC:
            return {
                "best_hour_utc":   15,
                "best_day":        "Wednesday",
                "recommendation":  "Post on Wednesday at 15:00 UTC (default — load more videos for personalised suggestion).",
                "hour_performance": {},
                "day_performance":  {},
                "based_on_videos":  0,
                "limited_data":     True,
            }

        hour_views: dict = defaultdict(list)
        day_views:  dict = defaultdict(list)
        heatmap: dict = {}  # (day, hour) → avg_views

        for v in channel_data:
            try:
                dt    = _parse_iso(v.get("published_at", ""))
                views = v.get("view_count", 0)
                hour_views[dt.hour].append(views)
                day_views[dt.weekday()].append(views)
                key = f"{dt.weekday()}_{dt.hour}"
                if key not in heatmap:
                    heatmap[key] = []
                heatmap[key].append(views)
            except Exception:
                pass

        # Avg views per hour / day
        hour_avg = {h: int(sum(vs) / len(vs)) for h, vs in hour_views.items()}
        day_avg  = {d: int(sum(vs) / len(vs)) for d, vs in day_views.items()}
        heatmap_avg = {k: int(sum(vs) / len(vs)) for k, vs in heatmap.items()}

        best_hour    = max(hour_avg, key=lambda h: hour_avg[h]) if hour_avg else 15
        best_day_idx = max(day_avg,  key=lambda d: day_avg[d])  if day_avg  else 2
        best_day     = DAY_NAMES[best_day_idx]

        return {
            "best_hour_utc":    best_hour,
            "best_day":         best_day,
            "best_day_idx":     best_day_idx,
            "recommendation":   f"Post on {best_day} at {best_hour:02d}:00 UTC for best results on your channel.",
            "hour_performance": hour_avg,
            "day_performance":  day_avg,
            "heatmap":          heatmap_avg,  # {day_hour: avg_views}
            "based_on_videos":  len(channel_data),
            "limited_data":     len(channel_data) < _MIN_VIDEOS_FULL,
        }

    # ── title pattern analysis ─────────────────────────────────────────────────
    def analyze_title_patterns(self, videos: list) -> dict:
        """
        Analyse which title characteristics correlate with higher views on THIS channel.
        Returns insights about: length, numbers, questions, colons/pipes.
        """
        limited = len(videos) < _MIN_VIDEOS_FULL

        if len(videos) < _MIN_VIDEOS_HEURISTIC:
            return {
                "limited_data":     True,
                "best_length_bucket": "50-70 chars",
                "length_buckets":   {},
                "numbers_boost_pct": 0,
                "questions_boost_pct": 0,
                "has_colon_boost_pct": 0,
                "top_title_words":  [],
                "best_example":     {},
            }

        def bucket(title_len: int) -> str:
            if title_len < 30:   return "<30 chars"
            if title_len < 50:   return "30-50 chars"
            if title_len < 70:   return "50-70 chars"
            if title_len < 90:   return "70-90 chars"
            return ">90 chars"

        bucket_views: dict = defaultdict(list)
        with_numbers, without_numbers = [], []
        with_question, without_question = [], []
        with_colon, without_colon = [], []
        word_views: dict = defaultdict(list)

        for v in videos:
            title  = v.get("title", "")
            views  = v.get("view_count", 0)
            b      = bucket(len(title))
            bucket_views[b].append(views)

            if re.search(r'\d', title):
                with_numbers.append(views)
            else:
                without_numbers.append(views)

            if "?" in title:
                with_question.append(views)
            else:
                without_question.append(views)

            if ":" in title or "|" in title:
                with_colon.append(views)
            else:
                without_colon.append(views)

            # Word-level performance (ignore short words)
            STOP = {"the","a","an","in","on","of","to","is","it","at","by","be","or","and",
                    "for","how","why","what","you","your","this","that","with","from"}
            for word in re.findall(r'[a-z]+', title.lower()):
                if len(word) > 3 and word not in STOP:
                    word_views[word].append(views)

        # Bucket averages
        bucket_avg = {
            b: int(sum(vs) / len(vs))
            for b, vs in bucket_views.items()
        }
        best_bucket = max(bucket_avg, key=lambda b: bucket_avg[b]) if bucket_avg else "50-70 chars"

        def boost_pct(with_list, without_list):
            if not with_list or not without_list:
                return 0
            avg_with    = sum(with_list) / len(with_list)
            avg_without = sum(without_list) / len(without_list)
            if avg_without == 0:
                return 0
            return round((avg_with - avg_without) / avg_without * 100, 1)

        # Top words by avg views (need ≥2 occurrences)
        top_words = [
            {"word": w, "avg_views": int(sum(vs) / len(vs)), "count": len(vs)}
            for w, vs in sorted(word_views.items(), key=lambda x: sum(x[1]) / len(x[1]), reverse=True)
            if len(vs) >= 2
        ][:10]

        # Best performing video as example
        best_vid = max(videos, key=lambda v: v.get("view_count", 0)) if videos else {}

        return {
            "limited_data":           limited,
            "best_length_bucket":     best_bucket,
            "length_buckets":         bucket_avg,
            "numbers_boost_pct":      boost_pct(with_numbers, without_numbers),
            "questions_boost_pct":    boost_pct(with_question, without_question),
            "has_colon_boost_pct":    boost_pct(with_colon, without_colon),
            "top_title_words":        top_words,
            "best_example":           {
                "title": best_vid.get("title", ""),
                "views": best_vid.get("view_count", 0),
            },
        }

    # ── topic performance ──────────────────────────────────────────────────────
    def get_topic_performance(self, videos: list) -> list:
        """
        Group videos by their most frequent tags and compute avg views per topic.
        Returns a ranked list of topics with performance metrics.
        """
        if len(videos) < _MIN_VIDEOS_HEURISTIC:
            return []

        tag_data: dict = defaultdict(lambda: {"views": [], "count": 0})
        STOP = {"video", "hindi", "english", "subscribe", "like", "share",
                "watch", "channel", "part", "full", "short", "live",
                "2024", "2025", "2026", "best", "new"}

        for v in videos:
            views = v.get("view_count", 0)
            tags  = v.get("tags", [])
            for tag in tags:
                tag_lower = tag.lower().strip()
                if len(tag_lower) > 3 and tag_lower not in STOP:
                    tag_data[tag_lower]["views"].append(views)
                    tag_data[tag_lower]["count"] += 1

        result = []
        for tag, data in tag_data.items():
            if data["count"] >= 2:  # need at least 2 videos per topic
                avg_v = int(sum(data["views"]) / len(data["views"]))
                result.append({
                    "topic":       tag,
                    "avg_views":   avg_v,
                    "video_count": data["count"],
                    "total_views": sum(data["views"]),
                })

        # Sort by avg views descending
        result.sort(key=lambda x: x["avg_views"], reverse=True)
        limited = len(videos) < _MIN_VIDEOS_FULL
        return [{"limited_data": limited, **r} for r in result[:12]]

    # ── optimal video duration ─────────────────────────────────────────────────
    def get_optimal_duration(self, videos: list) -> dict:
        """
        Analyse which video length bucket performs best on THIS channel.
        """
        if len(videos) < _MIN_VIDEOS_HEURISTIC:
            return {
                "limited_data":   True,
                "best_range":     "7-20 min",
                "duration_buckets": {},
                "recommendation": "Typically 7-20 minute videos perform best (based on general YouTube data).",
            }

        BUCKETS = [
            ("< 3 min",  0,    180),
            ("3-7 min",  180,  420),
            ("7-15 min", 420,  900),
            ("15-30 min",900,  1800),
            ("> 30 min", 1800, 99999),
        ]

        bucket_views: dict = defaultdict(list)
        for v in videos:
            secs  = _parse_duration_seconds(v.get("duration", ""))
            views = v.get("view_count", 0)
            if secs == 0:
                continue
            for label, lo, hi in BUCKETS:
                if lo <= secs < hi:
                    bucket_views[label].append(views)
                    break

        bucket_avg = {
            label: int(sum(vs) / len(vs))
            for label, vs in bucket_views.items()
            if vs
        }
        best_range = max(bucket_avg, key=lambda b: bucket_avg[b]) if bucket_avg else "7-15 min"

        return {
            "limited_data":     len(videos) < _MIN_VIDEOS_FULL,
            "best_range":       best_range,
            "duration_buckets": bucket_avg,
            "recommendation":   f"Your {best_range} videos average the most views. Aim for this range.",
        }

    # ── growth forecast ────────────────────────────────────────────────────────
    def get_growth_forecast(self, videos: list, channel_info: dict, weeks: int = 12) -> dict:
        """
        Linear regression on cumulative views over time → project next N weeks.
        Clearly labelled as ESTIMATED PROJECTION.
        """
        if len(videos) < _MIN_VIDEOS_HEURISTIC:
            return {
                "limited_data":      True,
                "forecast_points":   [],
                "slope_views_week":  0,
                "r2":                0,
                "label":             "Estimated Projection",
            }

        # Sort videos by date
        dated = []
        for v in videos:
            try:
                dt    = _parse_iso(v.get("published_at", ""))
                views = v.get("view_count", 0)
                dated.append((dt, views))
            except Exception:
                pass

        if not dated:
            return {"limited_data": True, "forecast_points": [], "slope_views_week": 0, "r2": 0, "label": "Estimated Projection"}

        dated.sort(key=lambda x: x[0])
        base_dt = dated[0][0]

        # Cumulative views over time
        cum_views = 0
        points_x  = []
        points_y  = []
        for dt, views in dated:
            weeks_since = (dt - base_dt).days / 7.0
            cum_views  += views
            points_x.append(weeks_since)
            points_y.append(cum_views)

        if not _SKLEARN_AVAILABLE or len(points_x) < 3:
            # Simple linear extrapolation
            if len(points_x) >= 2:
                slope = (points_y[-1] - points_y[0]) / max(1, points_x[-1] - points_x[0])
            else:
                slope = 0
            last_week = points_x[-1]
            last_val  = points_y[-1]
            forecast  = [
                {"week_offset": i + 1, "predicted_cum_views": int(last_val + slope * (i + 1)),
                 "label": f"Week +{i+1}"}
                for i in range(weeks)
            ]
            return {
                "limited_data":     len(videos) < _MIN_VIDEOS_FULL,
                "forecast_points":  forecast,
                "slope_views_week": int(slope),
                "r2":               0,
                "label":            "Estimated Projection",
                "disclaimer":       "This is an estimated projection based on linear extrapolation of past performance. Actual results may vary.",
            }

        X = np.array(points_x).reshape(-1, 1)
        y = np.array(points_y)
        model = LinearRegression()
        model.fit(X, y)
        r2  = float(r2_score(y, model.predict(X)))
        slope = float(model.coef_[0])

        last_week = points_x[-1]
        forecast  = []
        for i in range(1, weeks + 1):
            w_offset = last_week + i
            pred_cum = max(0, float(model.predict([[w_offset]])[0]))
            forecast.append({
                "week_offset":          i,
                "predicted_cum_views":  int(pred_cum),
                "label":                f"Week +{i}",
            })

        # Also include historical points for the chart
        historical = [
            {"week": round(x, 1), "cum_views": int(y_val)}
            for x, y_val in zip(points_x, points_y)
        ]

        # Subscriber forecast (rough: use channel sub count and growth rate)
        current_subs = channel_info.get("subscriber_count", 0) if channel_info else 0
        sub_forecast = []
        if current_subs and slope > 0:
            # Estimate weekly sub gain proportional to views slope
            views_per_sub_gain = max(1, int(self._channel_avg_views / 50))
            weekly_subs = max(1, int(slope / views_per_sub_gain))
            for i in range(1, weeks + 1):
                sub_forecast.append({
                    "week_offset": i,
                    "predicted_subs": current_subs + weekly_subs * i,
                    "label": f"Week +{i}",
                })

        return {
            "limited_data":     len(videos) < _MIN_VIDEOS_FULL,
            "historical":       historical,
            "forecast_points":  forecast,
            "sub_forecast":     sub_forecast,
            "slope_views_week": int(slope),
            "r2":               round(r2, 3),
            "label":            "Estimated Projection",
            "disclaimer":       "This is an estimated projection based on linear extrapolation of past performance. Actual results may vary.",
        }

    # ── content topic recommendations ──────────────────────────────────────────
    def recommend_content_topics(self, channel_data: list, trends_data: list = None) -> list:
        """
        Suggest content topics by cross-referencing high-performing video tags
        with trending topics.
        """
        tag_counter: Counter = Counter()
        for v in channel_data:
            views  = v.get("view_count", 0)
            weight = max(1, views // 10_000)
            for tag in v.get("tags", []):
                tag_counter[tag.lower()] += weight

        top_tags = [t for t, _ in tag_counter.most_common(10)]
        trending = [item.get("topic", "") for item in (trends_data or [])[:5]]

        recommendations = []
        for topic in trending:
            recommendations.append({
                "topic":  topic,
                "type":   "trending",
                "reason": "Currently trending on Google Trends",
            })
        for tag in top_tags:
            recommendations.append({
                "topic":  tag,
                "type":   "proven",
                "reason": "Historically high-performing tag in your channel",
            })
        return recommendations[:10]

    # ── feature importance ─────────────────────────────────────────────────────
    def get_feature_importance(self) -> dict:
        """Return feature importances from trained model (or defaults)."""
        if self._feature_importances:
            return self._feature_importances
        return {
            "video_length":    0.25,
            "publish_hour":    0.18,
            "publish_day":     0.12,
            "title_length":    0.15,
            "tag_count":       0.13,
            "has_thumbnail":   0.10,
            "sentiment_score": 0.07,
        }
