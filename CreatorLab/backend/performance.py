"""
CreatorIQ — Performance Insights

Every comparison here uses an age-adjusted score: how a video's views compare
with the channel's typical video of the same age and format ("2.3× typical").
Raw lifetime views can't be compared directly, because older videos have
simply had more time to collect them.

Group comparisons report medians (one viral video can't dominate), the number
of videos behind each group, and a significance test, so the page can say
"clear effect" or "no clear difference" instead of always naming a winner.
"""

import logging
import math
import re
from collections import Counter, defaultdict
from datetime import datetime, timezone
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

import numpy as np
from scipy import stats
from sklearn.ensemble import GradientBoostingRegressor
from sklearn.inspection import permutation_importance
from sklearn.linear_model import HuberRegressor
from sklearn.model_selection import KFold

logger = logging.getLogger("creatoriq.performance")

MIN_AGE_DAYS = 3          # younger videos are still too volatile to score
MIN_VIDEOS = 8            # below this there is nothing reliable to say
MIN_GROUP = 3             # smallest group a comparison may rely on
MIN_MODEL_VIDEOS = 30     # the ML model needs at least this many videos
P_CLEAR = 0.10            # false-discovery rate below which a difference is called "clear"
P_MOMENTUM = 0.05         # momentum is a single test, so a plain 5% threshold
MODEL_MIN_GAIN = 0.05     # model must beat the baseline by 5% to be shown
EXPECT_AT_DAYS = 30       # "expected views after a month"
RECENT_FOR_RANGE = 20     # recent videos that set the expected range
MOMENTUM_RECENT = 10

DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
LENGTH_BUCKETS = [(0, 240, "< 4 min"), (240, 480, "4–8 min"), (480, 900, "8–15 min"),
                  (900, 1800, "15–30 min"), (1800, 10 ** 9, "30+ min")]
TITLE_LENGTH_BUCKETS = [(0, 40, "Short (< 40 chars)"), (40, 70, "Medium (40–70)"), (70, 10 ** 9, "Long (70+)")]


# ══════════════════════════════════════════════════════════════════════════════
#  Helpers
# ══════════════════════════════════════════════════════════════════════════════
def _parse_time(iso: str) -> datetime | None:
    try:
        return datetime.fromisoformat(iso.replace("Z", "+00:00"))
    except (AttributeError, ValueError):
        return None


def _zone(tz: str) -> ZoneInfo:
    try:
        return ZoneInfo(tz or "UTC")
    except (ZoneInfoNotFoundError, ValueError):
        return ZoneInfo("UTC")


def is_short(video: dict) -> bool:
    """Shorts: up to 60 s, or up to 3 min when marked #shorts."""
    secs = video.get("duration_secs") or 0
    text = f"{video.get('title', '')} {video.get('description', '')}".lower()
    return 0 < secs <= 60 or (0 < secs <= 180 and "#short" in text)


def _r(x: float, nd: int = 2) -> float:
    return round(float(x), nd)


def _median(values) -> float:
    return float(np.median(values)) if len(values) else 0.0


def _p_value(groups: list[list[float]]) -> float:
    groups = [g for g in groups if len(g) >= MIN_GROUP]
    if len(groups) < 2:
        return 1.0
    try:
        if len(groups) == 2:
            return float(stats.mannwhitneyu(groups[0], groups[1], alternative="two-sided").pvalue)
        return float(stats.kruskal(*groups).pvalue)
    except ValueError:      # e.g. all values identical
        return 1.0


def _bh_adjust(p_values: list[float]) -> list[float]:
    """
    Benjamini–Hochberg adjusted p-values (q-values). The page runs many tests
    per channel; without this, a few would look "clear" by chance alone.
    """
    m = len(p_values)
    if m == 0:
        return []
    order = sorted(range(m), key=lambda i: p_values[i])
    q = [0.0] * m
    running = 1.0
    for rank in range(m, 0, -1):
        i = order[rank - 1]
        running = min(running, p_values[i] * m / rank)
        q[i] = running
    return q


def _length_bucket(secs: int) -> str:
    return next(label for lo, hi, label in LENGTH_BUCKETS if lo <= secs < hi)


def _title_traits(title: str) -> dict:
    return {
        "has_number":   bool(re.search(r"\d", title)),
        "has_question": "?" in title,
        "has_brackets": bool(re.search(r"[\[\(].+[\]\)]", title)),
        "title_length": next(label for lo, hi, label in TITLE_LENGTH_BUCKETS if lo <= len(title) < hi),
    }


