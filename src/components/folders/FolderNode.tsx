import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronDown, ChevronRight, Folder as FolderIcon, FolderPlus, Pencil, Trash2 } from 'lucide-react'
import type { Folder, Task } from '@/lib/types'
import { getChildFolders, getFolderStats } from '@/lib/folderStats'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { cx } from '@/lib/utils'
import { useDataStore } from '@/store/dataStore'
import { FolderFormModal } from './FolderFormModal'

export function FolderNode({
  folder,
  folders,
  tasks,
  depth,
  canManage,
}: {
  folder: Folder
  folders: Folder[]
  tasks: Task[]
  depth: number
  canManage: boolean
}) {
  const [expanded, setExpanded] = useState(depth === 0)
  const [addingSubfolder, setAddingSubfolder] = useState(false)
  const [renaming, setRenaming] = useState(false)
  const navigate = useNavigate()
  const deleteFolder = useDataStore((s) => s.deleteFolder)

  const children = getChildFolders(folder.id, folders)
  const stats = getFolderStats(folder.id, folders, tasks)

  function handleDelete(e: React.MouseEvent) {
    e.stopPropagation()
    if (confirm(`Delete "${folder.name}" and everything inside it? This can't be undone.`)) {
      deleteFolder(folder.id)
    }
  }

  return (
    <div>
      <div
        className="group flex items-center gap-2 rounded-lg px-2 py-2 hover:bg-ink-100"
        style={{ paddingLeft: depth * 20 + 8 }}
      >
        <button
          onClick={() => setExpanded((e) => !e)}
          className={cx('shrink-0 rounded p-0.5 text-ink-400 hover:bg-ink-200', children.length === 0 && 'invisible')}
        >
          {expanded ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
        </button>

        <button onClick={() => navigate(`/folders/${folder.id}`)} className="flex min-w-0 flex-1 items-center gap-2 text-left">
          <FolderIcon size={16} className="shrink-0 text-brand-500" />
          <span className="truncate text-sm font-medium text-ink-800">{folder.name}</span>
          <span className="shrink-0 text-xs text-ink-400">{stats.active} active</span>
        </button>

        <div className="hidden w-20 shrink-0 items-center sm:flex">
          <ProgressBar value={stats.progress} size="sm" />
        </div>

        {canManage && (
          <div className="hidden shrink-0 items-center gap-0.5 group-hover:flex">
            <button
              onClick={(e) => {
                e.stopPropagation()
                setAddingSubfolder(true)
              }}
              className="rounded p-1 text-ink-400 hover:bg-ink-200 hover:text-ink-700"
              title="Add subfolder"
            >
              <FolderPlus size={14} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                setRenaming(true)
              }}
              className="rounded p-1 text-ink-400 hover:bg-ink-200 hover:text-ink-700"
              title="Rename"
            >
              <Pencil size={14} />
            </button>
            <button onClick={handleDelete} className="rounded p-1 text-ink-400 hover:bg-red-100 hover:text-red-600" title="Delete">
              <Trash2 size={14} />
            </button>
          </div>
        )}
      </div>

      {expanded && children.length > 0 && (
        <div>
          {children.map((child) => (
            <FolderNode key={child.id} folder={child} folders={folders} tasks={tasks} depth={depth + 1} canManage={canManage} />
          ))}
        </div>
      )}

      <FolderFormModal
        open={addingSubfolder}
        onClose={() => setAddingSubfolder(false)}
        ownerId={folder.owner_id}
        parentFolderId={folder.id}
      />
      <FolderFormModal open={renaming} onClose={() => setRenaming(false)} folder={folder} />
    </div>
  )
}
