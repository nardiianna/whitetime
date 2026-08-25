import { statusLabel } from '../types'
import type { Post } from '../types'

interface Props {
  posts: Post[]
  weekStart: Date
  onPrevWeek: () => void
  onNextWeek: () => void
  onToday: () => void
  onEdit: (post: Post) => void
  onDelete: (post: Post) => void
  onMarkPublished: (post: Post) => void
  onDuplicate: (post: Post) => void
  onQuickAdd: (date: Date) => void
}

const STATUS_DOT: Record<string, string> = {
  idea: 'border border-neutral-400 bg-white',
  da_fare: 'bg-neutral-300',
  programmato: 'bg-neutral-500',
  promemoria_inviato: 'bg-neutral-800',
  pubblicato: 'bg-neutral-900',
}

const STATUS_DOT_PERSONAL: Record<string, string> = {
  idea: 'border border-personal-300 bg-white',
  da_fare: 'bg-personal-200',
  programmato: 'bg-personal-400',
  promemoria_inviato: 'bg-personal-600',
  pubblicato: 'bg-personal-800',
}

function addDays(date: Date, days: number) {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

export function WeekCalendar({
  posts,
  weekStart,
  onPrevWeek,
  onNextWeek,
  onToday,
  onEdit,
  onDelete,
  onMarkPublished,
  onDuplicate,
  onQuickAdd,
}: Props) {
  const today = new Date()
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
  const weekEnd = days[6]

  const rangeLabel = `${weekStart.toLocaleDateString('it-IT', { day: '2-digit', month: 'short' })} – ${weekEnd.toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' })}`

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <button
          onClick={onPrevWeek}
          className="rounded-lg border border-neutral-300 bg-white px-2.5 py-1.5 text-sm text-neutral-700 hover:bg-neutral-100"
          aria-label="Settimana precedente"
        >
          ‹
        </button>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-neutral-800">{rangeLabel}</span>
          <button
            onClick={onToday}
            className="rounded-full border border-neutral-300 bg-white px-3 py-1 text-xs font-medium text-neutral-700 hover:bg-neutral-100"
          >
            Oggi
          </button>
        </div>
        <button
          onClick={onNextWeek}
          className="rounded-lg border border-neutral-300 bg-white px-2.5 py-1.5 text-sm text-neutral-700 hover:bg-neutral-100"
          aria-label="Settimana successiva"
        >
          ›
        </button>
      </div>

      <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        <div className="flex gap-2">
          {days.map((day) => {
            const dayPosts = posts.filter((post) => isSameDay(new Date(post.scheduled_at), day))
            const isToday = isSameDay(day, today)

            return (
              <div key={day.toISOString()} className="min-w-[124px] flex-1 space-y-1.5">
                <div
                  className={`flex items-center justify-between rounded-md px-1.5 py-1 ${
                    isToday ? 'bg-neutral-200' : ''
                  }`}
                >
                  <span
                    className={`text-xs font-semibold capitalize ${
                      isToday ? 'text-neutral-700' : 'text-neutral-700'
                    }`}
                  >
                    {day.toLocaleDateString('it-IT', { weekday: 'short' })}{' '}
                    <span className="font-normal text-neutral-500">
                      {day.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit' })}
                    </span>
                  </span>
                  <button
                    onClick={() => onQuickAdd(day)}
                    className="rounded-full border border-dashed border-neutral-400 bg-white px-1.5 text-xs leading-5 text-neutral-700 hover:bg-neutral-100"
                    aria-label="Aggiungi post"
                  >
                    +
                  </button>
                </div>

                <div className="space-y-1.5">
                  {dayPosts.length === 0 && <p className="px-1.5 text-[11px] text-neutral-300">—</p>}
                  {dayPosts.map((post) => {
                    const isPersonal = post.page?.type === 'personal'
                    return (
                      <div
                        key={post.id}
                        onClick={() => onEdit(post)}
                        className={`cursor-pointer space-y-1 rounded-lg border bg-white p-2 text-xs shadow-sm transition-colors ${
                          isPersonal
                            ? 'border-personal-100 hover:border-personal-300'
                            : 'border-neutral-200 hover:border-neutral-400'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span
                            className={`truncate font-semibold ${
                              isPersonal ? 'text-personal-700' : 'text-neutral-900'
                            }`}
                          >
                            {post.page?.name ?? 'Cliente'}
                          </span>
                          <span
                            className={`h-2 w-2 shrink-0 rounded-full ${
                              isPersonal ? STATUS_DOT_PERSONAL[post.status] : STATUS_DOT[post.status]
                            }`}
                            title={statusLabel(post.status, isPersonal)}
                          />
                        </div>
                        <div className="flex items-center gap-1 text-[10px] text-neutral-500">
                          <span>
                            {new Date(post.scheduled_at).toLocaleTimeString('it-IT', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                          {post.category?.name && (
                            <span className={`truncate ${isPersonal ? 'text-personal-600' : 'text-neutral-800'}`}>
                              · {post.category.name}
                            </span>
                          )}
                        </div>
                        <p className="line-clamp-2 text-neutral-600">
                          {post.caption || '(nessuna descrizione)'}
                        </p>
                        {post.reminder_error && (
                          <span className="block text-[10px] text-red-700" title={post.reminder_error}>
                            ⚠️ non inviato
                          </span>
                        )}
                        <div
                          className={`flex gap-1.5 pt-0.5 text-[11px] ${
                            isPersonal ? 'text-personal-700' : 'text-neutral-700'
                          }`}
                          onClick={(e) => e.stopPropagation()}
                        >
                          {post.status !== 'pubblicato' && (
                            <button
                              onClick={() => onMarkPublished(post)}
                              title={isPersonal ? 'Segna fatto' : 'Segna pubblicato'}
                            >
                              ✓
                            </button>
                          )}
                          <button onClick={() => onDuplicate(post)} title="Duplica">
                            ⧉
                          </button>
                          <button
                            onClick={() => onDelete(post)}
                            title="Elimina"
                            className={isPersonal ? 'text-personal-800' : 'text-neutral-900'}
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
