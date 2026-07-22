import { useState } from 'react'
import { Plus } from 'lucide-react'
import type { Folder, Task } from '@/lib/types'
import { FolderNode } from './FolderNode'
import { FolderFormModal } from './FolderFormModal'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { FolderKanban } from 'lucide-react'

export function FolderTree({
  rootFolders,
  allFolders,
  tasks,
  ownerId,
  canManage,
}: {
  rootFolders: Folder[]
  allFolders: Folder[]
  tasks: Task[]
  ownerId: string
  canManage: boolean
}) {
  const [creating, setCreating] = useState(false)

  return (
    <div>
      <div className="mb-2 flex justify-end">
        {canManage && (
          <Button size="sm" variant="secondary" onClick={() => setCreating(true)}>
            <Plus size={14} />
            New folder
          </Button>
        )}
      </div>

      {rootFolders.length === 0 ? (
        <EmptyState
          icon={FolderKanban}
          title="No folders yet"
          description="Create a folder to start organizing tasks."
          action={
            canManage && (
              <Button size="sm" onClick={() => setCreating(true)}>
                <Plus size={14} />
                New folder
              </Button>
            )
          }
        />
      ) : (
        <div className="space-y-0.5 rounded-2xl border border-ink-200 bg-white p-2">
          {rootFolders.map((folder) => (
            <FolderNode key={folder.id} folder={folder} folders={allFolders} tasks={tasks} depth={0} canManage={canManage} />
          ))}
        </div>
      )}

      <FolderFormModal open={creating} onClose={() => setCreating(false)} ownerId={ownerId} parentFolderId={null} />
    </div>
  )
}
