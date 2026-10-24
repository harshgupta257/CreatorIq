"""
CreatorIQ — daily channel snapshots (subscribers, views, video count).

YouTube's API has no history of a channel's numbers, so we record one row per
channel per day whenever a channel is analyzed (and, optionally, from a daily
scheduled refresh). After a few days this gives a real growth chart.

Storage: Postgres when DATABASE_URL is set; otherwise a local SQLite file in
CACHE_DIR. Hosts with ephemeral disks (e.g. Render's free tier) lose that file
on every restart or deploy, so production needs DATABASE_URL.
"""

import logging
import os
import sqlite3
import tempfile
import threading
from datetime import datetime, timedelta, timezone

logger = logging.getLogger("creatoriq.snapshots")

_DATABASE_URL = os.getenv("DATABASE_URL", "").strip()
_SQLITE_PATH = os.path.join(
    os.getenv("CACHE_DIR") or os.path.join(tempfile.gettempdir(), "creatoriq-cache"),
    "snapshots.sqlite3",
)

_SCHEMA = """
CREATE TABLE IF NOT EXISTS channel_snapshots (
    channel_id  TEXT    NOT NULL,
    day         DATE    NOT NULL,
    title       TEXT,
    subscribers BIGINT  NOT NULL,
    views       BIGINT  NOT NULL,
    videos      INTEGER NOT NULL,
    PRIMARY KEY (channel_id, day)
)
"""

_ready = False
_ready_lock = threading.Lock()


def storage_kind() -> str:
    return "database" if _DATABASE_URL else "local_file"


def _connect():
    if _DATABASE_URL:
        import psycopg  # only needed when a database is configured
        return psycopg.connect(_DATABASE_URL, connect_timeout=10)
    os.makedirs(os.path.dirname(_SQLITE_PATH), exist_ok=True)
    return sqlite3.connect(_SQLITE_PATH, timeout=10)


def _sql(query: str) -> str:
    """Queries are written with '?' placeholders; psycopg uses '%s'."""
    return query.replace("?", "%s") if _DATABASE_URL else query


def _ensure_schema(conn) -> None:
    global _ready
    if _ready:
        return
    with _ready_lock:
        if not _ready:
            conn.execute(_SCHEMA)
            conn.commit()
            _ready = True


def record(channel: dict | None) -> bool:
    """Save today's numbers for a channel (one row per UTC day; later calls update it)."""
    if not channel or not channel.get("channel_id"):
        return False
    day = datetime.now(timezone.utc).date().isoformat()
    try:
        conn = _connect()
        try:
            _ensure_schema(conn)
            conn.execute(_sql("""
                INSERT INTO channel_snapshots (channel_id, day, title, subscribers, views, videos)
                VALUES (?, ?, ?, ?, ?, ?)
                ON CONFLICT (channel_id, day) DO UPDATE SET
                    title = excluded.title, subscribers = excluded.subscribers,
                    views = excluded.views, videos = excluded.videos
            """), (
                channel["channel_id"], day, channel.get("title", ""),
                int(channel.get("subscriber_count") or 0),
                int(channel.get("view_count") or 0),
                int(channel.get("video_count") or 0),
            ))
            conn.commit()
        finally:
            conn.close()
        return True
    except Exception as exc:
        logger.warning("snapshot record failed: %s", exc)
        return False


def history(channel_id: str, days: int = 365) -> list[dict]:
    """Snapshots for a channel, oldest first."""
    since = (datetime.now(timezone.utc).date() - timedelta(days=days)).isoformat()
    try:
        conn = _connect()
        try:
            _ensure_schema(conn)
            rows = conn.execute(_sql("""
                SELECT day, subscribers, views, videos FROM channel_snapshots
                WHERE channel_id = ? AND day >= ? ORDER BY day
            """), (channel_id, since)).fetchall()
        finally:
            conn.close()
        return [{"date": str(d), "subscribers": int(s), "views": int(v), "videos": int(n)}
                for d, s, v, n in rows]
    except Exception as exc:
        logger.warning("snapshot history failed: %s", exc)
        return []


def tracked_channel_ids(active_days: int = 30) -> list[str]:
    """Channels analyzed in the last `active_days` days (for the daily refresh)."""
    since = (datetime.now(timezone.utc).date() - timedelta(days=active_days)).isoformat()
    try:
        conn = _connect()
        try:
            _ensure_schema(conn)
            rows = conn.execute(_sql(
                "SELECT DISTINCT channel_id FROM channel_snapshots WHERE day >= ? ORDER BY channel_id"
            ), (since,)).fetchall()
        finally:
            conn.close()
        return [r[0] for r in rows]
    except Exception as exc:
        logger.warning("tracked_channel_ids failed: %s", exc)
        return []
