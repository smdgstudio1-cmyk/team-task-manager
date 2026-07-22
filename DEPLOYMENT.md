# Deploying Lumen Studio to Vercel

## 1. Push the code to GitHub

The repo is already committed locally. To push it:

```
git remote add origin <your-github-repo-url>
git branch -M main
git push -u origin main
```

## 2. Import the project in Vercel

1. Go to **vercel.com** and sign in (GitHub login is easiest).
2. Click **Add New...** → **Project**.
3. Under "Import Git Repository," find your repo (authorize Vercel's GitHub App if prompted) and click **Import**.
4. Vercel auto-detects **Vite** as the framework. Leave the defaults:
   - Framework Preset: **Vite**
   - Build Command: `npm run build` (auto-filled)
   - Output Directory: `dist` (auto-filled)
   - Root Directory: `.` (leave as-is, unless you moved the app into a subfolder of the repo)
5. Expand **Environment Variables** and add these two (same values as your local `.env` file — copy them from there, or from Supabase **Settings → API**):

   | Name | Value |
   |---|---|
   | `VITE_SUPABASE_URL` | your Supabase project URL |
   | `VITE_SUPABASE_ANON_KEY` | your Supabase anon/publishable key |

   Do **not** add `SUPABASE_SERVICE_ROLE_KEY` here — it's a secret key only ever used locally by `scripts/seed.mjs`, never by the deployed frontend.
6. Click **Deploy**.

Vercel will build and give you a live URL like `https://lumen-studio.vercel.app`. The client-side routing rewrite in `vercel.json` (already committed) makes sure refreshing a page like `/folders/abc123` doesn't 404.

## 3. Point Supabase auth at your production URL

This is the step people forget, and it's why "it works on localhost but not in production" happens. Supabase uses a **Site URL** to build confirmation/reset-password links, and only allows redirects to URLs on an **allow list**.

In your Supabase project:

1. Go to **Authentication → URL Configuration**.
2. Set **Site URL** to your production URL, e.g. `https://lumen-studio.vercel.app`.
3. Under **Redirect URLs**, add:
   - `https://lumen-studio.vercel.app/**`
   - `https://*.vercel.app/**` (optional — covers Vercel's preview deployments for other branches/PRs)
   - Keep `http://localhost:5173/**` too if you still want local dev to work.
4. Save.

Without this, email confirmation links sent to new sign-ups will redirect back to `localhost` instead of your live site.

## 4. Verify it works in production

1. Open your Vercel URL.
2. Sign up a test account (or sign in with the account you already confirmed).
3. Confirm you land on the dashboard, can create a folder and a task, and the admin dashboard updates.
4. Try a deep link directly (e.g. paste `https://your-app.vercel.app/team` into the address bar) to confirm the SPA rewrite works.

## 5. Ongoing deploys

Every `git push` to `main` triggers a new production deployment automatically. Every push to any other branch (or PR) gets its own preview URL — useful for testing changes before they go live.
