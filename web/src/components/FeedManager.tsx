import { useCallback, useEffect, useState } from 'react'
import type { ChangeEvent } from 'react'
import { Grid3x3, ImageUp, X } from 'lucide-react'
import { supabase } from '../lib/supabase'
import type { ClientFeedPhoto } from '../types'
import { sanitizeFileName } from '../lib/image'
import { errorMessage, useToast } from '../lib/toast'

interface Props {
  pageId: string
}

export function FeedManager({ pageId }: Props) {
  const [photos, setPhotos] = useState<ClientFeedPhoto[]>([])
  const [uploading, setUploading] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const toast = useToast()

  const loadPhotos = useCallback(async () => {
    const { data } = await supabase
      .from('client_feed_photos')
      .select('*')
      .eq('page_id', pageId)
      .order('created_at', { ascending: false })
    setPhotos(data ?? [])
  }, [pageId])

  useEffect(() => {
    loadPhotos()
  }, [loadPhotos])

  async function handleUpload(e: ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files ?? [])
    e.target.value = ''
    if (selected.length === 0) return
    setUploading(true)
    try {
      for (const file of selected) {
        const path = `${pageId}/${crypto.randomUUID()}-${sanitizeFileName(file.name)}`
        const { error: uploadError } = await supabase.storage.from('feed').upload(path, file)
        if (uploadError) throw uploadError
        const { error: insertError } = await supabase
          .from('client_feed_photos')
          .insert({ page_id: pageId, file_path: path })
        if (insertError) {
          await supabase.storage.from('feed').remove([path])
          throw insertError
        }
      }
      await loadPhotos()
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setUploading(false)
    }
  }

  async function handleDelete(photo: ClientFeedPhoto) {
    if (!confirm('Rimuovere questa foto dal feed?')) return
    setDeletingId(photo.id)
    try {
      const { error: removeError } = await supabase.storage.from('feed').remove([photo.file_path])
      if (removeError) throw removeError
      const { error: deleteError } = await supabase.from('client_feed_photos').delete().eq('id', photo.id)
      if (deleteError) throw deleteError
      setPhotos((prev) => prev.filter((p) => p.id !== photo.id))
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="space-y-4 rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-neutral-100 text-neutral-800">
            <Grid3x3 className="h-5 w-5" />
          </div>
          <h3 className="text-base font-semibold text-neutral-800">Feed</h3>
        </div>
        <label className="flex cursor-pointer items-center gap-1.5 rounded-full border border-dashed border-neutral-400 px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-100">
          <ImageUp className="h-3.5 w-3.5" />
          {uploading ? 'Caricamento…' : 'Aggiungi foto'}
          <input
            type="file"
            accept="image/*"
            multiple
            disabled={uploading}
            onChange={handleUpload}
            className="hidden"
          />
        </label>
      </div>

      {photos.length === 0 && <p className="text-sm text-neutral-500">Nessuna foto nel feed di questo cliente.</p>}

      {photos.length > 0 && (
        <div className="grid grid-cols-3 gap-0.5 overflow-hidden rounded-lg border border-neutral-200">
          {photos.map((photo) => {
            const url = supabase.storage.from('feed').getPublicUrl(photo.file_path).data.publicUrl
            return (
              <div key={photo.id} className="group relative aspect-[4/5]">
                <img src={url} alt="" className="h-full w-full object-cover" />
                <button
                  onClick={() => handleDelete(photo)}
                  disabled={deletingId === photo.id}
                  title="Rimuovi"
                  className="absolute right-1.5 top-1.5 rounded-full bg-black/60 p-1 text-white opacity-0 transition-opacity hover:bg-black/80 disabled:opacity-100 group-hover:opacity-100"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
