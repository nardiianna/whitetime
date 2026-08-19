import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { EDITORIAL_STATUS_LABELS } from '../types'
import type { EditorialPlanItem, Page } from '../types'
import { addMonths, getMonthStart, isInMonth, monthLabel } from '../lib/date'

interface Props {
  pageId: string
  page: Page
}

const STATUS_STYLES: Record<string, string> = {
  idea: 'bg-white text-brand-600 border border-brand-200',
  da_fare: 'bg-brand-50 text-brand-600',
  programmato: 'bg-brand-100 text-brand-700',
  pubblicato: 'bg-brand-400 text-white font-medium',
}

function PostHeader({ page }: { page: Page }) {
  const avatarUrl = page.avatar_path ? supabase.storage.from('media').getPublicUrl(page.avatar_path).data.publicUrl : null
  const handle = page.instagram_username || page.name

  return (
    <div className="flex items-center gap-2.5 p-3">
      {avatarUrl ? (
        <img src={avatarUrl} alt="" className="h-8 w-8 rounded-full object-cover" />
      ) : (
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-200 text-xs font-semibold text-brand-700">
          {page.name.charAt(0).toUpperCase()}
        </div>
      )}
      <span className="text-sm font-semibold text-neutral-900">{handle}</span>
    </div>
  )
}

