import { useEffect, useState } from 'react'
import { ArrowLeftRight, BarChart3, FileText, LogOut } from 'lucide-react'
import { supabase } from '../lib/supabase'
import type { Page } from '../types'
import { ClientEditorialPlan } from './ClientEditorialPlan'
import { ClientReports } from './ClientReports'
import { loadPersisted, savePersisted } from '../lib/persist'
import logo from '../assets/logo.png'

interface Props {
  pageId: string
  onSwitchCompany?: () => void
}

export function ClientPortal({ pageId, onSwitchCompany }: Props) {
  const [page, setPage] = useState<Page | null>(null)
  const [tab, setTab] = useState<'ped' | 'report'>(() => loadPersisted('client_tab', 'ped'))

  useEffect(() => {
    savePersisted('client_tab', tab)
  }, [tab])

  useEffect(() => {
    supabase
      .from('pages')
      .select('*')
      .eq('id', pageId)
      .single()
      .then(({ data }) => setPage(data ?? null))
  }, [pageId])

  const avatarUrl = page?.avatar_path ? supabase.storage.from('media').getPublicUrl(page.avatar_path).data.publicUrl : null

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="mx-auto max-w-3xl px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <img src={logo} alt="WhiteTime" className="h-6 w-auto" />
          <div className="flex items-center gap-5">
            {onSwitchCompany && (
              <button
                onClick={onSwitchCompany}
                className="flex items-center gap-1.5 text-sm font-medium text-neutral-600 hover:text-neutral-900"
              >
                <ArrowLeftRight className="h-4 w-4" />
                Cambia azienda
              </button>
            )}
            <button
              onClick={() => supabase.auth.signOut()}
              className="flex items-center gap-1.5 text-sm font-medium text-neutral-600 hover:text-neutral-900"
            >
              <LogOut className="h-4 w-4" />
              Esci
            </button>
          </div>
        </div>

        {page && (
          <div className="mb-9 flex items-center gap-4">
            {avatarUrl ? (
              <img src={avatarUrl} alt="" className="h-[52px] w-[52px] shrink-0 rounded-2xl object-cover shadow-sm" />
            ) : (
              <div className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-2xl bg-neutral-900 text-xl font-bold text-white">
                {page.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-neutral-900">{page.name}</h1>
              <p className="text-sm text-neutral-500">Portale contenuti &amp; campagne</p>
            </div>
          </div>
        )}

        <div className="mb-8 flex w-fit gap-1 rounded-full border border-neutral-200 bg-neutral-100 p-1">
          <button
            onClick={() => setTab('ped')}
            className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              tab === 'ped' ? 'bg-neutral-900 text-white shadow-sm' : 'text-neutral-600 hover:bg-neutral-200'
            }`}
          >
            <FileText className="h-4 w-4" />
            Piano Editoriale
          </button>
          <button
            onClick={() => setTab('report')}
            className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              tab === 'report' ? 'bg-neutral-900 text-white shadow-sm' : 'text-neutral-600 hover:bg-neutral-200'
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
