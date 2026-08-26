import { useCallback, useEffect, useState } from 'react'
import { BarChart3, Plus } from 'lucide-react'
import { supabase } from '../lib/supabase'
import type { AdReport } from '../types'
import { ReportForm } from './ReportForm'

interface Props {
  pageId: string
}

export function ReportsManager({ pageId }: Props) {
  const [reports, setReports] = useState<AdReport[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingReport, setEditingReport] = useState<AdReport | undefined>(undefined)

  const loadReports = useCallback(async () => {
    const { data } = await supabase
      .from('ad_reports')
      .select('*')
      .eq('page_id', pageId)
      .order('period_start', { ascending: false, nullsFirst: false })
    const sorted = [...(data ?? [])].sort((a, b) =>
      a.kind === b.kind ? 0 : a.kind === 'organic' ? -1 : 1,
    )
    setReports(sorted)
  }, [pageId])

  useEffect(() => {
    loadReports()
  }, [loadReports])

  function openNew() {
    setEditingReport(undefined)
    setShowForm(true)
  }

  function openEdit(report: AdReport) {
    setEditingReport(report)
    setShowForm(true)
  }

  async function handleDelete(report: AdReport) {
    if (!confirm('Eliminare questo report?')) return
    if (report.screenshot_path) {
      const { error } = await supabase.storage.from('reports').remove([report.screenshot_path])
      if (error) console.error('Failed to delete screenshot', error)
    }
    await supabase.from('ad_reports').delete().eq('id', report.id)
    setShowForm(false)
    setEditingReport(undefined)
    loadReports()
  }

  return (
    <div className="space-y-4 rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-neutral-100 text-neutral-800">
            <BarChart3 className="h-5 w-5" />
          </div>
          <h3 className="text-base font-semibold text-neutral-800">Dashboard campagne</h3>
        </div>
        {!showForm && (
          <button
            onClick={openNew}
            className="flex items-center gap-1.5 rounded-full border border-dashed border-neutral-400 px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-100"
          >
            <Plus className="h-3.5 w-3.5" />
            Nuovo report
          </button>
        )}
      </div>

      {showForm && (
        <ReportForm
          pageId={pageId}
          report={editingReport}
          onSaved={() => {
            setShowForm(false)
            setEditingReport(undefined)
            loadReports()
          }}
          onCancel={() => {
            setShowForm(false)
            setEditingReport(undefined)
          }}
          onDelete={editingReport ? () => handleDelete(editingReport) : undefined}
        />
      )}

      {reports.length === 0 && !showForm && (
        <p className="text-sm text-neutral-500">Nessun report inserito per questo cliente.</p>
      )}

      {reports.length > 0 && (
        <ul className="space-y-3">
          {reports.map((report) => (
            <li
              key={report.id}
              onClick={() => openEdit(report)}
              className={`cursor-pointer space-y-3 rounded-xl border p-4 transition-colors hover:bg-neutral-100/40 ${
                report.kind === 'organic'
                  ? 'border-2 border-indigo-300 hover:border-indigo-400'
                  : 'border-neutral-200 hover:border-neutral-400'
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  {report.kind === 'organic' && (
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-indigo-600">
                      📈 Crescita organica
                    </p>
                  )}
                  <p className="font-semibold text-neutral-900">{report.campaign_name}</p>
                  {report.campaign_objective && (
                    <p className="text-xs text-neutral-800">{report.campaign_objective}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {(report.period_start || report.period_end) && (
                    <span className="text-xs text-neutral-500">
                      {report.period_start ? new Date(report.period_start).toLocaleDateString('it-IT') : '…'}
                      {' → '}
                      {report.period_end ? new Date(report.period_end).toLocaleDateString('it-IT') : '…'}
                    </span>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDelete(report)
                    }}
                    className="shrink-0 rounded-full border border-neutral-300 px-3 py-1 text-xs font-medium text-neutral-700 hover:bg-neutral-100"
                  >
                    Elimina
                  </button>
                </div>
              </div>

              {(report.spend != null || report.custom_metrics.length > 0) && (
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 border-t border-neutral-200 pt-3 text-sm sm:grid-cols-4">
                  {report.spend != null && (
                    <div>
                      <p className="text-xs text-neutral-500">Spesa</p>
                      <p className="font-semibold text-neutral-900">€{report.spend}</p>
                    </div>
                  )}
                  {report.custom_metrics.map((m) => (
                    <div key={m.label}>
                      <p className="text-xs text-neutral-500">{m.label}</p>
                      <p className="font-semibold text-neutral-900">{m.value}</p>
                    </div>
                  ))}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
