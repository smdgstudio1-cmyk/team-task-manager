import { create } from 'zustand'
import { supabase } from '@/lib/supabaseClient'
import type { Folder, Task, TaskList, TeamMember } from '@/lib/types'

interface DataState {
  teamMembers: TeamMember[]
  folders: Folder[]
  taskLists: TaskList[]
  tasks: Task[]
  loading: boolean
  loaded: boolean
  subscribed: boolean

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

  createTeamMember: (input: { name: string; title?: string | null }) => Promise<{ error: string | null }>
  updateTeamMember: (id: string, patch: Partial<Pick<TeamMember, 'name' | 'title' | 'archived'>>) => Promise<void>
}

export const useDataStore = create<DataState>((set, get) => ({
  teamMembers: [],
  folders: [],
  taskLists: [],
  tasks: [],
  loading: false,
  loaded: false,
  subscribed: false,

  loadAll: async () => {
    set({ loading: true })
    const [teamMembersRes, foldersRes, taskListsRes, tasksRes] = await Promise.all([
      supabase.from('team_members').select('*').order('created_at'),
      supabase.from('folders').select('*').order('created_at'),
      supabase.from('task_lists').select('*').order('created_at'),
      supabase.from('tasks').select('*').order('position'),
    ])
    set({
      teamMembers: (teamMembersRes.data as TeamMember[]) || [],
      folders: (foldersRes.data as Folder[]) || [],
      taskLists: (taskListsRes.data as TaskList[]) || [],
      tasks: (tasksRes.data as Task[]) || [],
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
}))
