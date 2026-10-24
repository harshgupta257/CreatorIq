"""
CreatorIQ — small file-backed cache and daily quota counter.

Gunicorn runs several worker processes, so in-memory state is not shared:
a quota cap kept in memory would be applied once per worker. These helpers
keep state in files under CACHE_DIR, guarded by an exclusive file lock.
"""

import fcntl
import hashlib
import json
import logging
import os
import tempfile
import time
from contextlib import contextmanager
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo

logger = logging.getLogger("creatoriq.store")

_DIR = os.getenv("CACHE_DIR") or os.path.join(tempfile.gettempdir(), "creatoriq-cache")
os.makedirs(_DIR, exist_ok=True)

# YouTube's daily quota resets at midnight Pacific time
_QUOTA_TZ = ZoneInfo("America/Los_Angeles")


@contextmanager
def _locked(name: str):
    with open(os.path.join(_DIR, f"{name}.lock"), "w") as lock:
        fcntl.flock(lock, fcntl.LOCK_EX)
        try:
            yield
        finally:
            fcntl.flock(lock, fcntl.LOCK_UN)


def _path(namespace: str, key: str) -> str:
    digest = hashlib.sha256(key.encode()).hexdigest()[:32]
    return os.path.join(_DIR, f"{namespace}-{digest}.json")


# ── cache ──────────────────────────────────────────────────────────────────────
def cache_get(namespace: str, key: str, ttl_secs: int):
    """Return the cached value, or None when missing or older than ttl_secs."""
    try:
        with open(_path(namespace, key)) as f:
            entry = json.load(f)
        if time.time() - entry["saved_at"] < ttl_secs:
            return entry["value"]
    except (OSError, ValueError, KeyError):
        pass
    return None


def cache_set(namespace: str, key: str, value) -> None:
    path = _path(namespace, key)
    tmp = f"{path}.{os.getpid()}.tmp"
    try:
        with open(tmp, "w") as f:
            json.dump({"saved_at": time.time(), "value": value}, f)
        os.replace(tmp, path)  # atomic, so readers never see a half-written file
    except OSError as exc:
        logger.warning("cache_set(%s) failed: %s", namespace, exc)


# ── daily quota ────────────────────────────────────────────────────────────────
def _quota_day() -> str:
    return datetime.now(_QUOTA_TZ).strftime("%Y-%m-%d")


def quota_resets_at() -> str:
    """ISO time (UTC offset included) of the next Pacific-midnight reset."""
    now = datetime.now(_QUOTA_TZ)
    midnight = (now + timedelta(days=1)).replace(hour=0, minute=0, second=0, microsecond=0)
    return midnight.isoformat()


def quota_try_spend(name: str, units: int, daily_cap: int) -> bool:
    """
    Reserve `units` from today's budget for `name`.
    Returns False (and spends nothing) if that would exceed daily_cap.
    """
    path = os.path.join(_DIR, f"quota-{name}.json")
    with _locked(f"quota-{name}"):
        day, used = _quota_day(), 0
        try:
            with open(path) as f:
                data = json.load(f)
            if data.get("day") == day:
                used = int(data.get("used", 0))
        except (OSError, ValueError):
            pass
        if used + units > daily_cap:
            return False
        with open(path, "w") as f:
            json.dump({"day": day, "used": used + units}, f)
        return True


def quota_used(name: str) -> int:
    try:
        with open(os.path.join(_DIR, f"quota-{name}.json")) as f:
            data = json.load(f)
        return int(data.get("used", 0)) if data.get("day") == _quota_day() else 0
    except (OSError, ValueError):
        return 0
