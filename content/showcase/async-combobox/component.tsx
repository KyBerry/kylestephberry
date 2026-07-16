'use client'

import { useEffect, useId, useRef, useState } from 'react'

/**
 * An async autocomplete built on the ARIA combobox pattern: debounced
 * queries, a stale-response guard, aria-activedescendant option tracking,
 * and a polite live region announcing result counts.
 */

interface Typeface {
  id: string
  name: string
  classification: string
  year: number
}

const TYPEFACES: Typeface[] = [
  { id: 'akzidenz', name: 'Akzidenz-Grotesk', classification: 'Grotesque', year: 1898 },
  { id: 'futura', name: 'Futura', classification: 'Geometric sans', year: 1927 },
  { id: 'times', name: 'Times New Roman', classification: 'Transitional serif', year: 1932 },
  { id: 'palatino', name: 'Palatino', classification: 'Old-style serif', year: 1949 },
  { id: 'helvetica', name: 'Helvetica', classification: 'Neo-grotesque', year: 1957 },
  { id: 'univers', name: 'Univers', classification: 'Neo-grotesque', year: 1957 },
  { id: 'optima', name: 'Optima', classification: 'Humanist sans', year: 1958 },
  { id: 'eurostile', name: 'Eurostile', classification: 'Square sans', year: 1962 },
  { id: 'sabon', name: 'Sabon', classification: 'Old-style serif', year: 1967 },
  { id: 'avant', name: 'ITC Avant Garde', classification: 'Geometric sans', year: 1970 },
  { id: 'frutiger', name: 'Frutiger', classification: 'Humanist sans', year: 1976 },
  { id: 'bell', name: 'Bell Centennial', classification: 'Utility sans', year: 1978 },
  { id: 'chicago', name: 'Chicago', classification: 'Bitmap sans', year: 1984 },
  { id: 'lucida', name: 'Lucida Grande', classification: 'Humanist sans', year: 1985 },
  { id: 'rotis', name: 'Rotis', classification: 'Semi-serif', year: 1988 },
  { id: 'minion', name: 'Minion', classification: 'Old-style serif', year: 1990 },
  { id: 'georgia', name: 'Georgia', classification: 'Transitional serif', year: 1993 },
  { id: 'verdana', name: 'Verdana', classification: 'Humanist sans', year: 1996 },
  { id: 'gotham', name: 'Gotham', classification: 'Geometric sans', year: 2000 },
  { id: 'source', name: 'Source Sans', classification: 'Humanist sans', year: 2012 },
  { id: 'inter', name: 'Inter', classification: 'Neo-grotesque', year: 2017 },
  { id: 'fraunces', name: 'Fraunces', classification: 'Display serif', year: 2020 },
]

const DEBOUNCE_MS = 200

/** Simulated backend search with realistic latency. */
function searchTypefaces(query: string): Promise<Typeface[]> {
  const q = query.trim().toLowerCase()
  const results = TYPEFACES.filter(
    (t) => t.name.toLowerCase().includes(q) || t.classification.toLowerCase().includes(q),
  )
  const latency = 250 + Math.random() * 450
  return new Promise((resolve) => {
    window.setTimeout(() => resolve(results), latency)
  })
}

