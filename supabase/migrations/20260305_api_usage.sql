-- ════════════════════════════════════════════════════════════
-- API Usage Rate Limiting Table
-- Tracks Gemini proxy calls per user per hour and per day.
-- ════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS api_usage (
  user_id           uuid    NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date              date    NOT NULL DEFAULT CURRENT_DATE,
  hour_key          text    NOT NULL, -- format: "YYYY-MM-DDTHH" (UTC hour)
  requests_this_hour integer NOT NULL DEFAULT 0,
  requests_today     integer NOT NULL DEFAULT 0,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, date, hour_key)
);

-- Index for fast lookup by user + date
CREATE INDEX IF NOT EXISTS idx_api_usage_user_date
  ON api_usage(user_id, date);

-- ── RLS: each user can only read their own usage ──────────────────────────
ALTER TABLE api_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own usage"
  ON api_usage FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- No direct INSERT/UPDATE from client — only the edge function
-- (using service role key) can write to this table.

-- ════════════════════════════════════════════════════════════
-- Stored function to atomically increment counters
-- Called from the edge function after a successful Gemini call.
-- ════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION increment_api_usage(
  p_user_id  uuid,
  p_date     date,
  p_hour_key text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER  -- runs with elevated privilege, not the caller's role
AS $$
BEGIN
  INSERT INTO api_usage (user_id, date, hour_key, requests_this_hour, requests_today, updated_at)
  VALUES (p_user_id, p_date, p_hour_key, 1, 1, now())
  ON CONFLICT (user_id, date, hour_key) DO UPDATE
    SET
      requests_this_hour = api_usage.requests_this_hour + 1,
      requests_today     = api_usage.requests_today + 1,
      updated_at         = now();
END;
$$;

-- ── Auto-cleanup: delete rows older than 7 days ────────────────────────────
-- Run this periodically via pg_cron or Supabase scheduled jobs.
-- CREATE EXTENSION IF NOT EXISTS pg_cron;
-- SELECT cron.schedule('0 0 * * *', $$DELETE FROM api_usage WHERE date < CURRENT_DATE - 7$$);
