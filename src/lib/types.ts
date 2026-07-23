export type TaskStatus =
  | 'Not Started'
  | 'In Progress'
  | 'Waiting / Blocked'
  | 'In Review'
  | 'Completed'

export type TaskPriority = 'Low' | 'Medium' | 'High' | 'Urgent'

export interface AdminUser {
  id: string
  auth_user_id: string
  email: string
  created_at: string
}

/** An internal organizational record only — never an authenticated user. */
export interface TeamMember {
  id: string
  name: string
  title: string | null
  avatar_url: string | null
  archived: boolean
  created_at: string
  updated_at: string
}

export interface Folder {
  id: string
  name: string
  description: string | null
  owner_id: string | null
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
  archived: boolean
  created_at: string
  updated_at: string
}

export interface TaskAttachment {
  id: string
  task_id: string
  file_name: string
  file_path: string
  file_size: number
  mime_type: string | null
  created_at: string
}

export interface TaskNote {
  id: string
  task_id: string
  body: string
  created_at: string
  updated_at: string
}

export type TaskActivityType =
  | 'created'
  | 'status_changed'
  | 'deadline_changed'
  | 'priority_changed'
  | 'assignment_changed'
  | 'completed'
  | 'archived'
  | 'attachment_added'
  | 'note_added'

export interface TaskActivity {
  id: string
  task_id: string
  type: TaskActivityType
  message: string
  created_at: string
}

export type NotificationType = 'due_today' | 'due_tomorrow' | 'due_soon' | 'overdue' | 'stale_blocked'

export interface AppNotification {
  id: string
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

export const MAX_ATTACHMENT_SIZE_BYTES = 20 * 1024 * 1024 // 20MB
