-- Requires pg_net extension (enabled by default on Supabase)
create extension if not exists pg_net with schema extensions;

-- Function: fires after INSERT on public.profiles
create or replace function public.notify_attio_on_signup()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  _edge_url text;
  _service_key text;
  _payload jsonb;
begin
  _edge_url    := 'https://spinhhzpboojmpndaxue.supabase.co/functions/v1/sync-to-attio';
  _service_key := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNwaW5oaHpwYm9vam1wbmRheHVlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzA2ODg1MCwiZXhwIjoyMDkyNjQ0ODUwfQ.doCtW3vG9H_YRzxujXdYfnwZhdH4VlD910rIHOumGO8';

  _payload := jsonb_build_object(
    'id',         NEW.id,
    'email',      NEW.email,
    'name',       coalesce(NEW.name, ''),
    'industry',   NEW.industry,
    'domain',     NEW.domain,
    'tier',       NEW.tier,
    'created_at', NEW.created_at
  );

  perform net.http_post(
    url     := _edge_url,
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer ' || _service_key
    ),
    body    := _payload
  );

  return NEW;
end;
$$;

-- Trigger: after each new profile row
drop trigger if exists trg_attio_sync on public.profiles;
create trigger trg_attio_sync
  after insert on public.profiles
  for each row
  execute function public.notify_attio_on_signup();
