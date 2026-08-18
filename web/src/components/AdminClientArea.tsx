import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Page } from '../types'
import { EditorialPlanManager } from './EditorialPlanManager'
import { ReportsManager } from './ReportsManager'

export function AdminClientArea() {
  const [pages, setPages] = useState<Page[]>([])
  const [selectedPageId, setSelectedPageId] = useState<string>('')
  const [tab, setTab] = useState<'ped' | 'dashboard'>('ped')

  useEffect(() => {
    supabase
      .from('pages')
      .select('*')
      .eq('type', 'client')
      .order('name')
      .then(({ data }) => {
        setPages(data ?? [])
        setSelectedPageId((prev) => prev || data?.[0]?.id || '')
      })
  }, [])

  if (pages.length === 0) {
    return (
      <p className="text-sm text-neutral-500">
        Nessun cliente disponibile. Creane uno da "Pianificazione" prima di usare l'Area Clienti.
      </p>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {pages.map((page) => (
          <button
            key={page.id}
            onClick={() => setSelectedPageId(page.id)}
            className={`rounded-full px-3 py-1.5 text-sm ${
              selectedPageId === page.id
                ? 'bg-brand-300 text-neutral-800'
                : 'border border-brand-200 text-brand-700'
            }`}
          >
            {page.name}
          </button>
        ))}
      </div>

      {selectedPageId && (
        <>
          <div className="flex gap-1 rounded-full border border-brand-200 p-0.5 w-fit">
            <button
              onClick={() => setTab('ped')}
              className={`rounded-full px-3 py-1.5 text-sm ${
                tab === 'ped' ? 'bg-brand-300 text-neutral-800' : 'text-brand-700'
              }`}
            >
              Piano Editoriale
            </button>
            <button
              onClick={() => setTab('dashboard')}
              className={`rounded-full px-3 py-1.5 text-sm ${
                tab === 'dashboard' ? 'bg-brand-300 text-neutral-800' : 'text-brand-700'
              }`}
            >
              Dashboard campagne
            </button>
          </div>

          {tab === 'ped' ? (
            <EditorialPlanManager pageId={selectedPageId} />
          ) : (
            <ReportsManager pageId={selectedPageId} />
          )}
        </>
      )}
    </div>
  )
}