# ══════════════════════════════════════════════════════════════════════════════
#  Age-adjusted score
# ══════════════════════════════════════════════════════════════════════════════
def score_videos(videos: list[dict], now: datetime, tz: str = "UTC") -> tuple[list[dict], dict] | None:
    """
    Fit log(views) ≈ a + b·log(age_days) + c·is_short with a robust (Huber)
    regression, then score each video by how far it sits above or below that
    line. Returns (rows, model) or None when there are too few videos.
    """
    zone = _zone(tz)
    rows = []
    for v in videos:
        published = _parse_time(v.get("published_at", ""))
        if not published:
            continue
        age = (now - published).total_seconds() / 86400
        if age < MIN_AGE_DAYS:
            continue
        local = published.astimezone(zone)
        rows.append({
            "video": v,
            "published": published,
            "age_days": age,
            "short": is_short(v),
            "local_day": local.weekday(),
            "local_hour": local.hour,
            "x": math.log(age),
            "y": math.log1p(max(0, v.get("view_count", 0))),
        })
    if len(rows) < MIN_VIDEOS:
        return None

    X = np.array([[r["x"], 1.0 if r["short"] else 0.0] for r in rows])
    y = np.array([r["y"] for r in rows])
    try:
        huber = HuberRegressor(max_iter=500).fit(X, y)
        b, c = float(huber.coef_[0]), float(huber.coef_[1])
    except Exception as exc:  # degenerate data (e.g. identical ages)
        logger.warning("age model fit failed: %s", exc)
        b, c = 0.3, 0.0
    # Views never shrink with age; a negative slope means the channel is growing,
    # which momentum should show rather than the age adjustment absorbing it
    b = min(max(b, 0.0), 1.5)
    has_both_formats = len({r["short"] for r in rows}) == 2
    c = c if has_both_formats else 0.0
    a = _median(y - b * X[:, 0] - c * X[:, 1])

    for r in rows:
        expected = a + b * r["x"] + c * (1.0 if r["short"] else 0.0)
        r["log_ratio"] = r["y"] - expected
        r["ratio"] = math.exp(r["log_ratio"])
    rows.sort(key=lambda r: r["published"])
    return rows, {"a": a, "b": b, "c": c}


def _expected_log_views(model: dict, age_days: float, short: bool) -> float:
    return model["a"] + model["b"] * math.log(age_days) + model["c"] * (1.0 if short else 0.0)


# ══════════════════════════════════════════════════════════════════════════════
#  Sections
# ══════════════════════════════════════════════════════════════════════════════
def next_video_expectation(rows: list[dict], model: dict) -> list[dict]:
    """Likely views after a month for a new video, per format, from recent form."""
    out = []
    for short in (False, True):
        fmt_rows = [r for r in rows if r["short"] == short]
        if len(fmt_rows) < 5:
            continue
        recent = fmt_rows[-RECENT_FOR_RANGE:]
        lr = [r["log_ratio"] for r in recent]
        base = _expected_log_views(model, EXPECT_AT_DAYS, short)
        q25, q50, q75 = np.percentile(lr, [25, 50, 75])
        out.append({
            "format":   "short" if short else "long",
            "label":    "Shorts" if short else "Long-form videos",
            "days":     EXPECT_AT_DAYS,
            "low":      int(max(0, math.expm1(base + q25))),
            "typical":  int(max(0, math.expm1(base + q50))),
            "high":     int(max(0, math.expm1(base + q75))),
            "based_on": len(recent),
        })
    return out


