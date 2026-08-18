import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { EDITORIAL_STATUS_LABELS } from '../types'
import type { EditorialPlanItem } from '../types'

interface Props {
  pageId: string
}

const STATUS_STYLES: Record<string, string> = {
  idea: 'bg-white text-brand-600 border border-brand-200',
  da_fare: 'bg-brand-50 text-brand-600',
  programmato: 'bg-brand-100 text-brand-700',
  pubblicato: 'bg-brand-400 text-white font-medium',
}

function NoteEditor({ item, onSaved }: { item: EditorialPlanItem; onSaved: () => void }) {
  const [note, setNote] = useState(item.client_note ?? '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  async function handleSave() {
    setSaving(true)
    setSaved(false)
    const { error } = await supabase.rpc('submit_client_note', { p_item_id: item.id, p_note: note.trim() || null })
    setSaving(false)
    if (!error) {
      setSaved(true)
      onSaved()
    }
  }

  return (
    <div className="space-y-1">
      <label className="text-xs text-neutral-500">La tua nota</label>
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
          onClick={handleSave}
          disabled={saving}
          className="rounded-lg bg-brand-500 px-3 py-1.5 text-xs font-medium text-white shadow-sm shadow-brand-300/60 hover:bg-brand-600 disabled:opacity-50"
        >
          {saving ? 'Salvataggio…' : 'Salva nota'}
        </button>
        {saved && <span className="text-xs font-medium text-brand-600">Salvata ✓</span>}
      </div>
    </div>
  )
}

export function ClientEditorialPlan({ pageId }: Props) {
  const [items, setItems] = useState<EditorialPlanItem[]>([])
  const [loading, setLoading] = useState(true)

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

  if (items.length === 0) {
    return <p className="py-8 text-center text-sm text-neutral-500">Nessun contenuto pianificato al momento.</p>
  }

  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li key={item.id} className="space-y-3 rounded-2xl border border-brand-100 bg-white p-5 shadow-sm shadow-brand-100/50">
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

          {item.title && <p className="font-semibold text-neutral-900">{item.title}</p>}
          {item.image_url && (
            <a href={item.image_url} target="_blank" rel="noreferrer" className="text-sm text-brand-600 underline">
              Vedi immagine/materiale
            </a>
          )}
          {item.caption && <p className="whitespace-pre-wrap text-sm text-neutral-700">{item.caption}</p>}

          <NoteEditor item={item} onSaved={loadItems} />
        </li>
      ))}
    </ul>
  )
}
