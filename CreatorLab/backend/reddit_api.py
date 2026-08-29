"""
CreatorIQ — Reddit Mention & Sentiment Collector (PRAW)
"""

import os
import logging
from datetime import datetime, timezone

from dotenv import load_dotenv

load_dotenv()
logger = logging.getLogger("creatoriq.reddit")

# ── optional heavy import ──────────────────────────────────────────────────────
try:
    import praw
    from praw.exceptions import PRAWException
    _PRAW_AVAILABLE = True
except ImportError:
    _PRAW_AVAILABLE = False
    logger.warning("praw not installed; using demo data.")


# ══════════════════════════════════════════════════════════════════════════════
#  Demo / fallback data
# ══════════════════════════════════════════════════════════════════════════════
_DEMO_POSTS = [
    {
        "id": f"demo_{i:04d}",
        "title": f"Thoughts on this creator — post {i}",
        "text": f"Really enjoy their content! Their latest video was amazing #{i}",
        "score": 100 + i * 15,
        "num_comments": 20 + i,
        "subreddit": "videos" if i % 2 == 0 else "youtube",
        "url": f"https://reddit.com/r/videos/demo_{i}",
        "created_utc": "2024-05-10T10:00:00Z",
        "author": f"redditor_{i}",
        "comments": [
            f"I totally agree, video {i} was great!",
            f"Not my favourite but still good — post {i}",
        ],
    }
    for i in range(1, 16)
]

# Subreddits likely to discuss YouTube creators / content
_CREATOR_SUBREDDITS = [
    "youtube",
    "videos",
    "entertainment",
    "OutOfTheLoop",
]


# ══════════════════════════════════════════════════════════════════════════════
#  Main class
# ══════════════════════════════════════════════════════════════════════════════
class RedditSentimentCollector:
    """Searches Reddit for mentions of a creator/channel using PRAW."""

    def __init__(self):
        self.client_id = os.getenv("REDDIT_CLIENT_ID", "")
        self.client_secret = os.getenv("REDDIT_CLIENT_SECRET", "")
        self.user_agent = os.getenv("REDDIT_USER_AGENT", "CreatorIQ/1.0")
        self._reddit = None

        if self.client_id and self.client_secret and _PRAW_AVAILABLE:
            try:
                self._reddit = praw.Reddit(
                    client_id=self.client_id,
                    client_secret=self.client_secret,
                    user_agent=self.user_agent,
                    read_only=True,
                )
                # Quick connection test
                _ = self._reddit.user.me()
                logger.info("Reddit (PRAW) client initialized.")
            except Exception as exc:
                logger.warning("Reddit client init failed: %s — using demo data.", exc)
                self._reddit = None

    # ── internal ───────────────────────────────────────────────────────────────
    def _has_api(self) -> bool:
        return self._reddit is not None

    def _submission_to_dict(self, submission) -> dict:
        """Convert PRAW Submission → plain dict."""
        try:
            top_comments: list[str] = []
            submission.comments.replace_more(limit=0)
            for c in submission.comments[:10]:
                if hasattr(c, "body"):
                    top_comments.append(c.body)
        except Exception:
            top_comments = []

        return {
            "id": submission.id,
            "title": submission.title,
            "text": submission.selftext or submission.title,
            "score": submission.score,
            "num_comments": submission.num_comments,
            "subreddit": str(submission.subreddit),
            "url": f"https://reddit.com{submission.permalink}",
            "created_utc": datetime.fromtimestamp(
                submission.created_utc, tz=timezone.utc
            ).isoformat(),
            "author": str(submission.author) if submission.author else "[deleted]",
            "comments": top_comments,
        }

    # ── public API ─────────────────────────────────────────────────────────────
    def search_mentions(self, query: str, limit: int = 100) -> list[dict]:
        """
        Search all of Reddit for posts mentioning `query`.
        Returns list of post dicts.
        """
        if not self._has_api():
            logger.info("No Reddit credentials — returning demo posts.")
            return _DEMO_POSTS[:limit]

        results: list[dict] = []
        try:
            for submission in self._reddit.subreddit("all").search(
                query, sort="relevance", time_filter="month", limit=limit
            ):
                results.append(self._submission_to_dict(submission))
        except Exception as exc:
            logger.error("search_mentions error: %s", exc)
        return results

    def get_subreddit_posts(self, subreddit: str, limit: int = 50) -> list[dict]:
        """
        Fetch hot posts from a specific subreddit.
        """
        if not self._has_api():
            return [p for p in _DEMO_POSTS if p["subreddit"] == subreddit][:limit]

        results: list[dict] = []
        try:
            for submission in self._reddit.subreddit(subreddit).hot(limit=limit):
                results.append(self._submission_to_dict(submission))
        except Exception as exc:
            logger.error("get_subreddit_posts(%s) error: %s", subreddit, exc)
        return results

    def collect_all_mentions(self, channel_name: str) -> list[dict]:
        """
        Combine broad search + targeted subreddit scan for a creator.
        De-duplicates by post ID.
        """
        seen_ids: set[str] = set()
        all_posts: list[dict] = []

        # 1. Broad Reddit search
        for post in self.search_mentions(channel_name, limit=80):
            if post["id"] not in seen_ids:
                seen_ids.add(post["id"])
                all_posts.append(post)

        # 2. Targeted subreddits
        for sub in _CREATOR_SUBREDDITS:
            try:
                for post in self.get_subreddit_posts(sub, limit=25):
                    # Only keep posts that mention the channel name
                    combined = f"{post['title']} {post['text']}".lower()
                    if channel_name.lower() in combined and post["id"] not in seen_ids:
                        seen_ids.add(post["id"])
                        all_posts.append(post)
            except Exception as exc:
                logger.warning("Subreddit %s scan failed: %s", sub, exc)

        logger.info(
            "collect_all_mentions('%s'): %d unique posts collected.", channel_name, len(all_posts)
        )
        return all_posts

    def extract_text_corpus(self, posts: list[dict]) -> list[str]:
        """
        Flatten posts + their comments into a list of text strings for
        downstream sentiment / NLP analysis.
        """
        texts: list[str] = []
        for post in posts:
            if post.get("title"):
                texts.append(post["title"])
            if post.get("text") and post["text"] != post.get("title"):
                texts.append(post["text"])
            for comment in post.get("comments", []):
                if comment and comment not in ("[deleted]", "[removed]"):
                    texts.append(comment)
        return [t.strip() for t in texts if t and t.strip()]
