import { useEffect, useState } from 'react'
import { BarChart3, FileText, LogOut } from 'lucide-react'
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
    <div className="min-h-screen bg-gradient-to-b from-brand-50 to-white">
      <div className="mx-auto max-w-3xl px-4 py-6">
        <div className="mb-5 flex items-center justify-between">
          <img src={logo} alt="WhiteTime" className="h-8 w-auto" />
          <button
            onClick={() => supabase.auth.signOut()}
            className="flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:text-brand-700"
          >
            <LogOut className="h-4 w-4" />
            Esci
          </button>
        </div>

        {page && <h1 className="mb-4 text-xl font-semibold text-neutral-900">{page.name}</h1>}

        <div className="mb-6 flex w-fit gap-1 rounded-full border border-brand-100 bg-white p-1 shadow-sm shadow-brand-100/60">
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
            onClick={() => setTab('report')}
            className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              tab === 'report'
                ? 'bg-brand-500 text-white shadow-sm shadow-brand-300/70'
                : 'text-neutral-600 hover:bg-brand-50'
            }`}
          >
            <BarChart3 className="h-4 w-4" />
            Dashboard campagne
          </button>
        </div>

        {page && (tab === 'ped' ? <ClientEditorialPlan pageId={pageId} page={page} /> : <ClientReports pageId={pageId} />)}
      </div>
    </div>
  )
}
