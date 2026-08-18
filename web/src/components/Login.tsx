import { useState } from 'react'
import type { FormEvent } from 'react'
import { supabase } from '../lib/supabase'
import logo from '../assets/logo.png'

export function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setError(error.message)
    setLoading(false)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-brand-50 to-white px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm space-y-5 rounded-2xl border border-brand-100 bg-white p-7 shadow-lg shadow-brand-200/40"
      >
        <img src={logo} alt="WhiteTime" className="h-12 w-auto mx-auto" />
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-neutral-700">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-brand-200 bg-white px-3 py-2.5 text-sm text-neutral-800 outline-none transition-colors focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-neutral-700">Password</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-brand-200 bg-white px-3 py-2.5 text-sm text-neutral-800 outline-none transition-colors focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
          />
        </div>
        {error && <p className="text-sm text-brand-700">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white shadow-sm shadow-brand-300/60 hover:bg-brand-600 disabled:opacity-50"
        >
          {loading ? 'Accesso in corso…' : 'Accedi'}
        </button>
      </form>
    </div>
  )
}
