'use client'

import { useState, useEffect, useRef, useId } from 'react'

interface Command {
  id: string
  label: string
  category: string
  shortcut?: string
}

const COMMANDS: Command[] = [
  { id: 'new-post', label: 'New post', category: 'Create', shortcut: 'N' },
  { id: 'new-page', label: 'New page', category: 'Create' },
  { id: 'upload-file', label: 'Upload file', category: 'Create' },
  { id: 'search', label: 'Search everything', category: 'Navigate', shortcut: 'F' },
  { id: 'go-home', label: 'Go to home', category: 'Navigate' },
  { id: 'go-settings', label: 'Go to settings', category: 'Navigate', shortcut: ',' },
  { id: 'toggle-theme', label: 'Toggle dark mode', category: 'View', shortcut: 'D' },
  { id: 'toggle-sidebar', label: 'Toggle sidebar', category: 'View' },
  { id: 'keyboard-shortcuts', label: 'Keyboard shortcuts', category: 'Help', shortcut: '?' },
  { id: 'docs', label: 'Open documentation', category: 'Help' },
]

export default function CommandPalette() {
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const [lastRan, setLastRan] = useState<Command | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const listboxId = useId()

  const filtered = query.trim()
    ? COMMANDS.filter((c) => c.label.toLowerCase().includes(query.toLowerCase()))
    : COMMANDS

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        inputRef.current?.focus()
        inputRef.current?.select()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // A real palette would dispatch the action here; the demo confirms the
  // selection in the footer and keeps focus in the input for the next command.
  const run = (cmd: Command) => {
    setLastRan(cmd)
    setQuery('')
    setActiveIndex(0)
    inputRef.current?.focus()
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex((i) => Math.min(i + 1, filtered.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const cmd = filtered[activeIndex]
      if (cmd) run(cmd)
    } else if (e.key === 'Escape') {
      e.preventDefault()
      setQuery('')
      setActiveIndex(0)
    }
  }

  const activeId = filtered[activeIndex] ? `${listboxId}-opt-${filtered[activeIndex].id}` : undefined

  return (
    <div
      role="dialog"
      aria-label="Command palette"
      onKeyDown={onKeyDown}
      className="mx-auto w-md max-w-full overflow-hidden rounded-(--radius-card) border border-(--color-border-strong) bg-(--color-surface)"
    >
      <div className="flex items-center gap-3 border-b border-(--color-border) px-4 py-3">
        <input
          ref={inputRef}
          role="combobox"
          aria-expanded="true"
          aria-autocomplete="list"
          aria-controls={listboxId}
          aria-activedescendant={activeId}
          aria-keyshortcuts="Meta+K"
          type="text"
          placeholder="Search commands…"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setActiveIndex(0)
          }}
          className="w-full bg-transparent text-sm text-(--color-fg) placeholder:text-(--color-fg-subtle) focus:outline-none"
        />
        <kbd className="shrink-0 rounded-md border border-(--color-border) bg-(--color-surface-hover) px-1.5 py-0.5 font-mono text-[10px] text-(--color-fg-subtle)">
          ⌘K
        </kbd>
      </div>

      <ul
        id={listboxId}
        role="listbox"
        aria-label="Commands"
        className="scrollbar-thin max-h-72 overflow-y-auto py-1"
      >
        {filtered.length === 0 ? (
          <li className="px-4 py-3 font-mono text-xs text-(--color-fg-subtle)">
            No commands found.
          </li>
        ) : (
          filtered.map((cmd, i) => (
            <li
              key={cmd.id}
              id={`${listboxId}-opt-${cmd.id}`}
              role="option"
              aria-selected={i === activeIndex}
              onMouseEnter={() => setActiveIndex(i)}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => run(cmd)}
              className={`flex cursor-default items-center justify-between gap-4 px-4 py-2.5 text-sm ${
                i === activeIndex
                  ? 'bg-(--color-surface-hover) text-(--color-fg)'
                  : 'text-(--color-fg-muted)'
              }`}
            >
              <span className="flex items-center gap-3">
                <span className="w-16 font-mono text-[10px] text-(--color-fg-subtle)">
                  {cmd.category}
                </span>
                {cmd.label}
              </span>
              {cmd.shortcut ? (
                <kbd className="rounded-md border border-(--color-border) bg-(--color-surface) px-1.5 py-0.5 font-mono text-[10px] text-(--color-fg-subtle)">
                  {cmd.shortcut}
                </kbd>
              ) : null}
            </li>
          ))
        )}
      </ul>

      <div className="flex items-center justify-between gap-4 border-t border-(--color-border) px-4 py-2">
        <span aria-live="polite" className="truncate font-mono text-[10px] text-(--color-accent)">
          {lastRan ? `Ran: ${lastRan.label}` : ''}
        </span>
        <span className="shrink-0 font-mono text-[10px] text-(--color-fg-subtle)">
          ↑↓ navigate · ↵ select · ⌘K focus
        </span>
      </div>
    </div>
  )
}
