import { create } from 'zustand'
import { supabase } from '@/lib/supabaseClient'
import { attachmentStoragePath } from '@/lib/attachments'
import { isDueThisWeek, isOverdue, isDueToday } from '@/lib/utils'
import type {
  AppNotification,
  Folder,
  Task,
  TaskActivity,
  TaskAttachment,
  TaskList,
  TaskNote,
  TeamMember,
} from '@/lib/types'
import { MAX_ATTACHMENT_SIZE_BYTES } from '@/lib/types'

const ATTACHMENTS_BUCKET = 'task-attachments'
const STALE_BLOCKED_DAYS = 3

interface DataState {
  teamMembers: TeamMember[]
  folders: Folder[]
  taskLists: TaskList[]
  tasks: Task[]
  notifications: AppNotification[]
  loading: boolean
  loaded: boolean
  subscribed: boolean

  attachmentsByTask: Record<string, TaskAttachment[]>
  notesByTask: Record<string, TaskNote[]>
  activityByTask: Record<string, TaskActivity[]>
  taskExtrasLoading: Record<string, boolean>

  loadAll: () => Promise<void>
  subscribeRealtime: () => void

  createFolder: (input: { name: string; description?: string | null; owner_id?: string | null; parent_folder_id?: string | null }) => Promise<Folder | null>
  updateFolder: (id: string, patch: Partial<Pick<Folder, 'name' | 'description' | 'parent_folder_id' | 'owner_id'>>) => Promise<void>
  deleteFolder: (id: string) => Promise<void>

  createTaskList: (input: { name: string; folder_id: string }) => Promise<TaskList | null>
  updateTaskList: (id: string, patch: Partial<Pick<TaskList, 'name'>>) => Promise<void>
  deleteTaskList: (id: string) => Promise<void>

  createTask: (input: Partial<Task> & { title: string; folder_id: string }) => Promise<Task | null>
  updateTask: (id: string, patch: Partial<Task>) => Promise<void>
  deleteTask: (id: string) => Promise<void>
  duplicateTask: (id: string) => Promise<Task | null>
  archiveTask: (id: string, archived: boolean) => Promise<void>

  createTeamMember: (input: { name: string; title?: string | null }) => Promise<{ error: string | null }>
  updateTeamMember: (id: string, patch: Partial<Pick<TeamMember, 'name' | 'title' | 'archived'>>) => Promise<void>

  loadTaskExtras: (taskId: string) => Promise<void>
  createNote: (taskId: string, body: string) => Promise<void>
  updateNote: (id: string, taskId: string, body: string) => Promise<void>
  deleteNote: (id: string, taskId: string) => Promise<void>
  uploadAttachment: (taskId: string, file: File) => Promise<{ error: string | null }>
  deleteAttachment: (attachment: TaskAttachment) => Promise<void>

  markNotificationRead: (id: string) => Promise<void>
  markAllNotificationsRead: () => Promise<void>
  generateDeadlineNotifications: () => Promise<void>
}

