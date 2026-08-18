import { useState } from 'react'
import { supabase } from './lib/supabase'
import { AdminClientArea } from './components/AdminClientArea'
import logo from './assets/logo.png'
import AdminApp from './AdminApp'

export function AdminRoot() {
  const [section, setSection] = useState<'pianificazione' | 'clienti'>('pianificazione')

  return (
    <div className="min-h-screen bg-brand-50">
      <div className="mx-auto max-w-3xl px-4 py-6">
        <div className="mb-4 flex items-center justify-between">
          <img src={logo} alt="WhiteTime" className="h-8 w-auto" />
          <button
            onClick={() => supabase.auth.signOut()}
            className="text-sm text-brand-600 hover:underline"
          >
            Esci
          </button>
        </div>

        <div className="mb-4 flex gap-1 rounded-full border border-brand-200 p-0.5 w-fit">
          <button
            onClick={() => setSection('pianificazione')}
            className={`rounded-full px-4 py-1.5 text-sm ${
              section === 'pianificazione' ? 'bg-brand-300 text-neutral-800' : 'text-brand-700'
            }`}
          >
            Pianificazione
          </button>
          <button
            onClick={() => setSection('clienti')}
            className={`rounded-full px-4 py-1.5 text-sm ${
              section === 'clienti' ? 'bg-brand-300 text-neutral-800' : 'text-brand-700'
            }`}
          >
            Area Clienti
          </button>
        </div>

        {section === 'pianificazione' ? <AdminApp /> : <AdminClientArea />}
      </div>
    </div>
  )
}

export default AdminRoot
