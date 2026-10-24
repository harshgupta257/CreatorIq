"""
CreatorIQ — YouTube Data API v3 helper
Uses requests directly (not google-api-python-client) for reliability.
"""

import os
import re
import time
import logging
import threading
from datetime import datetime, timedelta, timezone
from collections import defaultdict
from urllib.parse import urlparse

import requests
from dotenv import load_dotenv

import shared_store

load_dotenv()
logger = logging.getLogger("creatoriq.youtube")

YT_BASE = "https://www.googleapis.com/youtube/v3"

# Video lists are cached per channel so the dashboard's endpoints share one fetch.
_CACHE_TTL_SECS = 600
_MIN_FETCH = 50   # always fetch a full page; it costs the same quota as fewer
_video_cache: dict[str, tuple[float, int, list]] = {}
_cache_lock = threading.Lock()


# Standard YouTube video category IDs → names (stable; avoids an API call)
CATEGORY_NAMES = {
    "1": "Film & Animation", "2": "Autos & Vehicles", "10": "Music",
    "15": "Pets & Animals", "17": "Sports", "19": "Travel & Events",
    "20": "Gaming", "22": "People & Blogs", "23": "Comedy",
    "24": "Entertainment", "25": "News & Politics", "26": "Howto & Style",
    "27": "Education", "28": "Science & Technology", "29": "Nonprofits & Activism",
}

# Search costs 100 units + 1 for the stats lookup
_SEARCH_COST = 101
_TRENDING_TTL_SECS = 3600
_NICHE_TTL_SECS = 6 * 3600


class QuotaCapReached(Exception):
    """The app's own daily budget for niche searches is used up."""


class YouTubeAPIError(Exception):
    """Upstream YouTube error with a message that is safe to show to clients."""

    def __init__(self, message: str, status: int = 502):
        super().__init__(message)
        self.status = status


def parse_duration_seconds(iso: str) -> int:
    """Convert ISO 8601 duration (PT1H2M3S) to seconds."""
    m = re.match(r"PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?", iso or "")
    if not m:
        return 0
    h, mi, s = (int(x or 0) for x in m.groups())
    return h * 3600 + mi * 60 + s


def _parse_channel_input(raw: str) -> tuple[str, str]:
    """
    Classify user input into (kind, value) where kind is one of
    'id', 'handle', 'username', 'custom' or 'name'.
    """
    text = raw.strip()
    if "youtube.com" in text or "youtu.be" in text:
        if not re.match(r"^[a-z]+://", text):
            text = "https://" + text
        parts = [p for p in urlparse(text).path.split("/") if p]
        if parts:
            first = parts[0]
            if first == "channel" and len(parts) > 1:
                return "id", parts[1]
            if first.startswith("@"):
                return "handle", first[1:]
            if first == "user" and len(parts) > 1:
                return "username", parts[1]
            if first == "c" and len(parts) > 1:
                return "custom", parts[1]
            return "custom", first
        return "name", ""

    if re.fullmatch(r"UC[\w-]{22}", text):
        return "id", text
    if text.startswith("@"):
        return "handle", text[1:]
    return "name", text


