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
                ? 'bg-neutral-900 text-white shadow-sm '
                : 'border border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-100'
            }`}
          >
            {page.name}
          </button>
        ))}
      </div>

      {selectedPageId && (
        <>
          <div className="flex w-fit gap-1 rounded-full border border-neutral-200 bg-white p-1 shadow-sm">
            <button
              onClick={() => setTab('ped')}
              className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                tab === 'ped'
                  ? 'bg-neutral-900 text-white shadow-sm '
                  : 'text-neutral-600 hover:bg-neutral-100'
              }`}
            >
              <FileText className="h-4 w-4" />
              Piano Editoriale
            </button>
            <button
              onClick={() => setTab('dashboard')}
              className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                tab === 'dashboard'
                  ? 'bg-neutral-900 text-white shadow-sm '
                  : 'text-neutral-600 hover:bg-neutral-100'
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
