create table if not exists public.decision_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  pending_action_id uuid null references public.pending_actions(id) on delete set null,
  execution_log_id uuid null references public.execution_log(id) on delete set null,
  artifact_id uuid null references public.artifacts(id) on delete set null,
  source_health_check_id uuid null references public.business_health_checks(id) on delete set null,
  finding_fingerprint text not null,
  finding_area_id text not null,
  finding_title text not null,
  finding_status text null,
  finding_severity text null,
  metric_key text null,
  metric_value numeric null,
  comparator text null,
  threshold_value numeric null,
  recommendation text null,
  action_type text not null,
  tool_slug text null,
  connector text null,
  execution_outcome text not null check (execution_outcome in ('dismissed', 'success', 'failed')),
  finding_snapshot jsonb not null default '{}'::jsonb,
  action_snapshot jsonb not null default '{}'::jsonb,
  observation_status text not null default 'pending' check (observation_status in ('pending', 'observed')),
  observed_health_check_id uuid null references public.business_health_checks(id) on delete set null,
  observed_at timestamptz null,
  observed_metric_value numeric null,
  observed_result text null check (observed_result in ('improved', 'unchanged', 'worsened', 'resolved', 'unknown')),
  observed_notes text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists decision_records_user_created_idx
  on public.decision_records(user_id, created_at desc);

create index if not exists decision_records_user_metric_idx
  on public.decision_records(user_id, finding_area_id, metric_key, created_at desc);

create index if not exists decision_records_user_fingerprint_idx
  on public.decision_records(user_id, finding_fingerprint, created_at desc);

alter table public.decision_records enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'decision_records'
      and policyname = 'Users manage own decisions'
  ) then
    create policy "Users manage own decisions"
      on public.decision_records
      for all
      to authenticated
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'decision_records'
      and policyname = 'Service role bypass decisions'
  ) then
    create policy "Service role bypass decisions"
      on public.decision_records
      for all
      to service_role
      using (true)
      with check (true);
  end if;
end $$;

alter table public.pending_actions
  add column if not exists finding_snapshot jsonb,
  add column if not exists finding_fingerprint text,
  add column if not exists source_health_check_id uuid references public.business_health_checks(id) on delete set null;
