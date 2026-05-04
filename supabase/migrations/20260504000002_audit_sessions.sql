-- audit_sessions: one row per completed audit session
create table if not exists public.audit_sessions (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid references auth.users(id) on delete cascade,
  session_id        uuid not null,
  goal_input        text,
  industry          text,
  domain            text,
  conversation_mode text,
  created_at        timestamptz not null default now()
);

alter table public.audit_sessions enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies where tablename = 'audit_sessions' and policyname = 'Users can read own audit sessions'
  ) then
    create policy "Users can read own audit sessions"
      on public.audit_sessions for select
      using (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies where tablename = 'audit_sessions' and policyname = 'Users can insert own audit sessions'
  ) then
    create policy "Users can insert own audit sessions"
      on public.audit_sessions for insert
      with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies where tablename = 'audit_sessions' and policyname = 'Users can update own audit sessions'
  ) then
    create policy "Users can update own audit sessions"
      on public.audit_sessions for update
      using (auth.uid() = user_id);
  end if;
end $$;

-- audit_messages: full conversation log linked to a session
create table if not exists public.audit_messages (
  id         uuid primary key default gen_random_uuid(),
  session_id uuid not null,
  role       text not null check (role in ('user', 'assistant')),
  content    text not null,
  created_at timestamptz not null default now()
);

alter table public.audit_messages enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies where tablename = 'audit_messages' and policyname = 'Users can read own audit messages'
  ) then
    create policy "Users can read own audit messages"
      on public.audit_messages for select
      using (
        session_id in (
          select session_id from public.audit_sessions where user_id = auth.uid()
        )
      );
  end if;

  if not exists (
    select 1 from pg_policies where tablename = 'audit_messages' and policyname = 'Users can insert own audit messages'
  ) then
    create policy "Users can insert own audit messages"
      on public.audit_messages for insert
      with check (
        session_id in (
          select session_id from public.audit_sessions where user_id = auth.uid()
        )
      );
  end if;
end $$;
