# Lumen Studio — Team Task Manager

A clean, fast task manager for a small creative team: personal folder workspaces, an admin dashboard, list/kanban/calendar/deadline task views, filters, and in-app notifications. React + TypeScript + Tailwind CSS v4 + Supabase.

## 1. Set up the database

1. Open your Supabase project → **SQL Editor** → New query.
2. Paste the contents of [`supabase/schema.sql`](supabase/schema.sql) and run it. This creates all tables, RLS policies, and triggers (auto `updated_at`, auto `completed_at` on completion, and notification triggers for assignment/status-change/completion/notes).

## 2. Configure environment variables

Copy `.env.example` to `.env` and fill in:

```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

Both come from your Supabase project's **Settings → API** page.

## 3. Run the app

```
npm install
npm run dev
```

The **first person to create an account** (via the "Create account" tab on the login screen) automatically becomes the admin / project manager. Everyone who signs up afterwards is a regular team member. Admins can promote/manage roles from the Team page.

## 4. (Optional) Seed realistic demo data

`scripts/seed.mjs` creates a demo creative studio team (5 people) with folders, subfolders, task lists, and ~30 tasks spanning every status, priority, and deadline scenario (overdue, due soon, blocked, in review, completed).

This script needs your **service role key** (Settings → API → `service_role`). This key must **never** be used in frontend code — it bypasses Row Level Security. Add it to `.env` as `SUPABASE_SERVICE_ROLE_KEY` (already gitignored), then run:

```
node scripts/seed.mjs
```

Demo accounts all use password `Demo1234!`:
- `priya@lumenstudio.co` — admin / project manager
- `alex@lumenstudio.co`, `jordan@lumenstudio.co`, `sam@lumenstudio.co`, `mia@lumenstudio.co` — team members

## How data access works

- `profiles` mirrors your team roster and is decoupled from `auth.users` — an admin can add a team member (name + email) before that person ever signs up. When they later sign up with the same email, their account links to the existing profile automatically, keeping their assigned tasks intact.
- Folders are scoped to their owner's personal workspace; admins can see and manage everyone's.
- The admin dashboard subscribes to Supabase Realtime, so it updates live as anyone completes, reassigns, or edits a task.

## Project structure

```
src/
  components/   ui/ layout/ tasks/ folders/ dashboard/
  pages/        one file per screen
  store/        zustand stores (auth, data) — talk to Supabase directly
  lib/          types, Supabase client, date/progress helpers, filters
supabase/
  schema.sql    full schema + RLS + triggers
scripts/
  seed.mjs      demo data seeder (uses service role key, local-only)
```
