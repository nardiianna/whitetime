import { useCallback, useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { KeyRound } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { errorMessage, useToast } from '../lib/toast'

interface Props {
  pageId: string
}

export function ClientAccessForm({ pageId }: Props) {
  const [profileIds, setProfileIds] = useState<string[]>([])
  const [uid, setUid] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const toast = useToast()

  const loadProfiles = useCallback(async () => {
    const { data } = await supabase.from('profile_page_access').select('profile_id').eq('page_id', pageId)
    setProfileIds((data ?? []).map((row) => row.profile_id))
  }, [pageId])

  useEffect(() => {
    loadProfiles()
  }, [loadProfiles])

  async function handleAdd(e: FormEvent) {
    e.preventDefault()
    const id = uid.trim()
    if (!id) return
    setSaving(true)
    setError(null)

    const { data: existing, error: fetchError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', id)
      .maybeSingle()
    if (fetchError) {
      setError(errorMessage(fetchError))
      setSaving(false)
      return
    }

    if (existing && existing.role !== 'client') {
      setError('Questo UID appartiene a un amministratore: non può essere aggiunto come cliente.')
      setSaving(false)
      return
    }

    if (!existing) {
      const { error: profileError } = await supabase.from('profiles').insert({ id, role: 'client' })
      if (profileError) {
        setError(
          profileError.message.includes('foreign key')
            ? "Nessun utente Supabase trovato con questo UID. Crealo prima da Dashboard → Authentication → Users."
            : profileError.message,
        )
        setSaving(false)
        return
      }
    }

    const { error: accessError } = await supabase
      .from('profile_page_access')
      .insert({ profile_id: id, page_id: pageId })
    if (accessError && !accessError.message.includes('duplicate key')) {
      setError(errorMessage(accessError))
      setSaving(false)
      return
    }

    setUid('')
    setSaving(false)
    loadProfiles()
  }

  async function handleRemove(profileId: string) {
    if (
      !confirm(
        "Revocare l'accesso di questo utente a questo cliente? (Se ha accesso ad altre aziende, quello resta invariato.)",
      )
    )
      return
    const { error } = await supabase
      .from('profile_page_access')
      .delete()
      .eq('profile_id', profileId)
      .eq('page_id', pageId)
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
            Crea l'utente da Supabase Dashboard → Authentication → Users, poi incolla qui il suo UID. Lo stesso UID
            può essere collegato a più aziende: il cliente sceglierà quale vedere al login.
          </p>
        </div>
      </div>

      {profileIds.length > 0 && (
        <ul className="space-y-1.5">
          {profileIds.map((id) => (
            <li key={id} className="flex items-center gap-2 rounded-lg bg-brand-50/50 px-3 py-2 text-sm">
              <span className="flex-1 truncate font-mono text-xs text-neutral-700">{id}</span>
              <button onClick={() => handleRemove(id)} className="text-xs font-medium text-red-700 hover:underline">
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
