import { Users } from 'lucide-react'
import { useDataStore } from '@/store/dataStore'
import { FolderTree } from '@/components/folders/FolderTree'
import { Avatar } from '@/components/ui/Avatar'

export function ExplorerPage() {
  const teamMembers = useDataStore((s) => s.teamMembers)
  const folders = useDataStore((s) => s.folders)
  const tasks = useDataStore((s) => s.tasks)

  const activeMembers = teamMembers.filter((m) => !m.archived)
  const generalRoots = folders.filter((f) => f.owner_id === null && f.parent_folder_id === null)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-ink-900">Projects</h1>
        <p className="mt-1 text-sm text-ink-500">Every folder across the studio, organized by team member.</p>
      </div>

      {activeMembers.map((p) => {
        const roots = folders.filter((f) => f.owner_id === p.id && f.parent_folder_id === null)
        return (
          <div key={p.id}>
            <div className="mb-2 flex items-center gap-2">
              <Avatar name={p.name} size="sm" />
              <h2 className="text-sm font-semibold text-ink-800">{p.name}'s workspace</h2>
            </div>
            <FolderTree rootFolders={roots} allFolders={folders} tasks={tasks} ownerId={p.id} />
          </div>
        )
      })}

      <div>
        <div className="mb-2 flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-ink-100 text-ink-500">
            <Users size={13} />
          </div>
          <h2 className="text-sm font-semibold text-ink-800">General projects</h2>
        </div>
        <FolderTree rootFolders={generalRoots} allFolders={folders} tasks={tasks} ownerId={null} />
      </div>
    </div>
  )
}
