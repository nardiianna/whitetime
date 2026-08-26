import { useCallback, useEffect, useState } from 'react'
import { ArrowRightCircle, ChevronLeft, ChevronRight, FileText, Plus } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { EDITORIAL_STATUS_LABELS } from '../types'
import type { EditorialPlanItem, PostPromotionDraft } from '../types'
import { addMonths, getMonthStart, isInMonth, monthLabel } from '../lib/date'
import { EditorialPlanForm } from './EditorialPlanForm'
import { errorMessage, useToast } from '../lib/toast'

interface Props {
  pageId: string
  onPromote?: (draft: PostPromotionDraft) => void
  onNoteAcknowledged?: () => void
}

type ClientFilter = 'all' | 'approved' | 'commented' | 'pending'

const STATUS_STYLES: Record<string, string> = {
  idea: 'bg-white text-neutral-800 border border-neutral-300',
  da_fare: 'bg-neutral-100 text-neutral-800',
  programmato: 'bg-neutral-200 text-neutral-700',
  pubblicato: 'bg-neutral-500 text-white font-medium',
}

const CLIENT_FILTERS: { key: ClientFilter; label: string }[] = [
  { key: 'all', label: 'Tutti' },
  { key: 'approved', label: 'Approvati' },
  { key: 'commented', label: 'Da rivedere' },
  { key: 'pending', label: 'In attesa' },
]

function matchesClientFilter(item: EditorialPlanItem, filter: ClientFilter) {
  if (filter === 'all') return true
  if (filter === 'approved') return item.approved
  if (filter === 'commented') return !!item.client_note
  return !item.approved && !item.client_note
}

