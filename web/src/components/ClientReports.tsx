import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { AdReport } from '../types'

interface Props {
  pageId: string
}

export function ClientReports({ pageId }: Props) {
  const [reports, setReports] = useState<AdReport[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('ad_reports')
      .select('*')
      .eq('page_id', pageId)
      .order('period_start', { ascending: false, nullsFirst: false })
      .then(({ data }) => {
        setReports(data ?? [])
        setLoading(false)
      })
  }, [pageId])

  if (loading) return null

  if (reports.length === 0) {
    return <p className="py-8 text-center text-sm text-neutral-500">Nessun report disponibile al momento.</p>
  }

  return (
    <ul className="space-y-3">
      {reports.map((report) => {
        const screenshotUrl = report.screenshot_path
          ? supabase.storage.from('reports').getPublicUrl(report.screenshot_path).data.publicUrl
          : null
        return (
          <li key={report.id} className="space-y-3 rounded-2xl border border-brand-100 bg-white p-5 shadow-sm shadow-brand-100/50">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-semibold text-neutral-900">{report.campaign_name}</span>
              {(report.period_start || report.period_end) && (
                <span className="text-xs text-neutral-600">
                  {report.period_start ? new Date(report.period_start).toLocaleDateString('it-IT') : '…'}
                  {' → '}
                  {report.period_end ? new Date(report.period_end).toLocaleDateString('it-IT') : '…'}
                </span>
              )}
            </div>
            {report.campaign_objective && (
              <p className="text-sm text-brand-600">Obiettivo: {report.campaign_objective}</p>
            )}

            <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-3">
              {report.spend != null && (
                <div>
                  <p className="text-xs text-neutral-500">Spesa</p>
                  <p className="font-medium text-neutral-900">€{report.spend}</p>
                </div>
              )}
              {report.custom_metrics.map((m) => (
                <div key={m.label}>
                  <p className="text-xs text-neutral-500">{m.label}</p>
                  <p className="font-medium text-neutral-900">{m.value}</p>
                </div>
              ))}
            </div>

            {screenshotUrl && <img src={screenshotUrl} alt="" className="max-h-64 w-auto rounded-md" />}
            {report.notes && <p className="whitespace-pre-wrap text-sm text-neutral-700">{report.notes}</p>}
          </li>
        )
      })}
    </ul>
  )
}
