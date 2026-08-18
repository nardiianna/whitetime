import { useState } from 'react'
import type { FormEvent } from 'react'
import { supabase } from '../lib/supabase'
import type { AdReport } from '../types'

interface Props {
  pageId: string
  report?: AdReport
  onSaved: () => void
  onCancel: () => void
  onDelete?: () => void
}

function toNumber(value: string): number | null {
  return value.trim() === '' ? null : Number(value)
}

export function ReportForm({ pageId, report, onSaved, onCancel, onDelete }: Props) {
  const [campaignName, setCampaignName] = useState(report?.campaign_name ?? '')
  const [periodStart, setPeriodStart] = useState(report?.period_start ?? '')
  const [periodEnd, setPeriodEnd] = useState(report?.period_end ?? '')
  const [spend, setSpend] = useState(report?.spend?.toString() ?? '')
  const [reach, setReach] = useState(report?.reach?.toString() ?? '')
  const [impressions, setImpressions] = useState(report?.impressions?.toString() ?? '')
  const [clicks, setClicks] = useState(report?.clicks?.toString() ?? '')
  const [results, setResults] = useState(report?.results?.toString() ?? '')
  const [costPerResult, setCostPerResult] = useState(report?.cost_per_result?.toString() ?? '')
  const [notes, setNotes] = useState(report?.notes ?? '')
  const [existingPath, setExistingPath] = useState(report?.screenshot_path ?? null)
  const [removedPath, setRemovedPath] = useState<string | null>(null)
  const [newFile, setNewFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const existingUrl = existingPath
    ? supabase.storage.from('reports').getPublicUrl(existingPath).data.publicUrl
    : null

  function removeExisting() {
    if (existingPath) setRemovedPath(existingPath)
    setExistingPath(null)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      let screenshotPath = existingPath
      if (newFile) {
        const path = `${pageId}/${crypto.randomUUID()}-${newFile.name}`
        const { error: uploadError } = await supabase.storage.from('reports').upload(path, newFile)
        if (uploadError) throw uploadError
        screenshotPath = path
      }

      const payload = {
        page_id: pageId,
        campaign_name: campaignName.trim(),
        period_start: periodStart || null,
        period_end: periodEnd || null,
        spend: toNumber(spend),
        reach: toNumber(reach),
        impressions: toNumber(impressions),
        clicks: toNumber(clicks),
        results: toNumber(results),
        cost_per_result: toNumber(costPerResult),
        notes: notes.trim() || null,
        screenshot_path: screenshotPath,
      }

      const { error: saveError } = report
        ? await supabase.from('ad_reports').update(payload).eq('id', report.id)
        : await supabase.from('ad_reports').insert(payload)
      if (saveError) throw saveError

      if (removedPath) {
        const { error: removeError } = await supabase.storage.from('reports').remove([removedPath])
        if (removeError) console.error('Failed to delete removed screenshot', removeError)
      }

      onSaved()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore durante il salvataggio')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-brand-200 bg-white p-4">
      <div className="space-y-1">
        <label className="text-sm text-neutral-600">Nome campagna</label>
        <input
          required
          value={campaignName}
          onChange={(e) => setCampaignName(e.target.value)}
          className="w-full rounded-md border border-brand-200 bg-white px-3 py-2 text-sm focus:border-brand-400 outline-none"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-sm text-neutral-600">Dal</label>
          <input
            type="date"
            value={periodStart}
            onChange={(e) => setPeriodStart(e.target.value)}
            className="w-full rounded-md border border-brand-200 bg-white px-3 py-2 text-sm focus:border-brand-400 outline-none"
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm text-neutral-600">Al</label>
          <input
            type="date"
            value={periodEnd}
            onChange={(e) => setPeriodEnd(e.target.value)}
            className="w-full rounded-md border border-brand-200 bg-white px-3 py-2 text-sm focus:border-brand-400 outline-none"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-sm text-neutral-600">Spesa (€)</label>
          <input
            type="number"
            step="0.01"
            value={spend}
            onChange={(e) => setSpend(e.target.value)}
            className="w-full rounded-md border border-brand-200 bg-white px-3 py-2 text-sm focus:border-brand-400 outline-none"
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm text-neutral-600">Costo per risultato (€)</label>
          <input
            type="number"
            step="0.01"
            value={costPerResult}
            onChange={(e) => setCostPerResult(e.target.value)}
            className="w-full rounded-md border border-brand-200 bg-white px-3 py-2 text-sm focus:border-brand-400 outline-none"
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-1">
          <label className="text-sm text-neutral-600">Copertura</label>
          <input
            type="number"
            value={reach}
            onChange={(e) => setReach(e.target.value)}
            className="w-full rounded-md border border-brand-200 bg-white px-3 py-2 text-sm focus:border-brand-400 outline-none"
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm text-neutral-600">Impression</label>
          <input
            type="number"
            value={impressions}
            onChange={(e) => setImpressions(e.target.value)}
            className="w-full rounded-md border border-brand-200 bg-white px-3 py-2 text-sm focus:border-brand-400 outline-none"
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm text-neutral-600">Click</label>
          <input
            type="number"
            value={clicks}
            onChange={(e) => setClicks(e.target.value)}
            className="w-full rounded-md border border-brand-200 bg-white px-3 py-2 text-sm focus:border-brand-400 outline-none"
          />
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-sm text-neutral-600">Risultati</label>
        <input
          type="number"
          value={results}
          onChange={(e) => setResults(e.target.value)}
          className="w-full rounded-md border border-brand-200 bg-white px-3 py-2 text-sm focus:border-brand-400 outline-none"
        />
      </div>

      <div className="space-y-1">
        <label className="text-sm text-neutral-600">Screenshot report Meta</label>
        {existingUrl && (
          <div className="relative w-fit">
            <img src={existingUrl} alt="" className="h-24 w-auto rounded object-cover" />
            <button
              type="button"
              onClick={removeExisting}
              className="absolute -right-1 -top-1 rounded-full bg-brand-800 px-1.5 text-xs text-white"
            >
              ✕
            </button>
          </div>
        )}
        {!existingUrl && newFile && (
          <img src={URL.createObjectURL(newFile)} alt="" className="h-24 w-auto rounded object-cover" />
        )}
        {!existingUrl && (
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setNewFile(e.target.files?.[0] ?? null)}
            className="w-full text-sm"
          />
        )}
      </div>

      <div className="space-y-1">
        <label className="text-sm text-neutral-600">Note (opzionale)</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          className="w-full rounded-md border border-brand-200 bg-white px-3 py-2 text-sm focus:border-brand-400 outline-none"
        />
      </div>

      {error && <p className="text-sm text-brand-700">{error}</p>}

      <div className="flex items-center justify-between gap-2">
        {report && onDelete ? (
          <button
            type="button"
            onClick={onDelete}
            className="rounded-md border border-red-200 px-3 py-2 text-sm text-red-700"
          >
            Elimina
          </button>
        ) : (
          <span />
        )}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md border border-brand-200 px-3 py-2 text-sm text-brand-700"
          >
            Annulla
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded-md bg-brand-300 px-3 py-2 text-sm font-medium text-neutral-800 hover:bg-brand-400 disabled:opacity-50"
          >
            {saving ? 'Salvataggio…' : 'Salva'}
          </button>
        </div>
      </div>
    </form>
  )
}
