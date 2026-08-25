import { LogOut } from 'lucide-react'
import { supabase } from '../lib/supabase'
import type { Page } from '../types'

interface Props {
  pages: Page[]
  onSelect: (pageId: string) => void
}

export function ClientCompanyPicker({ pages, onSelect }: Props) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-7 bg-neutral-50 px-4">
      <span className="text-sm font-extrabold tracking-tight text-neutral-400">WHITETIME</span>
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
              className="flex w-40 flex-col items-center gap-3 rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm transition-colors hover:border-neutral-400 hover:bg-neutral-50"
            >
              {avatarUrl ? (
                <img src={avatarUrl} alt="" className="h-14 w-14 rounded-2xl object-cover" />
              ) : (
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-neutral-900 text-lg font-bold text-white">
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
        className="flex items-center gap-1.5 text-sm font-medium text-neutral-600 hover:text-neutral-900"
      >
        <LogOut className="h-4 w-4" />
        Esci
      </button>
    </div>
  )
}
