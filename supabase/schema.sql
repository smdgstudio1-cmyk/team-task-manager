-- Lumen Studio — single-admin schema (current target state)
-- Run this once in your Supabase project's SQL Editor (Database → SQL Editor → New query)
-- for a BRAND NEW project only.
--
-- If you already have a project running Lumen Studio, do NOT run this file —
-- apply the incremental migrations in supabase/migrations/ instead, in order:
--   002_single_admin.sql        (multi-user -> single admin + team_members)
--   003_task_workspace.sql      (attachments, notes, activity, notifications)
--   004_notification_dedupe.sql (unique constraint to prevent duplicate alerts)

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
  archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index tasks_folder_id_idx on public.tasks(folder_id);
create index tasks_task_list_id_idx on public.tasks(task_list_id);
create index tasks_assigned_user_id_idx on public.tasks(assigned_user_id);
create index tasks_status_idx on public.tasks(status);
create index tasks_deadline_idx on public.tasks(deadline);
create index tasks_archived_idx on public.tasks(archived);

-- ============================================================================
-- TASK ATTACHMENTS, NOTES, ACTIVITY, NOTIFICATIONS
-- ============================================================================
create table public.task_attachments (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  file_name text not null,
  file_path text not null,
  file_size bigint not null,
  mime_type text,
  created_at timestamptz not null default now()
);
create index task_attachments_task_id_idx on public.task_attachments(task_id);

create table public.task_notes (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index task_notes_task_id_idx on public.task_notes(task_id);

create table public.task_activity (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  type text not null,
  message text not null,
  created_at timestamptz not null default now()
);
create index task_activity_task_id_idx on public.task_activity(task_id);

-- Single-admin notifications: deadline + staleness alerts only, no user_id
-- needed since there is only ever one authorized reader.
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('due_today', 'due_tomorrow', 'due_soon', 'overdue', 'stale_blocked')),
  message text not null,
  related_task_id uuid references public.tasks(id) on delete cascade,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);
create index notifications_is_read_idx on public.notifications(is_read);
create index notifications_related_task_id_idx on public.notifications(related_task_id);

-- A task should only ever have one notification of a given type. Enforced
-- here (not just client-side) so a race between two loads can't duplicate.
create unique index notifications_task_type_unique
  on public.notifications(related_task_id, type)
  where related_task_id is not null;

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
create trigger task_notes_set_updated_at before update on public.task_notes
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
-- ACTIVITY LOGGING (server-side, so nothing can bypass it)
-- ============================================================================
create function public.log_task_activity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.task_activity (task_id, type, message) values (new.id, 'created', 'Task created');
    return new;
  end if;

  if new.status is distinct from old.status then
    if new.status = 'Completed' then
      insert into public.task_activity (task_id, type, message) values (new.id, 'completed', 'Marked as completed');
    else
      insert into public.task_activity (task_id, type, message) values (new.id, 'status_changed', 'Status changed to "' || new.status || '"');
    end if;
  end if;

  if new.deadline is distinct from old.deadline then
    insert into public.task_activity (task_id, type, message)
    values (
      new.id,
      'deadline_changed',
      case when new.deadline is null then 'Deadline removed' else 'Deadline set to ' || to_char(new.deadline, 'Mon DD, YYYY') end
    );
  end if;

  if new.priority is distinct from old.priority then
    insert into public.task_activity (task_id, type, message) values (new.id, 'priority_changed', 'Priority changed to ' || new.priority);
  end if;

  if new.assigned_user_id is distinct from old.assigned_user_id then
    insert into public.task_activity (task_id, type, message)
    values (new.id, 'assignment_changed', case when new.assigned_user_id is null then 'Unassigned' else 'Reassigned' end);
  end if;

  if new.archived is distinct from old.archived and new.archived then
    insert into public.task_activity (task_id, type, message) values (new.id, 'archived', 'Task archived');
  end if;

  return new;
end;
$$;

create trigger tasks_log_activity after insert or update on public.tasks
  for each row execute function public.log_task_activity();

create function public.log_attachment_activity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.task_activity (task_id, type, message) values (new.task_id, 'attachment_added', 'Attached ' || new.file_name);
  return new;
end;
$$;

create trigger task_attachments_log_activity after insert on public.task_attachments
  for each row execute function public.log_attachment_activity();

create function public.log_note_activity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.task_activity (task_id, type, message) values (new.task_id, 'note_added', 'Note added');
  return new;
end;
$$;

create trigger task_notes_log_activity after insert on public.task_notes
  for each row execute function public.log_note_activity();

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
alter table public.task_attachments enable row level security;
alter table public.task_notes enable row level security;
alter table public.task_activity enable row level security;
alter table public.notifications enable row level security;

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

create policy task_attachments_all on public.task_attachments
  for all using (public.is_admin_user()) with check (public.is_admin_user());

create policy task_notes_all on public.task_notes
  for all using (public.is_admin_user()) with check (public.is_admin_user());

create policy task_activity_all on public.task_activity
  for all using (public.is_admin_user()) with check (public.is_admin_user());

create policy notifications_all on public.notifications
  for all using (public.is_admin_user()) with check (public.is_admin_user());

-- ============================================================================
-- PRIVATE STORAGE BUCKET FOR ATTACHMENTS
-- ============================================================================
insert into storage.buckets (id, name, public) values ('task-attachments', 'task-attachments', false);

create policy task_attachments_storage_all on storage.objects
  for all using (bucket_id = 'task-attachments' and public.is_admin_user())
  with check (bucket_id = 'task-attachments' and public.is_admin_user());

-- ============================================================================
-- REALTIME (so the dashboard updates live as you edit tasks/folders)
-- ============================================================================
alter publication supabase_realtime add table public.tasks;
alter publication supabase_realtime add table public.folders;
alter publication supabase_realtime add table public.team_members;
alter publication supabase_realtime add table public.notifications;
alter publication supabase_realtime add table public.task_activity;

-- ============================================================================
-- IMPORTANT MANUAL STEP (Supabase dashboard, not SQL):
-- Authentication → Providers → Email → turn OFF "Allow new users to sign up"
-- once you've created your one admin account. The app has no sign-up page,
-- but this closes the signup API entirely as defense in depth.
-- ============================================================================
