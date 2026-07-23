-- Migration: task workspace features — attachments, notes, activity, notifications
-- Run this once in your Supabase SQL Editor. Safe to re-run (all guarded).
--
-- Adds:
--   - tasks.archived column
--   - task_attachments (private Supabase Storage bucket "task-attachments")
--   - task_notes
--   - task_activity (auto-logged via triggers on tasks/attachments/notes)
--   - notifications (redesigned for a single admin — deadline alerts only,
--     no user_id needed since there is only ever one authorized reader)
--
-- Every new table is admin-only via RLS, same pattern as the rest of the app.
-- No existing data is touched or deleted.

-- ============================================================================
-- 1. tasks.archived
-- ============================================================================
alter table public.tasks add column if not exists archived boolean not null default false;
create index if not exists tasks_archived_idx on public.tasks(archived);

-- ============================================================================
-- 2. Attachments
-- ============================================================================
create table if not exists public.task_attachments (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  file_name text not null,
  file_path text not null,
  file_size bigint not null,
  mime_type text,
  created_at timestamptz not null default now()
);
create index if not exists task_attachments_task_id_idx on public.task_attachments(task_id);

-- ============================================================================
-- 3. Notes
-- ============================================================================
create table if not exists public.task_notes (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists task_notes_task_id_idx on public.task_notes(task_id);

drop trigger if exists task_notes_set_updated_at on public.task_notes;
create trigger task_notes_set_updated_at before update on public.task_notes
  for each row execute function public.set_updated_at();

-- ============================================================================
-- 4. Activity log
-- ============================================================================
create table if not exists public.task_activity (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  type text not null,
  message text not null,
  created_at timestamptz not null default now()
);
create index if not exists task_activity_task_id_idx on public.task_activity(task_id);

-- ============================================================================
-- 5. Notifications (single-admin: deadline + staleness alerts only)
-- ============================================================================
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('due_today', 'due_tomorrow', 'due_soon', 'overdue', 'stale_blocked')),
  message text not null,
  related_task_id uuid references public.tasks(id) on delete cascade,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists notifications_is_read_idx on public.notifications(is_read);
create index if not exists notifications_related_task_id_idx on public.notifications(related_task_id);

-- ============================================================================
-- 6. RLS — same admin-only pattern as every other table
-- ============================================================================
alter table public.task_attachments enable row level security;
alter table public.task_notes enable row level security;
alter table public.task_activity enable row level security;
alter table public.notifications enable row level security;

drop policy if exists task_attachments_all on public.task_attachments;
create policy task_attachments_all on public.task_attachments
  for all using (public.is_admin_user()) with check (public.is_admin_user());

drop policy if exists task_notes_all on public.task_notes;
create policy task_notes_all on public.task_notes
  for all using (public.is_admin_user()) with check (public.is_admin_user());

drop policy if exists task_activity_all on public.task_activity;
create policy task_activity_all on public.task_activity
  for all using (public.is_admin_user()) with check (public.is_admin_user());

drop policy if exists notifications_all on public.notifications;
create policy notifications_all on public.notifications
  for all using (public.is_admin_user()) with check (public.is_admin_user());

-- ============================================================================
-- 7. Activity logging triggers (server-side, so nothing can bypass them)
-- ============================================================================
create or replace function public.log_task_activity()
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

drop trigger if exists tasks_log_activity on public.tasks;
create trigger tasks_log_activity after insert or update on public.tasks
  for each row execute function public.log_task_activity();

create or replace function public.log_attachment_activity()
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

drop trigger if exists task_attachments_log_activity on public.task_attachments;
create trigger task_attachments_log_activity after insert on public.task_attachments
  for each row execute function public.log_attachment_activity();

create or replace function public.log_note_activity()
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

drop trigger if exists task_notes_log_activity on public.task_notes;
create trigger task_notes_log_activity after insert on public.task_notes
  for each row execute function public.log_note_activity();

-- ============================================================================
-- 8. Private storage bucket for attachments
-- ============================================================================
insert into storage.buckets (id, name, public)
values ('task-attachments', 'task-attachments', false)
on conflict (id) do nothing;

drop policy if exists task_attachments_storage_all on storage.objects;
create policy task_attachments_storage_all on storage.objects
  for all using (bucket_id = 'task-attachments' and public.is_admin_user())
  with check (bucket_id = 'task-attachments' and public.is_admin_user());

-- ============================================================================
-- 9. Realtime
-- ============================================================================
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'notifications'
  ) then
    alter publication supabase_realtime add table public.notifications;
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'task_activity'
  ) then
    alter publication supabase_realtime add table public.task_activity;
  end if;
end $$;
