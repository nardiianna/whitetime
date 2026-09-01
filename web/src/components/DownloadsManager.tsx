import { useCallback, useEffect, useState } from 'react'
import type { ChangeEvent } from 'react'
import { Download, ImageUp, Trash2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import type { ClientDownload } from '../types'
import { sanitizeFileName } from '../lib/image'
import { errorMessage, useToast } from '../lib/toast'

interface Props {
  pageId: string
}

export function DownloadsManager({ pageId }: Props) {
  const [files, setFiles] = useState<ClientDownload[]>([])
  const [uploading, setUploading] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const toast = useToast()

  const loadFiles = useCallback(async () => {
    const { data } = await supabase
      .from('client_downloads')
      .select('*')
      .eq('page_id', pageId)
      .order('created_at', { ascending: false })
    setFiles(data ?? [])
  }, [pageId])

  useEffect(() => {
    loadFiles()
  }, [loadFiles])

  async function handleUpload(e: ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files ?? [])
    e.target.value = ''
    if (selected.length === 0) return
    setUploading(true)
    try {
      for (const file of selected) {
        const path = `${pageId}/${crypto.randomUUID()}-${sanitizeFileName(file.name)}`
        const { error: uploadError } = await supabase.storage.from('downloads').upload(path, file)
        if (uploadError) throw uploadError
        const { error: insertError } = await supabase
          .from('client_downloads')
          .insert({ page_id: pageId, file_path: path, file_name: file.name })
        if (insertError) {
          await supabase.storage.from('downloads').remove([path])
          throw insertError
        }
      }
      await loadFiles()
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setUploading(false)
    }
  }

  async function handleDelete(file: ClientDownload) {
    if (!confirm(`Eliminare "${file.file_name}"?`)) return
    setDeletingId(file.id)
    try {
      const { error: removeError } = await supabase.storage.from('downloads').remove([file.file_path])
      if (removeError) throw removeError
      const { error: deleteError } = await supabase.from('client_downloads').delete().eq('id', file.id)
      if (deleteError) throw deleteError
      setFiles((prev) => prev.filter((f) => f.id !== file.id))
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
            <Download className="h-5 w-5" />
          </div>
          <h3 className="text-base font-semibold text-neutral-800">Download</h3>
        </div>
        <label className="flex cursor-pointer items-center gap-1.5 rounded-full border border-dashed border-neutral-400 px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-100">
          <ImageUp className="h-3.5 w-3.5" />
          {uploading ? 'Caricamento…' : 'Carica foto'}
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

      {files.length === 0 && <p className="text-sm text-neutral-500">Nessuna foto caricata per questo cliente.</p>}

      {files.length > 0 && (
        <ul className="space-y-2">
          {files.map((file) => {
            const previewUrl = supabase.storage.from('downloads').getPublicUrl(file.file_path).data.publicUrl
            return (
              <li
                key={file.id}
                className="flex items-center gap-3 rounded-xl border border-neutral-200 p-3"
              >
                <img src={previewUrl} alt="" className="h-10 w-10 shrink-0 rounded-lg object-cover" />
                <span className="min-w-0 flex-1 truncate text-sm text-neutral-800">{file.file_name}</span>
                <button
                  onClick={() => handleDelete(file)}
                  disabled={deletingId === file.id}
                  title="Elimina"
                  className="shrink-0 rounded-full border border-neutral-300 p-1.5 text-neutral-700 hover:bg-neutral-100 disabled:opacity-50"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