function ImageCarousel({ urls }: { urls: string[] }) {
  const [index, setIndex] = useState(0)

  if (urls.length === 0) return null

  return (
    <div className="relative overflow-hidden bg-neutral-100">
      <div
        className="flex transition-transform duration-300 ease-out"
        style={{ transform: `translateX(-${index * 100}%)` }}
      >
        {urls.map((url, i) => (
          <img key={i} src={url} alt="" className="aspect-[4/5] w-full shrink-0 object-cover" />
        ))}
      </div>

      {urls.length > 1 && (
        <>
          <button
            onClick={() => setIndex((i) => (i - 1 + urls.length) % urls.length)}
            aria-label="Foto precedente"
            className="absolute left-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-neutral-800 shadow-sm hover:bg-white"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => setIndex((i) => (i + 1) % urls.length)}
            aria-label="Foto successiva"
            className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-neutral-800 shadow-sm hover:bg-white"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <div className="absolute bottom-2.5 left-1/2 flex -translate-x-1/2 gap-1.5">
            {urls.map((_, i) => (
              <span
                key={i}
                className={`h-1.5 w-1.5 rounded-full transition-colors ${i === index ? 'bg-white' : 'bg-white/50'}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function ApprovalAndNote({ item, onSaved }: { item: EditorialPlanItem; onSaved: () => void }) {
  const [note, setNote] = useState(item.client_note ?? '')
  const [approved, setApproved] = useState(item.approved)
  const [savingNote, setSavingNote] = useState(false)
  const [saved, setSaved] = useState(false)

  async function toggleApproved() {
    const next = !approved
    setApproved(next)
    await supabase.rpc('submit_client_approval', { p_item_id: item.id, p_approved: next })
    onSaved()
  }

  async function handleSaveNote() {
    setSavingNote(true)
    setSaved(false)
    const { error } = await supabase.rpc('submit_client_note', { p_item_id: item.id, p_note: note.trim() || null })
    setSavingNote(false)
    if (!error) {
      setSaved(true)
      onSaved()
    }
  }

  return (
    <div className="space-y-3 border-t border-brand-100 pt-3">
      <button
        onClick={toggleApproved}
        className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
          approved
            ? 'border-green-200 bg-green-50 text-green-700'
            : 'border-brand-200 bg-white text-neutral-600 hover:bg-brand-50'
        }`}
      >
        <span
          className={`flex h-5 w-5 items-center justify-center rounded-full border ${
            approved ? 'border-green-500 bg-green-500 text-white' : 'border-neutral-300'
          }`}
        >
          {approved && '✓'}
        </span>
        {approved ? 'Approvato' : 'Approvo questo contenuto'}
      </button>

      <div className="space-y-1">
        <label className="text-xs font-medium text-neutral-500">Vuoi chiedere una modifica? Scrivi qui</label>
        <textarea
          value={note}
          onChange={(e) => {
            setNote(e.target.value)
            setSaved(false)
          }}
          rows={2}
          placeholder="Scrivi qui un commento o una richiesta per questo contenuto…"
          className="w-full rounded-lg border border-brand-200 bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
        />
        <div className="flex items-center gap-2">
          <button
            onClick={handleSaveNote}
            disabled={savingNote}
            className="rounded-lg bg-brand-500 px-3 py-1.5 text-xs font-medium text-white shadow-sm shadow-brand-300/60 hover:bg-brand-600 disabled:opacity-50"
          >
            {savingNote ? 'Salvataggio…' : 'Salva nota'}
          </button>
          {saved && <span className="text-xs font-medium text-brand-600">Salvata ✓</span>}
        </div>
      </div>
    </div>
  )
}

export function ClientEditorialPlan({ pageId, page }: Props) {
  const [items, setItems] = useState<EditorialPlanItem[]>([])
  const [loading, setLoading] = useState(true)
  const [monthStart, setMonthStart] = useState(() => getMonthStart(new Date()))

  async function loadItems() {
    const { data } = await supabase
      .from('editorial_plan_items')
      .select('*')
      .eq('page_id', pageId)
      .order('scheduled_date', { ascending: true, nullsFirst: false })
    setItems(data ?? [])
    setLoading(false)
  }

  useEffect(() => {
    loadItems()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageId])

  if (loading) return null

  const monthItems = items.filter((i) => i.scheduled_date && isInMonth(i.scheduled_date, monthStart))

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMonthStart((m) => addMonths(m, -1))}
            className="rounded-lg border border-brand-200 bg-white p-1.5 text-brand-700 hover:bg-brand-50"
            aria-label="Mese precedente"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-sm font-medium text-neutral-800">{monthLabel(monthStart)}</span>
          <button
            onClick={() => setMonthStart((m) => addMonths(m, 1))}
            className="rounded-lg border border-brand-200 bg-white p-1.5 text-brand-700 hover:bg-brand-50"
            aria-label="Mese successivo"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
        <button
          onClick={() => setMonthStart(getMonthStart(new Date()))}
          className="rounded-full border border-brand-200 bg-white px-3 py-1 text-xs font-medium text-brand-700 hover:bg-brand-50"
        >
          Mese corrente
        </button>
      </div>

      {monthItems.length === 0 ? (
        <p className="py-8 text-center text-sm text-neutral-500">Nessun contenuto pianificato per questo mese.</p>
      ) : (
        <ul className="space-y-4">
          {monthItems.map((item) => {
            const imageUrls = item.image_paths.map(
              (path) => supabase.storage.from('media').getPublicUrl(path).data.publicUrl,
            )
            return (
              <li key={item.id} className="mx-auto w-full max-w-sm overflow-hidden rounded-2xl border border-brand-100 bg-white shadow-sm shadow-brand-100/50">
                <PostHeader page={page} />
                <ImageCarousel urls={imageUrls} />
                <div className="space-y-3 p-5">
                  <div className="flex flex-wrap items-center gap-2">
                    {item.scheduled_date && (
                      <span className="text-sm text-neutral-600">
                        {new Date(item.scheduled_date).toLocaleDateString('it-IT', {
                          weekday: 'long',
                          day: '2-digit',
                          month: '2-digit',
                        })}
                      </span>
                    )}
                    <span className={`rounded-full px-2 py-0.5 text-xs ${STATUS_STYLES[item.status]}`}>
                      {EDITORIAL_STATUS_LABELS[item.status]}
                    </span>
                    {item.social.map((s) => (
                      <span key={s} className="rounded-full bg-brand-50 px-2 py-0.5 text-xs text-brand-600">
                        {s}
                      </span>
                    ))}
                    {item.format && (
                      <span className="rounded-full bg-brand-50 px-2 py-0.5 text-xs text-brand-600">{item.format}</span>
                    )}
                  </div>

                  {item.theme && <p className="text-lg font-semibold text-neutral-900">{item.theme}</p>}
                  {item.image_url && (
                    <a href={item.image_url} target="_blank" rel="noreferrer" className="text-sm text-brand-600 underline">
                      Vedi materiale
                    </a>
                  )}
                  {item.caption && <p className="whitespace-pre-wrap text-base text-neutral-700">{item.caption}</p>}

                  <ApprovalAndNote item={item} onSaved={loadItems} />
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
