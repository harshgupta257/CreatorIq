# CreatorIQ — Decision Log

> This file tracks every significant technical and product decision made in this project.
> Format: Decision → Why → Impact → What's used.
> **Maintained at:** `CreatorLab/decision.md`

---

## 2026-07-16 — Chose Flask over FastAPI for backend

**Decision:** Use Python Flask as the backend framework.

**Why:** Flask is simpler to set up quickly, has excellent ecosystem support for data science libs (sklearn, pandas, pytrends), and the project doesn't need async performance at this scale.

**Impact:** Slightly slower for concurrent requests than FastAPI, but negligible for a single-user analytics tool.

**What's used:** `flask==2.3.3`, `flask-cors==4.0.0`

---

## 2026-07-16 — pytrends over Google Trends API

**Decision:** Use `pytrends` (unofficial reverse-engineered library) for Google Trends data instead of any official API.

**Why:** Google does not offer a public Trends API. Pytrends scrapes the same data the website shows. Added retry logic and 429 rate-limit detection.

**Impact:** Occasional rate-limiting. UI shows a banner when this happens and falls back to word-cloud from channel tags. Keyword filtering added to exclude flat-line keywords (max value ≤ 3/100).

**What's used:** `pytrends==4.9.2`, custom `_safe_build_payload()` retry wrapper in `google_trends.py`

---

## 2026-07-17 — Multi-series Google Trends chart (3 keywords)

**Decision:** Changed the Trends chart from single-keyword to a 3-keyword multi-line chart.

**Why:** A single keyword gives limited context. Showing 3 relevant keywords (extracted from video tags) lets the creator see relative interest between their topics.

**Impact:** Keywords extracted from video titles + tags with STOPWORDS + BLACKLIST filter to pick channel-specific terms. Blacklist includes generic words like "past", "reality", "future", "people" that inflate tag counts but have no trends signal.

**What's used:** `pytrends.interest_over_time()` with 3-keyword payload. Chart.js multi-dataset line chart.

---

## 2026-07-17 — Filter near-zero (≤3/100) keywords from Trends chart

**Decision:** Keywords whose max relative value across 90 days is ≤ 3 are excluded from the chart.

**Why:** When pytrends normalizes 3 keywords, low-volume keywords appear as flat lines at 2/100 — visually misleading.

**Impact:** Chart may show 1-2 lines instead of 3. Intentional — real data for 2 terms beats noise for 3. `keywords_in_data` field in API updated accordingly.

**What's used:** Post-processing step in `google_trends.py:get_interest_over_time()`.

---

## 2026-07-30 — Always-visible Google Trends info strip

**Decision:** Changed Trends tab banner from "only visible when rate-limited" to "always visible".

**Why:** User wants a direct link to Google Trends even when data loads successfully. Rate-limited = yellow ⚠️. Normal = blue 📈 strip with "Open on Google Trends →" link.

**Impact:** Better transparency. User can always jump to Google Trends for deeper analysis.

**What's used:** `dashboard.js:updateTrendsTab()` — banner injected at top of `#tab-trends`.

---

## 2026-08-03 — Competitor tab redesign: multi-competitor + health grade + content gap

**Decision:** Replaced single-competitor comparison with a full competitor intelligence system.

**Why:** Previous system had a critical bug (`State.channel` undefined during comparison). Also single-competitor comparison is too limited for real creator research.

**Key decisions inside this:**
- **Health Score (A-F grade):** 5 weighted metrics — subs, avg views/video, video count, growth proxy, views/subscriber ratio
- **Content Gap Analysis:** Fetch competitor videos to extract tags, tokenize into words, find terms they cover that you don't
- **Niche-based suggestions:** Detect niche from actual video tags (osho/buddha tags → suggest spiritual channels, not MrBeast)
- **Max 3 competitors:** Prevents UI overload and YouTube API quota waste

**Impact:** 2 API calls per competitor (channel + videos). More useful gap analysis. Health score gives quick benchmark.

**What's used:** `/api/youtube/channel` + `/api/youtube/videos`. Chart.js bar charts. JS `CompetitorState` object.

---

## 2026-08-03 — Content gap: tokenize tags into individual words

**Decision:** Split multi-word YouTube tags into individual words for comparison (e.g., "stop overthinking" → ["stop", "overthinking"]).

**Why:** String-level comparison of multi-word tags misses obvious overlaps between "overthinking" and "stop overthinking".

**Impact:** Eliminated the false "no gaps found" result. Added stopword filter for noise removal.

**What's used:** Custom `tokenize()` in `dashboard.js:renderContentGapAnalysis()`.

---

## 2026-08-17 — ML Predictions tab as "hero section" *(PLANNED — pending approval)*

**Decision (planned):** Redesign the Predictions tab from demo-data cosmetics to real channel-trained analysis.

**Why:** The current predictions tab sends **static, hardcoded features** (`publish_hour=15, video_length=600`) to the ML model for every single video — it is not actually using real data. The viral score is generic (not channel-relative). The heatmap is demo JS. This is the biggest credibility gap in the entire app.

**Root problem in current code (`app.py` line 468-476):**
```python
features = {
    "video_length": 600,        # ← HARDCODED, not real
    "publish_hour": 15,         # ← HARDCODED, not real
    "publish_day": 2,           # ← HARDCODED, not real
    ...
}
```

**What will change:**
- `ml_models.py`: Fix feature extraction + add `analyze_title_patterns()`, `get_topic_performance()`, `get_optimal_duration()`, `get_growth_forecast()`.
- `app.py`: Extract real features per video. Add new response fields.
- `dashboard.js`: 6-section real-data layout replacing the demo UI.

**Differentiation from YouTube Studio:**
| Feature | YouTube Studio | CreatorIQ |
|---|---|---|
| Historical view counts | ✅ | ✅ |
| Predicted views before upload | ❌ | ✅ (new) |
| Best title pattern for YOUR audience | ❌ | ✅ (new) |
| Topic performance by content cluster | ❌ | ✅ (new) |
| Growth trajectory forecast | ❌ | ✅ (new) |
| Content format sweet spot (duration) | ❌ | ✅ (new) |

**What will be used:** `sklearn.linear_model.LinearRegression` (growth forecast), `RandomForest + GradientBoosting` (view prediction), `collections.Counter` (tag clustering), Chart.js (growth chart).
