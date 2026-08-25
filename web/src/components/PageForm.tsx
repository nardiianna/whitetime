import { useState } from 'react'
import type { FormEvent } from 'react'
import { ImageUp, X } from 'lucide-react'
import { supabase } from '../lib/supabase'
import type { Page } from '../types'
import { ClientAccessForm } from './ClientAccessForm'
import { prepareImageFile } from '../lib/image'
import { useToast } from '../lib/toast'

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
  const [existingAvatarPath, setExistingAvatarPath] = useState(page?.avatar_path ?? null)
  const [removedAvatarPath, setRemovedAvatarPath] = useState<string | null>(null)
  const [newAvatarFile, setNewAvatarFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [preparingFile, setPreparingFile] = useState(false)
  const toast = useToast()

  const existingAvatarUrl = existingAvatarPath
    ? supabase.storage.from('media').getPublicUrl(existingAvatarPath).data.publicUrl
    : null

  function removeExistingAvatar() {
    if (existingAvatarPath) setRemovedAvatarPath(existingAvatarPath)
    setExistingAvatarPath(null)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      let avatarPath = existingAvatarPath
      if (newAvatarFile) {
        const path = `${page?.id ?? 'new'}/avatar-${crypto.randomUUID()}-${newAvatarFile.name}`
        const { error: uploadError } = await supabase.storage.from('media').upload(path, newAvatarFile)
        if (uploadError) throw uploadError
        avatarPath = path
      }

      const payload = {
        name: name.trim(),
        instagram_username: instagramUsername.trim() || null,
        notes: notes.trim() || null,
        avatar_path: avatarPath,
      }
      const { error: saveError } = page
        ? await supabase.from('pages').update(payload).eq('id', page.id)
        : await supabase.from('pages').insert(payload)
      if (saveError) throw saveError

      if (removedAvatarPath) {
        const { error: removeError } = await supabase.storage.from('media').remove([removedAvatarPath])
        if (removeError) toast.error("La vecchia foto profilo non è stata cancellata dallo storage")
      }

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

      <div className="space-y-1.5">
        <label className="text-sm font-medium text-neutral-700">Foto profilo (per l'anteprima stile Instagram)</label>
        <div className="flex items-center gap-3">
          {existingAvatarUrl ? (
            <div className="relative">
              <img src={existingAvatarUrl} alt="" className="h-12 w-12 rounded-full object-cover" />
              <button
                type="button"
                onClick={removeExistingAvatar}
                className="absolute -right-1 -top-1 rounded-full bg-brand-700 p-0.5 text-white shadow-sm"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ) : newAvatarFile ? (
            <img src={URL.createObjectURL(newAvatarFile)} alt="" className="h-12 w-12 rounded-full object-cover" />
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-100 text-xs text-brand-500">
              {name.charAt(0).toUpperCase() || '?'}
            </div>
          )}
          {!existingAvatarUrl && (
            <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-brand-300 bg-brand-50/40 px-3 py-2 text-sm text-brand-600 hover:bg-brand-50">
              <ImageUp className="h-4 w-4" />
              {preparingFile ? 'Elaborazione…' : 'Carica foto'}
              <input
                type="file"
                accept="image/*"
                disabled={preparingFile}
                onChange={async (e) => {
                  const file = e.target.files?.[0]
                  e.target.value = ''
                  if (!file) return
                  setPreparingFile(true)
                  try {
                    setNewAvatarFile(await prepareImageFile(file))
                  } catch (err) {
                    toast.error(err instanceof Error ? err.message : 'File non valido')
                  } finally {
                    setPreparingFile(false)
                  }
                }}
                className="hidden"
              />
            </label>
          )}
        </div>
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
            disabled={saving || preparingFile}
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
