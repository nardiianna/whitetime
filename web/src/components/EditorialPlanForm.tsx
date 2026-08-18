import { useState } from 'react'
import type { FormEvent } from 'react'
import { Calendar } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { EDITORIAL_STATUS_LABELS } from '../types'
import type { EditorialPlanItem, EditorialStatus } from '../types'

interface Props {
  pageId: string
  item?: EditorialPlanItem
  onSaved: () => void
  onCancel: () => void
  onDelete?: () => void
}

function errorMessage(err: unknown): string {
  if (err && typeof err === 'object' && 'message' in err) {
    const message = String((err as { message?: unknown }).message ?? '')
    const hint = 'hint' in err ? (err as { hint?: unknown }).hint : undefined
    return hint ? `${message} — ${hint}` : message || 'Errore durante il salvataggio'
  }
  return err instanceof Error ? err.message : 'Errore durante il salvataggio'
}

export function EditorialPlanForm({ pageId, item, onSaved, onCancel, onDelete }: Props) {
  const [scheduledDate, setScheduledDate] = useState(item?.scheduled_date ?? '')
  const [status, setStatus] = useState<EditorialStatus>(item?.status ?? 'idea')
  const [social, setSocial] = useState((item?.social ?? []).join(', '))
  const [theme, setTheme] = useState(item?.theme ?? '')
  const [format, setFormat] = useState(item?.format ?? '')
  const [title, setTitle] = useState(item?.title ?? '')
  const [caption, setCaption] = useState(item?.caption ?? '')
  const [imageUrl, setImageUrl] = useState(item?.image_url ?? '')
  const [internalNote, setInternalNote] = useState(item?.internal_note ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      const payload = {
        page_id: pageId,
        scheduled_date: scheduledDate || null,
        status,
        social: social
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        theme: theme.trim() || null,
        format: format.trim() || null,
        title: title.trim() || null,
        caption: caption.trim() || null,
        image_url: imageUrl.trim() || null,
        internal_note: internalNote.trim() || null,
      }
      const { error: saveError } = item
        ? await supabase.from('editorial_plan_items').update(payload).eq('id', item.id)
        : await supabase.from('editorial_plan_items').insert(payload)
      if (saveError) throw saveError
      onSaved()
    } catch (err) {
      console.error('Failed to save editorial plan item', err)
      setError(errorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 rounded-2xl border border-brand-100 bg-white p-5 shadow-sm shadow-brand-100/50">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-neutral-700">Data</label>
          <div className="relative">
            <Calendar className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-400" />
            <input
              type="date"
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
              className="w-full rounded-lg border border-brand-200 bg-white py-2.5 pl-9 pr-3 text-sm text-neutral-800 outline-none transition-colors focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
            />
          </div>
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium text-neutral-700">Stato</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as EditorialStatus)}
            className="w-full rounded-lg border border-brand-200 bg-white px-3 py-2.5 text-sm text-neutral-800 outline-none transition-colors focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
          >
            {(Object.keys(EDITORIAL_STATUS_LABELS) as EditorialStatus[]).map((value) => (
              <option key={value} value={value}>
                {EDITORIAL_STATUS_LABELS[value]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-sm font-medium text-neutral-700">Social (separati da virgola)</label>
          <input
            value={social}
            onChange={(e) => setSocial(e.target.value)}
            placeholder="Instagram, TikTok"
            className="w-full rounded-lg border border-brand-200 bg-white px-3 py-2.5 text-sm text-neutral-800 outline-none transition-colors focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium text-neutral-700">Formato</label>
          <input
            value={format}
            onChange={(e) => setFormat(e.target.value)}
            placeholder="Carosello, Reel, Pin…"
            className="w-full rounded-lg border border-brand-200 bg-white px-3 py-2.5 text-sm text-neutral-800 outline-none transition-colors focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
          />
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium text-neutral-700">Tema</label>
        <input
          value={theme}
          onChange={(e) => setTheme(e.target.value)}
          className="w-full rounded-lg border border-brand-200 bg-white px-3 py-2.5 text-sm text-neutral-800 outline-none transition-colors focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
        />
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium text-neutral-700">Titolo / Argomento</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full rounded-lg border border-brand-200 bg-white px-3 py-2.5 text-sm text-neutral-800 outline-none transition-colors focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
        />
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium text-neutral-700">Caption</label>
        <textarea
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          rows={3}
          className="w-full rounded-lg border border-brand-200 bg-white px-3 py-2.5 text-sm text-neutral-800 outline-none transition-colors focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
        />
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium text-neutral-700">URL immagine (Drive o link diretto)</label>
        <input
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          placeholder="https://drive.google.com/…"
          className="w-full rounded-lg border border-brand-200 bg-white px-3 py-2.5 text-sm text-neutral-800 outline-none transition-colors focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
        />
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium text-neutral-700">Note interne (non visibili al cliente)</label>
        <textarea
          value={internalNote}
          onChange={(e) => setInternalNote(e.target.value)}
          rows={2}
          className="w-full rounded-lg border border-brand-200 bg-white px-3 py-2.5 text-sm text-neutral-800 outline-none transition-colors focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
        />
      </div>

      {item?.client_note && (
        <div className="space-y-1 rounded-lg bg-brand-50 p-3">
          <p className="text-xs font-semibold text-brand-600">Nota del cliente</p>
          <p className="text-sm text-neutral-800">{item.client_note}</p>
        </div>
      )}

      {error && <p className="text-sm text-brand-700">{error}</p>}

      <div className="flex items-center justify-between gap-2 border-t border-brand-100 pt-4">
        {item && onDelete ? (
          <button
            type="button"
            onClick={onDelete}
            className="rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50"
          >
            Elimina
          </button>
        ) : (
          <span />
        )}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-brand-200 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-brand-50"
          >
            Annulla
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white shadow-sm shadow-brand-300/60 hover:bg-brand-600 disabled:opacity-50"
          >
            {saving ? 'Salvataggio…' : 'Salva'}
          </button>
        </div>
      </div>
    </form>
  )
}
