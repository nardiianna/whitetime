import { useCallback, useEffect, useState } from 'react'
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
    <div className="space-y-3 rounded-xl border border-brand-200 bg-white p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-brand-600">Report Meta Ads</h3>
        {!showForm && (
          <button
            onClick={openNew}
            className="rounded-full border border-dashed border-brand-300 px-3 py-1 text-xs text-brand-700"
          >
            + Nuovo report
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
              className="flex cursor-pointer flex-col gap-2 rounded-lg border border-brand-100 p-3 hover:border-brand-300 sm:flex-row sm:items-center"
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
                  {report.spend != null && <span>Spesa: €{report.spend}</span>}
                  {report.results != null && <span>Risultati: {report.results}</span>}
                  {report.cost_per_result != null && <span>Costo/risultato: €{report.cost_per_result}</span>}
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleDelete(report)
                }}
                className="self-start rounded-md border border-brand-300 px-2 py-1 text-xs text-brand-800 sm:self-center"
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
