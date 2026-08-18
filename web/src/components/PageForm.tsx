import { useState } from 'react'
import type { FormEvent } from 'react'
import { supabase } from '../lib/supabase'
import type { Page } from '../types'
import { ClientAccessForm } from './ClientAccessForm'

interface Props {
  page?: Page
  onSaved: () => void
  onCancel: () => void
  onDelete?: () => void
}

export function PageForm({ page, onSaved, onCancel, onDelete }: Props) {
  const [name, setName] = useState(page?.name ?? '')
  const [instagramUsername, setInstagramUsername] = useState(page?.instagram_username ?? '')
  const [notes, setNotes] = useState(page?.notes ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      const payload = {
        name: name.trim(),
        instagram_username: instagramUsername.trim() || null,
        notes: notes.trim() || null,
      }
      const { error: saveError } = page
        ? await supabase.from('pages').update(payload).eq('id', page.id)
        : await supabase.from('pages').insert(payload)
      if (saveError) throw saveError
      onSaved()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore durante il salvataggio')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <form
        onSubmit={handleSubmit}
        className="space-y-4 rounded-2xl border border-brand-100 bg-white p-5 shadow-sm shadow-brand-100/50"
      >
      <div className="space-y-1">
        <label className="text-sm font-medium text-neutral-700">Nome cliente</label>
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Es. Nome pagina/attività"
          className="w-full rounded-lg border border-brand-200 bg-white px-3 py-2.5 text-sm text-neutral-800 outline-none transition-colors focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
        />
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium text-neutral-700">Username Instagram (opzionale)</label>
        <input
          value={instagramUsername}
          onChange={(e) => setInstagramUsername(e.target.value)}
          placeholder="Es. nome.pagina"
          className="w-full rounded-lg border border-brand-200 bg-white px-3 py-2.5 text-sm text-neutral-800 outline-none transition-colors focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
        />
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium text-neutral-700">Note (opzionale)</label>
        <input
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full rounded-lg border border-brand-200 bg-white px-3 py-2.5 text-sm text-neutral-800 outline-none transition-colors focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
        />
      </div>

      {error && <p className="text-sm text-brand-700">{error}</p>}

      <div className="flex items-center justify-between gap-2 border-t border-brand-100 pt-4">
        {page && onDelete ? (
          <button
            type="button"
            onClick={onDelete}
            className="rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50"
          >
            Elimina cliente
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
      {page && page.type !== 'personal' && <ClientAccessForm pageId={page.id} />}
    </div>
  )
}
