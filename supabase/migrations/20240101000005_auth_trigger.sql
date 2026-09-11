-- Auto-provision an organization + owner profile when a new auth user signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
as $$
declare
  org_id uuid;
begin
  insert into public.organizations (name) values (
    case
      when new.raw_user_meta_data->>'full_name' is not null
      then (new.raw_user_meta_data->>'full_name') || ' business'
      else coalesce(new.email, 'User') || ' business'
    end
  ) returning id into org_id;

  insert into public.profiles (id, org_id, email, full_name, role)
  values (
    new.id,
    org_id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    'owner'
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();
