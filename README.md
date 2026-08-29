# CreatorIQ

An intelligence dashboard for social-media creators. Provides deeper analytics than standard platform analytics — including ML predictions, sentiment analysis, competitor intelligence, and Google Trends integration.

## Stack

- **Backend:** Python / Flask (`CreatorLab/backend/`)
- **Frontend:** Next.js 16 + React 19 + Tailwind CSS v4 + TypeScript (`creatorlab-frontend/`)

## Features

- **YouTube Analytics** — video performance table, posting heatmap, engagement metrics
- **Audience Sentiment** — multi-source analysis (YouTube comments + Reddit + News)
- **ML Predictions** — growth forecasting, viral potential score, title intelligence, topic performance
- **Google Trends** — interest over time, related queries, geographic interest
- **Competitor Intelligence** — health scores, metrics comparison, content gap analysis
- **Instagram** — coming soon

## Running Locally

### 1. Backend (Flask)

```bash
cd CreatorLab/backend
pip install -r requirements.txt
python app.py
# → http://localhost:5000
```

Set these in a `.env` file inside `CreatorLab/backend/`:
```
YOUTUBE_API_KEY=your_key
REDDIT_CLIENT_ID=your_id
REDDIT_CLIENT_SECRET=your_secret
REDDIT_USER_AGENT=CreatorIQ/1.0
NEWS_API_KEY=your_key
```

### 2. Frontend (Next.js)

```bash
cd creatorlab-frontend
bun install        # or npm install
bun run dev        # or npm run dev
# → http://localhost:3000
```

Make sure Flask is running on port 5000 before starting the frontend.

## Project Structure

```
├── CreatorLab/
│   ├── backend/          # Flask API
│   │   ├── app.py
│   │   ├── youtube_api.py
│   │   ├── sentiment_analysis.py
│   │   ├── ml_models.py
│   │   ├── google_trends.py
│   │   └── ...
│   ├── dashboard.html    # Legacy vanilla dashboard
│   └── index.html        # Legacy landing page
│
└── creatorlab-frontend/  # New Next.js frontend
    ├── app/
    │   ├── page.tsx              # Landing page
    │   └── dashboard/
    │       ├── page.tsx          # Overview
    │       ├── youtube/
    │       ├── sentiment/
    │       ├── predictions/
    │       ├── trends/
    │       ├── competitor/
    │       ├── instagram/
    │       └── settings/
    ├── components/
    │   ├── shell/         # Sidebar, Header
    │   ├── ui/            # Button, Badge, DataTable, etc.
    │   ├── dashboard/     # Overview charts
    │   └── predictions/   # Forecast chart, heatmap, etc.
    └── lib/
        ├── api.ts         # Flask API client
        ├── store.ts       # Zustand state
        ├── types.ts       # TypeScript interfaces
        └── utils.ts       # Formatting utilities
```
