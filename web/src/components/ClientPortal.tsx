import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import logo from '../assets/logo.png'
import type { Page } from '../types'
import { ClientEditorialPlan } from './ClientEditorialPlan'
import { ClientReports } from './ClientReports'

interface Props {
  pageId: string
}

export function ClientPortal({ pageId }: Props) {
  const [page, setPage] = useState<Page | null>(null)
  const [tab, setTab] = useState<'ped' | 'report'>('ped')

  useEffect(() => {
    supabase
      .from('pages')
      .select('*')
      .eq('id', pageId)
      .single()
      .then(({ data }) => setPage(data ?? null))
  }, [pageId])

  return (
    <div className="min-h-screen bg-brand-50">
      <div className="mx-auto max-w-3xl px-4 py-6">
        <div className="mb-4 flex items-center justify-between">
          <img src={logo} alt="WhiteTime" className="h-8 w-auto" />
          <button onClick={() => supabase.auth.signOut()} className="text-sm text-brand-600 hover:underline">
            Esci
          </button>
        </div>

        {page && <h1 className="mb-4 text-lg font-semibold text-neutral-900">{page.name}</h1>}

        <div className="mb-4 flex gap-1 rounded-full border border-brand-200 p-0.5">
          <button
            onClick={() => setTab('ped')}
            className={`flex-1 rounded-full px-3 py-1.5 text-sm ${
              tab === 'ped' ? 'bg-brand-300 text-neutral-800' : 'text-brand-700'
            }`}
          >
            Piano Editoriale
          </button>
          <button
            onClick={() => setTab('report')}
            className={`flex-1 rounded-full px-3 py-1.5 text-sm ${
              tab === 'report' ? 'bg-brand-300 text-neutral-800' : 'text-brand-700'
            }`}
          >
            Report
          </button>
        </div>

        {tab === 'ped' ? <ClientEditorialPlan pageId={pageId} /> : <ClientReports pageId={pageId} />}
      </div>
    </div>
  )
}
