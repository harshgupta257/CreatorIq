"""
CreatorIQ — Instagram Graph API Analyzer
"""

import os
import logging
from datetime import datetime, timezone

import requests
from dotenv import load_dotenv

load_dotenv()
logger = logging.getLogger("creatoriq.instagram")

_IG_BASE_URL = "https://graph.instagram.com"
_FB_BASE_URL = "https://graph.facebook.com/v18.0"


# ══════════════════════════════════════════════════════════════════════════════
#  Demo / fallback data
# ══════════════════════════════════════════════════════════════════════════════
_DEMO_PROFILE = {
    "id": "17841400000000001",
    "username": "demo_creator",
    "account_type": "BUSINESS",
    "media_count": 248,
    "followers_count": 87_500,
    "follows_count": 1_200,
    "biography": "Demo creator profile — configure Instagram credentials to see real data.",
    "website": "https://example.com",
    "profile_picture_url": "https://via.placeholder.com/150.png?text=IG",
}

_DEMO_MEDIA = [
    {
        "id": f"media_{i}",
        "media_type": "IMAGE" if i % 3 != 0 else "VIDEO",
        "timestamp": f"2024-0{(i % 9) + 1}-{(i % 28) + 1:02d}T12:00:00+0000",
        "like_count": 1_200 + i * 50,
        "comments_count": 80 + i * 5,
        "impressions": 15_000 + i * 500,
        "reach": 12_000 + i * 400,
        "engagement": round((1_200 + i * 50 + 80 + i * 5) / (12_000 + i * 400) * 100, 2),
        "thumbnail_url": f"https://via.placeholder.com/320x320.png?text=Post+{i}",
    }
    for i in range(1, 13)
]

_DEMO_DEMOGRAPHICS = {
    "age_gender": {
        "F.18-24": 18.2,
        "F.25-34": 22.5,
        "F.35-44": 10.1,
        "M.18-24": 16.8,
        "M.25-34": 19.7,
        "M.35-44": 8.4,
        "U.13-17": 4.3,
    },
    "top_countries": {"US": 34.2, "GB": 10.5, "IN": 8.3, "CA": 6.1, "AU": 4.9},
    "top_cities": {"New York": 5.2, "London": 4.8, "Mumbai": 3.9, "Los Angeles": 3.5, "Toronto": 2.7},
}

_DEMO_BEST_TIMES = {
    "best_days": ["Tuesday", "Wednesday", "Friday"],
    "best_hours_utc": [12, 18, 20],
    "recommendation": "Post on Tuesday–Friday between 12:00–20:00 UTC.",
}


# ══════════════════════════════════════════════════════════════════════════════
#  Helpers
# ══════════════════════════════════════════════════════════════════════════════
def _ig_get(endpoint: str, params: dict) -> dict:
    """Thin wrapper around requests.get for Graph API calls."""
    url = f"{_IG_BASE_URL}/{endpoint}"
    resp = requests.get(url, params=params, timeout=15)
    resp.raise_for_status()
    return resp.json()


def _fb_get(endpoint: str, params: dict) -> dict:
    """Wrapper for Facebook Graph API (v18) calls."""
    url = f"{_FB_BASE_URL}/{endpoint}"
    resp = requests.get(url, params=params, timeout=15)
    resp.raise_for_status()
    return resp.json()