export function EditorialPlanManager({ pageId, onPromote, onNoteAcknowledged }: Props) {
  const [items, setItems] = useState<EditorialPlanItem[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingItem, setEditingItem] = useState<EditorialPlanItem | undefined>(undefined)
  const [monthStart, setMonthStart] = useState(() => getMonthStart(new Date()))
  const [clientFilter, setClientFilter] = useState<ClientFilter>('all')
  const toast = useToast()

  const loadItems = useCallback(async () => {
    const { data } = await supabase
      .from('editorial_plan_items')
      .select('*')
      .eq('page_id', pageId)
      .order('scheduled_date', { ascending: true, nullsFirst: false })
    setItems(data ?? [])
  }, [pageId])

  useEffect(() => {
    loadItems()
  }, [loadItems])

  function openNew() {
    setEditingItem(undefined)
    setShowForm(true)
  }

  function openEdit(item: EditorialPlanItem) {
    setEditingItem(item)
    setShowForm(true)
  }

  async function handleAcknowledgeNote(item: EditorialPlanItem) {
    const { error } = await supabase
      .from('editorial_plan_items')
      .update({ note_acknowledged: true })
      .eq('id', item.id)
    if (error) {
      toast.error(errorMessage(error))
      return
    }
    onNoteAcknowledged?.()
    loadItems()
  }

  async function handleDelete(item: EditorialPlanItem) {
    if (!confirm('Eliminare questo contenuto dal piano editoriale?')) return
    if (item.image_paths.length > 0) {
      const { error } = await supabase.storage.from('media').remove(item.image_paths)
      if (error) toast.error('Alcune immagini non sono state cancellate dallo storage')
    }
    const { error: deleteError } = await supabase.from('editorial_plan_items').delete().eq('id', item.id)
    if (deleteError) {
      toast.error(errorMessage(deleteError))
      return
    }
    setShowForm(false)
    setEditingItem(undefined)
    loadItems()
  }

  const scheduled = items.filter(
    (i) => i.scheduled_date && isInMonth(i.scheduled_date, monthStart) && matchesClientFilter(i, clientFilter),
  )
  const unscheduled = items.filter((i) => !i.scheduled_date && matchesClientFilter(i, clientFilter))

  function renderRow(item: EditorialPlanItem) {
    const imageUrl =
      item.image_paths.length > 0 ? supabase.storage.from('media').getPublicUrl(item.image_paths[0]).data.publicUrl : null
    return (
      <li
        key={item.id}
        onClick={() => openEdit(item)}
        className="flex cursor-pointer flex-col gap-3 rounded-xl border border-neutral-200 p-3 transition-colors hover:border-neutral-400 hover:bg-neutral-100/40 sm:flex-row sm:items-center"
      >
        {imageUrl && (
          <div className="relative shrink-0">
            <img src={imageUrl} alt="" className="h-16 w-16 rounded-lg object-cover" />
            {item.image_paths.length > 1 && (
              <span className="absolute -right-1.5 -top-1.5 rounded-full bg-neutral-700 px-1.5 text-[10px] font-medium text-white">
                {item.image_paths.length}
              </span>
            )}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            {item.scheduled_date && (
              <span className="text-sm text-neutral-600">
                {new Date(item.scheduled_date).toLocaleDateString('it-IT', {
                  weekday: 'short',
                  day: '2-digit',
                  month: '2-digit',
                })}
              </span>
            )}
            <span className={`rounded-full px-2 py-0.5 text-xs ${STATUS_STYLES[item.status]}`}>
              {EDITORIAL_STATUS_LABELS[item.status]}
            </span>
            {item.social.map((s) => (
              <span key={s} className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-neutral-800">
                {s}
              </span>
            ))}
            {item.approved && (
              <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                ✓ Approvato
              </span>
            )}
            {item.client_note && (
              <span
                className={`rounded-full px-2 py-0.5 text-xs ${
                  item.note_acknowledged ? 'bg-neutral-300 text-neutral-900' : 'bg-red-100 font-medium text-red-700'
                }`}
                title={item.client_note}
              >
                💬 {item.note_acknowledged ? 'nota cliente' : 'nuova nota cliente'}
              </span>
            )}
            {item.client_note && !item.note_acknowledged && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleAcknowledgeNote(item)
                }}
                className="rounded-full border border-neutral-300 px-2 py-0.5 text-xs font-medium text-neutral-700 hover:bg-neutral-100"
              >
                ✓ Segna come letta
              </button>
            )}
          </div>
          <p className="truncate text-sm font-medium text-neutral-900">
            {item.theme || '(senza tema)'}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2 self-start sm:self-center">
          {onPromote && item.approved && item.scheduled_date && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onPromote({
                  pageId,
                  caption: item.caption ?? '',
                  notes: item.theme ? `Da Piano Editoriale: ${item.theme}` : 'Da Piano Editoriale',
                  scheduledDate: item.scheduled_date,
                })
                toast.success('Post precompilato in Pianificazione: rivedi data/immagini e salva.')
              }}
              className="flex items-center gap-1.5 rounded-full border border-neutral-300 px-3 py-1 text-xs font-medium text-neutral-700 hover:bg-neutral-100"
              title="Precompila un nuovo post in Pianificazione con questo contenuto"
            >
              <ArrowRightCircle className="h-3.5 w-3.5" />
              Trasforma in post
            </button>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation()
              handleDelete(item)
            }}
            className="rounded-full border border-neutral-300 px-3 py-1 text-xs font-medium text-neutral-700 hover:bg-neutral-100"
          >
            Elimina
          </button>
        </div>
      </li>
    )
  }

  return (
    <div className="space-y-4 rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-neutral-100 text-neutral-800">
            <FileText className="h-5 w-5" />
          </div>
          <h3 className="text-base font-semibold text-neutral-800">Piano Editoriale</h3>
        </div>
        {!showForm && (
          <button
            onClick={openNew}
            className="flex items-center gap-1.5 rounded-full border border-dashed border-neutral-400 px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-100"
          >
            <Plus className="h-3.5 w-3.5" />
            Nuovo contenuto
          </button>
        )}
      </div>

      {showForm && (
        <EditorialPlanForm
          pageId={pageId}
          item={editingItem}
          onSaved={() => {
            setShowForm(false)
            setEditingItem(undefined)
            loadItems()
          }}
          onCancel={() => {
            setShowForm(false)
            setEditingItem(undefined)
          }}
          onDelete={editingItem ? () => handleDelete(editingItem) : undefined}
        />
      )}

      {!showForm && (
        <>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setMonthStart((m) => addMonths(m, -1))}
                className="rounded-lg border border-neutral-300 bg-white p-1.5 text-neutral-700 hover:bg-neutral-100"
                aria-label="Mese precedente"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-sm font-medium text-neutral-800">{monthLabel(monthStart)}</span>
              <button
                onClick={() => setMonthStart((m) => addMonths(m, 1))}
                className="rounded-lg border border-neutral-300 bg-white p-1.5 text-neutral-700 hover:bg-neutral-100"
                aria-label="Mese successivo"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
            <button
              onClick={() => setMonthStart(getMonthStart(new Date()))}
              className="rounded-full border border-neutral-300 bg-white px-3 py-1 text-xs font-medium text-neutral-700 hover:bg-neutral-100"
            >
              Mese corrente
            </button>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {CLIENT_FILTERS.map((f) => (
              <button
                key={f.key}
                onClick={() => setClientFilter(f.key)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  clientFilter === f.key
                    ? 'bg-neutral-900 text-white shadow-sm '
                    : 'border border-neutral-200 bg-white text-neutral-800 hover:bg-neutral-100'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {scheduled.length === 0 && (
            <p className="text-sm text-neutral-500">Nessun contenuto pianificato per questo mese.</p>
          )}
          {scheduled.length > 0 && <ul className="space-y-2">{scheduled.map(renderRow)}</ul>}

          {unscheduled.length > 0 && (
            <div className="space-y-2 border-t border-neutral-200 pt-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Senza data</p>
              <ul className="space-y-2">{unscheduled.map(renderRow)}</ul>
            </div>
          )}
        </>
      )}
    </div>
  )
}
