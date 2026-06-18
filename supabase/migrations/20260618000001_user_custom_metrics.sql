create table if not exists user_custom_metrics (
  id         uuid        primary key default gen_random_uuid(),
  user_id    uuid        not null references profiles(id) on delete cascade,
  area_id    text        not null,
  name       text        not null,
  value      numeric     not null,
  unit       text        not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists user_custom_metrics_user_area_idx
  on user_custom_metrics (user_id, area_id);

create unique index if not exists user_custom_metrics_upsert_idx
  on user_custom_metrics (user_id, area_id, name);

alter table user_custom_metrics enable row level security;

create policy "Users can manage their own custom metrics"
  on user_custom_metrics
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Service role has full access to user_custom_metrics"
  on user_custom_metrics
  using (true)
  with check (true);
