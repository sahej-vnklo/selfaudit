create table if not exists public.foresight_scenarios (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 160),
  scenario jsonb not null default '{}'::jsonb,
  result jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists foresight_scenarios_user_updated_idx
  on public.foresight_scenarios (user_id, updated_at desc);

alter table public.foresight_scenarios enable row level security;

grant select, insert, update, delete on table public.foresight_scenarios to authenticated;
grant select, insert, update, delete on table public.foresight_scenarios to service_role;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'foresight_scenarios'
      and policyname = 'Users select own foresight scenarios'
  ) then
    create policy "Users select own foresight scenarios"
      on public.foresight_scenarios for select
      to authenticated
      using ((select auth.uid()) = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'foresight_scenarios'
      and policyname = 'Users insert own foresight scenarios'
  ) then
    create policy "Users insert own foresight scenarios"
      on public.foresight_scenarios for insert
      to authenticated
      with check ((select auth.uid()) = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'foresight_scenarios'
      and policyname = 'Users update own foresight scenarios'
  ) then
    create policy "Users update own foresight scenarios"
      on public.foresight_scenarios for update
      to authenticated
      using ((select auth.uid()) = user_id)
      with check ((select auth.uid()) = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'foresight_scenarios'
      and policyname = 'Users delete own foresight scenarios'
  ) then
    create policy "Users delete own foresight scenarios"
      on public.foresight_scenarios for delete
      to authenticated
      using ((select auth.uid()) = user_id);
  end if;
end $$;
