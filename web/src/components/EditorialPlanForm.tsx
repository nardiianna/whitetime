import { useState } from 'react'
import type { FormEvent } from 'react'
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
      setError(err instanceof Error ? err.message : 'Errore durante il salvataggio')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-brand-200 bg-white p-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-sm text-neutral-600">Data</label>
          <input
            type="date"
            value={scheduledDate}
            onChange={(e) => setScheduledDate(e.target.value)}
            className="w-full rounded-md border border-brand-200 bg-white px-3 py-2 text-sm focus:border-brand-400 outline-none"
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm text-neutral-600">Stato</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as EditorialStatus)}
            className="w-full rounded-md border border-brand-200 bg-white px-3 py-2 text-sm focus:border-brand-400 outline-none"
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
          <label className="text-sm text-neutral-600">Social (separati da virgola)</label>
          <input
            value={social}
            onChange={(e) => setSocial(e.target.value)}
            placeholder="Instagram, TikTok"
            className="w-full rounded-md border border-brand-200 bg-white px-3 py-2 text-sm focus:border-brand-400 outline-none"
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm text-neutral-600">Formato</label>
          <input
            value={format}
            onChange={(e) => setFormat(e.target.value)}
            placeholder="Carosello, Reel, Pin…"
            className="w-full rounded-md border border-brand-200 bg-white px-3 py-2 text-sm focus:border-brand-400 outline-none"
          />
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-sm text-neutral-600">Tema</label>
        <input
          value={theme}
          onChange={(e) => setTheme(e.target.value)}
          className="w-full rounded-md border border-brand-200 bg-white px-3 py-2 text-sm focus:border-brand-400 outline-none"
        />
      </div>

      <div className="space-y-1">
        <label className="text-sm text-neutral-600">Titolo / Argomento</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full rounded-md border border-brand-200 bg-white px-3 py-2 text-sm focus:border-brand-400 outline-none"
        />
      </div>

      <div className="space-y-1">
        <label className="text-sm text-neutral-600">Caption</label>
        <textarea
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          rows={3}
          className="w-full rounded-md border border-brand-200 bg-white px-3 py-2 text-sm focus:border-brand-400 outline-none"
        />
      </div>

      <div className="space-y-1">
        <label className="text-sm text-neutral-600">URL immagine (Drive o link diretto)</label>
        <input
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          placeholder="https://drive.google.com/…"
          className="w-full rounded-md border border-brand-200 bg-white px-3 py-2 text-sm focus:border-brand-400 outline-none"
        />
      </div>

      <div className="space-y-1">
        <label className="text-sm text-neutral-600">Note interne (non visibili al cliente)</label>
        <textarea
          value={internalNote}
          onChange={(e) => setInternalNote(e.target.value)}
          rows={2}
          className="w-full rounded-md border border-brand-200 bg-white px-3 py-2 text-sm focus:border-brand-400 outline-none"
        />
      </div>

      {item?.client_note && (
        <div className="space-y-1 rounded-md bg-brand-50 p-3">
          <p className="text-xs font-semibold text-brand-600">Nota del cliente</p>
          <p className="text-sm text-neutral-800">{item.client_note}</p>
        </div>
      )}

      {error && <p className="text-sm text-brand-700">{error}</p>}

      <div className="flex items-center justify-between gap-2">
        {item && onDelete ? (
          <button
            type="button"
            onClick={onDelete}
            className="rounded-md border border-red-200 px-3 py-2 text-sm text-red-700"
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
            className="rounded-md border border-brand-200 px-3 py-2 text-sm text-brand-700"
          >
            Annulla
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded-md bg-brand-300 px-3 py-2 text-sm font-medium text-neutral-800 hover:bg-brand-400 disabled:opacity-50"
          >
            {saving ? 'Salvataggio…' : 'Salva'}
          </button>
        </div>
      </div>
    </form>
  )
}
