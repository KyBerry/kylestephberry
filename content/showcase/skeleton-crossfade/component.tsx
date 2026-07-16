'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * A perceived-performance study: skeleton -> content with a minimum display
 * time. If data arrives before MIN_SKELETON_MS, the skeleton is held so it
 * never flashes. If data is slower, content swaps in the moment it lands.
 */

const MIN_SKELETON_MS = 450
const CROSSFADE_MS = 240

interface LoadStats {
  fetchMs: number
  heldMs: number
}

interface Article {
  title: string
  excerpt: string
  meta: string
}

const ARTICLE: Article = {
  title: 'Why loading states deserve design time',
  excerpt:
    'A skeleton that flashes for 80ms is worse than no skeleton at all. The fix is a minimum display time, and the numbers matter more than the pattern.',
  meta: '4 min read · Perception',
}

/** Simulated fetch: sometimes faster than the minimum, sometimes slower. */
function fakeLatency(): number {
  return 150 + Math.random() * 1250
}

export default function SkeletonCrossfade() {
  const [phase, setPhase] = useState<'loading' | 'ready'>('loading')
  const [stats, setStats] = useState<LoadStats | null>(null)
  const timersRef = useRef<number[]>([])

  const clearTimers = useCallback(() => {
    for (const id of timersRef.current) window.clearTimeout(id)
    timersRef.current = []
  }, [])

  // Only schedules timers; state changes happen inside the timer callbacks,
  // so this is safe to run from the mount effect.
  const schedule = useCallback(() => {
    const startedAt = performance.now()
    const latency = fakeLatency()

    const fetchTimer = window.setTimeout(() => {
      const fetchMs = Math.round(performance.now() - startedAt)
      const heldMs = Math.max(0, Math.round(MIN_SKELETON_MS - fetchMs))

      const holdTimer = window.setTimeout(() => {
        setPhase('ready')
        setStats({ fetchMs, heldMs })
      }, heldMs)
      timersRef.current.push(holdTimer)
    }, latency)
    timersRef.current.push(fetchTimer)
  }, [])

  const reload = () => {
    clearTimers()
    setPhase('loading')
    setStats(null)
    schedule()
  }

  useEffect(() => {
    schedule()
    return clearTimers
  }, [schedule, clearTimers])

  const ready = phase === 'ready'

  return (
    <div className="mx-auto w-md max-w-full">
      <style>{`
        @keyframes skeleton-shimmer {
          from { background-position: 200% 0; }
          to { background-position: -200% 0; }
        }
        .skeleton-line {
          background: linear-gradient(
            90deg,
            var(--color-surface-hover) 25%,
            var(--color-border) 50%,
            var(--color-surface-hover) 75%
          );
          background-size: 200% 100%;
        }
        @media (prefers-reduced-motion: no-preference) {
          .skeleton-line { animation: skeleton-shimmer 1.6s linear infinite; }
        }
        @media (prefers-reduced-motion: reduce) {
          .crossfade-layer { transition: none !important; }
        }
      `}</style>

      <div
        aria-busy={!ready}
        className="grid overflow-hidden rounded-(--radius-card) border border-(--color-border) bg-(--color-surface) p-5"
      >
        {/* Skeleton layer: mirrors the content dimensions so the swap is layout-stable. */}
        <div
          aria-hidden="true"
          className="crossfade-layer col-start-1 row-start-1 transition-opacity"
          style={{ opacity: ready ? 0 : 1, transitionDuration: `${CROSSFADE_MS}ms` }}
        >
          <div className="skeleton-line h-3 w-24 rounded" />
          <div className="skeleton-line mt-4 h-5 w-4/5 rounded" />
          <div className="skeleton-line mt-3 h-4 w-full rounded" />
          <div className="skeleton-line mt-2 h-4 w-11/12 rounded" />
          <div className="skeleton-line mt-2 h-4 w-2/3 rounded" />
        </div>

        {/* Content layer */}
        <div
          className="crossfade-layer col-start-1 row-start-1 transition-opacity"
          style={{ opacity: ready ? 1 : 0, transitionDuration: `${CROSSFADE_MS}ms` }}
          aria-hidden={!ready}
        >
          <p className="font-mono text-[10px] tracking-[0.14em] text-(--color-fg-subtle) uppercase">
            {ARTICLE.meta}
          </p>
          <h3 className="mt-3 text-lg leading-snug font-medium text-(--color-fg)">
            {ARTICLE.title}
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-(--color-fg-muted)">{ARTICLE.excerpt}</p>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={reload}
          className="rounded-md border border-(--color-border-strong) bg-(--color-surface) px-3 py-1.5 text-sm text-(--color-fg) transition-colors hover:bg-(--color-surface-hover)"
        >
          Reload
        </button>
        <span className="font-mono text-[10px] text-(--color-fg-subtle)" aria-live="polite">
          {stats
            ? `fetch ${stats.fetchMs}ms · held ${stats.heldMs}ms · min ${MIN_SKELETON_MS}ms`
            : 'loading…'}
        </span>
      </div>
    </div>
  )
}
