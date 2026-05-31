-- Area metric snapshots: append-only time-series store for governance metrics.
-- Replaces the single-row upsert pattern in business_state for metric tracking.
-- Every cron health check writes a snapshot row per metric per area.
-- Enables trend detection, delta computation, and direction indicators.

CREATE TABLE IF NOT EXISTS area_metric_snapshots (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  area            text        NOT NULL,          -- 'customer-service' | 'marketing-sales' | 'finance-accounting' | 'management-strategy'
  metric_name     text        NOT NULL,          -- matches metricKey from rule packs (e.g. 'open_deals', 'churn_rate')
  value           numeric     NOT NULL,
  captured_at     timestamptz NOT NULL DEFAULT now(),
  source          text        NOT NULL,          -- 'hubspot' | 'intelligence_brief' | 'company_brain' | 'derived'
  delta_from_prior numeric    DEFAULT NULL       -- value minus most recent prior snapshot (null on first capture)
);

-- Fast lookup: all metrics for a user ordered by time (primary read pattern)
CREATE INDEX IF NOT EXISTS area_metric_snapshots_user_time
  ON area_metric_snapshots (user_id, captured_at DESC);

-- Fast lookup: trend for a specific metric (used by trend indicator UI)
CREATE INDEX IF NOT EXISTS area_metric_snapshots_user_metric
  ON area_metric_snapshots (user_id, area, metric_name, captured_at DESC);

-- RLS: users can only see their own snapshots
ALTER TABLE area_metric_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own metric snapshots"
  ON area_metric_snapshots FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert metric snapshots"
  ON area_metric_snapshots FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Service role can delete old snapshots"
  ON area_metric_snapshots FOR DELETE
  USING (true);

-- Keep only the last 90 days of snapshots to prevent table bloat.
-- Run as a maintenance step (can be called from a weekly cron).
CREATE OR REPLACE FUNCTION prune_old_metric_snapshots()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
  DELETE FROM area_metric_snapshots
  WHERE captured_at < now() - interval '90 days';
$$;
