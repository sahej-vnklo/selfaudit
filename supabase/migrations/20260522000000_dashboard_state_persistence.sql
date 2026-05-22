ALTER TABLE public.business_state
  ADD COLUMN IF NOT EXISTS open_issue_statuses jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS founder_checkin_snooze jsonb NOT NULL DEFAULT '{}'::jsonb;
