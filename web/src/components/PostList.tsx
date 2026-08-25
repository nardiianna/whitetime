import { statusLabel } from '../types'
import type { Post } from '../types'

interface Props {
  posts: Post[]
  onEdit: (post: Post) => void
  onDelete: (post: Post) => void
  onMarkPublished: (post: Post) => void
  onDuplicate: (post: Post) => void
}

const STATUS_STYLES: Record<string, string> = {
  idea: 'bg-white text-neutral-800 border border-neutral-300',
  da_fare: 'bg-neutral-100 text-neutral-800',
  programmato: 'bg-neutral-200 text-neutral-700',
  promemoria_inviato: 'bg-neutral-300 text-neutral-900',
  pubblicato: 'bg-neutral-400 text-neutral-800 font-medium',
}

const STATUS_STYLES_PERSONAL: Record<string, string> = {
  idea: 'bg-white text-personal-600 border border-personal-200',
  da_fare: 'bg-personal-50 text-personal-600',
  programmato: 'bg-personal-100 text-personal-700',
  promemoria_inviato: 'bg-personal-200 text-personal-800',
  pubblicato: 'bg-personal-300 text-neutral-800 font-medium',
}

export function PostList({ posts, onEdit, onDelete, onMarkPublished, onDuplicate }: Props) {
  if (posts.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-neutral-500">
        Nessun post pianificato. Aggiungine uno con "+ Nuovo post".
      </p>
    )
  }

  return (
    <ul className="space-y-2">
      {posts.map((post) => {
        const isPersonal = post.page?.type === 'personal'
        return (
          <li
            key={post.id}
            className={`flex flex-col gap-3 rounded-xl border bg-white p-4 shadow-sm transition-colors sm:flex-row sm:items-center ${
              isPersonal ? 'border-personal-100 hover:border-personal-300' : 'border-neutral-200 hover:border-neutral-400'
            }`}
          >
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`font-semibold ${isPersonal ? 'text-personal-700' : 'text-neutral-900'}`}>
                  {post.page?.name ?? 'Cliente'}
                </span>
                <span className="text-sm text-neutral-600">
                  {new Date(post.scheduled_at).toLocaleString('it-IT', {
                    weekday: 'short',
                    day: '2-digit',
                    month: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs ${
                    isPersonal ? STATUS_STYLES_PERSONAL[post.status] : STATUS_STYLES[post.status]
                  }`}
                >
                  {statusLabel(post.status, isPersonal)}
                </span>
                {post.category?.name && (
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs ${
                      isPersonal ? 'bg-personal-50 text-personal-600' : 'bg-neutral-100 text-neutral-800'
                    }`}
                  >
                    {post.category.name}
                  </span>
                )}
                {post.reminder_error && (
                  <span
                    className="rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-700"
                    title={post.reminder_error}
                  >
                    ⚠️ Promemoria non inviato
                  </span>
                )}
              </div>
              <p className="truncate text-sm text-neutral-600">
                {post.caption || '(nessuna caption)'}
              </p>
            </div>
            <div className="flex flex-wrap gap-2 sm:shrink-0">
              {post.status !== 'pubblicato' && (
                <button
                  onClick={() => onMarkPublished(post)}
                  className={`rounded-md border px-2 py-1 text-xs ${
                    isPersonal ? 'border-personal-200 text-personal-700' : 'border-neutral-300 text-neutral-700'
                  }`}
                >
                  {isPersonal ? 'Segna fatto' : 'Segna pubblicato'}
                </button>
              )}
              <button
                onClick={() => onEdit(post)}
                className={`rounded-md border px-2 py-1 text-xs ${
                  isPersonal ? 'border-personal-200 text-personal-700' : 'border-neutral-300 text-neutral-700'
                }`}
              >
                Modifica
              </button>
              <button
                onClick={() => onDuplicate(post)}
                className={`rounded-md border px-2 py-1 text-xs ${
                  isPersonal ? 'border-personal-200 text-personal-700' : 'border-neutral-300 text-neutral-700'
                }`}
              >
                Duplica
              </button>
              <button
                onClick={() => onDelete(post)}
                className={`rounded-md border px-2 py-1 text-xs ${
                  isPersonal ? 'border-personal-300 text-personal-800' : 'border-neutral-400 text-neutral-900'
                }`}
              >
                Elimina
              </button>
            </div>
          </li>
        )
      })}
    </ul>
  )
}
