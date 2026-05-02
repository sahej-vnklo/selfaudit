-- Fix handle_new_user trigger to never overwrite an existing profile row.
-- Without ON CONFLICT DO NOTHING, a retry or race condition could re-insert
-- with tier='essential' (the column default) and overwrite a tier already
-- written by the signup flow.
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
  )
  on conflict (id) do nothing;
  return new;
end;
$$;
