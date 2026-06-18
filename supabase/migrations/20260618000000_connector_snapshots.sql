-- connector_snapshots: stores the latest normalized connector data per user.
-- Populated by the 5:30 AM sync-connectors cron.
-- Read by the 6 AM intelligence synthesis and 8 AM health check cron.

create table if not exists connector_snapshots (
  id              uuid        primary key default gen_random_uuid(),
  user_id         uuid        not null references profiles(id) on delete cascade,
  normalized_data jsonb       not null default '{}',
  providers       text[]      not null default '{}',
  fetched_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create unique index if not exists connector_snapshots_user_id_idx
  on connector_snapshots (user_id);

alter table connector_snapshots enable row level security;

create policy "Service role has full access to connector_snapshots"
  on connector_snapshots
  using (true)
  with check (true);
