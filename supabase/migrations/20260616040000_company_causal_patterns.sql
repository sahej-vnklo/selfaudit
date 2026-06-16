create table if not exists public.company_causal_patterns (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  from_metric text not null,
  to_metric text not null,
  weight numeric not null,
  support_count integer not null default 0,
  same_run_hits integer not null default 0,
  lag_1_hits integer not null default 0,
  contradictions integer not null default 0,
  lag_hint integer,
  pattern_type text not null default 'edge_weight',
  narrative text,
  last_computed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, from_metric, to_metric, pattern_type)
);

alter table public.company_causal_patterns enable row level security;

create policy "Users can read own patterns"
  on public.company_causal_patterns for select
  using (auth.uid() = user_id);

create policy "Service role manages patterns"
  on public.company_causal_patterns for all
  using (true)
  with check (true);
