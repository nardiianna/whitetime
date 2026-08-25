import { useEffect, useState } from 'react'
import { Calendar, LogOut, Users } from 'lucide-react'
import { supabase } from './lib/supabase'
import { AdminClientArea } from './components/AdminClientArea'
import logo from './assets/logo.png'
import AdminApp from './AdminApp'
import { loadPersisted, savePersisted } from './lib/persist'

export function AdminRoot() {
  const [section, setSection] = useState<'pianificazione' | 'clienti'>(() =>
    loadPersisted('admin_section', 'pianificazione'),
  )

  useEffect(() => {
    savePersisted('admin_section', section)
  }, [section])

  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-50 to-white">
      <div className="mx-auto max-w-3xl px-4 py-6">
        <div className="mb-5 flex items-center justify-between">
          <img src={logo} alt="WhiteTime" className="h-8 w-auto" />
          <button
            onClick={() => supabase.auth.signOut()}
            className="flex items-center gap-1.5 text-sm font-medium text-neutral-700 hover:text-neutral-900"
          >
            <LogOut className="h-4 w-4" />
            Esci
          </button>
        </div>

        <div className="mb-6 flex w-fit gap-1 rounded-full border border-neutral-200 bg-white p-1 shadow-sm">
          <button
            onClick={() => setSection('pianificazione')}
            className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              section === 'pianificazione'
                ? 'bg-neutral-900 text-white shadow-sm '
                : 'text-neutral-600 hover:bg-neutral-100'
            }`}
          >
            <Calendar className="h-4 w-4" />
            Pianificazione
          </button>
          <button
            onClick={() => setSection('clienti')}
            className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              section === 'clienti'
                ? 'bg-neutral-900 text-white shadow-sm '
                : 'text-neutral-600 hover:bg-neutral-100'
            }`}
          >
            <Users className="h-4 w-4" />
            Area Clienti
          </button>
        </div>

        {section === 'pianificazione' ? <AdminApp /> : <AdminClientArea />}
      </div>
    </div>
  )
}

export default AdminRoot
