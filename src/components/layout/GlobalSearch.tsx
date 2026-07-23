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
        className="flex w-full max-w-sm items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-ink-400 hover:border-white/20"
      >
        <Search size={16} />
        Search tasks and projects...
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 p-4 pt-20" onClick={close}>
          <div
            className="glass animate-fade-in w-full max-w-lg rounded-2xl border border-white/10 shadow-soft-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 border-b border-white/8 px-4 py-3">
              <Search size={18} className="text-ink-400" />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search tasks and projects..."
                className="flex-1 bg-transparent text-sm text-ink-100 outline-none placeholder:text-ink-500"
              />
              <button onClick={close} className="rounded-lg p-1 text-ink-400 hover:bg-white/8">
                <X size={16} />
              </button>
            </div>
            <div className="max-h-96 overflow-y-auto p-2">
              {query.trim() && results.folders.length === 0 && results.tasks.length === 0 && (
                <p className="px-3 py-8 text-center text-sm text-ink-400">No results found.</p>
              )}
              {results.folders.length > 0 && (
                <div className="mb-2">
                  <p className="px-3 py-1 text-xs font-semibold text-ink-500">Projects</p>
                  {results.folders.map((f) => (
                    <button
                      key={f.id}
                      onClick={() => {
                        navigate(`/projects/${f.id}`)
                        close()
                      }}
                      className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm text-ink-200 hover:bg-white/8"
                    >
                      <FolderKanban size={16} className="text-ink-400" />
                      {f.name}
                    </button>
                  ))}
                </div>
              )}
              {results.tasks.length > 0 && (
                <div>
                  <p className="px-3 py-1 text-xs font-semibold text-ink-500">Tasks</p>
                  {results.tasks.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => {
                        navigate(`/projects/${t.folder_id}?task=${t.id}`)
                        close()
                      }}
                      className="flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-sm text-ink-200 hover:bg-white/8"
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
