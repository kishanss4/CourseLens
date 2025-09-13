-- Fix the last security warning for the assign_role_if_missing function
create or replace function public.assign_role_if_missing(user_id uuid, role_name text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.user_roles (user_id, role)
  values (user_id, role_name::app_role)
  on conflict (user_id) do nothing;
end;
$$;