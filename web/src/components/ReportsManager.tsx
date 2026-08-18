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
    setReports(data ?? [])
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
    <div className="space-y-4 rounded-2xl border border-brand-100 bg-white p-5 shadow-sm shadow-brand-100/50">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-50 text-brand-600">
            <BarChart3 className="h-5 w-5" />
          </div>
          <h3 className="text-base font-semibold text-brand-600">Dashboard campagne</h3>
        </div>
        {!showForm && (
          <button
            onClick={openNew}
            className="flex items-center gap-1.5 rounded-full border border-dashed border-brand-300 px-3 py-1.5 text-xs font-medium text-brand-700 hover:bg-brand-50"
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
        <ul className="space-y-2">
          {reports.map((report) => (
            <li
              key={report.id}
              onClick={() => openEdit(report)}
              className="flex cursor-pointer flex-col gap-2 rounded-xl border border-brand-100 p-3 transition-colors hover:border-brand-300 hover:bg-brand-50/40 sm:flex-row sm:items-center"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium text-neutral-900">{report.campaign_name}</span>
                  {(report.period_start || report.period_end) && (
                    <span className="text-xs text-neutral-600">
                      {report.period_start ?? '…'} → {report.period_end ?? '…'}
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-2 text-xs text-brand-600">
                  {report.campaign_objective && <span>{report.campaign_objective}</span>}
                  {report.spend != null && <span>Spesa: €{report.spend}</span>}
                  {report.custom_metrics.map((m) => (
                    <span key={m.label}>
                      {m.label}: {m.value}
                    </span>
                  ))}
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleDelete(report)
                }}
                className="self-start rounded-full border border-brand-200 px-3 py-1 text-xs font-medium text-brand-700 hover:bg-brand-50 sm:self-center"
              >
                Elimina
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
