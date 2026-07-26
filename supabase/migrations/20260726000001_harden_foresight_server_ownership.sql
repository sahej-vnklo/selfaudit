revoke update, truncate, trigger, references
  on table public.foresight_runs
  from service_role;

drop policy if exists "Users insert own foresight scenarios"
  on public.foresight_scenarios;

drop policy if exists "Users update own foresight scenarios"
  on public.foresight_scenarios;
