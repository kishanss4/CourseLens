-- Fix security warnings by updating functions with proper search_path

-- Update the handle_new_user function
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer 
set search_path = public
as $$
begin
  -- Insert profile
  insert into public.profiles (user_id, name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.email),
    new.email
  );
  
  -- Insert role
  insert into public.user_roles (user_id, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'role', 'student')::app_role
  );
  
  return new;
end;
$$;

-- Update the update_updated_at_column function
create or replace function public.update_updated_at_column()
returns trigger 
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;