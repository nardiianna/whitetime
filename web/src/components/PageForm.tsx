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
    <>
      <form
        onSubmit={handleSubmit}
        className="space-y-4 rounded-xl border border-brand-200 bg-white p-4"
      >
      <div className="space-y-1">
        <label className="text-sm text-neutral-600">Nome cliente</label>
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Es. Nome pagina/attività"
          className="w-full rounded-md border border-brand-200 bg-white px-3 py-2 text-sm focus:border-brand-400 outline-none"
        />
      </div>

      <div className="space-y-1">
        <label className="text-sm text-neutral-600">Username Instagram (opzionale)</label>
        <input
          value={instagramUsername}
          onChange={(e) => setInstagramUsername(e.target.value)}
          placeholder="Es. nome.pagina"
          className="w-full rounded-md border border-brand-200 bg-white px-3 py-2 text-sm focus:border-brand-400 outline-none"
        />
      </div>

      <div className="space-y-1">
        <label className="text-sm text-neutral-600">Note (opzionale)</label>
        <input
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full rounded-md border border-brand-200 bg-white px-3 py-2 text-sm focus:border-brand-400 outline-none"
        />
      </div>

      {error && <p className="text-sm text-brand-700">{error}</p>}

      <div className="flex items-center justify-between gap-2">
        {page && onDelete ? (
          <button
            type="button"
            onClick={onDelete}
            className="rounded-md border border-red-200 px-3 py-2 text-sm text-red-700"
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
      {page && page.type !== 'personal' && <ClientAccessForm pageId={page.id} />}
    </>
  )
}
