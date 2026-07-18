create table if not exists public.counsel_threads (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  title      text not null,
  summary    text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists counsel_threads_user_updated_idx
  on public.counsel_threads (user_id, updated_at desc);

alter table public.counsel_threads enable row level security;

create table if not exists public.counsel_messages (
  id            uuid primary key default gen_random_uuid(),
  thread_id     uuid not null references public.counsel_threads(id) on delete cascade,
  user_id       uuid not null references auth.users(id) on delete cascade,
  role          text not null check (role in ('user', 'assistant')),
  content       text not null,
  response_data jsonb,
  sources       jsonb not null default '[]'::jsonb,
  created_at    timestamptz not null default now()
);

create index if not exists counsel_messages_thread_created_idx
  on public.counsel_messages (thread_id, created_at asc);

alter table public.counsel_messages enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'counsel_threads' and policyname = 'Users manage own Counsel threads') then
    create policy "Users manage own Counsel threads" on public.counsel_threads
      for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'counsel_messages' and policyname = 'Users manage own Counsel messages') then
    create policy "Users manage own Counsel messages" on public.counsel_messages
      for all to authenticated
      using (
        auth.uid() = user_id
        and exists (
          select 1 from public.counsel_threads
          where counsel_threads.id = counsel_messages.thread_id
            and counsel_threads.user_id = auth.uid()
        )
      )
      with check (
        auth.uid() = user_id
        and exists (
          select 1 from public.counsel_threads
          where counsel_threads.id = counsel_messages.thread_id
            and counsel_threads.user_id = auth.uid()
        )
      );
  end if;
end $$;
