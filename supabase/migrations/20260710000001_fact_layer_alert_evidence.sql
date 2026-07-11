alter table public.connector_metric_history
  add column if not exists normalizer_version text,
  add column if not exists window_days integer;

alter table public.risk_alerts
  add column if not exists evidence_snapshot jsonb,
  add column if not exists detection_version text;
