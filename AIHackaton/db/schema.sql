CREATE TABLE IF NOT EXISTS competitors (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  url TEXT NOT NULL UNIQUE,
  source TEXT NOT NULL DEFAULT 'manual',
  priority INTEGER NOT NULL DEFAULT 100,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS snapshots (
  id BIGSERIAL PRIMARY KEY,
  competitor_id BIGINT NOT NULL REFERENCES competitors(id) ON DELETE CASCADE,
  captured_at TIMESTAMPTZ NOT NULL,
  viewport TEXT NOT NULL CHECK (viewport IN ('desktop', 'mobile')),
  screenshot_url TEXT NOT NULL,
  screenshot_hash TEXT NOT NULL,
  html TEXT,
  meta_title TEXT,
  hero_headline TEXT,
  hero_subheadline TEXT,
  hero_cta TEXT,
  promo_banner_present BOOLEAN,
  promo_discount_amount NUMERIC,
  promo_discount_text TEXT,
  promo_value_add TEXT,
  promo_multi_week BOOLEAN,
  promo_urgency TEXT,
  extraction JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_snapshots_competitor_viewport_captured_at
  ON snapshots(competitor_id, viewport, captured_at DESC);

CREATE TABLE IF NOT EXISTS semantic_analyses (
  id BIGSERIAL PRIMARY KEY,
  snapshot_id BIGINT NOT NULL UNIQUE REFERENCES snapshots(id) ON DELETE CASCADE,
  model TEXT NOT NULL,
  prompt_version TEXT NOT NULL,
  output JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS change_events (
  id BIGSERIAL PRIMARY KEY,
  competitor_id BIGINT NOT NULL REFERENCES competitors(id) ON DELETE CASCADE,
  snapshot_id BIGINT NOT NULL REFERENCES snapshots(id) ON DELETE CASCADE,
  previous_snapshot_id BIGINT REFERENCES snapshots(id) ON DELETE SET NULL,
  section TEXT NOT NULL CHECK (section IN ('hero', 'promo', 'meta_title')),
  change_type TEXT NOT NULL CHECK (change_type IN ('Positioning', 'Promo', 'Seasonal', 'Experiment-like')),
  is_significant BOOLEAN NOT NULL,
  confidence NUMERIC NOT NULL,
  summary TEXT NOT NULL,
  details JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_change_events_competitor_created_at
  ON change_events(competitor_id, created_at DESC);

CREATE TABLE IF NOT EXISTS tactics (
  id BIGSERIAL PRIMARY KEY,
  competitor_id BIGINT NOT NULL REFERENCES competitors(id) ON DELETE CASCADE,
  change_event_id BIGINT REFERENCES change_events(id) ON DELETE SET NULL,
  category TEXT NOT NULL CHECK (category IN ('Positioning', 'Promo', 'Seasonal', 'Experiment-like')),
  description TEXT NOT NULL,
  inferred_intent TEXT NOT NULL,
  experiment_suggestion TEXT NOT NULL,
  date_from DATE NOT NULL,
  date_to DATE,
  screenshot_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tactics_category_created_at
  ON tactics(category, created_at DESC);

CREATE TABLE IF NOT EXISTS weekly_insights (
  id BIGSERIAL PRIMARY KEY,
  week_start DATE NOT NULL,
  competitor_id BIGINT REFERENCES competitors(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  evidence JSONB NOT NULL,
  experiment_suggestion TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_weekly_insights_week_start
  ON weekly_insights(week_start DESC);

CREATE TABLE IF NOT EXISTS cron_runs (
  id BIGSERIAL PRIMARY KEY,
  run_key TEXT NOT NULL UNIQUE,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  finished_at TIMESTAMPTZ,
  status TEXT NOT NULL CHECK (status IN ('running', 'success', 'failed')),
  error_message TEXT
);

CREATE TABLE IF NOT EXISTS promotions (
  id BIGSERIAL PRIMARY KEY,
  coupon_code TEXT NOT NULL,
  page_name TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_promotions_end_date
  ON promotions(end_date DESC);