class YouTubeAnalyzer:
    def __init__(self):
        self.api_key = os.getenv("YOUTUBE_API_KEY", "")
        if not self.api_key:
            logger.warning("YOUTUBE_API_KEY not set.")
        else:
            logger.info("YouTube API ready (requests-based).")

    # ── internal helpers ──────────────────────────────────────────────────────

    def _get(self, endpoint: str, params: dict) -> dict:
        """
        Make a GET request to the YouTube Data API v3.
        The key is sent as a header so it never appears in URLs, logs or errors.
        """
        try:
            r = requests.get(
                f"{YT_BASE}/{endpoint}",
                params=params,
                headers={"X-Goog-Api-Key": self.api_key},
                timeout=15,
            )
        except requests.RequestException as exc:
            logger.warning("YouTube %s request failed: %s", endpoint, type(exc).__name__)
            raise YouTubeAPIError("Could not reach the YouTube API.") from None

        if r.ok:
            return r.json()

        reason = ""
        try:
            errors = r.json().get("error", {}).get("errors", [])
            reason = errors[0].get("reason", "") if errors else ""
        except ValueError:
            pass
        logger.warning("YouTube %s returned HTTP %s (%s)", endpoint, r.status_code, reason or "no reason")

        if reason in ("quotaExceeded", "dailyLimitExceeded", "rateLimitExceeded"):
            raise YouTubeAPIError("YouTube API quota exceeded. Try again later.", 429)
        if reason in ("keyInvalid", "keyExpired") or (r.status_code == 400 and "key" in reason.lower()):
            raise YouTubeAPIError("YouTube API key is invalid.", 502)
        if r.status_code == 404:
            raise YouTubeAPIError("Requested YouTube resource was not found.", 404)
        raise YouTubeAPIError(f"YouTube API request failed (HTTP {r.status_code}).", 502)

    # Kept for backwards compatibility with existing callers.
    _parse_duration_seconds = staticmethod(parse_duration_seconds)

    # ── public API ────────────────────────────────────────────────────────────

    def get_channel_info(self, url_or_handle: str) -> dict | None:
        """
        Accept: @handle, channel URL (/channel/, /@, /user/, /c/), channel name,
        or channel ID. Returns a standardised channel dict or None.
        """
        if not self.api_key:
            return None

        kind, value = _parse_channel_input(url_or_handle)
        if not value:
            return None

        if kind == "id":
            return self._channel_by_id(value)

        if kind == "handle":
            return self._channel_by_handle(value) or self._channel_by_search(value)

        if kind == "username":
            return (self._channel_by_username(value)
                    or self._channel_by_handle(value)
                    or self._channel_by_search(value))

        # custom URL or bare name: try it as a handle first (cheap), then search
        result = self._channel_by_handle(value)
        if result is None:
            # Collapse trailing repeated chars (thinkkagainnnn → thinkkagainnn)
            cleaned = re.sub(r'(.)\1{2,}', lambda m: m.group(1) * 2, value)
            if cleaned != value:
                result = self._channel_by_handle(cleaned)
        if result is None:
            result = self._channel_by_search(value)
        return result

    def _channel_by_id(self, channel_id: str) -> dict | None:
        data = self._get("channels", {
            "part": "snippet,statistics,contentDetails",
            "id": channel_id,
        })
        items = data.get("items", [])
        return self._parse_channel(items[0]) if items else None

    def get_channels_by_ids(self, channel_ids: list[str]) -> list[dict]:
        """Channel stats for many channels: 50 per request, 1 quota unit each."""
        if not self.api_key:
            return []
        out = []
        for i in range(0, len(channel_ids), 50):
            data = self._get("channels", {
                "part": "snippet,statistics",
                "id": ",".join(channel_ids[i:i + 50]),
                "maxResults": 50,
            })
            out.extend(self._parse_channel(item) for item in data.get("items", []))
        return out

    def _channel_by_handle(self, handle: str) -> dict | None:
        try:
            data = self._get("channels", {
                "part": "snippet,statistics,contentDetails",
                "forHandle": handle.lstrip("@"),
            })
            items = data.get("items", [])
            return self._parse_channel(items[0]) if items else None
        except YouTubeAPIError as exc:
            if exc.status == 429:
                raise
            return None

    def _channel_by_username(self, username: str) -> dict | None:
        try:
            data = self._get("channels", {
                "part": "snippet,statistics,contentDetails",
                "forUsername": username,
            })
            items = data.get("items", [])
            return self._parse_channel(items[0]) if items else None
        except YouTubeAPIError as exc:
            if exc.status == 429:
                raise
            return None

    def _channel_by_search(self, query: str) -> dict | None:
        data = self._get("search", {
            "part": "snippet",
            "q": query,
            "type": "channel",
            "maxResults": 1,
        })
        items = data.get("items", [])
        if not items:
            return None
        channel_id = items[0]["snippet"]["channelId"]
        return self._channel_by_id(channel_id)

    def _parse_channel(self, item: dict) -> dict:
        sn = item.get("snippet", {})
        st = item.get("statistics", {})
        return {
            "channel_id":       item["id"],
            "title":            sn.get("title", ""),
            "description":      sn.get("description", ""),
            "handle":           sn.get("customUrl", ""),   # e.g. @thinkkagainnn
            "subscriber_count": int(st.get("subscriberCount", 0)),
            "view_count":       int(st.get("viewCount", 0)),
            "video_count":      int(st.get("videoCount", 0)),
            "country":          sn.get("country", ""),
            "thumbnail":        (sn.get("thumbnails", {}).get("high") or
                                 sn.get("thumbnails", {}).get("default") or
                                 {}).get("url", ""),
            "published_at":     sn.get("publishedAt", ""),
        }

    def _uploads_playlist_id(self, channel_id: str) -> str | None:
        if re.fullmatch(r"UC[\w-]{22}", channel_id):
            return "UU" + channel_id[2:]
        data = self._get("channels", {"part": "contentDetails", "id": channel_id})
        items = data.get("items", [])
        if not items:
            return None
        return items[0].get("contentDetails", {}).get("relatedPlaylists", {}).get("uploads")

    def get_channel_videos(self, channel_id: str, max_results: int = 50) -> list:
        """
        Returns up to max_results recent videos with full statistics.
        Reads the channel's uploads playlist (1 quota unit per page, vs 100 for
        search) and caches the result for a few minutes.
        """
        if not self.api_key:
            return []

        with _cache_lock:
            cached = _video_cache.get(channel_id)
        if cached:
            fetched_at, fetched_n, videos = cached
            if time.time() - fetched_at < _CACHE_TTL_SECS and (
                max_results <= fetched_n or len(videos) < fetched_n
            ):
                return videos[:max_results]

        fetch_n = max(max_results, _MIN_FETCH)
        videos = self._fetch_channel_videos(channel_id, fetch_n)
        with _cache_lock:
            _video_cache[channel_id] = (time.time(), fetch_n, videos)
        return videos[:max_results]

    def _fetch_channel_videos(self, channel_id: str, max_results: int) -> list:
        playlist_id = self._uploads_playlist_id(channel_id)
        if not playlist_id:
            return []

        videos = []
        page_token = None

        while len(videos) < max_results:
            params = {
                "part": "contentDetails",
                "playlistId": playlist_id,
                "maxResults": min(50, max_results - len(videos)),
            }
            if page_token:
                params["pageToken"] = page_token

            try:
                data = self._get("playlistItems", params)
            except YouTubeAPIError as exc:
                if exc.status == 404:   # channel has no public uploads
                    break
                raise
            items = data.get("items", [])
            if not items:
                break

            # Batch-fetch statistics
            ids = [i["contentDetails"]["videoId"] for i in items
                   if i.get("contentDetails", {}).get("videoId")]
            if ids:
                stat_data = self._get("videos", {
                    "part": "snippet,statistics,contentDetails",
                    "id": ",".join(ids),
                })
                for v in stat_data.get("items", []):
                    sn = v.get("snippet", {})
                    st = v.get("statistics", {})
                    cd = v.get("contentDetails", {})
                    videos.append({
                        "video_id":      v["id"],
                        "title":         sn.get("title", ""),
                        "published_at":  sn.get("publishedAt", ""),
                        "view_count":    int(st.get("viewCount", 0)),
                        "like_count":    int(st.get("likeCount", 0)),
                        "comment_count": int(st.get("commentCount", 0)),
                        "duration":      cd.get("duration", ""),
                        "duration_secs": parse_duration_seconds(cd.get("duration", "")),
                        "thumbnail":     (sn.get("thumbnails", {}).get("high") or
                                          sn.get("thumbnails", {}).get("medium") or
                                          {}).get("url", ""),
                        "tags":          sn.get("tags", []),
                        "category_id":   sn.get("categoryId", ""),
                        "description":   sn.get("description", "")[:300],
                    })

            page_token = data.get("nextPageToken")
            if not page_token:
                break

        videos.sort(key=lambda v: v.get("published_at", ""), reverse=True)
        return videos[:max_results]

    @staticmethod
    def _brief_video(v: dict) -> dict:
        sn = v.get("snippet", {})
        st = v.get("statistics", {})
        return {
            "video_id":      v["id"],
            "title":         sn.get("title", ""),
            "channel_id":    sn.get("channelId", ""),
            "channel_title": sn.get("channelTitle", ""),
            "published_at":  sn.get("publishedAt", ""),
            "view_count":    int(st.get("viewCount", 0)),
            "like_count":    int(st.get("likeCount", 0)),
            "thumbnail":     (sn.get("thumbnails", {}).get("medium") or
                              sn.get("thumbnails", {}).get("default") or
                              {}).get("url", ""),
            "tags":          sn.get("tags", []),
        }

    def get_trending_videos(self, region: str, category_id: str = "", max_results: int = 10) -> dict:
        """
        Most popular videos right now in a region, optionally within a category
        (1 quota unit, cached for an hour). Some categories have no chart in
        some regions; then the region-wide chart is returned.
        """
        if not self.api_key:
            return {"region": region, "category_id": "", "videos": []}
        region = (region or "US").upper()
        key = f"{region}:{category_id}:{max_results}"
        cached = shared_store.cache_get("yt-trending", key, _TRENDING_TTL_SECS)
        if cached is not None:
            return cached

        params = {"part": "snippet,statistics", "chart": "mostPopular",
                  "regionCode": region, "maxResults": max_results}
        used_category = ""
        data = None
        if category_id:
            try:
                data = self._get("videos", {**params, "videoCategoryId": category_id})
                used_category = category_id
            except YouTubeAPIError as exc:
                if exc.status == 429:
                    raise
                logger.info("No trending chart for category %s in %s; using region chart.", category_id, region)
        if data is None:
            data = self._get("videos", params)

        result = {
            "region":      region,
            "category_id": used_category,
            "videos":      [self._brief_video(v) for v in data.get("items", [])],
        }
        shared_store.cache_set("yt-trending", key, result)
        return result

    def search_recent_videos(
        self, query: str, days: int = 14, max_results: int = 8, daily_cap: int = 6000
    ) -> list:
        """
        Most-viewed videos published in the last `days` days for `query`.
        Costs 101 quota units, so results are cached for 6 hours and every
        uncached search is charged to an app-wide daily budget (`daily_cap`).
        Raises QuotaCapReached when that budget is used up.
        """
        if not self.api_key:
            return []
        norm = " ".join(query.lower().split())
        key = f"{norm}:{days}:{max_results}"
        cached = shared_store.cache_get("yt-niche", key, _NICHE_TTL_SECS)
        if cached is not None:
            return cached

        if not shared_store.quota_try_spend("niche_search", _SEARCH_COST, daily_cap):
            raise QuotaCapReached()

        after = datetime.now(timezone.utc) - timedelta(days=days)
        data = self._get("search", {
            "part": "snippet",
            "q": norm,
            "type": "video",
            "order": "viewCount",
            "publishedAfter": after.strftime("%Y-%m-%dT%H:%M:%SZ"),
            "maxResults": max_results,
        })
        ids = [i["id"]["videoId"] for i in data.get("items", []) if i.get("id", {}).get("videoId")]
        videos = []
        if ids:
            stats = self._get("videos", {"part": "snippet,statistics", "id": ",".join(ids)})
            videos = [self._brief_video(v) for v in stats.get("items", [])]
            videos.sort(key=lambda v: v["view_count"], reverse=True)
        shared_store.cache_set("yt-niche", key, videos)
        return videos

    def get_video_comments(self, video_id: str, max_results: int = 100) -> list:
        """Return top comments for a video (plain text, no HTML)."""
        if not self.api_key:
            return []
        try:
            data = self._get("commentThreads", {
                "part": "snippet",
                "videoId": video_id,
                "order": "relevance",
                "textFormat": "plainText",
                "maxResults": min(max_results, 100),
            })
            comments = []
            for item in data.get("items", []):
                top = item["snippet"]["topLevelComment"]["snippet"]
                comments.append({
                    "comment_id":   item["id"],
                    "text":         top.get("textOriginal") or top.get("textDisplay", ""),
                    "author":       top.get("authorDisplayName", ""),
                    "likes":        int(top.get("likeCount", 0)),
                    "published_at": top.get("publishedAt", ""),
                })
            return comments
        except YouTubeAPIError as exc:
            if exc.status == 429:
                raise
            # Comments disabled or video unavailable
            logger.warning("get_video_comments(%s): %s", video_id, exc)
            return []

    def calculate_engagement_rate(self, videos: list) -> dict:
        """Compute engagement rate stats across a list of videos."""
        if not videos:
            return {"average_engagement_rate": 0.0, "highest_engagement_rate": 0.0, "lowest_engagement_rate": 0.0}
        rates = []
        for v in videos:
            vc = v.get("view_count", 0)
            if vc > 0:
                rate = ((v.get("like_count", 0) + v.get("comment_count", 0)) / vc) * 100
                rates.append(round(rate, 4))
        if not rates:
            return {"average_engagement_rate": 0.0, "highest_engagement_rate": 0.0, "lowest_engagement_rate": 0.0}
        return {
            "average_engagement_rate": round(sum(rates) / len(rates), 4),
            "highest_engagement_rate": round(max(rates), 4),
            "lowest_engagement_rate":  round(min(rates), 4),
        }

    def get_posting_frequency(self, videos: list) -> dict:
        """Analyse posting frequency by day of week."""
        if not videos:
            return {"best_days": [], "day_distribution": {}, "posts_per_week": 0}

        day_counts: dict[str, int] = defaultdict(int)
        dates = []
        for v in videos:
            try:
                dt = datetime.fromisoformat(v["published_at"].replace("Z", "+00:00"))
                day_counts[dt.strftime("%A")] += 1
                dates.append(dt)
            except Exception:
                pass

        sorted_days = sorted(day_counts.items(), key=lambda x: x[1], reverse=True)
        best_days = [d for d, _ in sorted_days[:3]]

        # Average uploads per week over the span the videos cover (at least one week)
        span_weeks = (max(dates) - min(dates)).days / 7 if dates else 0
        posts_per_week = len(dates) / max(span_weeks, 1)

        return {
            "best_days":       best_days,
            "day_distribution": dict(day_counts),
            "posts_per_week":  round(posts_per_week, 2),
        }

    def get_best_posting_times(self, videos: list) -> dict:
        """Find the hours that correlate with highest average views."""
        if not videos:
            return {"best_hour": 16, "avg_views_by_hour": {}}

        hour_views: dict[int, list] = defaultdict(list)
        for v in videos:
            try:
                dt = datetime.fromisoformat(v["published_at"].replace("Z", "+00:00"))
                hour_views[dt.hour].append(v.get("view_count", 0))
            except Exception:
                pass

        avg_by_hour = {h: int(sum(vl) / len(vl)) for h, vl in hour_views.items()}
        best_hour = max(avg_by_hour, key=avg_by_hour.get) if avg_by_hour else 16

        return {
            "best_hour":          best_hour,
            "avg_views_by_hour":  {str(k): v for k, v in sorted(avg_by_hour.items())},
        }
