create table if not exists public.goal_nodes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  parent_goal_id uuid null references public.goal_nodes(id) on delete set null,
  owner_team_member_id uuid null,
  area_id text null,
  title text not null,
  goal_type text not null default 'company' check (goal_type in ('company', 'department', 'team', 'individual')),
  metric_key text null,
  metric_direction text null check (metric_direction in ('increase', 'decrease')),
  baseline_value numeric null,
  target_value numeric null,
  current_value numeric null,
  progress numeric not null default 0 check (progress >= 0 and progress <= 100),
  health_score numeric not null default 0 check (health_score >= 0 and health_score <= 100),
  deadline date null,
  status text not null default 'active' check (status in ('active', 'completed', 'paused', 'cancelled')),
  source_report_id uuid null references public.reports(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists goal_nodes_user_id_idx
  on public.goal_nodes(user_id);

create index if not exists goal_nodes_status_idx
  on public.goal_nodes(user_id, status);

alter table public.goal_nodes enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'goal_nodes'
      and policyname = 'Users manage own goals'
  ) then
    create policy "Users manage own goals"
      on public.goal_nodes
      for all
      to authenticated
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'goal_nodes'
      and policyname = 'Service role bypass'
  ) then
    create policy "Service role bypass"
      on public.goal_nodes
      for all
      to service_role
      using (true)
      with check (true);
  end if;
end $$;
