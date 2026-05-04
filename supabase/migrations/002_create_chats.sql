create table if not exists public.chats (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references auth.users(id) on delete cascade,
  session_id uuid,
  role       text not null,
  message    text not null,
  created_at timestamptz not null default now()
);

alter table public.chats enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies where tablename = 'chats' and policyname = 'Users can select own chats'
  ) then
    create policy "Users can select own chats"
      on public.chats for select
      using (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies where tablename = 'chats' and policyname = 'Users can insert own chats'
  ) then
    create policy "Users can insert own chats"
      on public.chats for insert
      with check (auth.uid() = user_id);
  end if;
end $$;
