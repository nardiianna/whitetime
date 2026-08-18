import { useEffect, useState } from 'react'
import { BarChart3, FileText } from 'lucide-react'
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
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2">
        {pages.map((page) => (
          <button
            key={page.id}
            onClick={() => setSelectedPageId(page.id)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              selectedPageId === page.id
                ? 'bg-brand-500 text-white shadow-sm shadow-brand-300/70'
                : 'border border-brand-200 bg-white text-neutral-700 hover:bg-brand-50'
            }`}
          >
            {page.name}
          </button>
        ))}
      </div>

      {selectedPageId && (
        <>
          <div className="flex w-fit gap-1 rounded-full border border-brand-100 bg-white p-1 shadow-sm shadow-brand-100/60">
            <button
              onClick={() => setTab('ped')}
              className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                tab === 'ped'
                  ? 'bg-brand-500 text-white shadow-sm shadow-brand-300/70'
                  : 'text-neutral-600 hover:bg-brand-50'
              }`}
            >
              <FileText className="h-4 w-4" />
              Piano Editoriale
            </button>
            <button
              onClick={() => setTab('dashboard')}
              className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                tab === 'dashboard'
                  ? 'bg-brand-500 text-white shadow-sm shadow-brand-300/70'
                  : 'text-neutral-600 hover:bg-brand-50'
              }`}
            >
              <BarChart3 className="h-4 w-4" />
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
