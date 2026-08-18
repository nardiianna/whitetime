import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { EDITORIAL_STATUS_LABELS } from '../types'
import type { EditorialPlanItem } from '../types'
import { EditorialPlanForm } from './EditorialPlanForm'

interface Props {
  pageId: string
}

const STATUS_STYLES: Record<string, string> = {
  idea: 'bg-white text-brand-600 border border-brand-200',
  da_fare: 'bg-brand-50 text-brand-600',
  programmato: 'bg-brand-100 text-brand-700',
  pubblicato: 'bg-brand-300 text-neutral-800 font-medium',
}

export function EditorialPlanManager({ pageId }: Props) {
  const [items, setItems] = useState<EditorialPlanItem[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingItem, setEditingItem] = useState<EditorialPlanItem | undefined>(undefined)

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

  async function handleDelete(item: EditorialPlanItem) {
    if (!confirm('Eliminare questo contenuto dal piano editoriale?')) return
    await supabase.from('editorial_plan_items').delete().eq('id', item.id)
    setShowForm(false)
    setEditingItem(undefined)
    loadItems()
  }

  return (
    <div className="space-y-3 rounded-xl border border-brand-200 bg-white p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-brand-600">Piano Editoriale</h3>
        {!showForm && (
          <button
            onClick={openNew}
            className="rounded-full border border-dashed border-brand-300 px-3 py-1 text-xs text-brand-700"
          >
            + Nuovo contenuto
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

      {items.length === 0 && !showForm && (
        <p className="text-sm text-neutral-500">Nessun contenuto pianificato per questo cliente.</p>
      )}

      {items.length > 0 && (
        <ul className="space-y-2">
          {items.map((item) => (
            <li
              key={item.id}
              onClick={() => openEdit(item)}
              className="flex cursor-pointer flex-col gap-2 rounded-lg border border-brand-100 p-3 hover:border-brand-300 sm:flex-row sm:items-center"
            >
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
                    <span key={s} className="rounded-full bg-brand-50 px-2 py-0.5 text-xs text-brand-600">
                      {s}
                    </span>
                  ))}
                  {item.client_note && (
                    <span className="rounded-full bg-brand-200 px-2 py-0.5 text-xs text-brand-800" title={item.client_note}>
                      💬 nota cliente
                    </span>
                  )}
                </div>
                <p className="truncate text-sm font-medium text-neutral-900">
                  {item.title || item.theme || '(senza titolo)'}
                </p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleDelete(item)
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
