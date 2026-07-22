-- Team Task Manager — full schema
-- Run this once in your Supabase project's SQL Editor (Database → SQL Editor → New query).

create extension if not exists "pgcrypto";

-- ============================================================================
-- PROFILES
-- profiles.id is the app-facing user id, independent from auth.users.id so an
-- admin can create a "team member" placeholder before that person ever signs
-- up. When someone signs up with a matching email, their auth account gets
-- linked to the existing profile instead of creating a duplicate.
-- ============================================================================
create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique references auth.users(id) on delete set null,
  name text not null,
  email text not null unique,
  avatar_url text,
  role text not null default 'member' check (role in ('admin', 'member')),
  created_at timestamptz not null default now()
);

create index profiles_auth_user_id_idx on public.profiles(auth_user_id);

-- ============================================================================
-- FOLDERS (self-referencing for subfolders)
-- ============================================================================
create table public.folders (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  owner_id uuid not null references public.profiles(id) on delete cascade,
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
  assigned_user_id uuid references public.profiles(id) on delete set null,
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
-- NOTIFICATIONS
-- ============================================================================
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null check (
    type in ('assigned', 'deadline_approaching', 'overdue', 'completed', 'status_changed', 'note_added')
  ),
  message text not null,
  related_task_id uuid references public.tasks(id) on delete cascade,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create index notifications_user_id_idx on public.notifications(user_id);
create index notifications_is_read_idx on public.notifications(is_read);

-- ============================================================================
-- HELPER FUNCTIONS (security definer so they can be used safely inside RLS)
-- ============================================================================
create function public.current_profile_id()
returns uuid
language sql
security definer
stable
set search_path = public
as $$
  select id from public.profiles where auth_user_id = auth.uid();
$$;

create function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.profiles where auth_user_id = auth.uid() and role = 'admin'
  );
$$;

-- ============================================================================
-- AUTH TRIGGER: link or create a profile whenever someone signs up
-- The very first person to ever sign up becomes admin (the project manager).
-- ============================================================================
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  existing_profile_id uuid;
  profile_count int;
begin
  select id into existing_profile_id
  from public.profiles
  where email = new.email and auth_user_id is null
  limit 1;

  if existing_profile_id is not null then
    update public.profiles set auth_user_id = new.id where id = existing_profile_id;
  else
    select count(*) into profile_count from public.profiles;
    insert into public.profiles (auth_user_id, name, email, role)
    values (
      new.id,
      coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
      new.email,
      case when profile_count = 0 then 'admin' else 'member' end
    );
  end if;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

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
-- NOTIFICATION TRIGGERS (security definer so RLS never blocks the insert)
-- ============================================================================
create function public.notify_task_assigned()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.assigned_user_id is not null and (
    tg_op = 'INSERT' or new.assigned_user_id is distinct from old.assigned_user_id
  ) then
    insert into public.notifications (user_id, type, message, related_task_id)
    values (new.assigned_user_id, 'assigned', 'You were assigned: ' || new.title, new.id);
  end if;
  return new;
end;
$$;

create trigger tasks_notify_assigned
  after insert or update on public.tasks
  for each row execute function public.notify_task_assigned();

create function public.notify_task_status_changed()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'UPDATE' and new.status is distinct from old.status and new.assigned_user_id is not null then
    if new.status = 'Completed' then
      insert into public.notifications (user_id, type, message, related_task_id)
      values (new.assigned_user_id, 'completed', 'Task completed: ' || new.title, new.id);
    else
      insert into public.notifications (user_id, type, message, related_task_id)
      values (new.assigned_user_id, 'status_changed', new.title || ' is now "' || new.status || '"', new.id);
    end if;
  end if;
  return new;
end;
$$;

create trigger tasks_notify_status_changed
  after update on public.tasks
  for each row execute function public.notify_task_status_changed();

