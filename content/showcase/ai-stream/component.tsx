'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

const PROMPT = 'Explain the tradeoffs of micro-frontend architecture'

const RESPONSE_TOKENS = (
  'Micro-frontends let teams own and deploy UI slices independently, ' +
  'which reduces coordination overhead and enables polyglot tech stacks. ' +
  'The cost is real: every boundary adds a network round-trip, a separate JavaScript bundle, ' +
  'and a shared-state contract that can drift. ' +
  'Consistent design systems become hard to enforce when each team ships its own component library. ' +
  'The pattern pays off at scale where deployment independence outweighs the integration tax — ' +
  'below that threshold, a well-structured monorepo is almost always simpler.'
).split(/(?<=\s)|(?=\s)/).filter(Boolean)

function jitter(token: string): number {
  const base = 30 + Math.random() * 50
  const isPunctuation = /[.,!?;:]$/.test(token.trim())
  return base + (isPunctuation ? 150 + Math.random() * 70 : 0)
}

type Status = 'idle' | 'streaming' | 'done'

export default function AiStreamComponent() {
  const [status, setStatus] = useState<Status>('idle')
  const [displayed, setDisplayed] = useState('')
  const [cursorVisible, setCursorVisible] = useState(false)
  const outputRef = useRef<HTMLDivElement>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const cursorIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const indexRef = useRef(0)
  // Use a ref to hold the recursive scheduler so useCallback deps stay stable.
  const schedulerRef = useRef<(() => void) | null>(null)

  const clearTimers = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    if (cursorIntervalRef.current) clearInterval(cursorIntervalRef.current)
  }, [])

  const stopCursorBlink = useCallback(() => {
    if (cursorIntervalRef.current) clearInterval(cursorIntervalRef.current)
    setCursorVisible(false)
  }, [])

  const startCursorBlink = useCallback(() => {
    setCursorVisible(true)
    cursorIntervalRef.current = setInterval(() => setCursorVisible((v) => !v), 530)
  }, [])

  // Build the scheduler and store in ref to avoid circular useCallback deps.
  useEffect(() => {
    schedulerRef.current = () => {
      const i = indexRef.current
      const token = RESPONSE_TOKENS[i]
      if (i >= RESPONSE_TOKENS.length || token === undefined) {
        stopCursorBlink()
        setStatus('done')
        return
      }
      timeoutRef.current = setTimeout(() => {
        setDisplayed((prev) => prev + token)
        indexRef.current = i + 1
        schedulerRef.current?.()
      }, jitter(token))
    }
  }, [stopCursorBlink])

  const handleStream = useCallback(() => {
    if (status === 'streaming') return
    clearTimers()
    setDisplayed('')
    indexRef.current = 0
    setStatus('streaming')
    startCursorBlink()
    schedulerRef.current?.()
  }, [status, clearTimers, startCursorBlink])

  const handleReset = useCallback(() => {
    clearTimers()
    setDisplayed('')
    indexRef.current = 0
    setCursorVisible(false)
    setStatus('idle')
  }, [clearTimers])

  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight
    }
  }, [displayed])

  useEffect(() => () => clearTimers(), [clearTimers])

  return (
    <div className="flex w-full max-w-lg flex-col overflow-hidden rounded-(--radius-card) border border-(--color-border) bg-(--color-surface) font-mono text-sm">
      <div className="flex items-center gap-2.5 px-5 py-4">
        <span className="select-none text-(--color-fg-subtle)">{'>'}</span>
        <span className="flex-1 truncate text-(--color-fg-muted)">{PROMPT}</span>
        {status === 'idle' && (
          <button
            type="button"
            onClick={handleStream}
            className="shrink-0 rounded-md border border-(--color-border-strong) bg-(--color-surface-hover) px-3 py-1 text-xs text-(--color-fg) transition-colors hover:border-(--color-accent)"
          >
            Send
          </button>
        )}
      </div>

      {status !== 'idle' && (
        <div
          ref={outputRef}
          aria-live="polite"
          aria-label="AI response"
          className="scrollbar-thin max-h-48 overflow-y-auto border-t border-(--color-border) bg-(--color-bg) px-5 py-4 leading-relaxed text-(--color-fg)"
        >
          <span>{displayed}</span>
          {status === 'streaming' && (
            <span
              aria-hidden="true"
              className="text-(--color-accent)"
              style={{ opacity: cursorVisible ? 1 : 0, transition: 'opacity 80ms ease' }}
            >
              |
            </span>
          )}
        </div>
      )}

      <div className="flex items-center justify-between gap-3 border-t border-(--color-border) px-5 py-3">
        <span className="text-[10px] tracking-[0.14em] text-(--color-fg-subtle) uppercase">
          {status === 'idle' && 'Ready'}
          {status === 'streaming' && 'Streaming\u2026'}
          {status === 'done' && `${RESPONSE_TOKENS.length} tokens`}
        </span>
        {status === 'done' && (
          <button
            type="button"
            onClick={handleReset}
            className="rounded-md border border-(--color-border) px-3 py-1 text-xs text-(--color-fg-muted) transition-colors hover:text-(--color-fg)"
          >
            Reset
          </button>
        )}
      </div>
    </div>
  )
}
