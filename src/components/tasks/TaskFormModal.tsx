import { useEffect, useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input, Select, Textarea, FieldWrap } from '@/components/ui/Field'
import { useDataStore } from '@/store/dataStore'
import { useAuthStore } from '@/store/authStore'
import { TASK_PRIORITIES, TASK_STATUSES, type Task } from '@/lib/types'

export function TaskFormModal({
  open,
  onClose,
  task,
  defaultFolderId,
  defaultTaskListId,
}: {
  open: boolean
  onClose: () => void
  task?: Task | null
  defaultFolderId?: string
  defaultTaskListId?: string | null
}) {
  const profile = useAuthStore((s) => s.profile)
  const folders = useDataStore((s) => s.folders)
  const taskLists = useDataStore((s) => s.taskLists)
  const profiles = useDataStore((s) => s.profiles)
  const createTask = useDataStore((s) => s.createTask)
  const updateTask = useDataStore((s) => s.updateTask)

  const eligibleFolders = profile?.role === 'admin' ? folders : folders.filter((f) => f.owner_id === profile?.id)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [assignedUserId, setAssignedUserId] = useState('')
  const [folderId, setFolderId] = useState('')
  const [taskListId, setTaskListId] = useState('')
  const [status, setStatus] = useState<Task['status']>('Not Started')
  const [priority, setPriority] = useState<Task['priority']>('Medium')
  const [startDate, setStartDate] = useState('')
  const [deadline, setDeadline] = useState('')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!open) return
    if (task) {
      setTitle(task.title)
      setDescription(task.description || '')
      setAssignedUserId(task.assigned_user_id || '')
      setFolderId(task.folder_id)
      setTaskListId(task.task_list_id || '')
      setStatus(task.status)
      setPriority(task.priority)
      setStartDate(task.start_date || '')
      setDeadline(task.deadline ? task.deadline.slice(0, 10) : '')
      setNotes(task.notes || '')
    } else {
      setTitle('')
      setDescription('')
      setAssignedUserId(profile?.id || '')
      setFolderId(defaultFolderId || eligibleFolders[0]?.id || '')
      setTaskListId(defaultTaskListId || '')
      setStatus('Not Started')
      setPriority('Medium')
      setStartDate('')
      setDeadline('')
      setNotes('')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, task])

  const listsForFolder = taskLists.filter((tl) => tl.folder_id === folderId)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim() || !folderId) return
    setSubmitting(true)
    const patch = {
      title: title.trim(),
      description: description.trim() || null,
      assigned_user_id: assignedUserId || null,
      folder_id: folderId,
      task_list_id: taskListId || null,
      status,
      priority,
      start_date: startDate || null,
      deadline: deadline ? new Date(deadline).toISOString() : null,
      notes: notes.trim() || null,
    }
    if (task) {
      await updateTask(task.id, patch)
    } else {
      await createTask(patch)
    }
    setSubmitting(false)
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title={task ? 'Edit task' : 'New task'} width="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <FieldWrap label="Title">
          <Input value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="e.g. Design homepage hero" />
        </FieldWrap>

        <FieldWrap label="Description (optional)">
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="Add more detail..." />
        </FieldWrap>

        <div className="grid grid-cols-2 gap-4">
          <FieldWrap label="Folder">
            <Select
              value={folderId}
              onChange={(e) => {
                setFolderId(e.target.value)
                setTaskListId('')
              }}
              required
            >
              {eligibleFolders.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </Select>
          </FieldWrap>
          <FieldWrap label="Task list (optional)">
            <Select value={taskListId} onChange={(e) => setTaskListId(e.target.value)}>
              <option value="">No list</option>
              {listsForFolder.map((tl) => (
                <option key={tl.id} value={tl.id}>
                  {tl.name}
                </option>
              ))}
            </Select>
          </FieldWrap>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FieldWrap label="Assigned to">
            <Select value={assignedUserId} onChange={(e) => setAssignedUserId(e.target.value)}>
              <option value="">Unassigned</option>
              {profiles.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </Select>
          </FieldWrap>
          <FieldWrap label="Status">
            <Select value={status} onChange={(e) => setStatus(e.target.value as Task['status'])}>
              {TASK_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
          </FieldWrap>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <FieldWrap label="Priority">
            <Select value={priority} onChange={(e) => setPriority(e.target.value as Task['priority'])}>
              {TASK_PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </Select>
          </FieldWrap>
          <FieldWrap label="Start date">
            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </FieldWrap>
          <FieldWrap label="Deadline">
            <Input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
          </FieldWrap>
        </div>

        <FieldWrap label="Notes (optional)">
          <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Any extra notes..." />
        </FieldWrap>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? 'Saving...' : task ? 'Save changes' : 'Create task'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
