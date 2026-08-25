import type { Post } from '../types'
import { monthLabel } from '../lib/date'

interface Props {
  posts: Post[]
  monthStart: Date
  onPrevMonth: () => void
  onNextMonth: () => void
  onToday: () => void
  onDayClick: (date: Date) => void
  onQuickAdd: (date: Date) => void
}

const STATUS_DOT: Record<string, string> = {
  idea: 'border border-brand-300 bg-white',
  da_fare: 'bg-brand-200',
  programmato: 'bg-brand-400',
  promemoria_inviato: 'bg-brand-600',
  pubblicato: 'bg-brand-800',
}

const STATUS_DOT_PERSONAL: Record<string, string> = {
  idea: 'border border-personal-300 bg-white',
  da_fare: 'bg-personal-200',
  programmato: 'bg-personal-400',
  promemoria_inviato: 'bg-personal-600',
  pubblicato: 'bg-personal-800',
}

const WEEKDAY_LABELS = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom']
const MAX_DOTS = 4

function addDays(date: Date, days: number) {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

function getMonday(date: Date) {
  const d = new Date(date)
  const day = d.getDay()
  const diff = (day === 0 ? -6 : 1) - day
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

export function MonthCalendar({ posts, monthStart, onPrevMonth, onNextMonth, onToday, onDayClick, onQuickAdd }: Props) {
  const today = new Date()
  const gridStart = getMonday(monthStart)
  const days = Array.from({ length: 42 }, (_, i) => addDays(gridStart, i))

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <button
          onClick={onPrevMonth}
          className="rounded-lg border border-brand-200 bg-white px-2.5 py-1.5 text-sm text-brand-700 hover:bg-brand-50"
          aria-label="Mese precedente"
        >
          ‹
        </button>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium capitalize text-neutral-800">{monthLabel(monthStart)}</span>
          <button
            onClick={onToday}
            className="rounded-full border border-brand-200 bg-white px-3 py-1 text-xs font-medium text-brand-700 hover:bg-brand-50"
          >
            Oggi
          </button>
        </div>
        <button
          onClick={onNextMonth}
          className="rounded-lg border border-brand-200 bg-white px-2.5 py-1.5 text-sm text-brand-700 hover:bg-brand-50"
          aria-label="Mese successivo"
        >
          ›
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-medium text-neutral-500">
        {WEEKDAY_LABELS.map((label) => (
          <span key={label}>{label}</span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map((day) => {
          const inMonth = day.getMonth() === monthStart.getMonth()
          const isToday = isSameDay(day, today)
          const dayPosts = posts.filter((post) => isSameDay(new Date(post.scheduled_at), day))

          return (
            <button
              key={day.toISOString()}
              onClick={() => (dayPosts.length > 0 ? onDayClick(day) : onQuickAdd(day))}
              className={`group flex min-h-[64px] flex-col items-start gap-1 rounded-lg border p-1.5 text-left transition-colors ${
                inMonth ? 'border-brand-100 bg-white hover:border-brand-300' : 'border-transparent bg-neutral-50 text-neutral-300'
              }`}
            >
              <span
                className={`flex h-5 w-5 items-center justify-center rounded-full text-xs ${
                  isToday ? 'bg-brand-500 font-semibold text-white' : inMonth ? 'text-neutral-700' : 'text-neutral-300'
                }`}
              >
                {day.getDate()}
              </span>
              {dayPosts.length > 0 && (
                <div className="flex flex-wrap gap-0.5">
                  {dayPosts.slice(0, MAX_DOTS).map((post) => {
                    const isPersonal = post.page?.type === 'personal'
                    return (
                      <span
                        key={post.id}
                        className={`h-1.5 w-1.5 rounded-full ${
                          isPersonal ? STATUS_DOT_PERSONAL[post.status] : STATUS_DOT[post.status]
                        }`}
                      />
                    )
                  })}
                  {dayPosts.length > MAX_DOTS && (
                    <span className="text-[9px] leading-[6px] text-neutral-400">+{dayPosts.length - MAX_DOTS}</span>
                  )}
                </div>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
