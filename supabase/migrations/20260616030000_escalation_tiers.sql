alter table public.risk_alerts
  add column if not exists escalation_tier text,
  add column if not exists finding_status text,
  add column if not exists metric_key text,
  add column if not exists metric_value numeric,
  add column if not exists threshold_value numeric,
  add column if not exists comparator text,
  add column if not exists execution_staged boolean not null default false;

alter table public.intelligence_notification_preferences
  add column if not exists email_threshold text not null default 'alert'
    check (email_threshold in ('escalate', 'alert', 'critical'));

update public.risk_alerts
set escalation_tier =
  case
    when severity = 'critical' then 'critical'
    when severity = 'high' then 'alert'
    when severity = 'medium' then 'flag'
    else 'watch'
  end
where escalation_tier is null;
