import { useCallback, useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { supabase } from '../lib/supabase'
import type { Profile } from '../types'

interface Props {
  pageId: string
}

export function ClientAccessForm({ pageId }: Props) {
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [uid, setUid] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
    await supabase.from('profiles').delete().eq('id', profile.id)
    loadProfiles()
  }

  return (
    <div className="space-y-2 rounded-md border border-brand-100 p-3">
      <p className="text-sm font-semibold text-brand-600">Accessi cliente</p>
      <p className="text-xs text-neutral-500">
        Per dare accesso a questo cliente, crea prima l'utente da Supabase Dashboard → Authentication → Users,
        poi incolla qui il suo UID.
      </p>

      {profiles.length > 0 && (
        <ul className="space-y-1">
          {profiles.map((profile) => (
            <li key={profile.id} className="flex items-center gap-2 text-sm">
              <span className="flex-1 truncate font-mono text-xs text-neutral-700">{profile.id}</span>
              <button onClick={() => handleRemove(profile)} className="text-xs text-red-700">
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
          className="flex-1 rounded-md border border-brand-200 bg-white px-3 py-1.5 text-sm outline-none focus:border-brand-400"
        />
        <button
          type="submit"
          disabled={saving}
          className="rounded-md bg-brand-300 px-3 py-1.5 text-sm font-medium text-neutral-800 hover:bg-brand-400 disabled:opacity-50"
        >
          Collega
        </button>
      </form>
      {error && <p className="text-sm text-brand-700">{error}</p>}
    </div>
  )
}
