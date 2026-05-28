'use client'

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react'

type StreamStatus = 'streaming' | 'stopped' | 'done'

interface Citation {
  id: string
  marker: string
  title: string
  source: string
  quote: string
}

const USER_PROMPT = 'Summarize the dashboard accessibility risks before launch.'

const ASSISTANT_RESPONSE =
  'The launch risk is concentrated in three places: virtualized rows need a stable focus model, chart summaries need text equivalents, and automated locale formatting needs RTL review before it reaches production. I would ship once keyboard navigation, polite announcements, and citation traceability pass review. [1] [2]'

const RESPONSE_TOKENS = ASSISTANT_RESPONSE.split(/(?<=\s)|(?=\s)/).filter(Boolean)

const CITATIONS = [
  {
    id: 'grid-focus',
    marker: '1',
    title: 'Grid focus model',
    source: 'Dashboard accessibility review',
    quote: 'A virtualized grid must keep active row state stable even when offscreen rows unmount.',
  },
  {
    id: 'locale-rtl',
    marker: '2',
    title: 'Locale QA note',
    source: 'International launch checklist',
    quote:
      'RTL QA should validate direction, punctuation, numeric formatting, and focus order together.',
  },
] as const satisfies readonly Citation[]

type CitationId = (typeof CITATIONS)[number]['id']
const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)'

function tokenDelay(token: string, reducedMotion: boolean): number {
  if (reducedMotion) return 12

  const base = 26 + Math.random() * 34
  const pause = /[.!?]$/.test(token.trim()) ? 180 : 0
  return base + pause
}

function subscribeToMotionPreference(onStoreChange: () => void): () => void {
  const media = window.matchMedia(REDUCED_MOTION_QUERY)
  media.addEventListener('change', onStoreChange)
  return () => media.removeEventListener('change', onStoreChange)
}

function getMotionPreference(): boolean {
  return window.matchMedia(REDUCED_MOTION_QUERY).matches
}

function getServerMotionPreference(): boolean {
  return false
}

function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(
    subscribeToMotionPreference,
    getMotionPreference,
    getServerMotionPreference,
  )
}

