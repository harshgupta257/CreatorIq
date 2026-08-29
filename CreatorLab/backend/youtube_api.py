"""
CreatorIQ — YouTube Data API v3 helper
Uses requests directly (not google-api-python-client) for reliability.
"""

import os
import re
import logging
from datetime import datetime, timezone
from collections import defaultdict

import requests
from dotenv import load_dotenv

load_dotenv()
logger = logging.getLogger("creatoriq.youtube")

YT_BASE = "https://www.googleapis.com/youtube/v3"


class YouTubeAnalyzer:
    def __init__(self):
        self.api_key = os.getenv("YOUTUBE_API_KEY", "")
        if not self.api_key:
            logger.warning("YOUTUBE_API_KEY not set.")
        else:
            logger.info("YouTube API ready (requests-based).")

    # ── internal helpers ──────────────────────────────────────────────────────

    def _get(self, endpoint: str, params: dict) -> dict:
        """Make a GET request to the YouTube Data API v3."""
        params["key"] = self.api_key
        r = requests.get(f"{YT_BASE}/{endpoint}", params=params, timeout=15)
        r.raise_for_status()
        return r.json()

    @staticmethod
    def _parse_duration_seconds(iso: str) -> int:
        """Convert ISO 8601 duration (PT1H2M3S) to seconds."""
        m = re.match(r"PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?", iso or "")
        if not m:
            return 0
        h, mi, s = (int(x or 0) for x in m.groups())
        return h * 3600 + mi * 60 + s

    # ── public API ────────────────────────────────────────────────────────────

    def get_channel_info(self, url_or_handle: str) -> dict | None:
        """
        Accept: @handle, channel URL, channel name, or channel ID.
        Returns a standardised channel dict or None.
        """
        if not self.api_key:
            return None

        # 1. Extract handle / ID from URL
        handle = url_or_handle.strip()
        handle = re.sub(r"https?://(www\.)?youtube\.com/", "", handle)
        handle = handle.lstrip("/")

        # 2. Decide lookup strategy
        if handle.startswith("UC") and len(handle) == 24:
            return self._channel_by_id(handle)

        if handle.startswith("@"):
            result = self._channel_by_handle(handle)
            if result is None:
                # Try search fallback with the handle text
                result = self._channel_by_search(handle[1:])
            return result

        # Bare handle (no @): try direct handle first
        result = self._channel_by_handle("@" + handle)
        if result is None:
            # Collapse trailing repeated chars (thinkkagainnnn → thinkkagainnn)
            cleaned = re.sub(r'(.)\1{2,}', lambda m: m.group(1) * 2, handle)
            if cleaned != handle:
                result = self._channel_by_handle("@" + cleaned)
        if result is None:
            result = self._channel_by_search(handle)
        return result

    def _channel_by_id(self, channel_id: str) -> dict | None:
        data = self._get("channels", {
            "part": "snippet,statistics,contentDetails",
            "id": channel_id,
        })
        items = data.get("items", [])
        return self._parse_channel(items[0]) if items else None

    def _channel_by_handle(self, handle: str) -> dict | None:
        try:
            data = self._get("channels", {
                "part": "snippet,statistics,contentDetails",
                "forHandle": handle.lstrip("@"),
            })
            items = data.get("items", [])
            return self._parse_channel(items[0]) if items else None
        except Exception:
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

    def get_channel_videos(self, channel_id: str, max_results: int = 50) -> list:
        """
        Returns up to max_results recent videos with full statistics.
        """
        if not self.api_key:
            return []

        videos = []
        page_token = None

        # Step 1: get video IDs via search
        while len(videos) < max_results:
            params = {
                "part": "snippet",
                "channelId": channel_id,
                "order": "date",
                "type": "video",
                "maxResults": min(50, max_results - len(videos)),
            }
            if page_token:
                params["pageToken"] = page_token

            data = self._get("search", params)
            items = data.get("items", [])
            if not items:
                break

            # Step 2: batch-fetch statistics
            ids = [i["id"]["videoId"] for i in items if i.get("id", {}).get("videoId")]
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
                        "duration_secs": self._parse_duration_seconds(cd.get("duration", "")),
                        "thumbnail":     (sn.get("thumbnails", {}).get("high") or
                                          sn.get("thumbnails", {}).get("medium") or
                                          {}).get("url", ""),
                        "tags":          sn.get("tags", []),
                        "description":   sn.get("description", "")[:300],
                    })

            page_token = data.get("nextPageToken")
            if not page_token:
                break

        return videos[:max_results]

    def get_video_comments(self, video_id: str, max_results: int = 100) -> list:
        """Return top comments for a video."""
        if not self.api_key:
            return []
        try:
            data = self._get("commentThreads", {
                "part": "snippet",
                "videoId": video_id,
                "order": "relevance",
                "maxResults": min(max_results, 100),
            })
            comments = []
            for item in data.get("items", []):
                top = item["snippet"]["topLevelComment"]["snippet"]
                comments.append({
                    "comment_id":   item["id"],
                    "text":         top.get("textDisplay", ""),
                    "author":       top.get("authorDisplayName", ""),
                    "likes":        int(top.get("likeCount", 0)),
                    "published_at": top.get("publishedAt", ""),
                })
            return comments
        except Exception as exc:
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
        for v in videos:
            try:
                dt = datetime.fromisoformat(v["published_at"].replace("Z", "+00:00"))
                day_counts[dt.strftime("%A")] += 1
            except Exception:
                pass

        sorted_days = sorted(day_counts.items(), key=lambda x: x[1], reverse=True)
        best_days = [d for d, _ in sorted_days[:3]]
        total_weeks = max(len(videos) / 7, 1)

        return {
            "best_days":       best_days,
            "day_distribution": dict(day_counts),
            "posts_per_week":  round(len(videos) / total_weeks, 2),
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
