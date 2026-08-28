import { useEffect, useState } from 'react'
import { Download, ImageDown } from 'lucide-react'
import { supabase } from '../lib/supabase'
import type { ClientDownload } from '../types'
import { errorMessage, useToast } from '../lib/toast'

interface Props {
  pageId: string
}

export function ClientDownloads({ pageId }: Props) {
  const [files, setFiles] = useState<ClientDownload[]>([])
  const [loading, setLoading] = useState(true)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)
  const toast = useToast()

  useEffect(() => {
    supabase
      .from('client_downloads')
      .select('*')
      .eq('page_id', pageId)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setFiles(data ?? [])
        setLoading(false)
      })
  }, [pageId])

  async function handleDownload(file: ClientDownload) {
    setDownloadingId(file.id)
    try {
      const { data, error } = await supabase.storage.from('downloads').download(file.file_path)
      if (error) throw error
      const url = URL.createObjectURL(data)
      const a = document.createElement('a')
      a.href = url
      a.download = file.file_name
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setDownloadingId(null)
    }
  }

  if (loading) {
    return (
      <ul className="space-y-3" aria-label="Caricamento in corso">
        {[0, 1].map((i) => (
          <li key={i} className="h-16 animate-pulse rounded-2xl border border-neutral-200 bg-white shadow-sm" />
        ))}
      </ul>
    )
  }

  if (files.length === 0) {
    return <p className="py-8 text-center text-sm text-neutral-500">Nessuna foto disponibile al momento.</p>
  }

  return (
    <ul className="space-y-3">
      {files.map((file) => {
        const previewUrl = supabase.storage.from('downloads').getPublicUrl(file.file_path).data.publicUrl
        return (
          <li
            key={file.id}
            className="flex items-center gap-4 rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm"
          >
            <img src={previewUrl} alt="" className="h-12 w-12 shrink-0 rounded-lg object-cover" />
            <span className="min-w-0 flex-1 truncate text-sm font-medium text-neutral-800">{file.file_name}</span>
            <button
              onClick={() => handleDownload(file)}
              disabled={downloadingId === file.id}
              className="flex shrink-0 items-center gap-1.5 rounded-full bg-neutral-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-neutral-800 disabled:opacity-50"
            >
              {downloadingId === file.id ? (
                <ImageDown className="h-4 w-4 animate-pulse" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              Scarica
            </button>
          </li>
        )
      })}
    </ul>
  )
}