export default function AiMessagePanel() {
  const reducedMotion = usePrefersReducedMotion()
  const [status, setStatus] = useState<StreamStatus>('streaming')
  const [displayed, setDisplayed] = useState('')
  const [tokenIndex, setTokenIndex] = useState(0)
  const [expandedCitationId, setExpandedCitationId] = useState<CitationId | null>('grid-focus')
  const scrollRef = useRef<HTMLDivElement | null>(null)

  const expandedCitation = useMemo(
    () => CITATIONS.find((citation) => citation.id === expandedCitationId) ?? null,
    [expandedCitationId],
  )

  useEffect(() => {
    if (status !== 'streaming') return

    if (reducedMotion) {
      const timer = setTimeout(() => {
        setTokenIndex(RESPONSE_TOKENS.length)
        setDisplayed(ASSISTANT_RESPONSE)
        setStatus('done')
      }, 80)
      return () => clearTimeout(timer)
    }

    const token = RESPONSE_TOKENS[tokenIndex]
    if (token === undefined) {
      return
    }

    const timer = setTimeout(
      () => {
        setDisplayed((current) => current + token)
        setTokenIndex((current) => current + 1)
        if (tokenIndex + 1 >= RESPONSE_TOKENS.length) {
          setStatus('done')
        }
      },
      tokenDelay(token, reducedMotion),
    )

    return () => clearTimeout(timer)
  }, [reducedMotion, status, tokenIndex])

  useEffect(() => {
    if (!scrollRef.current) return
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [displayed, expandedCitationId])

  function stopStream() {
    setStatus('stopped')
  }

  function regenerate() {
    setTokenIndex(0)
    setDisplayed('')
    setExpandedCitationId('grid-focus')
    setStatus('streaming')
  }

  return (
    <div className="mx-auto w-full max-w-2xl overflow-hidden rounded-(--radius-card) border border-(--color-border) bg-(--color-surface) text-sm">
      <style>{`
        @keyframes ai-cursor-blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }

        @media (prefers-reduced-motion: reduce) {
          .ai-cursor { animation: none !important; }
        }
      `}</style>

      <div className="flex items-center justify-between gap-3 border-b border-(--color-border) px-4 py-3">
        <div>
          <p className="font-mono text-[10px] tracking-[0.18em] text-(--color-fg-subtle) uppercase">
            Review assistant
          </p>
          <p className="mt-1 text-xs text-(--color-fg-muted)">
            Streaming response with expandable sources
          </p>
        </div>
        <span
          aria-hidden="true"
          className="size-2 shrink-0 rounded-full bg-(--color-accent)"
          style={{ opacity: status === 'streaming' ? 1 : 0.4 }}
        />
      </div>

      <div
        ref={scrollRef}
        className="scrollbar-thin max-h-[390px] space-y-4 overflow-y-auto bg-(--color-bg) p-4"
      >
        <section
          aria-label="User message"
          className="ml-auto max-w-[86%] rounded-(--radius-card) rounded-tr-md border border-(--color-border) bg-(--color-surface) px-4 py-3 text-(--color-fg)"
        >
          <p className="font-mono text-[10px] tracking-[0.14em] text-(--color-fg-subtle) uppercase">
            You
          </p>
          <p className="mt-1">{USER_PROMPT}</p>
        </section>

        <section
          aria-label="Assistant message"
          className="max-w-[92%] rounded-(--radius-card) rounded-tl-md border border-(--color-border) bg-(--color-surface) px-4 py-3 text-(--color-fg-muted)"
        >
          <div className="flex items-center justify-between gap-3">
            <p className="font-mono text-[10px] tracking-[0.14em] text-(--color-fg-subtle) uppercase">
              Assistant
            </p>
            <span className="font-mono text-[10px] text-(--color-fg-subtle)">
              {status === 'streaming' ? 'Generating' : status === 'done' ? 'Complete' : 'Stopped'}
            </span>
          </div>

          <p aria-live="polite" className="mt-3 min-h-24 leading-relaxed text-(--color-fg)">
            {displayed}
            {status === 'streaming' ? (
              <span
                aria-hidden="true"
                className="ai-cursor ml-0.5 inline-block h-4 w-1 translate-y-0.5 rounded-full bg-(--color-accent)"
                style={{ animation: 'ai-cursor-blink 860ms steps(1) infinite' }}
              />
            ) : null}
          </p>

          <div className="mt-4 flex flex-wrap gap-2" aria-label="Citations">
            {CITATIONS.map((citation) => {
              const expanded = expandedCitationId === citation.id
              return (
                <button
                  key={citation.id}
                  type="button"
                  onClick={() => setExpandedCitationId(expanded ? null : citation.id)}
                  aria-expanded={expanded}
                  className="rounded-full border border-(--color-border) bg-(--color-bg) px-3 py-1 font-mono text-[10px] text-(--color-fg-muted) transition-colors hover:border-(--color-accent) hover:text-(--color-fg)"
                >
                  [{citation.marker}] {citation.title}
                </button>
              )
            })}
          </div>

          {expandedCitation ? (
            <aside className="mt-3 rounded-(--radius-card) border border-(--color-border) bg-(--color-bg) p-3">
              <p className="font-mono text-[10px] tracking-[0.14em] text-(--color-accent) uppercase">
                {expandedCitation.source}
              </p>
              <p className="mt-2 text-xs leading-relaxed text-(--color-fg-muted)">
                {expandedCitation.quote}
              </p>
            </aside>
          ) : null}
        </section>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-(--color-border) px-4 py-3">
        <span className="font-mono text-[10px] text-(--color-fg-subtle)" aria-live="polite">
          {status === 'streaming'
            ? `${tokenIndex}/${RESPONSE_TOKENS.length} tokens`
            : status === 'done'
              ? `${RESPONSE_TOKENS.length} tokens with ${CITATIONS.length} citations`
              : `Stopped at ${tokenIndex} tokens`}
        </span>
        <div className="flex gap-2">
          {status === 'streaming' ? (
            <button
              type="button"
              onClick={stopStream}
              className="rounded-md border border-(--color-border) px-3 py-1.5 text-xs text-(--color-fg-muted) transition-colors hover:text-(--color-fg)"
            >
              Stop
            </button>
          ) : null}
          <button
            type="button"
            onClick={regenerate}
            className="rounded-md border border-(--color-border-strong) bg-(--color-bg) px-3 py-1.5 text-xs text-(--color-fg) transition-colors hover:border-(--color-accent)"
          >
            Regenerate
          </button>
        </div>
      </div>
    </div>
  )
}
