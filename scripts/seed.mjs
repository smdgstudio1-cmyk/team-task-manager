// Demo data seeder for Lumen Studio's single-admin app.
// Team members here are plain organizational records — no auth accounts,
// no login, ever. Uses the SERVICE ROLE key locally only (bypasses RLS);
// never ship this key to the browser.
// Usage: node scripts/seed.mjs   (reads SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY from .env)

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

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY in .env')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const TEAM = [
  { name: 'Alex Rivera', title: 'Designer' },
  { name: 'Jordan Lee', title: 'Copywriter' },
  { name: 'Sam Okafor', title: 'Developer' },
  { name: 'Mia Chen', title: 'Illustrator' },
]

function daysFromNow(n) {
  const d = new Date()
  d.setDate(d.getDate() + n)
  return d.toISOString()
}

async function main() {
  console.log('Clearing previous demo data...')
  await supabase.from('team_members').delete().in(
    'name',
    TEAM.map((t) => t.name)
  )

  console.log('Creating team members...')
  const memberIdByName = {}
  for (const person of TEAM) {
    const { data, error } = await supabase.from('team_members').insert(person).select().single()
    if (error) throw error
    memberIdByName[person.name] = data.id
  }

  const alex = memberIdByName['Alex Rivera']
  const jordan = memberIdByName['Jordan Lee']
  const sam = memberIdByName['Sam Okafor']
  const mia = memberIdByName['Mia Chen']

  console.log('Clearing previous demo folders/tasks (if any)...')
  await supabase.from('folders').delete().in('owner_id', [alex, jordan, sam, mia])

  async function makeFolder(name, description, owner_id, parent_folder_id = null) {
    const { data, error } = await supabase
      .from('folders')
      .insert({ name, description, owner_id, parent_folder_id })
      .select()
      .single()
    if (error) throw error
    return data.id
  }

  async function makeList(name, folder_id) {
    const { data, error } = await supabase.from('task_lists').insert({ name, folder_id }).select().single()
    if (error) throw error
    return data.id
  }

  async function makeTask(t) {
    const { error } = await supabase.from('tasks').insert(t)
    if (error) throw error
  }

  console.log('Creating folders and tasks...')

  // ---- Alex (Designer) ----
  const novaBrand = await makeFolder('Brand Refresh — Nova Coffee', 'Full brand identity refresh for Nova Coffee Co.', alex)
  const logoFolder = await makeFolder('Logo Design', 'Primary mark, wordmark, and lockups', alex, novaBrand)
  const packagingFolder = await makeFolder('Packaging', 'Cup sleeves, bags, and box design', alex, novaBrand)
  const internalAlex = await makeFolder('Internal', 'Studio-facing design work', alex)

  const logoConcepts = await makeList('Concepts', logoFolder)
  const logoRevisions = await makeList('Revisions', logoFolder)
  const packagingList = await makeList('Packaging Design', packagingFolder)
  const internalAlexList = await makeList('Marketing Assets', internalAlex)

  await makeTask({ title: 'Sketch 5 logo concepts', description: 'Explore direction based on moodboard v2', assigned_user_id: alex, folder_id: logoFolder, task_list_id: logoConcepts, status: 'Completed', priority: 'High', start_date: '2026-07-01', deadline: daysFromNow(-15), completed_at: daysFromNow(-13), notes: 'Client loved concept 3', position: 0 })
  await makeTask({ title: 'Present concepts to client', assigned_user_id: alex, folder_id: logoFolder, task_list_id: logoConcepts, status: 'Completed', priority: 'High', deadline: daysFromNow(-12), completed_at: daysFromNow(-12), position: 1 })
  await makeTask({ title: 'Refine chosen logo concept', description: 'Tighten curves on the wordmark, test at small sizes', assigned_user_id: alex, folder_id: logoFolder, task_list_id: logoRevisions, status: 'In Progress', priority: 'High', deadline: daysFromNow(2), position: 2 })
  await makeTask({ title: 'Build full lockup variations', assigned_user_id: alex, folder_id: logoFolder, task_list_id: logoRevisions, status: 'Not Started', priority: 'Medium', deadline: daysFromNow(6), position: 3 })
  await makeTask({ title: 'Deliver final logo files', description: 'Export SVG/PNG/EPS + usage guide', assigned_user_id: alex, folder_id: logoFolder, task_list_id: logoRevisions, status: 'Not Started', priority: 'Urgent', deadline: daysFromNow(-2), position: 4 })
  await makeTask({ title: 'Cup sleeve design — hot cups', assigned_user_id: alex, folder_id: packagingFolder, task_list_id: packagingList, status: 'In Review', priority: 'Medium', deadline: daysFromNow(3), position: 0 })
  await makeTask({ title: 'Cup sleeve design — cold cups', assigned_user_id: alex, folder_id: packagingFolder, task_list_id: packagingList, status: 'Not Started', priority: 'Medium', deadline: daysFromNow(9), position: 1 })
  await makeTask({ title: 'Retail bag mockups', assigned_user_id: alex, folder_id: packagingFolder, task_list_id: packagingList, status: 'Waiting / Blocked', priority: 'Low', notes: 'Waiting on client to confirm bag supplier specs', deadline: daysFromNow(14), position: 2 })
  await makeTask({ title: 'Update studio Instagram templates', assigned_user_id: alex, folder_id: internalAlex, task_list_id: internalAlexList, status: 'In Progress', priority: 'Low', deadline: daysFromNow(5), position: 0 })

  // ---- Jordan (Copywriter) ----
  const novaCopy = await makeFolder('Nova Coffee Copywriting', 'Voice, tone, and website copy for Nova Coffee', jordan)
  const websiteContent = await makeFolder('Website Content Q3', "Copy for the studio's own site refresh", jordan)
  const novaCopyList = await makeList('Copy Drafts', novaCopy)
  const websiteList = await makeList('Page Copy', websiteContent)

  await makeTask({ title: 'Write brand voice guidelines', assigned_user_id: jordan, folder_id: novaCopy, task_list_id: novaCopyList, status: 'Completed', priority: 'Medium', deadline: daysFromNow(-20), completed_at: daysFromNow(-19), position: 0 })
  await makeTask({ title: 'Draft homepage hero copy', assigned_user_id: jordan, folder_id: novaCopy, task_list_id: novaCopyList, status: 'In Review', priority: 'High', deadline: daysFromNow(1), position: 1 })
  await makeTask({ title: 'Write product descriptions (12 items)', assigned_user_id: jordan, folder_id: novaCopy, task_list_id: novaCopyList, status: 'In Progress', priority: 'Medium', deadline: daysFromNow(7), position: 2 })
  await makeTask({ title: 'Menu board copy', assigned_user_id: jordan, folder_id: novaCopy, task_list_id: novaCopyList, status: 'Not Started', priority: 'Urgent', deadline: daysFromNow(-1), position: 3 })
  await makeTask({ title: 'About page draft', assigned_user_id: jordan, folder_id: websiteContent, task_list_id: websiteList, status: 'Not Started', priority: 'Low', deadline: daysFromNow(12), position: 0 })
  await makeTask({ title: 'Services page draft', assigned_user_id: jordan, folder_id: websiteContent, task_list_id: websiteList, status: 'Waiting / Blocked', priority: 'Medium', notes: 'Need final service list', deadline: daysFromNow(4), position: 1 })

  // ---- Sam (Developer) ----
  const studioSite = await makeFolder('Studio Website Rebuild', 'Rebuilding the studio site on a new stack', sam)
  const frontend = await makeFolder('Frontend', 'Client-side build', sam, studioSite)
  const backend = await makeFolder('Backend', 'CMS + API work', sam, studioSite)
  const frontendList = await makeList('Components', frontend)
  const backendList = await makeList('Infrastructure', backend)

  await makeTask({ title: 'Set up design tokens from Figma', assigned_user_id: sam, folder_id: frontend, task_list_id: frontendList, status: 'Completed', priority: 'Medium', deadline: daysFromNow(-25), completed_at: daysFromNow(-24), position: 0 })
  await makeTask({ title: 'Build responsive nav component', assigned_user_id: sam, folder_id: frontend, task_list_id: frontendList, status: 'Completed', priority: 'Medium', deadline: daysFromNow(-10), completed_at: daysFromNow(-9), position: 1 })
  await makeTask({ title: 'Build project gallery grid', assigned_user_id: sam, folder_id: frontend, task_list_id: frontendList, status: 'In Progress', priority: 'High', deadline: daysFromNow(3), position: 2 })
  await makeTask({ title: 'Accessibility pass (WCAG AA)', assigned_user_id: sam, folder_id: frontend, task_list_id: frontendList, status: 'Not Started', priority: 'Medium', deadline: daysFromNow(15), position: 3 })
  await makeTask({ title: 'Fix mobile menu overflow bug', assigned_user_id: sam, folder_id: frontend, task_list_id: frontendList, status: 'Not Started', priority: 'Urgent', deadline: daysFromNow(-3), position: 4 })
  await makeTask({ title: 'Set up headless CMS schema', assigned_user_id: sam, folder_id: backend, task_list_id: backendList, status: 'In Review', priority: 'High', deadline: daysFromNow(0), position: 0 })
  await makeTask({ title: 'Configure staging environment', assigned_user_id: sam, folder_id: backend, task_list_id: backendList, status: 'Waiting / Blocked', priority: 'Medium', notes: 'Blocked on hosting account access', deadline: daysFromNow(8), position: 1 })

  // ---- Mia (Illustrator) ----
  const novaIllustrations = await makeFolder('Nova Coffee Illustrations', 'Custom illustration set for packaging and social', mia)
  const socialPack = await makeFolder('Social Media Pack', 'Illustration assets for studio social channels', mia)
  const novaIllustList = await makeList('Illustration Set', novaIllustrations)
  const socialList = await makeList('Assets', socialPack)

  await makeTask({ title: 'Coffee bean character sketches', assigned_user_id: mia, folder_id: novaIllustrations, task_list_id: novaIllustList, status: 'Completed', priority: 'Medium', deadline: daysFromNow(-8), completed_at: daysFromNow(-7), position: 0 })
  await makeTask({ title: 'Final illustration — cup icon set', assigned_user_id: mia, folder_id: novaIllustrations, task_list_id: novaIllustList, status: 'In Progress', priority: 'High', deadline: daysFromNow(1), position: 1 })
  await makeTask({ title: 'Seasonal pattern for autumn cups', assigned_user_id: mia, folder_id: novaIllustrations, task_list_id: novaIllustList, status: 'Not Started', priority: 'Low', deadline: daysFromNow(20), position: 2 })
  await makeTask({ title: 'Pattern revisions from client', assigned_user_id: mia, folder_id: novaIllustrations, task_list_id: novaIllustList, status: 'Not Started', priority: 'Urgent', deadline: daysFromNow(-5), position: 3 })
  await makeTask({ title: 'Instagram carousel illustrations', assigned_user_id: mia, folder_id: socialPack, task_list_id: socialList, status: 'In Review', priority: 'Medium', deadline: daysFromNow(2), position: 0 })

  // ---- General / studio-wide (no single owner) ----
  const studioOps = await makeFolder('Studio Operations', 'Internal planning and admin', null)
  const opsList = await makeList('Planning', studioOps)
  await makeTask({ title: 'Quarterly client review deck', folder_id: studioOps, task_list_id: opsList, status: 'In Progress', priority: 'High', deadline: daysFromNow(4), position: 0 })
  await makeTask({ title: 'Freelancer contract renewals', folder_id: studioOps, task_list_id: opsList, status: 'Waiting / Blocked', priority: 'Medium', deadline: daysFromNow(-1), position: 1 })
  await makeTask({ title: 'Team retro notes', folder_id: studioOps, task_list_id: opsList, status: 'Completed', priority: 'Low', deadline: daysFromNow(-6), completed_at: daysFromNow(-6), position: 2 })

  console.log('Demo data seeded successfully.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
