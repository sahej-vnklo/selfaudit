create table if not exists public.reports (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid references auth.users(id) on delete cascade,
  session_id        uuid,
  -- legacy fields kept for dashboard compatibility
  title             text,
  content           text,
  domains           text[],
  -- enriched fields
  report_data       jsonb,
  industry          text,
  domain            text,
  conversation_mode text,
  headline          text,
  created_at        timestamptz not null default now()
);

alter table public.reports enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies where tablename = 'reports' and policyname = 'Users can read own reports'
  ) then
    create policy "Users can read own reports"
      on public.reports for select
      using (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies where tablename = 'reports' and policyname = 'Users can insert own reports'
  ) then
    create policy "Users can insert own reports"
      on public.reports for insert
      with check (auth.uid() = user_id);
  end if;
end $$;
