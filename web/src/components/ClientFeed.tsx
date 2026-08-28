import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { ClientFeedPhoto } from '../types'

interface Props {
  pageId: string
}

export function ClientFeed({ pageId }: Props) {
  const [photos, setPhotos] = useState<ClientFeedPhoto[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('client_feed_photos')
      .select('*')
      .eq('page_id', pageId)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setPhotos(data ?? [])
        setLoading(false)
      })
  }, [pageId])

  if (loading) {
    return (
      <div className="grid grid-cols-3 gap-0.5">
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className="aspect-[4/5] animate-pulse bg-neutral-100" />
        ))}
      </div>
    )
  }

  if (photos.length === 0) {
    return <p className="py-8 text-center text-sm text-neutral-500">Nessuna foto nel feed al momento.</p>
  }

  return (
    <div className="grid grid-cols-3 gap-0.5 overflow-hidden rounded-2xl border border-neutral-200 bg-white p-0.5 shadow-sm">
      {photos.map((photo) => {
        const url = supabase.storage.from('feed').getPublicUrl(photo.file_path).data.publicUrl
        return <img key={photo.id} src={url} alt="" className="aspect-[4/5] w-full object-cover" />
      })}
    </div>
  )
}
