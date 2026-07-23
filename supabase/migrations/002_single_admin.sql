-- Migration: single-admin access + internal-only team members
-- Run this once in your Supabase SQL Editor against a database that already
-- has the original supabase/schema.sql applied.
--
-- What this does, IN DEPENDENCY-SAFE ORDER:
--   1. Creates admin_user + team_members, migrates existing data across
--   2. Repoints folders.owner_id / tasks.assigned_user_id at team_members
--   3. Drops the OLD RLS policies first (they're what reference the old
--      helper functions — this must happen before those functions can drop)
--   4. Drops the old notification system and old helper functions/triggers
--   5. Creates the new single-admin helper function + bootstrap trigger
--   6. Drops the old profiles table
--   7. Creates the new RLS policies for every table
--
-- Your existing admin account (the first person who signed up) is carried
-- over automatically — nothing about your login changes. No task, folder,
-- or task_list data is deleted.
--
-- Safe to re-run: every step is guarded with IF EXISTS / IF NOT EXISTS /
-- ON CONFLICT so re-running after a partial failure won't error or duplicate
-- data.

-- ============================================================================
-- 1. Admin identity + team member roster (create + migrate data)
-- ============================================================================
create table if not exists public.admin_user (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique references auth.users(id) on delete cascade,
  email text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.team_members (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  title text,
  avatar_url text,
  archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Migrate the existing admin (first profile with role='admin') into admin_user,
-- only if profiles still exists and admin_user is still empty.
do $$
begin
  if to_regclass('public.profiles') is not null
     and not exists (select 1 from public.admin_user) then
    insert into public.admin_user (auth_user_id, email)
    select auth_user_id, email
    from public.profiles
    where auth_user_id is not null and role = 'admin'
    limit 1;
  end if;
end $$;

-- Migrate any existing non-admin profiles into team_members (id preserved so
-- existing folders/tasks that reference them keep working after the FK swap).
do $$
begin
  if to_regclass('public.profiles') is not null then
    insert into public.team_members (id, name, created_at)
    select id, name, created_at
    from public.profiles
    where role = 'member'
    on conflict (id) do nothing;
  end if;
end $$;

drop trigger if exists team_members_set_updated_at on public.team_members;
create trigger team_members_set_updated_at before update on public.team_members
  for each row execute function public.set_updated_at();

-- ============================================================================
-- 2. Repoint folders and tasks at team_members instead of profiles
--    Safety net: if any folder/task pointed at a profile that was never a
--    team member (e.g. the admin's own old profile row), clear that link
--    rather than erroring — nothing gets deleted, it just becomes
--    unassigned/general.
-- ============================================================================
alter table public.folders alter column owner_id drop not null;

update public.folders set owner_id = null
where owner_id is not null and owner_id not in (select id from public.team_members);

alter table public.folders drop constraint if exists folders_owner_id_fkey;
alter table public.folders add constraint folders_owner_id_fkey
  foreign key (owner_id) references public.team_members(id) on delete set null;

update public.tasks set assigned_user_id = null
where assigned_user_id is not null and assigned_user_id not in (select id from public.team_members);

alter table public.tasks drop constraint if exists tasks_assigned_user_id_fkey;
alter table public.tasks add constraint tasks_assigned_user_id_fkey
  foreign key (assigned_user_id) references public.team_members(id) on delete set null;

-- ============================================================================
-- 3. Drop OLD policies FIRST — they're what depend on the old helper
--    functions (current_profile_id / is_admin), so this must come before
--    step 4 drops those functions, or Postgres refuses the DROP FUNCTION.
-- ============================================================================
drop policy if exists profiles_select_all on public.profiles;
drop policy if exists profiles_insert_admin on public.profiles;
drop policy if exists profiles_update_self_or_admin on public.profiles;
drop policy if exists profiles_delete_admin on public.profiles;
drop policy if exists folders_select on public.folders;
drop policy if exists folders_insert on public.folders;
drop policy if exists folders_update on public.folders;
drop policy if exists folders_delete on public.folders;
drop policy if exists task_lists_select on public.task_lists;
drop policy if exists task_lists_insert on public.task_lists;
drop policy if exists task_lists_update on public.task_lists;
drop policy if exists task_lists_delete on public.task_lists;
drop policy if exists tasks_select on public.tasks;
drop policy if exists tasks_insert on public.tasks;
drop policy if exists tasks_update on public.tasks;
drop policy if exists tasks_delete on public.tasks;

-- ============================================================================
-- 4. Remove the multi-user notification system and old auth/RLS helpers
--    (safe now — nothing references them anymore)
-- ============================================================================
drop trigger if exists tasks_notify_assigned on public.tasks;
drop trigger if exists tasks_notify_status_changed on public.tasks;
drop trigger if exists tasks_notify_note_added on public.tasks;
drop function if exists public.notify_task_assigned();
drop function if exists public.notify_task_status_changed();
drop function if exists public.notify_task_note_added();
drop table if exists public.notifications;

drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();
drop function if exists public.current_profile_id();
drop function if exists public.is_admin();

-- ============================================================================
-- 5. New single-admin helpers
-- ============================================================================
create or replace function public.handle_new_admin_signup()
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

create or replace function public.is_admin_user()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (select 1 from public.admin_user where auth_user_id = auth.uid());
$$;

-- ============================================================================
-- 6. Drop the old profiles table (its policies are already gone, and
--    folders/tasks no longer reference it after step 2)
-- ============================================================================
drop table if exists public.profiles;

-- ============================================================================
-- 7. New RLS: every table requires the single admin, nothing else
-- ============================================================================
alter table public.admin_user enable row level security;
alter table public.team_members enable row level security;
alter table public.folders enable row level security;
alter table public.task_lists enable row level security;
alter table public.tasks enable row level security;

drop policy if exists admin_user_select_self on public.admin_user;
create policy admin_user_select_self on public.admin_user
  for select using (auth_user_id = auth.uid());

drop policy if exists team_members_all on public.team_members;
create policy team_members_all on public.team_members
  for all using (public.is_admin_user()) with check (public.is_admin_user());

drop policy if exists folders_all on public.folders;
create policy folders_all on public.folders
  for all using (public.is_admin_user()) with check (public.is_admin_user());

drop policy if exists task_lists_all on public.task_lists;
create policy task_lists_all on public.task_lists
  for all using (public.is_admin_user()) with check (public.is_admin_user());

drop policy if exists tasks_all on public.tasks;
create policy tasks_all on public.tasks
  for all using (public.is_admin_user()) with check (public.is_admin_user());

-- ============================================================================
-- 8. Realtime
-- ============================================================================
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'team_members'
  ) then
    alter publication supabase_realtime add table public.team_members;
  end if;
end $$;

-- ============================================================================
-- IMPORTANT MANUAL STEP (Supabase dashboard, not SQL):
-- Authentication → Providers → Email → turn OFF "Allow new users to sign up".
-- The app no longer has a sign-up page, but this closes the door completely
-- so no one can create a second account via the API directly. Even without
-- this step, a stray second account would get zero data access — every RLS
-- policy above only grants access to whoever is recorded in admin_user.
-- ============================================================================