export const useDataStore = create<DataState>((set, get) => ({
  teamMembers: [],
  folders: [],
  taskLists: [],
  tasks: [],
  notifications: [],
  loading: false,
  loaded: false,
  subscribed: false,

  attachmentsByTask: {},
  notesByTask: {},
  activityByTask: {},
  taskExtrasLoading: {},

  loadAll: async () => {
    set({ loading: true })
    const [teamMembersRes, foldersRes, taskListsRes, tasksRes, notificationsRes] = await Promise.all([
      supabase.from('team_members').select('*').order('created_at'),
      supabase.from('folders').select('*').order('created_at'),
      supabase.from('task_lists').select('*').order('created_at'),
      supabase.from('tasks').select('*').order('position'),
      supabase.from('notifications').select('*').order('created_at', { ascending: false }),
    ])
    set({
      teamMembers: (teamMembersRes.data as TeamMember[]) || [],
      folders: (foldersRes.data as Folder[]) || [],
      taskLists: (taskListsRes.data as TaskList[]) || [],
      tasks: (tasksRes.data as Task[]) || [],
      notifications: (notificationsRes.data as AppNotification[]) || [],
      loading: false,
      loaded: true,
    })
  },

  subscribeRealtime: () => {
    if (get().subscribed) return
    set({ subscribed: true })

    const refetchTasks = async () => {
      const { data } = await supabase.from('tasks').select('*').order('position')
      if (data) set({ tasks: data as Task[] })
    }
    const refetchFolders = async () => {
      const { data } = await supabase.from('folders').select('*').order('created_at')
      if (data) set({ folders: data as Folder[] })
    }
    const refetchTeamMembers = async () => {
      const { data } = await supabase.from('team_members').select('*').order('created_at')
      if (data) set({ teamMembers: data as TeamMember[] })
    }
    const refetchNotifications = async () => {
      const { data } = await supabase.from('notifications').select('*').order('created_at', { ascending: false })
      if (data) set({ notifications: data as AppNotification[] })
    }

    supabase
      .channel('tasks-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, refetchTasks)
      .subscribe()

    supabase
      .channel('folders-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'folders' }, refetchFolders)
      .subscribe()

    supabase
      .channel('team-members-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'team_members' }, refetchTeamMembers)
      .subscribe()

    supabase
      .channel('notifications-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, refetchNotifications)
      .subscribe()
  },

  createFolder: async (input) => {
    const { data, error } = await supabase.from('folders').insert(input).select().single()
    if (error) {
      console.error(error)
      return null
    }
    set({ folders: [...get().folders, data as Folder] })
    return data as Folder
  },

  updateFolder: async (id, patch) => {
    const { data, error } = await supabase.from('folders').update(patch).eq('id', id).select().single()
    if (error) {
      console.error(error)
      return
    }
    set({ folders: get().folders.map((f) => (f.id === id ? (data as Folder) : f)) })
  },

  deleteFolder: async (id) => {
    const { error } = await supabase.from('folders').delete().eq('id', id)
    if (error) {
      console.error(error)
      return
    }
    const isDescendant = (folderId: string, targetId: string, all: Folder[]): boolean => {
      const f = all.find((x) => x.id === folderId)
      if (!f || !f.parent_folder_id) return false
      if (f.parent_folder_id === targetId) return true
      return isDescendant(f.parent_folder_id, targetId, all)
    }
    const remainingFolders = get().folders.filter((f) => f.id !== id && !isDescendant(f.id, id, get().folders))
    const remainingFolderIds = new Set(remainingFolders.map((f) => f.id))
    set({
      folders: remainingFolders,
      taskLists: get().taskLists.filter((tl) => remainingFolderIds.has(tl.folder_id)),
      tasks: get().tasks.filter((t) => remainingFolderIds.has(t.folder_id)),
    })
  },

  createTaskList: async (input) => {
    const { data, error } = await supabase.from('task_lists').insert(input).select().single()
    if (error) {
      console.error(error)
      return null
    }
    set({ taskLists: [...get().taskLists, data as TaskList] })
    return data as TaskList
  },

  updateTaskList: async (id, patch) => {
    const { data, error } = await supabase.from('task_lists').update(patch).eq('id', id).select().single()
    if (error) {
      console.error(error)
      return
    }
    set({ taskLists: get().taskLists.map((tl) => (tl.id === id ? (data as TaskList) : tl)) })
  },

  deleteTaskList: async (id) => {
    const { error } = await supabase.from('task_lists').delete().eq('id', id)
    if (error) {
      console.error(error)
      return
    }
    set({
      taskLists: get().taskLists.filter((tl) => tl.id !== id),
      tasks: get().tasks.filter((t) => t.task_list_id !== id),
    })
  },

  createTask: async (input) => {
    const { data, error } = await supabase
      .from('tasks')
      .insert({ status: 'Not Started', priority: 'Medium', position: 0, ...input })
      .select()
      .single()
    if (error) {
      console.error(error)
      return null
    }
    set({ tasks: [...get().tasks, data as Task] })
    return data as Task
  },

  updateTask: async (id, patch) => {
    const { data, error } = await supabase.from('tasks').update(patch).eq('id', id).select().single()
    if (error) {
      console.error(error)
      return
    }
    set({ tasks: get().tasks.map((t) => (t.id === id ? (data as Task) : t)) })
    if (get().activityByTask[id] !== undefined) {
      get().loadTaskExtras(id)
    }
  },

  deleteTask: async (id) => {
    const { error } = await supabase.from('tasks').delete().eq('id', id)
    if (error) {
      console.error(error)
      return
    }
    set({ tasks: get().tasks.filter((t) => t.id !== id) })
  },

  duplicateTask: async (id) => {
    const original = get().tasks.find((t) => t.id === id)
    if (!original) return null
    const { data, error } = await supabase
      .from('tasks')
      .insert({
        title: `${original.title} (Copy)`,
        description: original.description,
        assigned_user_id: original.assigned_user_id,
        folder_id: original.folder_id,
        task_list_id: original.task_list_id,
        status: 'Not Started',
        priority: original.priority,
        start_date: original.start_date,
        deadline: original.deadline,
        notes: original.notes,
        position: original.position,
      })
      .select()
      .single()
    if (error) {
      console.error(error)
      return null
    }
    set({ tasks: [...get().tasks, data as Task] })
    return data as Task
  },

  archiveTask: async (id, archived) => {
    await get().updateTask(id, { archived })
  },

  createTeamMember: async (input) => {
    const { data, error } = await supabase.from('team_members').insert(input).select().single()
    if (error) return { error: error.message }
    set({ teamMembers: [...get().teamMembers, data as TeamMember] })
    return { error: null }
  },

  updateTeamMember: async (id, patch) => {
    const { data, error } = await supabase.from('team_members').update(patch).eq('id', id).select().single()
    if (error) {
      console.error(error)
      return
    }
    set({ teamMembers: get().teamMembers.map((m) => (m.id === id ? (data as TeamMember) : m)) })
  },

  loadTaskExtras: async (taskId) => {
    set({ taskExtrasLoading: { ...get().taskExtrasLoading, [taskId]: true } })
    const [attachmentsRes, notesRes, activityRes] = await Promise.all([
      supabase.from('task_attachments').select('*').eq('task_id', taskId).order('created_at'),
      supabase.from('task_notes').select('*').eq('task_id', taskId).order('created_at', { ascending: false }),
      supabase.from('task_activity').select('*').eq('task_id', taskId).order('created_at', { ascending: false }),
    ])
    set({
      attachmentsByTask: { ...get().attachmentsByTask, [taskId]: (attachmentsRes.data as TaskAttachment[]) || [] },
      notesByTask: { ...get().notesByTask, [taskId]: (notesRes.data as TaskNote[]) || [] },
      activityByTask: { ...get().activityByTask, [taskId]: (activityRes.data as TaskActivity[]) || [] },
      taskExtrasLoading: { ...get().taskExtrasLoading, [taskId]: false },
    })
  },

  createNote: async (taskId, body) => {
    const { data, error } = await supabase.from('task_notes').insert({ task_id: taskId, body }).select().single()
    if (error) {
      console.error(error)
      return
    }
    set({ notesByTask: { ...get().notesByTask, [taskId]: [data as TaskNote, ...(get().notesByTask[taskId] || [])] } })
    get().loadTaskExtras(taskId)
  },

  updateNote: async (id, taskId, body) => {
    const { data, error } = await supabase.from('task_notes').update({ body }).eq('id', id).select().single()
    if (error) {
      console.error(error)
      return
    }
    set({
      notesByTask: {
        ...get().notesByTask,
        [taskId]: (get().notesByTask[taskId] || []).map((n) => (n.id === id ? (data as TaskNote) : n)),
      },
    })
  },

  deleteNote: async (id, taskId) => {
    const { error } = await supabase.from('task_notes').delete().eq('id', id)
    if (error) {
      console.error(error)
      return
    }
    set({
      notesByTask: {
        ...get().notesByTask,
        [taskId]: (get().notesByTask[taskId] || []).filter((n) => n.id !== id),
      },
    })
  },

  uploadAttachment: async (taskId, file) => {
    if (file.size > MAX_ATTACHMENT_SIZE_BYTES) {
      return { error: `"${file.name}" is too large. Max size is 20MB.` }
    }
    const path = attachmentStoragePath(taskId, file.name)
    const { error: uploadError } = await supabase.storage.from(ATTACHMENTS_BUCKET).upload(path, file)
    if (uploadError) {
      return { error: uploadError.message }
    }
    const { data, error } = await supabase
      .from('task_attachments')
      .insert({ task_id: taskId, file_name: file.name, file_path: path, file_size: file.size, mime_type: file.type || null })
      .select()
      .single()
    if (error) {
      return { error: error.message }
    }
    set({
      attachmentsByTask: { ...get().attachmentsByTask, [taskId]: [...(get().attachmentsByTask[taskId] || []), data as TaskAttachment] },
    })
    get().loadTaskExtras(taskId)
    return { error: null }
  },

  deleteAttachment: async (attachment) => {
    await supabase.storage.from(ATTACHMENTS_BUCKET).remove([attachment.file_path])
    const { error } = await supabase.from('task_attachments').delete().eq('id', attachment.id)
    if (error) {
      console.error(error)
      return
    }
    set({
      attachmentsByTask: {
        ...get().attachmentsByTask,
        [attachment.task_id]: (get().attachmentsByTask[attachment.task_id] || []).filter((a) => a.id !== attachment.id),
      },
    })
  },

  markNotificationRead: async (id) => {
    const { error } = await supabase.from('notifications').update({ is_read: true }).eq('id', id)
    if (error) {
      console.error(error)
      return
    }
    set({ notifications: get().notifications.map((n) => (n.id === id ? { ...n, is_read: true } : n)) })
  },

  markAllNotificationsRead: async () => {
    const { error } = await supabase.from('notifications').update({ is_read: true }).eq('is_read', false)
    if (error) {
      console.error(error)
      return
    }
    set({ notifications: get().notifications.map((n) => ({ ...n, is_read: true })) })
  },

  generateDeadlineNotifications: async () => {
    const { tasks, notifications } = get()
    const toInsert: Array<{ type: string; message: string; related_task_id: string }> = []

    const hasExisting = (taskId: string, type: string) =>
      notifications.some((n) => n.related_task_id === taskId && n.type === type)

    for (const t of tasks) {
      if (t.archived) continue

      if (t.status === 'Waiting / Blocked') {
        const daysSinceUpdate = (Date.now() - new Date(t.updated_at).getTime()) / (24 * 60 * 60 * 1000)
        if (daysSinceUpdate >= STALE_BLOCKED_DAYS && !hasExisting(t.id, 'stale_blocked')) {
          toInsert.push({
            type: 'stale_blocked',
            message: `Still blocked after ${Math.floor(daysSinceUpdate)} days: ${t.title}`,
            related_task_id: t.id,
          })
        }
      }

      if (t.status === 'Completed') continue

      if (isOverdue(t) && !hasExisting(t.id, 'overdue')) {
        toInsert.push({ type: 'overdue', message: `Overdue: ${t.title}`, related_task_id: t.id })
      } else if (isDueToday(t) && !hasExisting(t.id, 'due_today')) {
        toInsert.push({ type: 'due_today', message: `Due today: ${t.title}`, related_task_id: t.id })
      } else if (t.deadline) {
        const days = Math.round((new Date(t.deadline).getTime() - Date.now()) / (24 * 60 * 60 * 1000))
        if (days === 1 && !hasExisting(t.id, 'due_tomorrow')) {
          toInsert.push({ type: 'due_tomorrow', message: `Due tomorrow: ${t.title}`, related_task_id: t.id })
        } else if (days > 1 && days <= 3 && !hasExisting(t.id, 'due_soon') && isDueThisWeek(t)) {
          toInsert.push({ type: 'due_soon', message: `Due in ${days} days: ${t.title}`, related_task_id: t.id })
        }
      }
    }

    if (toInsert.length === 0) return
    // Upsert with ignoreDuplicates rather than a plain insert: the client-side
    // hasExisting() check above is a fast path, but the real guarantee against
    // duplicates (e.g. from React StrictMode's double effect invocation, or
    // two tabs loading at once) is the DB's unique (related_task_id, type)
    // index — this makes a racing duplicate a no-op instead of a second row.
    const { data, error } = await supabase
      .from('notifications')
      .upsert(toInsert, { onConflict: 'related_task_id,type', ignoreDuplicates: true })
      .select()
    if (error) {
      console.error(error)
      return
    }
    if (data && data.length > 0) {
      set({ notifications: [...(data as AppNotification[]), ...get().notifications] })
    }
  },
}))
