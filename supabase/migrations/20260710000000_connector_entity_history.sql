create table if not exists public.connector_entity_history (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  provider     text not null,
  entity_type  text not null,
  entity_id    text not null,
  label        text,
  dimensions   jsonb,
  synced_at    timestamptz not null,
  created_at   timestamptz not null default now()
);

create index if not exists connector_entity_history_user_entity_time_idx
  on public.connector_entity_history (user_id, entity_type, entity_id, synced_at desc);

alter table public.connector_entity_history enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'connector_entity_history'
      and policyname = 'Users can read own connector entity history'
  ) then
    create policy "Users can read own connector entity history"
      on public.connector_entity_history
      for select
      to authenticated
      using (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'connector_entity_history'
      and policyname = 'Service role full access to connector entity history'
  ) then
    create policy "Service role full access to connector entity history"
      on public.connector_entity_history
      for all
      to service_role
      using (true)
      with check (true);
  end if;
end $$;
