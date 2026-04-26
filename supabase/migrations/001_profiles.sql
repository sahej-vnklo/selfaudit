-- User profiles table (extends Supabase auth.users)
create table public.profiles (
  id         uuid references auth.users on delete cascade primary key,
  email      text not null,
  name       text,
  tier       text not null default 'essential' check (tier in ('essential', 'business', 'portfolio', 'free', 'paid')),
  context    text,
  created_at timestamptz not null default now()
);

-- Row-level security
alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Auto-create profile row when a new user signs up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, name)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'name'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
