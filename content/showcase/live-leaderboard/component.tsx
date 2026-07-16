'use client'

import { useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from 'react'
import { CaretDown, CaretUp } from '@phosphor-icons/react/dist/ssr'

/**
 * A leaderboard whose rows FLIP into place as scores change: positions are
 * measured before and after each re-render, and the delta is played back
 * through the Web Animations API. Updates are pausable, pause on their own
 * while the board is off screen, and rank changes get a movement column in
 * the chart-listing style: caret plus places moved, next to the rank.
 */

const TICK_MS = 1800
const FLIP_MS = 340
// A tick that pushes the leader past this restarts the season, so a
// long-lived mount (the home page preview) never grinds into 4-digit scores.
const SEASON_CAP = 900

interface Row {
  id: string
  name: string
  score: number
  delta: number // positions moved on the last tick: + is up, - is down
}

const INITIAL_ROWS: Row[] = [
  { id: 'wren', name: 'Wren Okafor', score: 512, delta: 0 },
  { id: 'juno', name: 'Juno Marsh', score: 498, delta: 0 },
  { id: 'silas', name: 'Silas Vega', score: 471, delta: 0 },
  { id: 'noor', name: 'Noor Haddad', score: 455, delta: 0 },
  { id: 'peri', name: 'Peri Lindqvist', score: 430, delta: 0 },
  { id: 'idris', name: 'Idris Cole', score: 402, delta: 0 },
]

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)'

function subscribeToMotionPreference(onStoreChange: () => void): () => void {
  const media = window.matchMedia(REDUCED_MOTION_QUERY)
  media.addEventListener('change', onStoreChange)
  return () => media.removeEventListener('change', onStoreChange)
}

function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(
    subscribeToMotionPreference,
    () => window.matchMedia(REDUCED_MOTION_QUERY).matches,
    () => false,
  )
}

interface Board {
  rows: Row[]
  changed: Set<string>
}

function advance(board: Board): Board {
  const oldIndex = new Map(board.rows.map((r, i) => [r.id, i]))
  const changed = new Set<string>()

  // One or two rows pick up points each tick.
  const scorers = [...board.rows].sort(() => Math.random() - 0.5).slice(0, Math.random() < 0.4 ? 2 : 1)
  for (const s of scorers) changed.add(s.id)

  const rows = board.rows
    .map((r) => (changed.has(r.id) ? { ...r, score: r.score + 5 + Math.floor(Math.random() * 36) } : r))
    .sort((a, b) => b.score - a.score)
    .map((r, i) => ({ ...r, delta: (oldIndex.get(r.id) ?? i) - i }))

  if (rows[0] && rows[0].score >= SEASON_CAP) {
    return { rows: INITIAL_ROWS, changed: new Set() }
  }
  return { rows, changed }
}

function Movement({ delta }: { delta: number }) {
  if (delta === 0) {
    return (
      <span className="flex w-8 shrink-0 items-center font-mono text-[11px] text-(--color-fg-subtle) opacity-40">
        <span aria-hidden="true">–</span>
      </span>
    )
  }

  const up = delta > 0
  const places = Math.abs(delta)
  const Caret = up ? CaretUp : CaretDown
  return (
    <span
      className={`flex w-8 shrink-0 items-center gap-0.5 font-mono text-[11px] tabular-nums ${
        up ? 'text-(--color-accent)' : 'text-(--color-fg-subtle)'
      }`}
    >
      <Caret size={10} weight="fill" aria-hidden="true" />
      <span aria-hidden="true">{places}</span>
      <span className="sr-only">{`moved ${up ? 'up' : 'down'} ${places}`}</span>
    </span>
  )
}

export default function LiveLeaderboard() {
  const [board, setBoard] = useState<Board>({ rows: INITIAL_ROWS, changed: new Set() })
  const [running, setRunning] = useState(true)
  const [inView, setInView] = useState(true)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const rowRefs = useRef(new Map<string, HTMLLIElement>())
  const prevTops = useRef(new Map<string, number>())
  const reducedMotion = usePrefersReducedMotion()

  // Don't tick while scrolled out of view; a leaderboard nobody can see
  // shouldn't be reshuffling itself in the background.
  useEffect(() => {
    const node = containerRef.current
    if (!node) return
    const observer = new IntersectionObserver(([first]) => setInView(first?.isIntersecting ?? true))
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!running || !inView) return
    const id = window.setInterval(() => setBoard(advance), TICK_MS)
    return () => window.clearInterval(id)
  }, [running, inView])

  // FLIP: compare each row's new top against where it was last render and
  // play the inversion back to zero. offsetTop rather than
  // getBoundingClientRect: layout coordinates ignore page scroll and ancestor
  // transforms, both of which would poison the measured delta (the home page
  // previews render inside a scaled stage).
  useLayoutEffect(() => {
    for (const [id, el] of rowRefs.current) {
      const top = el.offsetTop
      const prev = prevTops.current.get(id)

      if (prev !== undefined && prev !== top && !reducedMotion) {
        el.animate(
          [{ transform: `translateY(${prev - top}px)` }, { transform: 'translateY(0)' }],
          { duration: FLIP_MS, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' },
        )
      }
      if (board.changed.has(id) && !reducedMotion) {
        el.animate(
          [{ backgroundColor: 'var(--color-accent-soft)' }, { backgroundColor: 'transparent' }],
          { duration: 700, easing: 'ease-out' },
        )
      }
      prevTops.current.set(id, top)
    }
  }, [board, reducedMotion])

  return (
    <div ref={containerRef} className="mx-auto w-md max-w-full">
      <div className="mb-4 flex items-center justify-between">
        <p className="font-mono text-[10px] tracking-[0.14em] text-(--color-fg-subtle) uppercase">
          Season standings · live
        </p>
        <button
          type="button"
          onClick={() => setRunning((r) => !r)}
          className="rounded-md border border-(--color-border-strong) bg-(--color-surface) px-3 py-1 text-xs text-(--color-fg) transition-colors hover:bg-(--color-surface-hover)"
        >
          {running ? 'Pause updates' : 'Resume updates'}
        </button>
      </div>

      <ol className="overflow-hidden rounded-(--radius-card) border border-(--color-border) bg-(--color-surface)">
        {board.rows.map((row, i) => (
          <li
            key={row.id}
            ref={(el) => {
              if (el) rowRefs.current.set(row.id, el)
              else rowRefs.current.delete(row.id)
            }}
            className="flex items-center gap-3 border-b border-(--color-border) px-4 py-2.5 text-sm last:border-b-0"
          >
            <span className="w-5 shrink-0 font-mono text-xs text-(--color-fg-subtle) tabular-nums">
              {i + 1}
            </span>
            <Movement delta={row.delta} />
            <span className="truncate text-(--color-fg)">{row.name}</span>
            <span className="ml-auto font-mono text-sm text-(--color-fg) tabular-nums">
              {row.score}
            </span>
          </li>
        ))}
      </ol>

      <p className="mt-3 font-mono text-[10px] text-(--color-fg-subtle)">
        rows re-sort as scores land · pause before reading closely
      </p>
    </div>
  )
}
