import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from './lib/supabase'
import { Login } from './components/Login'
import { ClientPortal } from './components/ClientPortal'
import { ClientCompanyPicker } from './components/ClientCompanyPicker'
import AdminRoot from './AdminRoot'
import type { Page, Profile } from './types'
import { loadPersisted, savePersisted } from './lib/persist'

function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [profileLoading, setProfileLoading] = useState(false)
  const [profileError, setProfileError] = useState(false)
  const [clientPages, setClientPages] = useState<Page[]>([])
  const [clientPagesLoading, setClientPagesLoading] = useState(false)
  const [activePageId, setActivePageId] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setAuthLoading(false)
    })
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!session) {
      setProfile(null)
      return
    }
    setProfileLoading(true)
    setProfileError(false)
    supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error || !data) {
          setProfileError(true)
          setProfile(null)
        } else {
          setProfile(data)
        }
        setProfileLoading(false)
      })
  }, [session])

  useEffect(() => {
    if (!profile || profile.role !== 'client') {
      setClientPages([])
      setActivePageId(null)
      return
    }
    setClientPagesLoading(true)
    supabase
      .from('profile_page_access')
      .select('page:pages(*)')
      .eq('profile_id', profile.id)
      .then(({ data }) => {
        const pages = (data ?? []).map((row) => row.page).filter(Boolean) as unknown as Page[]
        setClientPages(pages)
        const remembered = loadPersisted<string | null>('client_activePageId', null)
        const stillValid = remembered && pages.some((p) => p.id === remembered)
        setActivePageId(pages.length === 1 ? pages[0].id : stillValid ? remembered : null)
        setClientPagesLoading(false)
      })
  }, [profile])

  useEffect(() => {
    if (activePageId) savePersisted('client_activePageId', activePageId)
  }, [activePageId])

  if (authLoading || profileLoading) return null
  if (!session) return <Login />

  if (profileError || !profile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-4">
        <div className="space-y-3 text-center">
          <p className="text-sm text-neutral-600">
            Il tuo accesso non è ancora configurato. Contatta chi gestisce l'app.
          </p>
          <button onClick={() => supabase.auth.signOut()} className="text-sm text-neutral-700 hover:underline">
            Esci
          </button>
        </div>
      </div>
    )
  }

  if (profile.role === 'client') {
    if (clientPagesLoading) return null

    if (clientPages.length === 0) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-4">
          <div className="space-y-3 text-center">
            <p className="text-sm text-neutral-600">
              Il tuo accesso non è associato a nessuna azienda. Contatta chi gestisce l'app.
            </p>
            <button onClick={() => supabase.auth.signOut()} className="text-sm text-neutral-700 hover:underline">
              Esci
            </button>
          </div>
        </div>
      )
    }

    if (!activePageId) {
      return <ClientCompanyPicker pages={clientPages} onSelect={setActivePageId} />
    }

    return (
      <ClientPortal
        pageId={activePageId}
        onSwitchCompany={
          clientPages.length > 1
            ? () => {
                savePersisted('client_activePageId', null)
                setActivePageId(null)
              }
            : undefined
        }
      />
    )
  }

  return <AdminRoot />
}

export default App
