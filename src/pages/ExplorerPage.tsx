import { useAuthStore } from '@/store/authStore'
import { useDataStore } from '@/store/dataStore'
import { FolderTree } from '@/components/folders/FolderTree'
import { Avatar } from '@/components/ui/Avatar'

export function ExplorerPage() {
  const profile = useAuthStore((s) => s.profile)
  const profiles = useDataStore((s) => s.profiles)
  const folders = useDataStore((s) => s.folders)
  const tasks = useDataStore((s) => s.tasks)

  if (!profile) return null
  const isAdmin = profile.role === 'admin'

  if (!isAdmin) {
    const myRoots = folders.filter((f) => f.owner_id === profile.id && f.parent_folder_id === null)
    return (
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-semibold text-ink-900">Projects</h1>
          <p className="mt-1 text-sm text-ink-500">Your personal workspace of folders and subfolders.</p>
        </div>
        <FolderTree rootFolders={myRoots} allFolders={folders} tasks={tasks} ownerId={profile.id} canManage />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-ink-900">Projects</h1>
        <p className="mt-1 text-sm text-ink-500">Every team member's workspace, in one place.</p>
      </div>
      {profiles.map((p) => {
        const roots = folders.filter((f) => f.owner_id === p.id && f.parent_folder_id === null)
        return (
          <div key={p.id}>
            <div className="mb-2 flex items-center gap-2">
              <Avatar name={p.name} size="sm" />
              <h2 className="text-sm font-semibold text-ink-800">{p.name}'s workspace</h2>
            </div>
            <FolderTree rootFolders={roots} allFolders={folders} tasks={tasks} ownerId={p.id} canManage />
          </div>
        )
      })}
    </div>
  )
}
