import { useState, useEffect } from 'react'
import type { FormEvent } from 'react'
import { X } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { STATUS_LABELS, statusLabel } from '../types'
import type { Page, Post, PostStatus, Category } from '../types'
import { prepareImageFiles, sanitizeFileName } from '../lib/image'
import { useToast } from '../lib/toast'

interface Props {
  pages: Page[]
  defaultPageId: string
  post?: Post
  defaultScheduledAt?: string
  initialCaption?: string
  initialNotes?: string
  onSaved: () => void
  onCancel: () => void
}

function toLocalInputValue(iso: string | undefined) {
  if (!iso) return ''
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function PostForm({
  pages,
  defaultPageId,
  post,
  defaultScheduledAt,
  initialCaption,
  initialNotes,
  onSaved,
  onCancel,
}: Props) {
  const [pageId, setPageId] = useState(post?.page_id ?? defaultPageId)
  const [categoryId, setCategoryId] = useState(post?.category_id ?? '')
  const [categories, setCategories] = useState<Category[]>([])
  const [caption, setCaption] = useState(post?.caption ?? initialCaption ?? '')
  const [scheduledAt, setScheduledAt] = useState(
    post ? toLocalInputValue(post.scheduled_at) : (defaultScheduledAt ?? ''),
  )
  const [status, setStatus] = useState<PostStatus>(post?.status ?? 'programmato')
  const [notes, setNotes] = useState(post?.notes ?? initialNotes ?? '')
  const [existingPaths, setExistingPaths] = useState(post?.media_paths ?? [])
  const [removedPaths, setRemovedPaths] = useState<string[]>([])
  const [newFiles, setNewFiles] = useState<File[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [preparingFiles, setPreparingFiles] = useState(false)
  const toast = useToast()

  const isPersonal = pages.find((p) => p.id === pageId)?.type === 'personal'

  const existingUrls = existingPaths.map((path) => ({
    path,
    url: supabase.storage.from('media').getPublicUrl(path).data.publicUrl,
  }))

  async function addFiles(fileList: FileList | null) {
    if (!fileList) return
    setPreparingFiles(true)
    const ready = await prepareImageFiles(Array.from(fileList), toast.error)
    setNewFiles((prev) => [...prev, ...ready])
    setPreparingFiles(false)
  }

  function removeExisting(path: string) {
    setExistingPaths((prev) => prev.filter((p) => p !== path))
    setRemovedPaths((prev) => [...prev, path])
  }

  function removeNewFile(index: number) {
    setNewFiles((prev) => prev.filter((_, i) => i !== index))
  }

  useEffect(() => {
    supabase
      .from('categories')
      .select('*')
      .eq('page_id', pageId)
      .order('name')
      .then(({ data }) => setCategories(data ?? []))
  }, [pageId])

  function handlePageChange(newPageId: string) {
    setPageId(newPageId)
    setCategoryId('')
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      const uploadedPaths: string[] = []
      for (const file of newFiles) {
        const path = `${pageId}/${crypto.randomUUID()}-${sanitizeFileName(file.name)}`
        const { error: uploadError } = await supabase.storage.from('media').upload(path, file)
        if (uploadError) throw uploadError
        uploadedPaths.push(path)
      }

      const payload = {
        page_id: pageId,
        category_id: categoryId || null,
        caption,
        scheduled_at: new Date(scheduledAt).toISOString(),
        status,
        notes: notes || null,
        media_paths: [...existingPaths, ...uploadedPaths],
      }

      const { error: saveError } = post
        ? await supabase.from('posts').update(payload).eq('id', post.id)
        : await supabase.from('posts').insert(payload)

      if (saveError) {
        if (uploadedPaths.length > 0) await supabase.storage.from('media').remove(uploadedPaths)
        throw saveError
      }

      if (removedPaths.length > 0) {
        const { error: removeError } = await supabase.storage.from('media').remove(removedPaths)
        if (removeError) toast.error('Alcune immagini rimosse non sono state cancellate dallo storage')
      }

      onSaved()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore durante il salvataggio')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm"
    >
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-sm font-medium text-neutral-700">Pagina</label>
          <select
            value={pageId}
            onChange={(e) => handlePageChange(e.target.value)}
            className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-sm text-neutral-800 outline-none transition-colors focus:border-neutral-500 focus:ring-2 focus:ring-neutral-200"
          >
            {pages.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium text-neutral-700">
            {isPersonal ? 'Data e ora' : 'Data e ora pubblicazione'}
          </label>
          <input
            type="datetime-local"
            required
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
            className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-sm text-neutral-800 outline-none transition-colors focus:border-neutral-500 focus:ring-2 focus:ring-neutral-200"
          />
        </div>
      </div>

      {categories.length > 0 && (
        <div className="space-y-1">
          <label className="text-sm font-medium text-neutral-700">Categoria (opzionale)</label>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-sm text-neutral-800 outline-none transition-colors focus:border-neutral-500 focus:ring-2 focus:ring-neutral-200"
          >
            <option value="">— nessuna —</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="space-y-1">
        <label className="text-sm font-medium text-neutral-700">{isPersonal ? 'Descrizione' : 'Caption'}</label>
        <textarea
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          rows={4}
          className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-sm text-neutral-800 outline-none transition-colors focus:border-neutral-500 focus:ring-2 focus:ring-neutral-200"
        />
      </div>

      {!isPersonal && (
        <div className="space-y-1">
          <label className="text-sm font-medium text-neutral-700">Immagini</label>
          {(existingUrls.length > 0 || newFiles.length > 0) && (
            <div className="mb-2 flex flex-wrap gap-2">
              {existingUrls.map(({ path, url }) => (
                <div key={path} className="relative">
                  <img src={url} alt="" className="h-24 w-24 rounded-lg object-cover" />
                  <button
                    type="button"
                    onClick={() => removeExisting(path)}
                    className="absolute -right-2 -top-2 rounded-full bg-neutral-700 p-1 text-white shadow-sm"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              {newFiles.map((f, i) => (
                <div key={`${f.name}-${i}`} className="relative">
                  <img
                    src={URL.createObjectURL(f)}
                    alt=""
                    className="h-24 w-24 rounded-lg object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removeNewFile(i)}
                    className="absolute -right-2 -top-2 rounded-full bg-neutral-700 p-1 text-white shadow-sm"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
          <label className="flex cursor-pointer items-center justify-center rounded-lg border border-dashed border-neutral-400 bg-neutral-100/40 px-3 py-2.5 text-sm text-neutral-800 hover:bg-neutral-100">
            {preparingFiles ? 'Elaborazione…' : 'Carica immagini'}
            <input
              type="file"
              accept="image/*"
              multiple
              disabled={preparingFiles}
              onChange={(e) => {
                addFiles(e.target.files)
                e.target.value = ''
              }}
              className="hidden"
            />
          </label>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-sm font-medium text-neutral-700">Stato</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as PostStatus)}
            className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-sm text-neutral-800 outline-none transition-colors focus:border-neutral-500 focus:ring-2 focus:ring-neutral-200"
          >
            {(Object.keys(STATUS_LABELS) as PostStatus[]).map((value) => (
              <option key={value} value={value}>
                {statusLabel(value, isPersonal)}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium text-neutral-700">Note (opzionale)</label>
          <input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-sm text-neutral-800 outline-none transition-colors focus:border-neutral-500 focus:ring-2 focus:ring-neutral-200"
          />
        </div>
      </div>

      {error && <p className="text-sm text-neutral-700">{error}</p>}

      <div className="flex justify-end gap-2 border-t border-neutral-200 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100"
        >
          Annulla
        </button>
        <button
          type="submit"
          disabled={saving || preparingFiles}
          className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-neutral-800 disabled:opacity-50"
        >
          {saving ? 'Salvataggio…' : 'Salva'}
        </button>
      </div>
    </form>
  )
}
