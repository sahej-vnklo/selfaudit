alter table public.area_metric_snapshots
  add column if not exists schema_version text;

alter table public.business_health_checks
  add column if not exists schema_version text;

alter table public.company_schemas
  add column if not exists schema_version text;
