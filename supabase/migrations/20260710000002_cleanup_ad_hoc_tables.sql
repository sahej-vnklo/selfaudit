create table if not exists public.agent_findings (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  query       text not null,
  intent      text,
  answer      text,
  full_result jsonb,
  confidence  text,
  created_at  timestamptz default now()
);

create index if not exists agent_findings_user_created_idx
  on public.agent_findings (user_id, created_at desc);

alter table public.agent_findings enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'agent_findings'
      and policyname = 'Users can read own agent findings'
  ) then
    create policy "Users can read own agent findings"
      on public.agent_findings
      for select
      to authenticated
      using (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'agent_findings'
      and policyname = 'Service role full access to agent findings'
  ) then
    create policy "Service role full access to agent findings"
      on public.agent_findings
      for all
      to service_role
      using (true)
      with check (true);
  end if;
end $$;

create table if not exists public.user_custom_metrics (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  area_id     text not null,
  name        text not null,
  value       numeric not null,
  unit        text not null default '',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table public.user_custom_metrics
  add column if not exists updated_at timestamptz not null default now();

create index if not exists user_custom_metrics_user_area_idx
  on public.user_custom_metrics (user_id, area_id);

create unique index if not exists user_custom_metrics_upsert_idx
  on public.user_custom_metrics (user_id, area_id, name);

alter table public.user_custom_metrics enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'user_custom_metrics'
      and policyname = 'Users can read own custom metrics'
  ) then
    create policy "Users can read own custom metrics"
      on public.user_custom_metrics
      for select
      to authenticated
      using (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'user_custom_metrics'
      and policyname = 'Service role full access to custom metrics'
  ) then
    create policy "Service role full access to custom metrics"
      on public.user_custom_metrics
      for all
      to service_role
      using (true)
      with check (true);
  end if;
end $$;

create table if not exists public.business_health_checks (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references public.profiles(id) on delete cascade,
  checked_at          timestamptz not null,
  schema_version      text,
  health_score        int,
  risks               jsonb,
  opportunities       jsonb,
  summary             text,
  recommended_actions jsonb,
  evidence            jsonb,
  governance          jsonb,
  created_at          timestamptz default now()
);

alter table public.business_health_checks
  add column if not exists schema_version text,
  add column if not exists governance jsonb;

create index if not exists business_health_checks_user_checked_idx
  on public.business_health_checks (user_id, checked_at desc);

alter table public.business_health_checks enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'business_health_checks'
      and policyname = 'Users can read own business health checks'
  ) then
    create policy "Users can read own business health checks"
      on public.business_health_checks
      for select
      to authenticated
      using (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'business_health_checks'
      and policyname = 'Service role full access to business health checks'
  ) then
    create policy "Service role full access to business health checks"
      on public.business_health_checks
      for all
      to service_role
      using (true)
      with check (true);
  end if;
end $$;

create table if not exists public.risk_alerts (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references public.profiles(id) on delete cascade,
  health_check_id     uuid references public.business_health_checks(id) on delete set null,
  severity            text not null,
  category            text not null,
  title               text not null,
  description         text,
  evidence            jsonb,
  recommended_action  text,
  status              text not null default 'open',
  notification_sent   boolean not null default false,
  escalation_tier     text,
  finding_status      text,
  metric_key          text,
  metric_value        numeric,
  threshold_value     numeric,
  comparator          text,
  evidence_snapshot   jsonb,
  detection_version   text,
  execution_staged    boolean not null default false,
  created_at          timestamptz default now(),
  resolved_at         timestamptz
);

alter table public.risk_alerts
  add column if not exists escalation_tier text,
  add column if not exists finding_status text,
  add column if not exists metric_key text,
  add column if not exists metric_value numeric,
  add column if not exists threshold_value numeric,
  add column if not exists comparator text,
  add column if not exists evidence_snapshot jsonb,
  add column if not exists detection_version text,
  add column if not exists execution_staged boolean not null default false;

create index if not exists risk_alerts_user_status_created_idx
  on public.risk_alerts (user_id, status, created_at desc);

alter table public.risk_alerts enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'risk_alerts'
      and policyname = 'Users can read own risk alerts'
  ) then
    create policy "Users can read own risk alerts"
      on public.risk_alerts
      for select
      to authenticated
      using (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'risk_alerts'
      and policyname = 'Service role full access to risk alerts'
  ) then
    create policy "Service role full access to risk alerts"
      on public.risk_alerts
      for all
      to service_role
      using (true)
      with check (true);
  end if;
end $$;
