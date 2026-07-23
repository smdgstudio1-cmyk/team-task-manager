// One-time provisioning script for the single admin account.
// Not needed if you already signed up through the app's login screen before
// removing the sign-up flow — this is for spinning up a brand new project.
// Usage: node scripts/create-admin.mjs you@studio.co "a-strong-password"
// Reads SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY from .env (local-only, never shipped to the browser).

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import path from 'path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

function loadEnv() {
  const envPath = path.resolve(__dirname, '../.env')
  try {
    const content = readFileSync(envPath, 'utf-8')
    for (const line of content.split('\n')) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const idx = trimmed.indexOf('=')
      if (idx === -1) continue
      const key = trimmed.slice(0, idx).trim()
      const value = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, '')
      if (!process.env[key]) process.env[key] = value
    }
  } catch {
    // no .env file, rely on already-exported env vars
  }
}

loadEnv()

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const [, , email, password] = process.argv

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY in .env')
  process.exit(1)
}
if (!email || !password) {
  console.error('Usage: node scripts/create-admin.mjs you@studio.co "a-strong-password"')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

async function main() {
  const { count } = await supabase.from('admin_user').select('*', { count: 'exact', head: true })
  if (count && count > 0) {
    console.error('An admin account already exists. Refusing to create a second one.')
    process.exit(1)
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })
  if (error) throw error

  console.log(`Admin account created for ${data.user.email}. Sign in at your app's login screen.`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
