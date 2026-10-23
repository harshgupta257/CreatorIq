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
    logger.warning("praw not installed; Reddit data disabled.")


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
                logger.warning("Reddit client init failed: %s — Reddit data disabled.", exc)
                self._reddit = None

    # ── internal ───────────────────────────────────────────────────────────────
    def _has_api(self) -> bool:
        return self._reddit is not None

    def is_available(self) -> bool:
        """True when real Reddit data can be fetched."""
        return self._has_api()

    @staticmethod
    def _fetch_comments(submission) -> list[str]:
        """Load a submission's top comments (one network request per submission)."""
        try:
            submission.comments.replace_more(limit=0)
            return [c.body for c in submission.comments[:10] if hasattr(c, "body")]
        except Exception:
            return []

    def _submission_to_dict(self, submission, with_comments: bool = True) -> dict:
        """Convert PRAW Submission → plain dict."""
        top_comments = self._fetch_comments(submission) if with_comments else []

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
    def search_mentions(self, query: str, limit: int = 100, comments_for: int = 15) -> list[dict]:
        """
        Search all of Reddit for posts mentioning `query`.
        Comments are loaded only for the first `comments_for` results, since
        each one costs a separate request.
        Returns list of post dicts (empty when Reddit is not configured).
        """
        if not self._has_api():
            return []

        results: list[dict] = []
        try:
            for i, submission in enumerate(self._reddit.subreddit("all").search(
                query, sort="relevance", time_filter="month", limit=limit
            )):
                results.append(self._submission_to_dict(submission, with_comments=i < comments_for))
        except Exception as exc:
            logger.error("search_mentions error: %s", exc)
        return results

    def get_subreddit_posts(
        self, subreddit: str, limit: int = 50, must_contain: str | None = None
    ) -> list[dict]:
        """
        Fetch hot posts from a specific subreddit.
        If `must_contain` is given, only posts whose title/text contain it are
        kept, and comments are loaded only for those.
        """
        if not self._has_api():
            return []

        needle = must_contain.lower() if must_contain else None
        results: list[dict] = []
        try:
            for submission in self._reddit.subreddit(subreddit).hot(limit=limit):
                if needle:
                    combined = f"{submission.title} {submission.selftext or ''}".lower()
                    if needle not in combined:
                        continue
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
        if not self._has_api():
            return []

        for post in self.search_mentions(channel_name, limit=50):
            if post["id"] not in seen_ids:
                seen_ids.add(post["id"])
                all_posts.append(post)

        # 2. Targeted subreddits
        for sub in _CREATOR_SUBREDDITS:
            try:
                for post in self.get_subreddit_posts(sub, limit=25, must_contain=channel_name):
                    if post["id"] not in seen_ids:
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