# ══════════════════════════════════════════════════════════════════════════════
#  Main class
# ══════════════════════════════════════════════════════════════════════════════
class InstagramAnalyzer:
    """
    Wraps the Instagram Graph API.
    Requires a long-lived user access token with instagram_basic,
    instagram_manage_insights, pages_show_list permissions.
    """

    def __init__(self):
        self.app_id = os.getenv("INSTAGRAM_APP_ID", "")
        self.app_secret = os.getenv("INSTAGRAM_APP_SECRET", "")
        self.redirect_uri = os.getenv(
            "INSTAGRAM_REDIRECT_URI", "http://localhost:5000/auth/instagram/callback"
        )
        if self.app_id:
            logger.info("InstagramAnalyzer ready (App ID configured).")
        else:
            logger.warning("No INSTAGRAM_APP_ID found — demo data will be used.")

    # ── internal ───────────────────────────────────────────────────────────────
    def _has_credentials(self) -> bool:
        return bool(self.app_id and self.app_secret)

    def _get_ig_user_id(self, access_token: str) -> str | None:
        """Resolve Facebook Page → Instagram Business Account ID."""
        try:
            data = _fb_get("me/accounts", {"access_token": access_token, "fields": "instagram_business_account,name"})
            for page in data.get("data", []):
                ig = page.get("instagram_business_account", {})
                if ig.get("id"):
                    return ig["id"]
        except Exception as exc:
            logger.error("_get_ig_user_id error: %s", exc)
        return None

    # ── public API ─────────────────────────────────────────────────────────────
    def exchange_code_for_token(self, code: str) -> dict:
        """
        Exchange OAuth authorization code for a short-lived access token,
        then upgrade it to a long-lived token.
        Returns {access_token, token_type, expires_in, ...}.
        """
        if not self._has_credentials():
            logger.info("No IG credentials — returning demo token response.")
            return {
                "access_token": "demo_access_token",
                "token_type": "bearer",
                "expires_in": 5183944,
                "message": "Demo mode: configure INSTAGRAM_APP_ID and INSTAGRAM_APP_SECRET.",
            }

        try:
            # Short-lived token
            short_resp = requests.post(
                f"{_FB_BASE_URL}/oauth/access_token",
                data={
                    "client_id": self.app_id,
                    "client_secret": self.app_secret,
                    "grant_type": "authorization_code",
                    "redirect_uri": self.redirect_uri,
                    "code": code,
                },
                timeout=15,
            )
            short_resp.raise_for_status()
            short_data = short_resp.json()
            short_token = short_data.get("access_token", "")

            # Upgrade to long-lived token
            long_resp = requests.get(
                f"{_FB_BASE_URL}/oauth/access_token",
                params={
                    "grant_type": "fb_exchange_token",
                    "client_id": self.app_id,
                    "client_secret": self.app_secret,
                    "fb_exchange_token": short_token,
                },
                timeout=15,
            )
            long_resp.raise_for_status()
            return long_resp.json()

        except requests.HTTPError as exc:
            logger.error("exchange_code_for_token HTTP error: %s", exc)
            raise RuntimeError(f"Instagram OAuth error: {exc}") from exc

    def get_user_insights(self, access_token: str) -> dict:
        """
        Fetch Instagram Business Account profile metrics.
        """
        if not self._has_credentials() or access_token == "demo_access_token":
            return _DEMO_PROFILE

        try:
            ig_id = self._get_ig_user_id(access_token)
            if not ig_id:
                return _DEMO_PROFILE

            fields = "id,username,account_type,media_count,followers_count,follows_count,biography,website,profile_picture_url"
            data = _fb_get(ig_id, {"fields": fields, "access_token": access_token})
            return data
        except Exception as exc:
            logger.error("get_user_insights error: %s", exc)
            return _DEMO_PROFILE

    def get_media_insights(self, access_token: str) -> list[dict]:
        """
        Fetch performance metrics for recent media posts.
        """
        if not self._has_credentials() or access_token == "demo_access_token":
            return _DEMO_MEDIA

        try:
            ig_id = self._get_ig_user_id(access_token)
            if not ig_id:
                return _DEMO_MEDIA

            media_resp = _fb_get(
                f"{ig_id}/media",
                {
                    "fields": "id,media_type,timestamp,like_count,comments_count,thumbnail_url",
                    "access_token": access_token,
                    "limit": 25,
                },
            )

            media_items = media_resp.get("data", [])
            enriched = []
            for item in media_items:
                mid = item["id"]
                try:
                    ins_resp = _fb_get(
                        f"{mid}/insights",
                        {
                            "metric": "impressions,reach,engagement",
                            "access_token": access_token,
                        },
                    )
                    metrics = {m["name"]: m.get("values", [{}])[-1].get("value", 0) for m in ins_resp.get("data", [])}
                    item.update(metrics)
                    # Calculate engagement rate
                    reach = metrics.get("reach", 1) or 1
                    likes = item.get("like_count", 0)
                    comments = item.get("comments_count", 0)
                    item["engagement"] = round((likes + comments) / reach * 100, 2)
                except Exception:
                    pass
                enriched.append(item)
            return enriched

        except Exception as exc:
            logger.error("get_media_insights error: %s", exc)
            return _DEMO_MEDIA

    def get_audience_demographics(self, access_token: str) -> dict:
        """
        Fetch follower age/gender, country, and city breakdowns.
        """
        if not self._has_credentials() or access_token == "demo_access_token":
            return _DEMO_DEMOGRAPHICS

        try:
            ig_id = self._get_ig_user_id(access_token)
            if not ig_id:
                return _DEMO_DEMOGRAPHICS

            result: dict = {}
            for metric in ("audience_gender_age", "audience_country", "audience_city"):
                try:
                    resp = _fb_get(
                        f"{ig_id}/insights",
                        {
                            "metric": metric,
                            "period": "lifetime",
                            "access_token": access_token,
                        },
                    )
                    for entry in resp.get("data", []):
                        values = entry.get("values", [{}])
                        result[entry["name"]] = values[-1].get("value", {}) if values else {}
                except Exception as exc:
                    logger.warning("Metric %s failed: %s", metric, exc)

            return result or _DEMO_DEMOGRAPHICS

        except Exception as exc:
            logger.error("get_audience_demographics error: %s", exc)
            return _DEMO_DEMOGRAPHICS

    def get_best_posting_times(self, access_token: str) -> dict:
        """
        Analyse media timestamps vs engagement to determine optimal posting windows.
        """
        media = self.get_media_insights(access_token)
        if not media:
            return _DEMO_BEST_TIMES

        from collections import defaultdict
        hour_eng: dict[int, list[float]] = defaultdict(list)
        day_eng: dict[int, list[float]] = defaultdict(list)
        day_names = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

        for item in media:
            ts_str = item.get("timestamp", "")
            eng = item.get("engagement", 0.0) or 0.0
            try:
                dt = datetime.fromisoformat(ts_str.replace("+0000", "+00:00"))
                hour_eng[dt.hour].append(eng)
                day_eng[dt.weekday()].append(eng)
            except Exception:
                pass

        if not hour_eng:
            return _DEMO_BEST_TIMES

        best_hours = sorted(hour_eng, key=lambda h: sum(hour_eng[h]) / len(hour_eng[h]), reverse=True)[:3]
        best_day_indices = sorted(day_eng, key=lambda d: sum(day_eng[d]) / len(day_eng[d]), reverse=True)[:3]
        best_days = [day_names[d] for d in best_day_indices]

        return {
            "best_days": best_days,
            "best_hours_utc": best_hours,
            "recommendation": f"Post on {', '.join(best_days)} at {best_hours[0]:02d}:00 UTC.",
        }

    def cross_platform_comparison(self, ig_data: dict, yt_data: dict) -> dict:
        """
        Compare key metrics between Instagram and YouTube.
        Both ig_data and yt_data should be channel/profile info dicts.
        """
        ig_followers = ig_data.get("followers_count", 0)
        yt_subscribers = yt_data.get("subscriber_count", 0)

        ig_posts = ig_data.get("media_count", 0)
        yt_videos = yt_data.get("video_count", 0)

        ig_eng = ig_data.get("avg_engagement_rate", 0.0)
        yt_eng = yt_data.get("engagement_rate", 0.0)

        return {
            "audience": {
                "instagram_followers": ig_followers,
                "youtube_subscribers": yt_subscribers,
                "total_reach": ig_followers + yt_subscribers,
                "larger_platform": "instagram" if ig_followers > yt_subscribers else "youtube",
            },
            "content_volume": {
                "instagram_posts": ig_posts,
                "youtube_videos": yt_videos,
                "primary_platform": "instagram" if ig_posts > yt_videos else "youtube",
            },
            "engagement": {
                "instagram_avg_engagement_rate": ig_eng,
                "youtube_avg_engagement_rate": yt_eng,
                "better_engagement": "instagram" if ig_eng > yt_eng else "youtube",
            },
            "recommendations": [
                "Cross-promote YouTube content on Instagram Reels.",
                "Use Instagram Stories to drive traffic to new YouTube uploads.",
                "Repurpose long-form YouTube videos as Instagram carousel posts.",
            ],
        }
