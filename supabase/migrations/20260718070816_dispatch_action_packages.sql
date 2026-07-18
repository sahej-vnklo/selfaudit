alter table public.pending_actions
  add column if not exists source_type text,
  add column if not exists source_id text,
  add column if not exists source_label text,
  add column if not exists objective text,
  add column if not exists evidence_snapshot jsonb not null default '{}'::jsonb,
  add column if not exists owner_label text,
  add column if not exists destination_label text,
  add column if not exists approval_boundary text,
  add column if not exists artifact_bundle jsonb not null default '[]'::jsonb,
  add column if not exists priority text,
  add column if not exists source_created_at timestamptz;

create index if not exists pending_actions_user_source_idx
  on public.pending_actions (user_id, source_type, source_id, created_at desc);

create index if not exists pending_actions_user_updated_idx
  on public.pending_actions (user_id, updated_at desc);

comment on column public.pending_actions.source_type is
  'Originating SelfAudit surface: sentinel, counsel, foresight, or audit.';

comment on column public.pending_actions.approval_boundary is
  'Plain-language description of exactly what approval will and will not execute.';
