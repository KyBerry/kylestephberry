'use client'

import { useEffect, useRef, useState } from 'react'

/**
 * An accessible toast stack: polite live announcements, pause-on-hover and
 * pause-on-focus timers, a visible cap with a queue behind it, and an exit
 * animation that respects prefers-reduced-motion.
 */

const MAX_VISIBLE = 3
const DURATION_MS = 5000
const TICK_MS = 100
const EXIT_MS = 180

type ToastKind = 'success' | 'error' | 'info'

interface Toast {
  id: number
  kind: ToastKind
  title: string
  detail: string
  remaining: number
  leaving: boolean
}

interface Stack {
  visible: Toast[]
  queue: Toast[]
}

const KIND_META: Record<ToastKind, { label: string; dot: string }> = {
  success: { label: 'Success', dot: 'oklch(0.72 0.12 150)' },
  error: { label: 'Error', dot: 'oklch(0.65 0.16 25)' },
  info: { label: 'Info', dot: 'var(--color-accent)' },
}

const TRIGGERS: Array<{ kind: ToastKind; button: string; title: string; detail: string }> = [
  { kind: 'success', button: 'Save draft', title: 'Draft saved', detail: 'All changes synced.' },
  { kind: 'error', button: 'Sync (fails)', title: 'Sync failed', detail: 'Retry in a moment.' },
  { kind: 'info', button: 'Copy link', title: 'Link copied', detail: 'Ready to paste.' },
]

export default function ToastQueue() {
  const [stack, setStack] = useState<Stack>({ visible: [], queue: [] })
  const [paused, setPaused] = useState(false)
  const nextId = useRef(1)
  const removalScheduled = useRef(new Set<number>())
  const removalTimers = useRef<number[]>([])

  const push = (kind: ToastKind, title: string, detail: string) => {
    const toast: Toast = {
      id: nextId.current++,
      kind,
      title,
      detail,
      remaining: DURATION_MS,
      leaving: false,
    }
    setStack((s) =>
      s.visible.length < MAX_VISIBLE
        ? { visible: [...s.visible, toast], queue: s.queue }
        : { visible: s.visible, queue: [...s.queue, toast] },
    )
  }

  const dismiss = (id: number) => {
    setStack((s) => ({
      visible: s.visible.map((t) => (t.id === id ? { ...t, leaving: true } : t)),
      queue: s.queue,
    }))
  }

  // Countdown tick. Paused while the pointer or focus is inside the stack.
  useEffect(() => {
    if (paused) return
    const id = window.setInterval(() => {
      setStack((s) => {
        if (s.visible.length === 0) return s
        return {
          visible: s.visible.map((t) => {
            if (t.leaving) return t
            const remaining = t.remaining - TICK_MS
            return remaining <= 0 ? { ...t, remaining: 0, leaving: true } : { ...t, remaining }
          }),
          queue: s.queue,
        }
      })
    }, TICK_MS)
    return () => window.clearInterval(id)
  }, [paused])

  // Remove leaving toasts after the exit animation, then promote from the queue.
  useEffect(() => {
    for (const toast of stack.visible) {
      if (!toast.leaving || removalScheduled.current.has(toast.id)) continue
      removalScheduled.current.add(toast.id)
      const timer = window.setTimeout(() => {
        removalScheduled.current.delete(toast.id)
        setStack((s) => {
          const visible = s.visible.filter((t) => t.id !== toast.id)
          const queue = [...s.queue]
          while (visible.length < MAX_VISIBLE && queue.length > 0) {
            visible.push(queue.shift() as Toast)
          }
          return { visible, queue }
        })
      }, EXIT_MS)
      removalTimers.current.push(timer)
    }
  }, [stack])

  useEffect(() => {
    const timers = removalTimers.current
    return () => {
      for (const id of timers) window.clearTimeout(id)
    }
  }, [])

  return (
    <div className="mx-auto w-md max-w-full">
      <style>{`
        @keyframes toast-enter {
          from { opacity: 0; transform: translateY(8px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .toast-item { animation: toast-enter 200ms cubic-bezier(0.22, 1, 0.36, 1); }
        .toast-item[data-leaving='true'] {
          opacity: 0;
          transform: translateY(4px);
          transition: opacity ${EXIT_MS}ms ease, transform ${EXIT_MS}ms ease;
        }
        @media (prefers-reduced-motion: reduce) {
          .toast-item { animation: none; }
          .toast-item[data-leaving='true'] { transition: none; }
        }
      `}</style>

      <div className="flex flex-wrap gap-2">
        {TRIGGERS.map((t) => (
          <button
            key={t.kind}
            type="button"
            onClick={() => push(t.kind, t.title, t.detail)}
            className="rounded-md border border-(--color-border-strong) bg-(--color-surface) px-3 py-1.5 text-sm text-(--color-fg) transition-colors hover:bg-(--color-surface-hover)"
          >
            {t.button}
          </button>
        ))}
      </div>

      <div
        role="region"
        aria-label="Notifications"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocusCapture={() => setPaused(true)}
        onBlurCapture={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget)) setPaused(false)
        }}
        className="mt-6 flex min-h-64 flex-col justify-end gap-2"
      >
        {stack.visible.map((toast) => (
          <div
            key={toast.id}
            role={toast.kind === 'error' ? 'alert' : 'status'}
            data-leaving={toast.leaving}
            className="toast-item relative overflow-hidden rounded-(--radius-card) border border-(--color-border-strong) bg-(--color-surface) px-4 py-3"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <span
                  aria-hidden="true"
                  className="mt-1.5 size-2 shrink-0 rounded-full"
                  style={{ background: KIND_META[toast.kind].dot }}
                />
                <div>
                  <p className="text-sm text-(--color-fg)">
                    <span className="sr-only">{KIND_META[toast.kind].label}: </span>
                    {toast.title}
                  </p>
                  <p className="mt-0.5 text-xs text-(--color-fg-muted)">{toast.detail}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => dismiss(toast.id)}
                aria-label={`Dismiss notification: ${toast.title}`}
                className="-m-1 flex size-6 shrink-0 items-center justify-center rounded-md font-mono text-xs text-(--color-fg-subtle) transition-colors hover:bg-(--color-surface-hover) hover:text-(--color-fg)"
              >
                ✕
              </button>
            </div>
            <div
              aria-hidden="true"
              className="absolute inset-x-0 bottom-0 h-0.5 bg-(--color-accent) opacity-60"
              style={{ width: `${(toast.remaining / DURATION_MS) * 100}%` }}
            />
          </div>
        ))}
        <div className="flex h-4 items-center justify-between font-mono text-[10px] text-(--color-fg-subtle)">
          <span>{paused ? 'timers paused' : ' '}</span>
          <span>{stack.queue.length > 0 ? `+${stack.queue.length} queued` : ' '}</span>
        </div>
      </div>
    </div>
  )
}
