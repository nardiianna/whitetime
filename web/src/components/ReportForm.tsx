import { useState } from 'react'
import type { FormEvent } from 'react'
import { Calendar, Euro, ImageUp, X } from 'lucide-react'
import { supabase } from '../lib/supabase'
import type { AdReport, CustomMetric } from '../types'
import { prepareImageFile, sanitizeFileName } from '../lib/image'
import { errorMessage, useToast } from '../lib/toast'

interface Props {
  pageId: string
  report?: AdReport
  onSaved: () => void
  onCancel: () => void
  onDelete?: () => void
}

interface MetricInput {
  label: string
  value: string
}

const DEFAULT_METRICS: MetricInput[] = [
  { label: 'Copertura', value: '' },
  { label: 'Impression', value: '' },
  { label: 'Costo per risultato (€)', value: '' },
]

const INPUT =
  'w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-sm text-neutral-800 outline-none transition-colors focus:border-neutral-500 focus:ring-2 focus:ring-neutral-200'
const LABEL = 'text-sm font-medium text-neutral-700'

function toNumber(value: string): number | null {
  return value.trim() === '' ? null : Number(value)
}

export function ReportForm({ pageId, report, onSaved, onCancel, onDelete }: Props) {
  const [campaignName, setCampaignName] = useState(report?.campaign_name ?? '')
  const [periodStart, setPeriodStart] = useState(report?.period_start ?? '')
  const [periodEnd, setPeriodEnd] = useState(report?.period_end ?? '')
  const [campaignObjective, setCampaignObjective] = useState(report?.campaign_objective ?? '')
  const [spend, setSpend] = useState(report?.spend?.toString() ?? '')
  const [metrics, setMetrics] = useState<MetricInput[]>(
    report
      ? report.custom_metrics.map((m) => ({ label: m.label, value: m.value?.toString() ?? '' }))
      : DEFAULT_METRICS,
  )
  const [notes, setNotes] = useState(report?.notes ?? '')
  const [existingPath, setExistingPath] = useState(report?.screenshot_path ?? null)
  const [removedPath, setRemovedPath] = useState<string | null>(null)
  const [newFile, setNewFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [preparingFile, setPreparingFile] = useState(false)
  const toast = useToast()

  const existingUrl = existingPath
    ? supabase.storage.from('reports').getPublicUrl(existingPath).data.publicUrl
    : null

  function removeExisting() {
    if (existingPath) setRemovedPath(existingPath)
    setExistingPath(null)
  }

  function addMetric() {
    setMetrics((prev) => [...prev, { label: '', value: '' }])
  }

  function updateMetric(index: number, field: 'label' | 'value', value: string) {
    setMetrics((prev) => prev.map((m, i) => (i === index ? { ...m, [field]: value } : m)))
  }

  function removeMetric(index: number) {
    setMetrics((prev) => prev.filter((_, i) => i !== index))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      let screenshotPath = existingPath
      if (newFile) {
        const path = `${pageId}/${crypto.randomUUID()}-${sanitizeFileName(newFile.name)}`
        const { error: uploadError } = await supabase.storage.from('reports').upload(path, newFile)
        if (uploadError) throw uploadError
        screenshotPath = path
      }

      const customMetrics: CustomMetric[] = metrics
        .filter((m) => m.label.trim())
        .map((m) => ({ label: m.label.trim(), value: toNumber(m.value) }))

      const payload = {
        page_id: pageId,
        campaign_name: campaignName.trim(),
        period_start: periodStart || null,
        period_end: periodEnd || null,
        campaign_objective: campaignObjective.trim() || null,
        spend: toNumber(spend),
        custom_metrics: customMetrics,
        notes: notes.trim() || null,
        screenshot_path: screenshotPath,
      }

      const { error: saveError } = report
        ? await supabase.from('ad_reports').update(payload).eq('id', report.id)
        : await supabase.from('ad_reports').insert(payload)
      if (saveError) throw saveError

      if (removedPath) {
        const { error: removeError } = await supabase.storage.from('reports').remove([removedPath])
        if (removeError) toast.error('Lo screenshot rimosso non è stato cancellato dallo storage')
      }

      onSaved()
    } catch (err) {
      console.error('Failed to save report', err)
      setError(errorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
      <div className="space-y-1.5">
        <label className={LABEL}>Nome campagna</label>
        <input
          required
          value={campaignName}
          onChange={(e) => setCampaignName(e.target.value)}
          placeholder="Inserisci il nome della campagna"
          className={INPUT}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className={LABEL}>Dal</label>
          <div className="relative">
            <Calendar className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
            <input
              type="date"
              value={periodStart}
              onChange={(e) => setPeriodStart(e.target.value)}
              className={`${INPUT} pl-9`}
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <label className={LABEL}>Al</label>
          <div className="relative">
            <Calendar className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
            <input
              type="date"
              value={periodEnd}
              onChange={(e) => setPeriodEnd(e.target.value)}
              className={`${INPUT} pl-9`}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className={LABEL}>Spesa (€)</label>
          <div className="relative">
            <Euro className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
            <input
              type="number"
              step="0.01"
              placeholder="0,00"
              value={spend}
              onChange={(e) => setSpend(e.target.value)}
              className={`${INPUT} pl-9`}
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <label className={LABEL}>Obiettivo campagna</label>
          <input
            value={campaignObjective}
            onChange={(e) => setCampaignObjective(e.target.value)}
            placeholder="Es. Acquisizione follower"
            className={INPUT}
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className={LABEL}>Metriche</label>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {metrics.map((metric, i) => (
            <div key={i} className="relative space-y-1.5 rounded-lg border border-neutral-200 bg-neutral-100/30 p-2.5">
              <button
                type="button"
                onClick={() => removeMetric(i)}
                title="Rimuovi metrica"
                className="absolute right-1.5 top-1.5 rounded-full p-0.5 text-neutral-500 hover:bg-white hover:text-neutral-700"
              >
                <X className="h-3.5 w-3.5" />
              </button>
              <input
                value={metric.label}
                onChange={(e) => updateMetric(i, 'label', e.target.value)}
                placeholder="Titolo"
                className="w-full border-0 bg-transparent p-0 pr-4 text-sm font-medium text-neutral-700 outline-none placeholder:font-normal placeholder:text-neutral-400"
              />
              <input
                type="number"
                value={metric.value}
                onChange={(e) => updateMetric(i, 'value', e.target.value)}
                placeholder="0"
                className="w-full rounded-md border border-neutral-300 bg-white px-2.5 py-2 text-sm outline-none transition-colors focus:border-neutral-500 focus:ring-2 focus:ring-neutral-200"
              />
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={addMetric}
          className="rounded-full border border-dashed border-neutral-400 px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-100"
        >
          + Aggiungi voce
        </button>
      </div>

      <div className="space-y-1.5">
        <label className={LABEL}>Screenshot report Meta</label>
        {existingUrl && (
          <div className="relative w-fit">
            <img src={existingUrl} alt="" className="h-24 w-auto rounded-lg object-cover" />
            <button
              type="button"
              onClick={removeExisting}
              className="absolute -right-2 -top-2 rounded-full bg-neutral-700 p-1 text-white shadow-sm"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        )}
        {!existingUrl && newFile && (
          <img src={URL.createObjectURL(newFile)} alt="" className="h-24 w-auto rounded-lg object-cover" />
        )}
        {!existingUrl && (
          <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-neutral-400 bg-neutral-100/40 px-3 py-2.5 text-sm text-neutral-800 hover:bg-neutral-100">
            <ImageUp className="h-4 w-4" />
            {preparingFile ? 'Elaborazione…' : 'Carica screenshot'}
            <input
              type="file"
              accept="image/*"
              disabled={preparingFile}
              onChange={async (e) => {
                const file = e.target.files?.[0]
                e.target.value = ''
                if (!file) return
                setPreparingFile(true)
                try {
                  setNewFile(await prepareImageFile(file))
                } catch (err) {
                  toast.error(err instanceof Error ? err.message : 'File non valido')
                } finally {
                  setPreparingFile(false)
                }
              }}
              className="hidden"
            />
          </label>
        )}
      </div>

      <div className="space-y-1.5">
        <label className={LABEL}>Note (opzionale)</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          className={INPUT}
        />
      </div>

      {error && <p className="text-sm text-neutral-700">{error}</p>}

      <div className="flex items-center justify-between gap-2 border-t border-neutral-200 pt-4">
        {report && onDelete ? (
          <button
            type="button"
            onClick={onDelete}
            className="rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50"
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
            className="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100"
          >
            Annulla
          </button>
          <button
            type="submit"
            disabled={saving || preparingFile}
            className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-neutral-800 disabled:opacity-50"
          >
            {saving ? 'Salvataggio…' : 'Salva'}
          </button>
        </div>
      </div>
    </form>
  )
}
