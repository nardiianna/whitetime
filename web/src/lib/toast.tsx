import { createContext, useCallback, useContext, useRef, useState } from 'react'
import type { ReactNode } from 'react'

export const UNDO_DELAY_MS = 5000

type ToastKind = 'success' | 'error' | 'undo'

interface Toast {
  id: string
  kind: ToastKind
  message: string
  onUndo?: () => void
}

interface ToastApi {
  success: (message: string) => void
  error: (message: string) => void
  undo: (message: string, onUndo: () => void, durationMs?: number) => void
}

const ToastContext = createContext<ToastApi | null>(null)

const KIND_STYLES: Record<ToastKind, string> = {
  success: 'border-brand-200 bg-white text-neutral-800',
  error: 'border-red-200 bg-red-50 text-red-800',
  undo: 'border-brand-200 bg-white text-neutral-800',
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>())

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
    const timer = timers.current.get(id)
    if (timer) {
      clearTimeout(timer)
      timers.current.delete(id)
    }
  }, [])

  const push = useCallback(
    (kind: ToastKind, message: string, onUndo?: () => void, durationMs = 4000) => {
      const id = crypto.randomUUID()
      setToasts((prev) => [...prev, { id, kind, message, onUndo }])
      const timer = setTimeout(() => dismiss(id), durationMs)
      timers.current.set(id, timer)
    },
    [dismiss],
  )

  const api: ToastApi = {
    success: (message) => push('success', message),
    error: (message) => push('error', message, undefined, 6000),
    undo: (message, onUndo, durationMs = UNDO_DELAY_MS) => push('undo', message, onUndo, durationMs),
  }

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex flex-col items-center gap-2 px-4">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-xl border px-4 py-3 text-sm shadow-lg ${KIND_STYLES[t.kind]}`}
          >
            <span className="flex-1">{t.message}</span>
            {t.onUndo && (
              <button
                onClick={() => {
                  t.onUndo?.()
                  dismiss(t.id)
                }}
                className="shrink-0 font-semibold text-brand-600 hover:text-brand-800"
              >
                Annulla
              </button>
            )}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}

export function errorMessage(err: unknown): string {
  if (err && typeof err === 'object' && 'message' in err) {
    const message = String((err as { message?: unknown }).message ?? '')
    const hint = 'hint' in err ? (err as { hint?: unknown }).hint : undefined
    return hint ? `${message} — ${hint}` : message || 'Si è verificato un errore'
  }
  return err instanceof Error ? err.message : 'Si è verificato un errore'
}
