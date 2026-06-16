create table if not exists public.pending_actions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  artifact_id uuid references public.artifacts(id) on delete set null,
  action_type text not null,
  tool_slug text not null,
  connector text not null,
  title text,
  staged_args jsonb not null default '{}'::jsonb,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.pending_actions enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'pending_actions'
      and policyname = 'Users can manage own pending actions'
  ) then
    create policy "Users can manage own pending actions"
      on public.pending_actions
      for all
      to authenticated
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where tablename = 'pending_actions'
      and policyname = 'Service role full access to pending actions'
  ) then
    create policy "Service role full access to pending actions"
      on public.pending_actions
      for all
      to service_role
      using (true)
      with check (true);
  end if;
end $$;

create index if not exists pending_actions_user_status_idx
  on public.pending_actions (user_id, status, created_at desc);

create table if not exists public.execution_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  pending_action_id uuid references public.pending_actions(id) on delete set null,
  action_type text not null,
  tool_slug text not null,
  connector text not null,
  final_args jsonb not null default '{}'::jsonb,
  outcome text not null,
  composio_result jsonb,
  error_message text,
  executed_at timestamptz not null default now()
);

alter table public.execution_log enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'execution_log'
      and policyname = 'Users can view own execution log'
  ) then
    create policy "Users can view own execution log"
      on public.execution_log
      for select
      to authenticated
      using (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where tablename = 'execution_log'
      and policyname = 'Service role full access to execution log'
  ) then
    create policy "Service role full access to execution log"
      on public.execution_log
      for all
      to service_role
      using (true)
      with check (true);
  end if;
end $$;

create index if not exists execution_log_user_executed_idx
  on public.execution_log (user_id, executed_at desc);

do $$
declare
  artifact_constraint_name text;
begin
  select conname
  into artifact_constraint_name
  from pg_constraint
  where conrelid = 'public.artifacts'::regclass
    and contype = 'c'
    and pg_get_constraintdef(oid) like '%artifact_type%';

  if artifact_constraint_name is not null then
    execute format('alter table public.artifacts drop constraint %I', artifact_constraint_name);
  end if;

  alter table public.artifacts
    add constraint artifacts_artifact_type_check
    check (artifact_type in (
      'ACTION_PLAN',
      'SOP',
      'PROCESS_CHANGE',
      'PRICING_MODEL',
      'HIRING_BRIEF',
      'EMAIL',
      'INVESTOR_UPDATE',
      'TEAM_BRIEF'
    ));
end $$;
