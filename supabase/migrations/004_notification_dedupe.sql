-- Migration: prevent duplicate deadline notifications at the database level
--
-- Bug: generateDeadlineNotifications() checks "does a notification of this
-- type already exist for this task?" client-side before inserting. Under a
-- race (e.g. React StrictMode's double effect invocation in dev, or a fast
-- double page load), two calls can both pass the check before either insert
-- lands, producing duplicate rows.
--
-- Fix: a task should only ever have one notification of a given type. Enforce
-- that with a unique index, and switch the insert to an upsert that ignores
-- conflicts, so a race safely produces one row instead of two.
--
-- Safe to re-run. Cleans up any duplicates that already exist before adding
-- the constraint (keeps the earliest row of each duplicate set — no
-- unrelated data is touched).

delete from public.notifications a
using public.notifications b
where a.related_task_id = b.related_task_id
  and a.type = b.type
  and a.related_task_id is not null
  and a.created_at > b.created_at;

create unique index if not exists notifications_task_type_unique
  on public.notifications(related_task_id, type)
  where related_task_id is not null;
