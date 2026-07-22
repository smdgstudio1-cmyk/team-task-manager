import { create } from 'zustand'
import { supabase } from '@/lib/supabaseClient'
import type { AppNotification, Folder, Profile, Task, TaskList } from '@/lib/types'
import { isDueThisWeek, isOverdue } from '@/lib/utils'

interface DataState {
  profiles: Profile[]
  folders: Folder[]
  taskLists: TaskList[]
  tasks: Task[]
  notifications: AppNotification[]
  loading: boolean
  loaded: boolean
  subscribed: boolean

  loadAll: () => Promise<void>
  subscribeRealtime: () => void

  createFolder: (input: { name: string; description?: string | null; owner_id: string; parent_folder_id?: string | null }) => Promise<Folder | null>
  updateFolder: (id: string, patch: Partial<Pick<Folder, 'name' | 'description' | 'parent_folder_id'>>) => Promise<void>
  deleteFolder: (id: string) => Promise<void>

  createTaskList: (input: { name: string; folder_id: string }) => Promise<TaskList | null>
  updateTaskList: (id: string, patch: Partial<Pick<TaskList, 'name'>>) => Promise<void>
  deleteTaskList: (id: string) => Promise<void>

  createTask: (input: Partial<Task> & { title: string; folder_id: string }) => Promise<Task | null>
  updateTask: (id: string, patch: Partial<Task>) => Promise<void>
  deleteTask: (id: string) => Promise<void>

  createProfile: (input: { name: string; email: string; role: 'admin' | 'member' }) => Promise<{ error: string | null }>

  markNotificationRead: (id: string) => Promise<void>
  markAllNotificationsRead: (userId: string) => Promise<void>
  generateDeadlineNotifications: (currentProfileId: string, isAdmin: boolean) => Promise<void>
}

export const useDataStore = create<DataState>((set, get) => ({
  profiles: [],
  folders: [],
  taskLists: [],
  tasks: [],
  notifications: [],
  loading: false,
  loaded: false,
  subscribed: false,

  loadAll: async () => {
    set({ loading: true })
    const [profilesRes, foldersRes, taskListsRes, tasksRes, notificationsRes] = await Promise.all([
      supabase.from('profiles').select('*').order('created_at'),
      supabase.from('folders').select('*').order('created_at'),
      supabase.from('task_lists').select('*').order('created_at'),
      supabase.from('tasks').select('*').order('position'),
      supabase.from('notifications').select('*').order('created_at', { ascending: false }),
    ])
    set({
      profiles: (profilesRes.data as Profile[]) || [],
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
  },

  deleteTask: async (id) => {
    const { error } = await supabase.from('tasks').delete().eq('id', id)
    if (error) {
      console.error(error)
      return
    }
    set({ tasks: get().tasks.filter((t) => t.id !== id) })
  },

  createProfile: async (input) => {
    const { data, error } = await supabase.from('profiles').insert(input).select().single()
    if (error) return { error: error.message }
    set({ profiles: [...get().profiles, data as Profile] })
    return { error: null }
  },

  markNotificationRead: async (id) => {
    const { error } = await supabase.from('notifications').update({ is_read: true }).eq('id', id)
    if (error) {
      console.error(error)
      return
    }
    set({ notifications: get().notifications.map((n) => (n.id === id ? { ...n, is_read: true } : n)) })
  },

  markAllNotificationsRead: async (userId) => {
    const { error } = await supabase.from('notifications').update({ is_read: true }).eq('user_id', userId).eq('is_read', false)
    if (error) {
      console.error(error)
      return
    }
    set({ notifications: get().notifications.map((n) => (n.user_id === userId ? { ...n, is_read: true } : n)) })
  },

  generateDeadlineNotifications: async (currentProfileId, isAdmin) => {
    const { tasks, notifications } = get()
    const relevant = isAdmin ? tasks : tasks.filter((t) => t.assigned_user_id === currentProfileId)
    const toInsert: Array<{ user_id: string; type: 'overdue' | 'deadline_approaching'; message: string; related_task_id: string }> = []

    for (const t of relevant) {
      if (!t.assigned_user_id || t.status === 'Completed') continue
      const hasExisting = (type: string) =>
        notifications.some((n) => n.related_task_id === t.id && n.type === type)

      if (isOverdue(t) && !hasExisting('overdue')) {
        toInsert.push({ user_id: t.assigned_user_id, type: 'overdue', message: `Overdue: ${t.title}`, related_task_id: t.id })
      } else if (isDueThisWeek(t) && !hasExisting('deadline_approaching')) {
        toInsert.push({
          user_id: t.assigned_user_id,
          type: 'deadline_approaching',
          message: `Deadline approaching: ${t.title}`,
          related_task_id: t.id,
        })
      }
    }

    if (toInsert.length === 0) return
    const { data, error } = await supabase.from('notifications').insert(toInsert).select()
    if (error) {
      console.error(error)
      return
    }
    set({ notifications: [...(data as AppNotification[]), ...get().notifications] })
  },
}))
