import { useMemo, useState } from 'react'
import { Search, FolderKanban, ListChecks, X } from 'lucide-react'
import { useDataStore } from '@/store/dataStore'
import { useNavigate } from 'react-router-dom'
import { StatusBadge } from '@/components/ui/Badge'

export function GlobalSearch() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const tasks = useDataStore((s) => s.tasks)
  const folders = useDataStore((s) => s.folders)
  const navigate = useNavigate()

  const results = useMemo(() => {
    if (!query.trim()) return { folders: [], tasks: [] }
    const q = query.toLowerCase()
    return {
      folders: folders.filter((f) => f.name.toLowerCase().includes(q)).slice(0, 6),
      tasks: tasks.filter((t) => t.title.toLowerCase().includes(q)).slice(0, 8),
    }
  }, [query, folders, tasks])

  function close() {
    setOpen(false)
    setQuery('')
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex w-full max-w-sm items-center gap-2 rounded-xl border border-ink-200 bg-white px-3 py-2 text-sm text-ink-400 hover:border-ink-300"
      >
        <Search size={16} />
        Search tasks and folders...
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-ink-900/40 p-4 pt-20" onClick={close}>
          <div
            className="animate-fade-in w-full max-w-lg rounded-2xl bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 border-b border-ink-100 px-4 py-3">
              <Search size={18} className="text-ink-400" />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search tasks and folders..."
                className="flex-1 text-sm outline-none placeholder:text-ink-400"
              />
              <button onClick={close} className="rounded-lg p-1 text-ink-400 hover:bg-ink-100">
                <X size={16} />
              </button>
            </div>
            <div className="max-h-96 overflow-y-auto p-2">
              {query.trim() && results.folders.length === 0 && results.tasks.length === 0 && (
                <p className="px-3 py-8 text-center text-sm text-ink-400">No results found.</p>
              )}
              {results.folders.length > 0 && (
                <div className="mb-2">
                  <p className="px-3 py-1 text-xs font-semibold text-ink-400">Folders</p>
                  {results.folders.map((f) => (
                    <button
                      key={f.id}
                      onClick={() => {
                        navigate(`/folders/${f.id}`)
                        close()
                      }}
                      className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm hover:bg-ink-50"
                    >
                      <FolderKanban size={16} className="text-ink-400" />
                      {f.name}
                    </button>
                  ))}
                </div>
              )}
              {results.tasks.length > 0 && (
                <div>
                  <p className="px-3 py-1 text-xs font-semibold text-ink-400">Tasks</p>
                  {results.tasks.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => {
                        navigate(`/folders/${t.folder_id}?task=${t.id}`)
                        close()
                      }}
                      className="flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-sm hover:bg-ink-50"
                    >
                      <span className="flex min-w-0 items-center gap-3">
                        <ListChecks size={16} className="shrink-0 text-ink-400" />
                        <span className="truncate">{t.title}</span>
                      </span>
                      <StatusBadge status={t.status} className="shrink-0" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
