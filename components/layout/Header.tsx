'use client'

import { useEffect, useState, type ComponentType } from 'react'
import Link from 'next/link'
import { MagnifyingGlass } from '@phosphor-icons/react/dist/ssr'
import { Container } from '@/components/ui/Container'
import { site } from '@/lib/site'
import type { CommandPaletteProps } from './CommandPalette'

export function Header() {
  const [open, setOpen] = useState(false)
  // Lazy-load the command palette (and its Radix Dialog dependency) only after
  // the first open. Keeping the static import out of this root-layout client
  // component keeps @radix-ui/react-dialog off every route's first-load bundle.
  const [Palette, setPalette] = useState<ComponentType<CommandPaletteProps> | null>(null)

  useEffect(() => {
    function handle(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen((v) => !v)
      }
    }
    window.addEventListener('keydown', handle)
    return () => window.removeEventListener('keydown', handle)
  }, [])

  // Fetch the palette chunk the first time it's needed. It mounts already-open,
  // so its onOpenAutoFocus handler focuses the input on that first ⌘K / click.
  useEffect(() => {
    if (!open || Palette) return
    let cancelled = false
    void import('./CommandPalette').then((mod) => {
      if (!cancelled) {
        setPalette(() => mod.CommandPalette)
      }
    })
    return () => {
      cancelled = true
    }
  }, [open, Palette])

  return (
    <>
      <header className="sticky top-0 z-20 border-b border-(--color-border) bg-(--color-bg)/80 backdrop-blur">
        <Container variant="grid" as="div" className="flex h-14 items-center justify-between">
          <Link
            href="/"
            className="font-mono text-sm tracking-tight text-(--color-fg) transition-colors hover:text-(--color-accent)"
          >
            {site.name.toLowerCase().replace(' ', '.')}
          </Link>

          <nav className="flex items-center gap-1">
            {site.nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-md px-3 py-1.5 text-sm text-(--color-fg-muted) transition-colors hover:bg-(--color-surface) hover:text-(--color-fg)"
              >
                {item.label}
              </Link>
            ))}
            <button
              type="button"
              aria-label="Search"
              onClick={() => setOpen(true)}
              className="ml-1 inline-flex items-center gap-2 rounded-md border border-(--color-border) px-2.5 py-1.5 text-xs text-(--color-fg-muted) transition-colors hover:border-(--color-border-strong) hover:text-(--color-fg)"
            >
              <MagnifyingGlass weight="regular" size={14} />
              <span className="hidden sm:inline">Search</span>
              <kbd className="hidden font-mono text-[10px] text-(--color-fg-subtle) sm:inline">
                ⌘K
              </kbd>
            </button>
          </nav>
        </Container>
      </header>

      {Palette ? <Palette open={open} onOpenChange={setOpen} /> : null}
    </>
  )
}
