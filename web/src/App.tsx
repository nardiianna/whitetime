import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from './lib/supabase'
import { Login } from './components/Login'
import { ClientPortal } from './components/ClientPortal'
import AdminRoot from './AdminRoot'
import type { Profile } from './types'

function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [profileLoading, setProfileLoading] = useState(false)
  const [profileError, setProfileError] = useState(false)

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

  if (authLoading || profileLoading) return null
  if (!session) return <Login />

  if (profileError || !profile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-brand-50 px-4">
        <div className="space-y-3 text-center">
          <p className="text-sm text-neutral-600">
            Il tuo accesso non è ancora configurato. Contatta chi gestisce l'app.
          </p>
          <button onClick={() => supabase.auth.signOut()} className="text-sm text-brand-600 hover:underline">
            Esci
          </button>
        </div>
      </div>
    )
  }

  if (profile.role === 'client' && profile.page_id) {
    return <ClientPortal pageId={profile.page_id} />
  }

  return <AdminRoot />
}

export default App
