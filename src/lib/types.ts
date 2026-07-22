export type Role = 'admin' | 'member'

export type TaskStatus =
  | 'Not Started'
  | 'In Progress'
  | 'Waiting / Blocked'
  | 'In Review'
  | 'Completed'

export type TaskPriority = 'Low' | 'Medium' | 'High' | 'Urgent'

export type NotificationType =
  | 'assigned'
  | 'deadline_approaching'
  | 'overdue'
  | 'completed'
  | 'status_changed'
  | 'note_added'

export interface Profile {
  id: string
  name: string
  email: string
  avatar_url: string | null
  role: Role
  created_at: string
}

export interface Folder {
  id: string
  name: string
  description: string | null
  owner_id: string
  parent_folder_id: string | null
  created_at: string
  updated_at: string
}

export interface TaskList {
  id: string
  name: string
  folder_id: string
  created_at: string
  updated_at: string
}

export interface Task {
  id: string
  title: string
  description: string | null
  assigned_user_id: string | null
  folder_id: string
  task_list_id: string | null
  status: TaskStatus
  priority: TaskPriority
  start_date: string | null
  deadline: string | null
  completed_at: string | null
  notes: string | null
  position: number
  created_at: string
  updated_at: string
}

export interface AppNotification {
  id: string
  user_id: string
  type: NotificationType
  message: string
  related_task_id: string | null
  is_read: boolean
  created_at: string
}

export const TASK_STATUSES: TaskStatus[] = [
  'Not Started',
  'In Progress',
  'Waiting / Blocked',
  'In Review',
  'Completed',
]

export const TASK_PRIORITIES: TaskPriority[] = ['Low', 'Medium', 'High', 'Urgent']