def momentum(rows: list[dict]) -> dict:
    """Are recent videos doing better or worse than the channel's earlier ones?"""
    n_recent = min(MOMENTUM_RECENT, len(rows) // 2)
    recent, earlier = rows[-n_recent:], rows[:-n_recent]
    recent_lr = [r["log_ratio"] for r in recent]
    earlier_lr = [r["log_ratio"] for r in earlier]
    change = math.exp(_median(recent_lr) - _median(earlier_lr))
    p = _p_value([recent_lr, earlier_lr])
    verdict = "steady"
    if p < P_MOMENTUM:
        verdict = "improving" if change > 1 else "declining"

    lrs = [r["log_ratio"] for r in rows]
    series = []
    for i, r in enumerate(rows):
        window = lrs[max(0, i - 2): i + 3]  # centred 5-video rolling median
        series.append({
            "date":     r["published"].strftime("%Y-%m-%d"),
            "video_id": r["video"].get("video_id"),
            "title":    r["video"].get("title", ""),
            "ratio":    _r(r["ratio"]),
            "trend":    _r(math.exp(_median(window))),
            "format":   "short" if r["short"] else "long",
        })
    return {
        "verdict":       verdict,
        "change":        _r(change),
        "recent_count":  len(recent),
        "earlier_count": len(earlier),
        "p_value":       _r(p, 3),
        "series":        series,
    }


def _video_card(r: dict) -> dict:
    v = r["video"]
    return {
        "video_id":   v.get("video_id"),
        "title":      v.get("title", ""),
        "thumbnail":  v.get("thumbnail", ""),
        "view_count": v.get("view_count", 0),
        "ratio":      _r(r["ratio"]),
        "age_days":   int(r["age_days"]),
        "format":     "short" if r["short"] else "long",
    }


def _features_for_traits(r: dict) -> set[str]:
    v = r["video"]
    feats = {f"tag:{t.lower().strip()}" for t in (v.get("tags") or []) if t.strip()}
    feats.add("format:Shorts" if r["short"] else "format:Long-form")
    if not r["short"]:
        feats.add(f"length:{_length_bucket(v.get('duration_secs') or 0)}")
    traits = _title_traits(v.get("title", ""))
    if traits["has_number"]:
        feats.add("title:a number in the title")
    if traits["has_question"]:
        feats.add("title:a question in the title")
    if traits["has_brackets"]:
        feats.add("title:brackets in the title")
    return feats


def outliers(rows: list[dict]) -> dict:
    """Biggest over- and under-performers, and what the top ones share."""
    ranked = sorted(rows, key=lambda r: r["ratio"], reverse=True)
    top = ranked[:5]
    bottom = [r for r in reversed(ranked) if r["age_days"] >= 7][:5]

    shared = []
    k = max(3, len(ranked) // 4)
    top_q, rest = ranked[:k], ranked[k:]
    if rest:
        top_feats = Counter(f for r in top_q for f in _features_for_traits(r))
        rest_feats = Counter(f for r in rest for f in _features_for_traits(r))
        for feat, n_top in top_feats.most_common():
            share_top, share_rest = n_top / len(top_q), rest_feats[feat] / len(rest)
            if n_top >= 2 and share_top >= 0.5 and share_top >= 2 * share_rest:
                kind, value = feat.split(":", 1)
                text = {
                    "tag":    f"the tag “{value}”",
                    "format": f"are {value}",
                    "length": f"are {value} long",
                    "title":  value,
                }[kind]
                shared.append({
                    "text":       text,
                    "kind":       kind,
                    "top_count":  n_top,
                    "top_total":  len(top_q),
                    "rest_share": _r(share_rest * 100, 0),
                })
            if len(shared) == 4:
                break

    return {"top": [_video_card(r) for r in top],
            "bottom": [_video_card(r) for r in bottom],
            "top_share_traits": shared,
            "top_group_size": len(top_q)}


def _compare(key: str, name: str, groups: dict[str, list[float]], order: list[str]) -> dict:
    labels = [g for g in order if groups.get(g)]
    out_groups = [{"label": g, "n": len(groups[g]), "median_ratio": _r(math.exp(_median(groups[g])))}
                  for g in labels]
    testable = [g for g in labels if len(groups[g]) >= MIN_GROUP]
    result = {"key": key, "name": name, "groups": out_groups,
              "verdict": "insufficient", "best": None, "effect": None, "p_value": None}
    if len(testable) < 2:
        return result
    p = _p_value([groups[g] for g in testable])
    best = max(testable, key=lambda g: _median(groups[g]))
    others = [x for g in labels if g != best for x in groups[g]]
    result.update({
        "verdict": "pending",   # decided in what_works() after the BH correction
        "best":    best,
        "effect":  _r(math.exp(_median(groups[best]) - _median(others))),
        "p_value": p,
    })
    return result


def what_works(rows: list[dict], model: dict) -> dict:
    """Format, length, title style, upload day/time and topics — each tested."""
    factors = []

    # The score already adjusts for format, so compare formats on age alone
    fmt = defaultdict(list)
    for r in rows:
        fmt["Shorts" if r["short"] else "Long-form"].append(
            r["log_ratio"] + (model["c"] if r["short"] else 0.0))
    if len(fmt) == 2:
        factors.append(_compare("format", "Shorts vs long-form", fmt, ["Long-form", "Shorts"]))

    length = defaultdict(list)
    for r in rows:
        if not r["short"]:
            length[_length_bucket(r["video"].get("duration_secs") or 0)].append(r["log_ratio"])
    factors.append(_compare("length", "Video length (long-form)", length, [b[2] for b in LENGTH_BUCKETS]))

    for key, name, yes, no in (
        ("has_number",   "Numbers in the title",   "With a number",   "Without"),
        ("has_question", "Questions in the title", "With a question", "Without"),
        ("has_brackets", "Brackets in the title",  "With brackets",   "Without"),
    ):
        g = defaultdict(list)
        for r in rows:
            g[yes if _title_traits(r["video"].get("title", ""))[key] else no].append(r["log_ratio"])
        factors.append(_compare(key, name, g, [yes, no]))

    tl = defaultdict(list)
    for r in rows:
        tl[_title_traits(r["video"].get("title", ""))["title_length"]].append(r["log_ratio"])
    factors.append(_compare("title_length", "Title length", tl, [b[2] for b in TITLE_LENGTH_BUCKETS]))

    day = defaultdict(list)
    for r in rows:
        day[DAY_NAMES[r["local_day"]]].append(r["log_ratio"])
    factors.append(_compare("upload_day", "Upload day", day, DAY_NAMES))

    blocks = [f"{h:02d}:00–{(h + 4) % 24:02d}:00" for h in range(0, 24, 4)]
    time_g = defaultdict(list)
    heat = defaultdict(list)
    for r in rows:
        block = blocks[r["local_hour"] // 4]
        time_g[block].append(r["log_ratio"])
        heat[(r["local_day"], r["local_hour"] // 4)].append(r["log_ratio"])
    factors.append(_compare("upload_time", "Upload time", time_g, blocks))

    heatmap = [{"day": d, "block": b, "n": len(v), "median_ratio": _r(math.exp(_median(v)))}
               for (d, b), v in sorted(heat.items())]

    # Topics: each tag used by at least MIN_GROUP videos (and not by nearly all)
    tag_rows = defaultdict(set)
    for i, r in enumerate(rows):
        for t in {t.lower().strip() for t in (r["video"].get("tags") or []) if t.strip()}:
            tag_rows[t].add(i)
    topics = []
    for tag, idx in tag_rows.items():
        with_ = [rows[i]["log_ratio"] for i in idx]
        without = [r["log_ratio"] for i, r in enumerate(rows) if i not in idx]
        if len(with_) < MIN_GROUP or len(without) < MIN_GROUP:
            continue
        topics.append({
            "topic":   tag,
            "n":       len(with_),
            "effect":  _r(math.exp(_median(with_) - _median(without))),
            "verdict": "pending",
            "p_value": _p_value([with_, without]),
        })

    # One correction across every test on the page, then label the results
    tested = [f for f in factors if f["verdict"] == "pending"] + topics
    for item, q in zip(tested, _bh_adjust([t["p_value"] for t in tested])):
        item["verdict"] = "clear" if q < P_CLEAR else "none"
        item["p_value"] = _r(q, 3)
    topics.sort(key=lambda t: (t["verdict"] == "clear", abs(math.log(t["effect"])) if t["effect"] > 0 else 0),
                reverse=True)

    return {"factors": factors, "heatmap": heatmap, "time_blocks": blocks, "topics": topics[:10]}


# ══════════════════════════════════════════════════════════════════════════════
#  ML model: what drives views on this channel
# ══════════════════════════════════════════════════════════════════════════════
def _model_features(rows: list[dict]) -> tuple[np.ndarray, list[str], list[str]]:
    tag_counts = Counter(t for r in rows for t in {x.lower().strip() for x in (r["video"].get("tags") or [])})
    top_tags = [t for t, n in tag_counts.most_common(8) if n >= MIN_GROUP and n < len(rows)]
    names = ["is_short", "length", "title_length", "has_number", "has_question",
             "has_brackets", "tag_count", "day_sin", "day_cos", "hour_sin", "hour_cos"] + [f"tag:{t}" for t in top_tags]
    labels = ["Being a Short", "Video length", "Title length", "A number in the title",
              "A question in the title", "Brackets in the title", "Number of tags",
              "Upload day", "Upload day", "Upload time", "Upload time"] + [f"Topic “{t}”" for t in top_tags]
    X = []
    for r in rows:
        v = r["video"]
        title = v.get("title", "")
        tags = {x.lower().strip() for x in (v.get("tags") or [])}
        t = _title_traits(title)
        X.append([
            1.0 if r["short"] else 0.0,
            math.log1p(v.get("duration_secs") or 0),
            len(title),
            float(t["has_number"]), float(t["has_question"]), float(t["has_brackets"]),
            len(tags),
            math.sin(2 * math.pi * r["local_day"] / 7), math.cos(2 * math.pi * r["local_day"] / 7),
            math.sin(2 * math.pi * r["local_hour"] / 24), math.cos(2 * math.pi * r["local_hour"] / 24),
        ] + [1.0 if tag in tags else 0.0 for tag in top_tags])
    return np.array(X), names, labels


def _new_model() -> GradientBoostingRegressor:
    return GradientBoostingRegressor(n_estimators=150, max_depth=2, learning_rate=0.05,
                                     subsample=0.8, random_state=42)


def drivers_model(rows: list[dict]) -> dict:
    """
    Gradient boosting on the age-adjusted score, tested on videos it hasn't
    seen (5-fold cross-validation) against a baseline that always guesses the
    typical video. Drivers are shown only when the model clearly beats it.
    """
    n = len(rows)
    if n < MIN_MODEL_VIDEOS:
        return {"status": "insufficient_data", "n": n, "min_videos": MIN_MODEL_VIDEOS}

    X, names, labels = _model_features(rows)
    y = np.array([r["log_ratio"] for r in rows])
    err_model, err_base = [], []
    imp = np.zeros(X.shape[1])
    for train, test in KFold(n_splits=5, shuffle=True, random_state=42).split(X):
        model = _new_model().fit(X[train], y[train])
        err_model.extend(np.abs(model.predict(X[test]) - y[test]))
        err_base.extend(np.abs(np.median(y[train]) - y[test]))
        # Importance on the held-out fold: what actually helps on unseen videos
        imp += permutation_importance(model, X[test], y[test], n_repeats=5, random_state=42,
                                      scoring="neg_mean_absolute_error").importances_mean
    mae_model, mae_base = float(np.mean(err_model)), float(np.mean(err_base))
    gain = 1 - mae_model / mae_base if mae_base > 0 else 0.0

    result = {"status": "not_reliable", "n": n, "improvement_pct": _r(gain * 100, 1),
              "mae_model": _r(mae_model, 3), "mae_baseline": _r(mae_base, 3), "drivers": []}
    if gain < MODEL_MIN_GAIN:
        return result

    model = _new_model().fit(X, y)
    pred = model.predict(X)
    # Merge sin/cos pairs (and any duplicate labels) into one driver each
    merged: dict[str, dict] = {}
    for i, label in enumerate(labels):
        col = X[:, i]
        if np.std(col) == 0:
            continue
        corr = float(np.corrcoef(col, pred)[0, 1]) if label not in ("Upload day", "Upload time") else 0.0
        d = merged.setdefault(label, {"label": label, "importance": 0.0, "corr": 0.0})
        d["importance"] += max(0.0, float(imp[i]))
        d["corr"] += corr
    total = sum(d["importance"] for d in merged.values()) or 1.0
    drivers = []
    for d in sorted(merged.values(), key=lambda d: d["importance"], reverse=True)[:5]:
        if d["importance"] / total < 0.10:   # too small to tell apart from noise
            continue
        direction = "mixed"
        if d["label"] not in ("Upload day", "Upload time"):
            direction = "up" if d["corr"] > 0.05 else "down" if d["corr"] < -0.05 else "mixed"
        drivers.append({"label": d["label"], "share": _r(d["importance"] / total * 100, 0), "direction": direction})
    result.update({"status": "reliable", "drivers": drivers})
    return result


# ══════════════════════════════════════════════════════════════════════════════
#  Entry point
# ══════════════════════════════════════════════════════════════════════════════
def analyze(videos: list[dict], tz: str = "UTC", now: datetime | None = None) -> dict:
    now = now or datetime.now(timezone.utc)
    zone = _zone(tz)
    scored = score_videos(videos, now, zone.key)
    base = {
        "timezone":       zone.key,
        "videos_fetched": len(videos),
        "min_videos":     MIN_VIDEOS,
    }
    if scored is None:
        return {**base, "status": "insufficient_data", "videos_scored": 0}

    rows, model = scored
    return {
        **base,
        "status":         "ok",
        "videos_scored":  len(rows),
        "long_count":     sum(1 for r in rows if not r["short"]),
        "short_count":    sum(1 for r in rows if r["short"]),
        "min_age_days":   MIN_AGE_DAYS,
        "expected_next":  next_video_expectation(rows, model),
        "momentum":       momentum(rows),
        "outliers":       outliers(rows),
        "what_works":     what_works(rows, model),
        "model":          drivers_model(rows),
    }
