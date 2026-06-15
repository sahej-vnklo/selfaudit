-- Stores each user's compiled schema (industry + areas + unit types + causal links).
-- Built by api/lib/blueprint/schema-builder.js and read by the monitoring engine
-- on every governance run. One row per user — upsert replaces on re-onboarding.

create table if not exists company_schemas (
  user_id    text        primary key,
  schema     jsonb       not null,
  updated_at timestamptz not null default now()
);

-- Fast lookup by user_id (already the PK, but explicit index for jsonb ops)
create index if not exists idx_company_schemas_user_id on company_schemas (user_id);

-- Row-level security: users can only read and write their own schema
alter table company_schemas enable row level security;

create policy "Users can read their own schema"
  on company_schemas
  for select
  using (auth.uid()::text = user_id);

create policy "Users can upsert their own schema"
  on company_schemas
  for insert
  with check (auth.uid()::text = user_id);

create policy "Users can update their own schema"
  on company_schemas
  for update
  using (auth.uid()::text = user_id);

create policy "Users can delete their own schema"
  on company_schemas
  for delete
  using (auth.uid()::text = user_id);

-- Service role bypasses RLS (used by the monitoring engine server-side)
-- No additional grants needed — Supabase service role bypasses RLS by default.
