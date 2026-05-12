-- Add columns required by the weekly digest cron and WeeklyDigestPanel.
--
-- notification_email: used when the user's email was captured mid-chat (anonymous flows).
--   Already written by save-report.js — this migration formalises the column.
-- last_digest_sent_at: timestamp of the most recent successful weekly digest send.
-- last_digest_summary: JSONB snapshot of what was in that digest (score, top risks, etc).

alter table profiles
  add column if not exists notification_email   text,
  add column if not exists last_digest_sent_at  timestamptz,
  add column if not exists last_digest_summary  jsonb;
