import { useEffect, useState } from 'react'
import { BarChart3, Download, FileText } from 'lucide-react'
import { supabase } from '../lib/supabase'
import type { Page } from '../types'
import { EditorialPlanManager } from './EditorialPlanManager'
import { ReportsManager } from './ReportsManager'
import { DownloadsManager } from './DownloadsManager'
import { loadPersisted, savePersisted } from '../lib/persist'
import type { PostPromotionDraft } from '../types'

interface Props {
  onPromote?: (draft: PostPromotionDraft) => void
  onPendingCountChange?: (total: number) => void
}

export function AdminClientArea({ onPromote, onPendingCountChange }: Props) {
  const [pages, setPages] = useState<Page[]>([])
  const [selectedPageId, setSelectedPageId] = useState<string>(() => loadPersisted('clientArea_pageId', ''))
  const [tab, setTab] = useState<'ped' | 'dashboard' | 'download'>(() => loadPersisted('clientArea_tab', 'ped'))
  const [pendingByPage, setPendingByPage] = useState<Record<string, number>>({})

  useEffect(() => savePersisted('clientArea_pageId', selectedPageId), [selectedPageId])
  useEffect(() => savePersisted('clientArea_tab', tab), [tab])

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

    supabase
      .from('editorial_plan_items')
      .select('page_id')
      .not('client_note', 'is', null)
      .eq('note_acknowledged', false)
      .then(({ data }) => {
        const counts: Record<string, number> = {}
        for (const row of data ?? []) {
          counts[row.page_id] = (counts[row.page_id] ?? 0) + 1
        }
        setPendingByPage(counts)
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const total = Object.values(pendingByPage).reduce((sum, n) => sum + n, 0)
    onPendingCountChange?.(total)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingByPage])

  function handleNoteAcknowledged(pageId: string) {
    setPendingByPage((prev) => {
      const current = prev[pageId] ?? 0
      if (current <= 1) {
        const next = { ...prev }
        delete next[pageId]
        return next
      }
      return { ...prev, [pageId]: current - 1 }
    })
  }

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
            className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              selectedPageId === page.id
                ? 'bg-neutral-900 text-white shadow-sm '
                : 'border border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-100'
            }`}
          >
            {page.name}
            {!!pendingByPage[page.id] && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[11px] font-semibold text-white">
                {pendingByPage[page.id]}
              </span>
            )}
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
            <button
              onClick={() => setTab('download')}
              className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                tab === 'download'
                  ? 'bg-neutral-900 text-white shadow-sm '
                  : 'text-neutral-600 hover:bg-neutral-100'
              }`}
            >
              <Download className="h-4 w-4" />
              Download
            </button>
          </div>

          {tab === 'ped' ? (
            <EditorialPlanManager
              pageId={selectedPageId}
              onPromote={onPromote}
              onNoteAcknowledged={() => handleNoteAcknowledged(selectedPageId)}
            />
          ) : tab === 'dashboard' ? (
            <ReportsManager pageId={selectedPageId} />
          ) : (
            <DownloadsManager pageId={selectedPageId} />
          )}
        </>
      )}
    </div>
  )
}
