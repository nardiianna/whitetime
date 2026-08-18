import { useState } from 'react'
import type { FormEvent } from 'react'
import { Calendar, ImageUp, X } from 'lucide-react'
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
  const [caption, setCaption] = useState(item?.caption ?? '')
  const [imageUrl, setImageUrl] = useState(item?.image_url ?? '')
  const [existingImagePaths, setExistingImagePaths] = useState(item?.image_paths ?? [])
  const [removedImagePaths, setRemovedImagePaths] = useState<string[]>([])
  const [newImageFiles, setNewImageFiles] = useState<File[]>([])
  const [internalNote, setInternalNote] = useState(item?.internal_note ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const existingImageUrls = existingImagePaths.map((path) => ({
    path,
    url: supabase.storage.from('media').getPublicUrl(path).data.publicUrl,
  }))

  function addImageFiles(fileList: FileList | null) {
    if (!fileList) return
    setNewImageFiles((prev) => [...prev, ...Array.from(fileList)])
  }

  function removeExistingImage(path: string) {
    setExistingImagePaths((prev) => prev.filter((p) => p !== path))
    setRemovedImagePaths((prev) => [...prev, path])
  }

  function removeNewImageFile(index: number) {
    setNewImageFiles((prev) => prev.filter((_, i) => i !== index))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      const uploadedPaths: string[] = []
      for (const file of newImageFiles) {
        const path = `${pageId}/editorial/${crypto.randomUUID()}-${file.name}`
        const { error: uploadError } = await supabase.storage.from('media').upload(path, file)
        if (uploadError) throw uploadError
        uploadedPaths.push(path)
      }

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
        caption: caption.trim() || null,
        image_url: imageUrl.trim() || null,
        image_paths: [...existingImagePaths, ...uploadedPaths],
        internal_note: internalNote.trim() || null,
      }
      const { error: saveError } = item
        ? await supabase.from('editorial_plan_items').update(payload).eq('id', item.id)
        : await supabase.from('editorial_plan_items').insert(payload)
      if (saveError) throw saveError

      if (removedImagePaths.length > 0) {
        const { error: removeError } = await supabase.storage.from('media').remove(removedImagePaths)
        if (removeError) console.error('Failed to delete removed images', removeError)
      }

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
        <label className="text-sm font-medium text-neutral-700">Caption</label>
        <textarea
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          rows={3}
          className="w-full rounded-lg border border-brand-200 bg-white px-3 py-2.5 text-sm text-neutral-800 outline-none transition-colors focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium text-neutral-700">Immagini (una o più, es. carosello)</label>
        {(existingImageUrls.length > 0 || newImageFiles.length > 0) && (
          <div className="flex flex-wrap gap-2">
            {existingImageUrls.map(({ path, url }) => (
              <div key={path} className="relative">
                <img src={url} alt="" className="h-24 w-24 rounded-lg object-cover" />
                <button
                  type="button"
                  onClick={() => removeExistingImage(path)}
                  className="absolute -right-2 -top-2 rounded-full bg-brand-700 p-1 text-white shadow-sm"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
            {newImageFiles.map((f, i) => (
              <div key={`${f.name}-${i}`} className="relative">
                <img src={URL.createObjectURL(f)} alt="" className="h-24 w-24 rounded-lg object-cover" />
                <button
                  type="button"
                  onClick={() => removeNewImageFile(i)}
                  className="absolute -right-2 -top-2 rounded-full bg-brand-700 p-1 text-white shadow-sm"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}
        <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-brand-300 bg-brand-50/40 px-3 py-2.5 text-sm text-brand-600 hover:bg-brand-50">
          <ImageUp className="h-4 w-4" />
          Carica immagini
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => {
              addImageFiles(e.target.files)
              e.target.value = ''
            }}
            className="hidden"
          />
        </label>
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium text-neutral-700">Link esterno (opzionale, es. cartella Drive)</label>
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

      {item && (item.approved || item.client_note) && (
        <div className="space-y-2 rounded-lg bg-brand-50 p-3">
          {item.approved && (
            <p className="text-sm font-semibold text-green-700">✓ Approvato dal cliente</p>
          )}
          {item.client_note && (
            <div>
              <p className="text-xs font-semibold text-brand-600">Nota del cliente</p>
              <p className="text-sm text-neutral-800">{item.client_note}</p>
            </div>
          )}
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
