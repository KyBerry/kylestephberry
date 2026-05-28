'use client'

import { Fragment, type ReactNode, useCallback, useEffect, useRef, useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import Link from 'next/link'
import { MagnifyingGlass, X } from '@phosphor-icons/react/dist/ssr'
import { search, type PagefindResult } from '@/lib/search/pagefind'

interface CommandPaletteProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

/**
 * Parse pagefind's `<mark>highlight</mark>` excerpts into a React node tree.
 * No HTML injection — splits the raw string into safe text and <mark> elements.
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
          <mark key={i} className="rounded-sm bg-(--color-accent-soft) px-0.5 text-(--color-accent)">
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
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<PagefindResult[]>([])
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Reset state when the dialog closes
  useEffect(() => {
    if (!open) {
      setQuery('')
      setResults([])
      setLoading(false)
    }
  }, [open])

  // Debounced search on query change
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!open) return
    if (query.trim().length < 2) {
      setResults([])
      return
    }
    setLoading(true)
    debounceRef.current = setTimeout(async () => {
      try {
        const r = await search(query)
        setResults(r)
      } catch {
        setResults([])
      } finally {
        setLoading(false)
      }
    }, 150)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [query, open])

  const handleClose = useCallback(() => onOpenChange(false), [onOpenChange])

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-(--color-bg)/80 backdrop-blur-sm data-[state=open]:animate-in data-[state=open]:fade-in data-[state=closed]:animate-out data-[state=closed]:fade-out" />
        <Dialog.Content
          aria-describedby={undefined}
          onOpenAutoFocus={(e) => {
            e.preventDefault()
            inputRef.current?.focus()
          }}
          className="fixed top-[10vh] left-1/2 z-50 flex w-[min(640px,90vw)] -translate-x-1/2 flex-col overflow-hidden rounded-(--radius-card) border border-(--color-border) bg-(--color-surface) shadow-2xl data-[state=open]:animate-in data-[state=open]:fade-in data-[state=open]:zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=closed]:zoom-out-95"
        >
          <Dialog.Title className="sr-only">Search</Dialog.Title>

          <div className="flex shrink-0 items-center gap-3 border-b border-(--color-border) px-4 py-3">
            <MagnifyingGlass weight="regular" size={16} className="text-(--color-fg-muted)" />
            <input
              ref={inputRef}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search posts, components, designs…"
              className="min-w-0 flex-1 bg-transparent text-sm text-(--color-fg) placeholder:text-(--color-fg-subtle) focus:outline-none"
              autoComplete="off"
            />
            <Dialog.Close asChild>
              <button
                type="button"
                aria-label="Close"
                className="inline-flex h-7 w-7 items-center justify-center rounded text-(--color-fg-muted) transition-colors hover:bg-(--color-surface-hover) hover:text-(--color-fg)"
              >
                <X weight="regular" size={14} />
              </button>
            </Dialog.Close>
          </div>

          <div className="max-h-[60vh] min-h-[120px] overflow-y-auto">
            {loading ? (
              <p className="px-4 py-6 text-center font-mono text-xs text-(--color-fg-subtle)">
                Searching…
              </p>
            ) : query.trim().length < 2 ? (
              <p className="px-4 py-6 text-center font-mono text-xs text-(--color-fg-subtle)">
                Type at least 2 characters
              </p>
            ) : results.length === 0 ? (
              <p className="px-4 py-6 text-center font-mono text-xs text-(--color-fg-subtle)">
                No matches
              </p>
            ) : (
              <ul className="divide-y divide-(--color-border)">
                {results.map((r) => (
                  <li key={r.id}>
                    <Link
                      href={r.url}
                      onClick={handleClose}
                      className="block px-4 py-3 transition-colors hover:bg-(--color-surface-hover)"
                    >
                      <p className="text-sm font-medium text-(--color-fg)">
                        {r.meta.title ?? r.url}
                      </p>
                      <p className="mt-1 line-clamp-2 text-xs text-(--color-fg-muted)">
                        <ExcerptText raw={r.excerpt} />
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
