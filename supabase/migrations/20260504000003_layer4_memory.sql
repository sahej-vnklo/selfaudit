-- Layer 4: Memory + Compounding Intelligence

-- Status column on reports (for "Mark as done / Still open")
alter table public.reports
  add column if not exists status text default 'unknown';

-- Allow users to update their own report status
do $$
begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'reports' and policyname = 'Users can update own reports'
  ) then
    create policy "Users can update own reports"
      on public.reports for update
      using (auth.uid() = user_id);
  end if;
end $$;

-- Pattern tracking table (anonymous aggregate data — no user_id, no RLS needed)
create table if not exists public.patterns (
  id                uuid primary key default gen_random_uuid(),
  industry          text,
  domain            text,
  conversation_mode text,
  root_causes       text[],
  actions_given     text[],
  created_at        timestamptz not null default now()
);