export default function AsyncCombobox() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Typeface[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const [selected, setSelected] = useState<Typeface | null>(null)

  const listboxId = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  // Monotonic sequence number: responses that arrive for an older query are dropped.
  const requestSeq = useRef(0)
  const debounceTimer = useRef(0)

  useEffect(() => {
    return () => window.clearTimeout(debounceTimer.current)
  }, [])

  const onQueryChange = (value: string) => {
    setQuery(value)
    window.clearTimeout(debounceTimer.current)
    const seq = ++requestSeq.current

    if (value.trim() === '') {
      setResults([])
      setOpen(false)
      setLoading(false)
      setActiveIndex(-1)
      return
    }

    setLoading(true)
    debounceTimer.current = window.setTimeout(() => {
      void searchTypefaces(value).then((found) => {
        if (seq !== requestSeq.current) return // stale response, a newer query is in flight
        setResults(found)
        setActiveIndex(-1)
        setOpen(true)
        setLoading(false)
      })
    }, DEBOUNCE_MS)
  }

  const select = (face: Typeface) => {
    window.clearTimeout(debounceTimer.current)
    requestSeq.current++ // invalidate any in-flight search so it can't reopen the list
    setSelected(face)
    setQuery('')
    setOpen(false)
    setLoading(false)
    setActiveIndex(-1)
    inputRef.current?.focus()
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (!open && results.length > 0) setOpen(true)
      setActiveIndex((i) => Math.min(i + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (!open && results.length > 0) {
        setOpen(true)
        setActiveIndex(results.length - 1)
        return
      }
      setActiveIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const face = results[activeIndex]
      if (open && face) select(face)
    } else if (e.key === 'Escape') {
      e.preventDefault()
      setOpen(false)
      setActiveIndex(-1)
    }
  }

  const activeId =
    activeIndex >= 0 && results[activeIndex]
      ? `${listboxId}-opt-${results[activeIndex].id}`
      : undefined

  return (
    <div
      className="mx-auto w-md max-w-full"
      onBlurCapture={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setOpen(false)
      }}
    >
      <label
        htmlFor={`${listboxId}-input`}
        className="mb-2 block font-mono text-[10px] tracking-[0.14em] text-(--color-fg-subtle) uppercase"
      >
        Find a typeface
      </label>

      <div className="relative">
        <div className="flex items-center gap-3 rounded-(--radius-card) border border-(--color-border-strong) bg-(--color-surface) px-4 py-3">
          <input
            ref={inputRef}
            id={`${listboxId}-input`}
            role="combobox"
            aria-expanded={open}
            aria-autocomplete="list"
            aria-controls={listboxId}
            aria-activedescendant={activeId}
            type="text"
            placeholder="Try “grotesque” or “Frutiger”…"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            onKeyDown={onKeyDown}
            className="w-full bg-transparent text-sm text-(--color-fg) placeholder:text-(--color-fg-subtle) focus:outline-none"
          />
          {loading ? (
            <span
              aria-hidden="true"
              className="size-3.5 shrink-0 animate-spin rounded-full border border-(--color-fg-subtle) border-t-transparent motion-reduce:animate-none"
            />
          ) : null}
        </div>

        <ul
          id={listboxId}
          role="listbox"
          aria-label="Typefaces"
          hidden={!open}
          className="scrollbar-thin absolute inset-x-0 top-full z-10 mt-2 max-h-64 overflow-y-auto rounded-(--radius-card) border border-(--color-border-strong) bg-(--color-surface) py-1"
        >
          {results.length === 0 ? (
            <li className="px-4 py-3 font-mono text-xs text-(--color-fg-subtle)">
              No typefaces match.
            </li>
          ) : (
            results.map((face, i) => (
              <li
                key={face.id}
                id={`${listboxId}-opt-${face.id}`}
                role="option"
                aria-selected={i === activeIndex}
                onMouseEnter={() => setActiveIndex(i)}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => select(face)}
                className={`flex cursor-default items-baseline justify-between gap-4 px-4 py-2.5 text-sm ${
                  i === activeIndex
                    ? 'bg-(--color-surface-hover) text-(--color-fg)'
                    : 'text-(--color-fg-muted)'
                }`}
              >
                <span className="min-w-0 truncate">{face.name}</span>
                <span className="shrink-0 font-mono text-[10px] whitespace-nowrap text-(--color-fg-subtle)">
                  {face.classification} · {face.year}
                </span>
              </li>
            ))
          )}
        </ul>
      </div>

      {/* Result counts are announced here so screen reader users hear what typing produced. */}
      <div aria-live="polite" className="sr-only">
        {loading
          ? 'Searching…'
          : open
            ? `${results.length} ${results.length === 1 ? 'result' : 'results'} available.`
            : ''}
      </div>

      <div className="mt-4 flex h-8 items-center">
        {selected ? (
          <span className="inline-flex items-center gap-2 rounded-full border border-(--color-border) bg-(--color-surface) py-1 pr-1.5 pl-3 text-sm text-(--color-fg)">
            {selected.name}
            <button
              type="button"
              onClick={() => setSelected(null)}
              aria-label={`Remove ${selected.name}`}
              className="rounded-full px-1.5 font-mono text-xs text-(--color-fg-subtle) transition-colors hover:text-(--color-fg)"
            >
              ✕
            </button>
          </span>
        ) : (
          <span className="font-mono text-[10px] text-(--color-fg-subtle)">
            nothing selected yet
          </span>
        )}
      </div>
    </div>
  )
}
