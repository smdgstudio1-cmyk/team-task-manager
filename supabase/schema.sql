-- Lumen Studio — single-admin schema
-- Run this once in your Supabase project's SQL Editor (Database → SQL Editor → New query)
-- for a BRAND NEW project. If you already applied the original multi-user
-- schema, use supabase/migrations/002_single_admin.sql instead.

create extension if not exists "pgcrypto";

-- ============================================================================
-- ADMIN IDENTITY
-- Exactly one row: the studio manager's Supabase Auth account. Every RLS
-- policy in this file checks against this single row — there is no
-- multi-user auth system, no sign-up flow, and no roles to manage.
-- ============================================================================
create table public.admin_user (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique references auth.users(id) on delete cascade,
  email text not null,
  created_at timestamptz not null default now()
);

-- The first (and only) person to ever sign in becomes the admin.
create function public.handle_new_admin_signup()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (select 1 from public.admin_user) then
    insert into public.admin_user (auth_user_id, email) values (new.id, new.email);
  end if;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_admin_signup();

create function public.is_admin_user()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (select 1 from public.admin_user where auth_user_id = auth.uid());
$$;

-- ============================================================================
-- TEAM MEMBERS
-- Internal organizational records only. No login, no email, no password —
-- ever. Only the admin can create, edit, assign to, or archive them.
-- ============================================================================
create table public.team_members (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  title text,
  avatar_url text,
  archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================================
-- FOLDERS (self-referencing for subfolders)
-- owner_id is optional: a folder can belong to a specific team member's
-- workspace, or be a general/studio-wide project with no single owner.
-- ============================================================================
create table public.folders (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  owner_id uuid references public.team_members(id) on delete set null,
  parent_folder_id uuid references public.folders(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index folders_owner_id_idx on public.folders(owner_id);
create index folders_parent_folder_id_idx on public.folders(parent_folder_id);

-- ============================================================================
-- TASK LISTS
-- ============================================================================
create table public.task_lists (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  folder_id uuid not null references public.folders(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index task_lists_folder_id_idx on public.task_lists(folder_id);

-- ============================================================================
-- TASKS
-- ============================================================================
create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  assigned_user_id uuid references public.team_members(id) on delete set null,
  folder_id uuid not null references public.folders(id) on delete cascade,
  task_list_id uuid references public.task_lists(id) on delete set null,
  status text not null default 'Not Started' check (
    status in ('Not Started', 'In Progress', 'Waiting / Blocked', 'In Review', 'Completed')
  ),
  priority text not null default 'Medium' check (priority in ('Low', 'Medium', 'High', 'Urgent')),
  start_date date,
  deadline timestamptz,
  completed_at timestamptz,
  notes text,
  position int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index tasks_folder_id_idx on public.tasks(folder_id);
create index tasks_task_list_id_idx on public.tasks(task_list_id);
create index tasks_assigned_user_id_idx on public.tasks(assigned_user_id);
create index tasks_status_idx on public.tasks(status);
create index tasks_deadline_idx on public.tasks(deadline);

-- ============================================================================
-- updated_at MAINTENANCE
-- ============================================================================
create function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger team_members_set_updated_at before update on public.team_members
  for each row execute function public.set_updated_at();
create trigger folders_set_updated_at before update on public.folders
  for each row execute function public.set_updated_at();
create trigger task_lists_set_updated_at before update on public.task_lists
  for each row execute function public.set_updated_at();
create trigger tasks_set_updated_at before update on public.tasks
  for each row execute function public.set_updated_at();

-- ============================================================================
-- completed_at MAINTENANCE
-- ============================================================================
create function public.set_completed_at()
returns trigger
language plpgsql
as $$
begin
  if new.status = 'Completed' then
    if tg_op = 'INSERT' or old.status is distinct from 'Completed' then
      new.completed_at = coalesce(new.completed_at, now());
    end if;
  else
    new.completed_at = null;
  end if;
  return new;
end;
$$;

create trigger tasks_set_completed_at before insert or update on public.tasks
  for each row execute function public.set_completed_at();

-- ============================================================================
-- ROW LEVEL SECURITY
-- Single rule everywhere: you must be the recorded admin. No exceptions,
-- no per-owner logic — there is only one person who can ever be signed in.
-- ============================================================================
alter table public.admin_user enable row level security;
alter table public.team_members enable row level security;
alter table public.folders enable row level security;
alter table public.task_lists enable row level security;
alter table public.tasks enable row level security;

create policy admin_user_select_self on public.admin_user
  for select using (auth_user_id = auth.uid());

create policy team_members_all on public.team_members
  for all using (public.is_admin_user()) with check (public.is_admin_user());

create policy folders_all on public.folders
  for all using (public.is_admin_user()) with check (public.is_admin_user());

create policy task_lists_all on public.task_lists
  for all using (public.is_admin_user()) with check (public.is_admin_user());

create policy tasks_all on public.tasks
  for all using (public.is_admin_user()) with check (public.is_admin_user());

-- ============================================================================
-- REALTIME (so the dashboard updates live as you edit tasks/folders)
-- ============================================================================
alter publication supabase_realtime add table public.tasks;
alter publication supabase_realtime add table public.folders;
alter publication supabase_realtime add table public.team_members;

-- ============================================================================
-- IMPORTANT MANUAL STEP (Supabase dashboard, not SQL):
-- Authentication → Providers → Email → turn OFF "Allow new users to sign up"
-- once you've created your one admin account. The app has no sign-up page,
-- but this closes the signup API entirely as defense in depth.
-- ============================================================================
