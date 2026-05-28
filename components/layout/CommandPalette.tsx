'use client'

import {
  Fragment,
  type ReactNode,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { MagnifyingGlass, X } from '@phosphor-icons/react/dist/ssr'
import { groupResults, search, type PagefindResult } from '@/lib/search/pagefind'

export interface CommandPaletteProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

/**
 * Parse pagefind's `<mark>highlight</mark>` excerpts into a React node tree.
 * No HTML injection, splits the raw string into safe text and <mark> elements.
 */
function ExcerptText({ raw }: { raw: string }) {
  const tokens = raw.split(/(<mark>|<\/mark>)/g)
  let inMark = false
  const out: ReactNode[] = []
  tokens.forEach((tok, i) => {
    if (tok === '<mark>') {
      inMark = true
    } else if (tok === '</mark>') {
      inMark = false
    } else if (tok) {
      out.push(
        inMark ? (
          <mark
            key={i}
            className="rounded-md bg-(--color-accent-soft) px-0.5 text-(--color-accent)"
          >
            {tok}
          </mark>
        ) : (
          <Fragment key={i}>{tok}</Fragment>
        ),
      )
    }
  })
  return <>{out}</>
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<PagefindResult[]>([])
  const [loading, setLoading] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const listboxRef = useRef<HTMLDivElement | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  // Monotonic request-generation counter. Each debounced search captures a
  // generation; only the most recent in-flight search may commit its results,
  // so a slow earlier query can never overwrite a newer one (stale-result race).
  const genRef = useRef(0)
  const listboxId = useId()

  const trimmed = query.trim()
  const queryShort = trimmed.length < 2

  // Wrap onOpenChange to also reset state on close (event-driven, not effect-driven).
  const handleOpenChange = useCallback(
    (next: boolean) => {
      if (!next) {
        setQuery('')
        setResults([])
        setLoading(false)
        setActiveIndex(0)
        // Discard any in-flight search so it can't commit after reopen.
        genRef.current++
        if (debounceRef.current) {
          clearTimeout(debounceRef.current)
          debounceRef.current = null
        }
      }
      onOpenChange(next)
    },
    [onOpenChange],
  )

  // Debounced search on query change. Only fires when query is long enough; otherwise
  // render falls through to the short-query branch and any stale `results` are not shown.
  // setState is only called from inside the timer callback (async), never synchronously
  // in the effect body, so this satisfies react-hooks/set-state-in-effect.
  useEffect(() => {
    if (!open || queryShort) return
    debounceRef.current = setTimeout(async () => {
      // Capture this search's generation up front; if a newer search starts
      // (or the palette closes) before we resolve, genRef.current will differ
      // and we drop the result instead of clobbering current state.
      const gen = ++genRef.current
      setLoading(true)
      try {
        const r = await search(trimmed)
        if (genRef.current === gen) {
          setResults(r)
          setActiveIndex(0)
        }
      } catch {
        if (genRef.current === gen) setResults([])
      } finally {
        if (genRef.current === gen) setLoading(false)
      }
    }, 150)
    return () => {
      // Bump the live generation so a query superseded mid-flight is discarded.
      // The exhaustive-deps "ref changed by cleanup" hint is intentional here: we
      // need the current counter, not a snapshot, for the in-flight search to drop.
      // eslint-disable-next-line react-hooks/exhaustive-deps
      genRef.current++
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [trimmed, queryShort, open])

  const handleClose = useCallback(() => handleOpenChange(false), [handleOpenChange])

  const grouped = useMemo(() => groupResults(results), [results])
  const sections = useMemo(
    () =>
      (
        [
          { key: 'posts', label: 'Posts', items: grouped.posts },
          { key: 'components', label: 'Components', items: grouped.components },
          { key: 'designs', label: 'Designs', items: grouped.designs },
          { key: 'other', label: 'Other', items: grouped.other },
        ] as const
      ).filter((s) => s.items.length > 0),
    [grouped],
  )

  // Flatten the visible sections (in display order) into a single list so
  // keyboard navigation runs across all groups while the UI stays grouped.
  // Indices into `flat` are the source of truth for `activeIndex` and option ids.
  const flat = useMemo(() => sections.flatMap((s) => s.items), [sections])
  const hasResults = !queryShort && !loading && flat.length > 0
  const activeOptionId =
    hasResults && flat[activeIndex] ? `cmdk-opt-${activeIndex}` : undefined

  // Keep the active option scrolled into view as the user arrows through results.
  useEffect(() => {
    if (!hasResults) return
    const el = listboxRef.current?.querySelector<HTMLElement>(`#cmdk-opt-${activeIndex}`)
    el?.scrollIntoView({ block: 'nearest' })
  }, [activeIndex, hasResults])

  const handleInputKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (!hasResults) return
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setActiveIndex((i) => Math.min(i + 1, flat.length - 1))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setActiveIndex((i) => Math.max(i - 1, 0))
      } else if (e.key === 'Home') {
        e.preventDefault()
        setActiveIndex(0)
      } else if (e.key === 'End') {
        e.preventDefault()
        setActiveIndex(flat.length - 1)
      } else if (e.key === 'Enter') {
        e.preventDefault()
        const active = flat[activeIndex]
        if (active) {
          handleClose()
          router.push(active.url)
        }
      }
    },
    [hasResults, flat, activeIndex, handleClose, router],
  )

  // Running flat index assigned as sections render, so option ids/aria-selected
  // line up exactly with `flat` and `activeIndex`.
  let flatIndex = -1

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="data-[state=open]:animate-in data-[state=open]:fade-in data-[state=closed]:animate-out data-[state=closed]:fade-out fixed inset-0 z-40 bg-(--color-bg)/80 backdrop-blur-sm" />
        <Dialog.Content
          aria-describedby={undefined}
          onOpenAutoFocus={(e) => {
            e.preventDefault()
            inputRef.current?.focus()
          }}
          className="data-[state=open]:animate-in data-[state=open]:fade-in data-[state=open]:zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=closed]:zoom-out-95 fixed top-[10vh] left-1/2 z-50 flex w-[min(640px,90vw)] -translate-x-1/2 flex-col overflow-hidden rounded-(--radius-card) border border-(--color-border) bg-(--color-surface)"
        >
          <Dialog.Title className="sr-only">Search</Dialog.Title>

          <div className="flex shrink-0 items-center gap-3 border-b border-(--color-border) px-4 py-3">
            <MagnifyingGlass weight="regular" size={16} className="text-(--color-fg-muted)" />
            <input
              ref={inputRef}
              type="search"
              role="combobox"
              aria-expanded={hasResults}
              aria-controls={listboxId}
              aria-activedescendant={activeOptionId}
              aria-autocomplete="list"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                setActiveIndex(0)
              }}
              onKeyDown={handleInputKeyDown}
              placeholder="Search posts, components, designs…"
              className="min-w-0 flex-1 bg-transparent text-sm text-(--color-fg) placeholder:text-(--color-fg-subtle) focus:outline-none"
              autoComplete="off"
            />
            <Dialog.Close asChild>
              <button
                type="button"
                aria-label="Close"
                className="inline-flex h-7 w-7 items-center justify-center rounded-md text-(--color-fg-muted) transition-colors hover:bg-(--color-surface-hover) hover:text-(--color-fg)"
              >
                <X weight="regular" size={14} />
              </button>
            </Dialog.Close>
          </div>

          {/* Visually-hidden live region announcing the result count to screen readers. */}
          <div className="sr-only" role="status" aria-live="polite">
            {!queryShort && !loading
              ? flat.length === 0
                ? 'No matches'
                : `${flat.length} result${flat.length === 1 ? '' : 's'}`
              : ''}
          </div>

          <div ref={listboxRef} className="max-h-[60vh] min-h-[120px] overflow-y-auto">
            {queryShort ? (
              <p className="px-4 py-6 text-center font-mono text-xs text-(--color-fg-subtle)">
                Type at least 2 characters
              </p>
            ) : loading ? (
              <p className="px-4 py-6 text-center font-mono text-xs text-(--color-fg-subtle)">
                Searching…
              </p>
            ) : flat.length === 0 ? (
              <p className="px-4 py-6 text-center font-mono text-xs text-(--color-fg-subtle)">
                No matches
              </p>
            ) : (
              <div
                role="listbox"
                id={listboxId}
                aria-label="Search results"
                className="divide-y divide-(--color-border)"
              >
                {sections.map((section) => (
                  <section key={section.key} aria-label={section.label}>
                    <h2 className="px-4 pt-3 pb-1 font-mono text-[0.625rem] tracking-[0.18em] text-(--color-fg-subtle) uppercase">
                      {section.label}
                    </h2>
                    <ul className="divide-y divide-(--color-border)">
                      {section.items.map((r) => {
                        flatIndex += 1
                        const index = flatIndex
                        const isActive = index === activeIndex
                        return (
                          <li key={r.id}>
                            <Link
                              href={r.url}
                              id={`cmdk-opt-${index}`}
                              role="option"
                              aria-selected={isActive}
                              onClick={handleClose}
                              onMouseEnter={() => setActiveIndex(index)}
                              className={`block px-4 py-3 transition-colors hover:bg-(--color-surface-hover) ${
                                isActive ? 'bg-(--color-surface-hover)' : ''
                              }`}
                            >
                              <p className="text-sm font-medium text-(--color-fg)">
                                {r.meta.title ?? r.url}
                              </p>
                              <p className="mt-1 line-clamp-2 text-xs text-(--color-fg-muted)">
                                <ExcerptText raw={r.excerpt} />
                              </p>
                            </Link>
                          </li>
                        )
                      })}
                    </ul>
                  </section>
                ))}
              </div>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
