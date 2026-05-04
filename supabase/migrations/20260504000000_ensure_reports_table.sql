-- Ensure reports table exists with all required columns
create table if not exists public.reports (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid references auth.users(id) on delete cascade,
  session_id        uuid,
  report_data       jsonb,
  industry          text,
  domain            text,
  conversation_mode text,
  headline          text,
  -- legacy columns kept for dashboard compatibility
  title             text,
  content           text,
  domains           text[],
  created_at        timestamptz not null default now()
);

-- Add any missing columns to an existing table
alter table public.reports add column if not exists session_id        uuid;
alter table public.reports add column if not exists report_data       jsonb;
alter table public.reports add column if not exists industry          text;
alter table public.reports add column if not exists domain            text;
alter table public.reports add column if not exists conversation_mode text;
alter table public.reports add column if not exists headline          text;

-- RLS
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
