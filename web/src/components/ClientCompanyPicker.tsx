import { LogOut } from 'lucide-react'
import { supabase } from '../lib/supabase'
import logo from '../assets/logo.png'
import type { Page } from '../types'

interface Props {
  pages: Page[]
  onSelect: (pageId: string) => void
}

export function ClientCompanyPicker({ pages, onSelect }: Props) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-gradient-to-b from-brand-50 to-white px-4">
      <img src={logo} alt="WhiteTime" className="h-9 w-auto" />
      <p className="text-sm text-neutral-600">Seleziona l'azienda da visualizzare</p>
      <div className="flex flex-wrap justify-center gap-3">
        {pages.map((page) => {
          const avatarUrl = page.avatar_path
            ? supabase.storage.from('media').getPublicUrl(page.avatar_path).data.publicUrl
            : null
          return (
            <button
              key={page.id}
              onClick={() => onSelect(page.id)}
              className="flex w-40 flex-col items-center gap-3 rounded-2xl border border-brand-100 bg-white p-5 shadow-sm shadow-brand-100/50 transition-colors hover:border-brand-300 hover:bg-brand-50"
            >
              {avatarUrl ? (
                <img src={avatarUrl} alt="" className="h-14 w-14 rounded-full object-cover" />
              ) : (
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-100 text-lg font-semibold text-brand-600">
                  {page.name.charAt(0).toUpperCase()}
                </div>
              )}
              <span className="text-center text-sm font-semibold text-neutral-900">{page.name}</span>
            </button>
          )
        })}
      </div>
      <button
        onClick={() => supabase.auth.signOut()}
        className="flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:text-brand-700"
      >
        <LogOut className="h-4 w-4" />
        Esci
      </button>
    </div>
  )
}
