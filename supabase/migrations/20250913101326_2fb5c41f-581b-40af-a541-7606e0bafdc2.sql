-- Create user roles enum
create type public.app_role as enum ('student', 'admin');

-- Create profiles table
create table public.profiles (
  id uuid not null default gen_random_uuid() primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  email text not null,
  phone text,
  date_of_birth date,
  address text,
  profile_picture_url text,
  is_blocked boolean default false,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  unique(user_id)
);

-- Create user_roles table
create table public.user_roles (
  id uuid not null default gen_random_uuid() primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  role app_role not null default 'student',
  created_at timestamp with time zone not null default now(),
  unique(user_id)
);

-- Create courses table
create table public.courses (
  id uuid not null default gen_random_uuid() primary key,
  name text not null,
  code text not null unique,
  description text,
  is_active boolean default true,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

-- Create feedback table
create table public.feedback (
  id uuid not null default gen_random_uuid() primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  rating integer not null check (rating >= 1 and rating <= 5),
  message text not null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

-- Enable Row Level Security
alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.courses enable row level security;
alter table public.feedback enable row level security;

-- Create security definer function for role checking
create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = _user_id
      and role = _role
  )
$$;

-- RLS Policies for profiles
create policy "Users can view their own profile"
on public.profiles for select
using (auth.uid() = user_id);

create policy "Users can update their own profile"
on public.profiles for update
using (auth.uid() = user_id);

create policy "Users can insert their own profile"
on public.profiles for insert
with check (auth.uid() = user_id);

create policy "Admins can view all profiles"
on public.profiles for select
using (public.has_role(auth.uid(), 'admin'));

create policy "Admins can update all profiles"
on public.profiles for update
using (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for user_roles
create policy "Users can view their own role"
on public.user_roles for select
using (auth.uid() = user_id);

create policy "System can assign roles"
on public.user_roles for insert
with check (true);

-- RLS Policies for courses
create policy "Everyone can view active courses"
on public.courses for select
using (is_active = true or public.has_role(auth.uid(), 'admin'));

create policy "Admins can manage courses"
on public.courses for all
using (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for feedback
create policy "Users can view their own feedback"
on public.feedback for select
using (auth.uid() = user_id);

create policy "Users can create feedback"
on public.feedback for insert
with check (auth.uid() = user_id);

create policy "Users can update their own feedback"
on public.feedback for update
using (auth.uid() = user_id);

create policy "Users can delete their own feedback"
on public.feedback for delete
using (auth.uid() = user_id);

create policy "Admins can view all feedback"
on public.feedback for select
using (public.has_role(auth.uid(), 'admin'));

-- Create function to handle new user registration
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
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

-- Trigger for new user registration
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Create function to update timestamps
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Create triggers for automatic timestamp updates
create trigger update_profiles_updated_at
  before update on public.profiles
  for each row
  execute function public.update_updated_at_column();

create trigger update_courses_updated_at
  before update on public.courses
  for each row
  execute function public.update_updated_at_column();

create trigger update_feedback_updated_at
  before update on public.feedback
  for each row
  execute function public.update_updated_at_column();

-- Create storage bucket for profile pictures
insert into storage.buckets (id, name, public) values ('profile-pictures', 'profile-pictures', true);

-- Storage policies for profile pictures
create policy "Users can view profile pictures"
on storage.objects for select
using (bucket_id = 'profile-pictures');

create policy "Users can upload their own profile pictures"
on storage.objects for insert
with check (bucket_id = 'profile-pictures' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can update their own profile pictures"
on storage.objects for update
using (bucket_id = 'profile-pictures' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can delete their own profile pictures"
on storage.objects for delete
using (bucket_id = 'profile-pictures' and auth.uid()::text = (storage.foldername(name))[1]);

-- Insert some sample courses
insert into public.courses (name, code, description) values
  ('Introduction to Computer Science', 'CS101', 'Fundamentals of computer science and programming'),
  ('Data Structures and Algorithms', 'CS201', 'Advanced data structures and algorithmic thinking'),
  ('Database Systems', 'CS301', 'Database design, SQL, and database management systems'),
  ('Web Development', 'CS350', 'Full-stack web development with modern frameworks'),
  ('Machine Learning', 'CS401', 'Introduction to machine learning and AI concepts'),
  ('Software Engineering', 'CS302', 'Software development lifecycle and best practices');

-- Create function for role assignment (used by the auth hook)
create or replace function public.assign_role_if_missing(user_id uuid, role_name text)
returns void
language plpgsql
security definer
as $$
begin
  insert into public.user_roles (user_id, role)
  values (user_id, role_name::app_role)
  on conflict (user_id) do nothing;
end;
$$;