create function public.notify_task_note_added()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'UPDATE' and new.notes is distinct from old.notes
     and new.notes is not null and length(trim(new.notes)) > 0
     and new.assigned_user_id is not null then
    insert into public.notifications (user_id, type, message, related_task_id)
    values (new.assigned_user_id, 'note_added', 'New note on: ' || new.title, new.id);
  end if;
  return new;
end;
$$;

create trigger tasks_notify_note_added
  after update on public.tasks
  for each row execute function public.notify_task_note_added();

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================
alter table public.profiles enable row level security;
alter table public.folders enable row level security;
alter table public.task_lists enable row level security;
alter table public.tasks enable row level security;
alter table public.notifications enable row level security;

-- profiles: everyone can see the team roster; users edit themselves; admins manage all
create policy profiles_select_all on public.profiles
  for select using (true);

create policy profiles_insert_admin on public.profiles
  for insert with check (public.is_admin());

create policy profiles_update_self_or_admin on public.profiles
  for update using (auth_user_id = auth.uid() or public.is_admin());

create policy profiles_delete_admin on public.profiles
  for delete using (public.is_admin());

-- folders: scoped to each member's personal workspace; admin sees/manages all
create policy folders_select on public.folders
  for select using (owner_id = public.current_profile_id() or public.is_admin());

create policy folders_insert on public.folders
  for insert with check (owner_id = public.current_profile_id() or public.is_admin());

create policy folders_update on public.folders
  for update using (owner_id = public.current_profile_id() or public.is_admin());

create policy folders_delete on public.folders
  for delete using (owner_id = public.current_profile_id() or public.is_admin());

-- task_lists: inherit access from parent folder
create policy task_lists_select on public.task_lists
  for select using (
    public.is_admin() or exists (
      select 1 from public.folders f where f.id = folder_id and f.owner_id = public.current_profile_id()
    )
  );

create policy task_lists_insert on public.task_lists
  for insert with check (
    public.is_admin() or exists (
      select 1 from public.folders f where f.id = folder_id and f.owner_id = public.current_profile_id()
    )
  );

create policy task_lists_update on public.task_lists
  for update using (
    public.is_admin() or exists (
      select 1 from public.folders f where f.id = folder_id and f.owner_id = public.current_profile_id()
    )
  );

create policy task_lists_delete on public.task_lists
  for delete using (
    public.is_admin() or exists (
      select 1 from public.folders f where f.id = folder_id and f.owner_id = public.current_profile_id()
    )
  );

-- tasks: visible to folder owner, admin, and whoever is assigned
create policy tasks_select on public.tasks
  for select using (
    public.is_admin()
    or assigned_user_id = public.current_profile_id()
    or exists (select 1 from public.folders f where f.id = folder_id and f.owner_id = public.current_profile_id())
  );

create policy tasks_insert on public.tasks
  for insert with check (
    public.is_admin()
    or exists (select 1 from public.folders f where f.id = folder_id and f.owner_id = public.current_profile_id())
  );

create policy tasks_update on public.tasks
  for update using (
    public.is_admin()
    or assigned_user_id = public.current_profile_id()
    or exists (select 1 from public.folders f where f.id = folder_id and f.owner_id = public.current_profile_id())
  );

create policy tasks_delete on public.tasks
  for delete using (
    public.is_admin()
    or exists (select 1 from public.folders f where f.id = folder_id and f.owner_id = public.current_profile_id())
  );

-- notifications: strictly personal, admin can view all for visibility
create policy notifications_select on public.notifications
  for select using (user_id = public.current_profile_id() or public.is_admin());

create policy notifications_insert on public.notifications
  for insert with check (user_id = public.current_profile_id() or public.is_admin());

create policy notifications_update on public.notifications
  for update using (user_id = public.current_profile_id() or public.is_admin());

create policy notifications_delete on public.notifications
  for delete using (user_id = public.current_profile_id() or public.is_admin());

-- ============================================================================
-- REALTIME
-- ============================================================================
alter publication supabase_realtime add table public.tasks;
alter publication supabase_realtime add table public.folders;
alter publication supabase_realtime add table public.notifications;
