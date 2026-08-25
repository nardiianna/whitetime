import { useCallback, useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { KeyRound } from 'lucide-react'
import { supabase } from '../lib/supabase'
import type { Profile } from '../types'
import { errorMessage, useToast } from '../lib/toast'

interface Props {
  pageId: string
}

export function ClientAccessForm({ pageId }: Props) {
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [uid, setUid] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const toast = useToast()

  const loadProfiles = useCallback(async () => {
    const { data } = await supabase.from('profiles').select('*').eq('page_id', pageId)
    setProfiles(data ?? [])
  }, [pageId])

  useEffect(() => {
    loadProfiles()
  }, [loadProfiles])

  async function handleAdd(e: FormEvent) {
    e.preventDefault()
    if (!uid.trim()) return
    setSaving(true)
    setError(null)
    const { error: saveError } = await supabase
      .from('profiles')
      .insert({ id: uid.trim(), role: 'client', page_id: pageId })
    if (saveError) {
      setError(
        saveError.message.includes('foreign key')
          ? "Nessun utente Supabase trovato con questo UID. Crealo prima da Dashboard → Authentication → Users."
          : saveError.message,
      )
      setSaving(false)
      return
    }
    setUid('')
    setSaving(false)
    loadProfiles()
  }

  async function handleRemove(profile: Profile) {
    if (!confirm("Revocare l'accesso di questo utente a questo cliente?")) return
    const { error } = await supabase.from('profiles').delete().eq('id', profile.id)
    if (error) {
      toast.error(errorMessage(error))
      return
    }
    loadProfiles()
  }

  return (
    <div className="space-y-3 rounded-2xl border border-brand-100 bg-white p-5 shadow-sm shadow-brand-100/50">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-50 text-brand-600">
          <KeyRound className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm font-semibold text-brand-600">Accessi cliente</p>
          <p className="text-xs text-neutral-500">
            Crea l'utente da Supabase Dashboard → Authentication → Users, poi incolla qui il suo UID.
          </p>
        </div>
      </div>

      {profiles.length > 0 && (
        <ul className="space-y-1.5">
          {profiles.map((profile) => (
            <li key={profile.id} className="flex items-center gap-2 rounded-lg bg-brand-50/50 px-3 py-2 text-sm">
              <span className="flex-1 truncate font-mono text-xs text-neutral-700">{profile.id}</span>
              <button onClick={() => handleRemove(profile)} className="text-xs font-medium text-red-700 hover:underline">
                Revoca
              </button>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={handleAdd} className="flex gap-2">
        <input
          value={uid}
          onChange={(e) => setUid(e.target.value)}
          placeholder="UID utente Supabase…"
          className="flex-1 rounded-lg border border-brand-200 bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
        />
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white shadow-sm shadow-brand-300/60 hover:bg-brand-600 disabled:opacity-50"
        >
          Collega
        </button>
      </form>
      {error && <p className="text-sm text-brand-700">{error}</p>}
    </div>
  )
}
