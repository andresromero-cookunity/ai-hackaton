# Competitor Snapshotting Engine (CookUnity Hackathon MVP)

Internal app to monitor top competitor homepages, detect strict messaging/promo changes, and maintain a searchable tactic library with AI-generated experiment suggestions.

## Stack

- Next.js 14 (App Router)
- Neon Postgres
- Vercel Blob (screenshots)
- Playwright (capture)
- OpenAI Responses API (deterministic JSON semantic analysis)
- Vercel Cron

## What This MVP Does

- Imports top competitors from [foodtechrace.replit.app](https://foodtechrace.replit.app/)
- Captures desktop + mobile homepage snapshots
- Waits for popups, attempts known popup closes, then screenshots
- Extracts structured fields:
  - Hero: headline, subheadline, CTA
  - Promo: banner present, discount amount/text, value-add, multi-week, urgency
  - Meta title
- Runs strict change detection against prior snapshot
- Runs semantic analysis with OpenAI for every snapshot
- Writes tactic library entries when strict changes are found
- Shows weekly dashboard + competitor coverage + searchable tactic library

## Run Locally

1. Install dependencies:

```bash
npm install
```

2. Set env vars:

```bash
cp .env.example .env.local
```

3. Run migrations and seed:

```bash
npm run db:migrate
npm run db:seed
```

4. Start app:

```bash
npm run dev
```

5. Trigger a manual capture run:

```bash
npm run capture:once
```

## Cron Behavior

`vercel.json` schedules:
- `import-competitors` weekly
- `capture` hourly

The capture endpoint only executes inside ET windows controlled by env:
- `CAPTURE_HOURS_ET=8,18`
- `CAPTURE_DAYS_ET=0,1,2,3,4,5,6`

This avoids DST schedule drift while keeping Vercel cron simple.

## API Endpoints

- `GET /api/cron/import-competitors?key=...`
- `GET /api/cron/capture?key=...&force=true`
- `GET /api/insights`

If `CRON_SECRET` is set, pass it as `Authorization: Bearer <secret>` or `key` query param.

## Data Model

Defined in `db/schema.sql`:
- `competitors`
- `snapshots`
- `semantic_analyses`
- `change_events`
- `tactics`
- `weekly_insights`
- `cron_runs`

## Notes

- Raw HTML storage is optional (`STORE_RAW_HTML=true|false`), default false.
- No auth is included for this hackathon MVP.
