'use client'

import { useMemo, useRef, useState } from 'react'
import type { KeyboardEvent, UIEvent } from 'react'

type Region = 'North America' | 'Europe' | 'APAC' | 'LATAM'
type Health = 'Excellent' | 'Stable' | 'Watch' | 'At risk'
type SortKey = 'account' | 'region' | 'mrr' | 'users' | 'health' | 'lastSeen'
type SortDirection = 'ascending' | 'descending'
type Align = 'left' | 'right'

interface TableRow {
  id: string
  account: string
  plan: string
  region: Region
  mrr: number
  users: number
  health: Health
  lastSeen: string
  owner: string
}

interface Column {
  key: SortKey
  label: string
  align: Align
}

const ROW_HEIGHT = 48
const VIEWPORT_HEIGHT = 304
const OVERSCAN = 5
const GRID_COLUMNS =
  'minmax(150px, 1.35fr) minmax(90px, 0.8fr) minmax(86px, 0.7fr) minmax(72px, 0.55fr) minmax(88px, 0.7fr) minmax(96px, 0.75fr)'

const COLUMNS = [
  { key: 'account', label: 'Account', align: 'left' },
  { key: 'region', label: 'Region', align: 'left' },
  { key: 'mrr', label: 'MRR', align: 'right' },
  { key: 'users', label: 'Seats', align: 'right' },
  { key: 'health', label: 'Health', align: 'left' },
  { key: 'lastSeen', label: 'Last active', align: 'left' },
] as const satisfies readonly Column[]

const REGIONS = ['North America', 'Europe', 'APAC', 'LATAM'] as const
const HEALTH_STATES = ['Excellent', 'Stable', 'Watch', 'At risk'] as const
const OWNERS = ['Avery', 'Mina', 'Rowan', 'Sol', 'Jules', 'Nia'] as const
const ACCOUNT_PREFIXES = [
  'Cedar',
  'Northstar',
  'Keystone',
  'Signal',
  'Harbor',
  'Quartz',
  'Ember',
  'Atlas',
] as const
const ACCOUNT_SUFFIXES = [
  'Works',
  'Labs',
  'Supply',
  'Analytics',
  'Foundry',
  'Systems',
  'Studio',
  'Health',
] as const

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
})

function pick<T>(items: readonly T[], index: number): T {
  const item = items[index % items.length]
  if (item === undefined) {
    throw new Error('Expected non-empty mock data collection')
  }
  return item
}

function buildRows(): TableRow[] {
  return Array.from({ length: 180 }, (_, index) => {
    const id = `acct-${String(index + 1).padStart(3, '0')}`
    const day = String(((index * 7) % 28) + 1).padStart(2, '0')
    const month = String(((index * 5) % 12) + 1).padStart(2, '0')
    const mrr = 1200 + ((index * 379) % 18200)
    const users = 8 + ((index * 11) % 144)

    return {
      id,
      account: `${pick(ACCOUNT_PREFIXES, index)} ${pick(ACCOUNT_SUFFIXES, index * 3)}`,
      plan: index % 4 === 0 ? 'Enterprise' : index % 3 === 0 ? 'Scale' : 'Team',
      region: pick(REGIONS, index * 2),
      mrr,
      users,
      health: pick(HEALTH_STATES, index + Math.floor(index / 9)),
      lastSeen: `2026-${month}-${day}`,
      owner: pick(OWNERS, index * 5),
    }
  })
}

function healthClass(health: Health): string {
  switch (health) {
    case 'Excellent':
      return 'text-(--color-accent)'
    case 'Stable':
      return 'text-(--color-fg)'
    case 'Watch':
      return 'text-(--color-fg-muted)'
    case 'At risk':
      return 'text-(--color-fg-subtle)'
  }
}

function healthDotClass(health: Health): string {
  switch (health) {
    case 'Excellent':
      return 'bg-(--color-accent)'
    case 'Stable':
      return 'bg-(--color-fg)'
    case 'Watch':
      return 'bg-(--color-fg-muted)'
    case 'At risk':
      return 'bg-(--color-fg-subtle)'
  }
}

function sortValue(row: TableRow, key: SortKey): string | number {
  switch (key) {
    case 'mrr':
    case 'users':
      return row[key]
    case 'health':
      return HEALTH_STATES.indexOf(row.health)
    case 'account':
    case 'region':
    case 'lastSeen':
      return row[key]
  }
}

function compareRows(a: TableRow, b: TableRow, key: SortKey): number {
  const aValue = sortValue(a, key)
  const bValue = sortValue(b, key)

  if (typeof aValue === 'number' && typeof bValue === 'number') {
    return aValue - bValue
  }

  return String(aValue).localeCompare(String(bValue), 'en-US')
}

function nextDirection(current: SortDirection): SortDirection {
  return current === 'ascending' ? 'descending' : 'ascending'
}

export default function VirtualizedTable() {
  const rows = useMemo(() => buildRows(), [])
  const [sort, setSort] = useState<{ key: SortKey; direction: SortDirection }>({
    key: 'mrr',
    direction: 'descending',
  })
  const [activeRowId, setActiveRowId] = useState(rows[0]?.id ?? '')
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null)
  const [scrollTop, setScrollTop] = useState(0)
  const scrollRef = useRef<HTMLDivElement | null>(null)

  const sortedRows = useMemo(() => {
    const directionMultiplier = sort.direction === 'ascending' ? 1 : -1
    return [...rows].sort((a, b) => compareRows(a, b, sort.key) * directionMultiplier)
  }, [rows, sort])

  const activeIndex = Math.max(
    0,
    sortedRows.findIndex((row) => row.id === activeRowId),
  )
  const selectedRow = sortedRows.find((row) => row.id === selectedRowId) ?? null
  const startIndex = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - OVERSCAN)
  const visibleCount = Math.ceil(VIEWPORT_HEIGHT / ROW_HEIGHT) + OVERSCAN * 2
  const endIndex = Math.min(sortedRows.length, startIndex + visibleCount)
  const visibleRows = sortedRows.slice(startIndex, endIndex)
  const totalHeight = sortedRows.length * ROW_HEIGHT

  function scrollRowIntoView(index: number) {
    const viewport = scrollRef.current
    if (!viewport) return

    const rowTop = index * ROW_HEIGHT
    const rowBottom = rowTop + ROW_HEIGHT
    const viewportBottom = viewport.scrollTop + viewport.clientHeight

    if (rowTop < viewport.scrollTop) {
      viewport.scrollTo({ top: rowTop, behavior: 'auto' })
    } else if (rowBottom > viewportBottom) {
      viewport.scrollTo({ top: rowBottom - viewport.clientHeight, behavior: 'auto' })
    }
  }

  function moveActiveRow(nextIndex: number) {
    const clampedIndex = Math.min(Math.max(nextIndex, 0), sortedRows.length - 1)
    const nextRow = sortedRows[clampedIndex]
    if (!nextRow) return
    setActiveRowId(nextRow.id)
    scrollRowIntoView(clampedIndex)
  }

  function onGridKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (sortedRows.length === 0) return

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault()
        moveActiveRow(activeIndex + 1)
        break
      case 'ArrowUp':
        event.preventDefault()
        moveActiveRow(activeIndex - 1)
        break
      case 'PageDown':
        event.preventDefault()
        moveActiveRow(activeIndex + Math.floor(VIEWPORT_HEIGHT / ROW_HEIGHT))
        break
      case 'PageUp':
        event.preventDefault()
        moveActiveRow(activeIndex - Math.floor(VIEWPORT_HEIGHT / ROW_HEIGHT))
        break
      case 'Home':
        event.preventDefault()
        moveActiveRow(0)
        break
      case 'End':
        event.preventDefault()
        moveActiveRow(sortedRows.length - 1)
        break
      case 'Enter':
      case ' ':
        event.preventDefault()
        setSelectedRowId(sortedRows[activeIndex]?.id ?? null)
        break
    }
  }

  function onScroll(event: UIEvent<HTMLDivElement>) {
    setScrollTop(event.currentTarget.scrollTop)
  }

  function toggleSort(key: SortKey) {
    setSort((current) => ({
      key,
      direction: current.key === key ? nextDirection(current.direction) : 'ascending',
    }))
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-3 text-sm">
      <style>{`
        @media (prefers-reduced-motion: no-preference) {
          .virtual-row { transition: background-color 120ms ease, box-shadow 120ms ease; }
        }
      `}</style>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-mono text-[10px] tracking-[0.18em] text-(--color-fg-subtle) uppercase">
            Accounts dataset
          </p>
          <p className="mt-1 text-xs text-(--color-fg-muted)">
            Showing {visibleRows.length} rendered rows from {sortedRows.length} records.
          </p>
        </div>
        <div className="rounded-full border border-(--color-border) bg-(--color-surface) px-3 py-1 font-mono text-[10px] text-(--color-fg-subtle)">
          Arrow keys move focus · Enter selects
        </div>
      </div>

      <div
        role="grid"
        aria-label="Customer accounts"
        aria-rowcount={sortedRows.length + 1}
        aria-colcount={COLUMNS.length}
        aria-activedescendant={activeRowId ? `row-${activeRowId}` : undefined}
        tabIndex={0}
        onKeyDown={onGridKeyDown}
        className="overflow-hidden rounded-lg border border-(--color-border) bg-(--color-surface) shadow-[0_18px_60px_color-mix(in_srgb,var(--color-bg)_65%,transparent)] ring-0 outline-none focus-visible:border-(--color-accent)"
      >
        <div
          role="row"
          aria-rowindex={1}
          className="sticky top-0 z-10 grid border-b border-(--color-border) bg-(--color-surface) text-left"
          style={{ gridTemplateColumns: GRID_COLUMNS }}
        >
          {COLUMNS.map((column, index) => {
            const isSorted = sort.key === column.key
            return (
              <div
                key={column.key}
                role="columnheader"
                aria-colindex={index + 1}
                aria-sort={isSorted ? sort.direction : undefined}
                className={column.align === 'right' ? 'text-right' : 'text-left'}
              >
                <button
                  type="button"
                  onClick={() => toggleSort(column.key)}
                  className="flex w-full items-center justify-between gap-2 px-3 py-2.5 font-mono text-[10px] tracking-[0.12em] text-(--color-fg-subtle) uppercase transition-colors hover:text-(--color-fg)"
                >
                  <span>{column.label}</span>
                  <span aria-hidden="true" className="text-(--color-accent)">
                    {isSorted ? (sort.direction === 'ascending' ? 'ASC' : 'DESC') : 'SORT'}
                  </span>
                </button>
              </div>
            )
          })}
        </div>

        <div
          ref={scrollRef}
          role="rowgroup"
          onScroll={onScroll}
          className="overflow-y-auto"
          style={{ height: VIEWPORT_HEIGHT }}
        >
          <div className="relative" style={{ height: totalHeight }}>
            {visibleRows.map((row, visibleIndex) => {
              const rowIndex = startIndex + visibleIndex
              const isActive = row.id === activeRowId
              const isSelected = row.id === selectedRowId

              return (
                <div
                  id={`row-${row.id}`}
                  key={row.id}
                  role="row"
                  aria-rowindex={rowIndex + 2}
                  aria-selected={isSelected}
                  onMouseEnter={() => setActiveRowId(row.id)}
                  onClick={() => {
                    setActiveRowId(row.id)
                    setSelectedRowId(row.id)
                  }}
                  className="virtual-row absolute left-0 grid w-full cursor-default border-b border-(--color-border) text-(--color-fg-muted)"
                  style={{
                    gridTemplateColumns: GRID_COLUMNS,
                    height: ROW_HEIGHT,
                    transform: `translateY(${rowIndex * ROW_HEIGHT}px)`,
                    background: isActive
                      ? 'color-mix(in srgb, var(--color-accent-soft) 42%, transparent)'
                      : undefined,
                    boxShadow: isSelected ? 'inset 3px 0 0 var(--color-accent)' : undefined,
                  }}
                >
                  <div role="gridcell" aria-colindex={1} className="min-w-0 px-3 py-2">
                    <span className="block truncate text-(--color-fg)">{row.account}</span>
                    <span className="block truncate font-mono text-[10px] text-(--color-fg-subtle)">
                      {row.plan} · {row.owner}
                    </span>
                  </div>
                  <div role="gridcell" aria-colindex={2} className="px-3 py-3">
                    {row.region}
                  </div>
                  <div
                    role="gridcell"
                    aria-colindex={3}
                    className="px-3 py-3 text-right text-(--color-fg) tabular-nums"
                  >
                    {currencyFormatter.format(row.mrr)}
                  </div>
                  <div
                    role="gridcell"
                    aria-colindex={4}
                    className="px-3 py-3 text-right tabular-nums"
                  >
                    {row.users}
                  </div>
                  <div role="gridcell" aria-colindex={5} className="px-3 py-3">
                    <span className={`flex items-center gap-2 ${healthClass(row.health)}`}>
                      <span
                        aria-hidden="true"
                        className={`inline-block size-1.5 shrink-0 rounded-full ${healthDotClass(row.health)}`}
                      />
                      {row.health}
                    </span>
                  </div>
                  <div
                    role="gridcell"
                    aria-colindex={6}
                    className="px-3 py-3 font-mono text-[11px]"
                  >
                    {row.lastSeen}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <div className="min-h-10 rounded-md border border-(--color-border) bg-(--color-surface) px-3 py-2 font-mono text-[11px] text-(--color-fg-subtle)">
        {selectedRow ? (
          <span>
            Selected {selectedRow.account}: {currencyFormatter.format(selectedRow.mrr)} MRR,
            {` ${selectedRow.users}`} seats, {selectedRow.health.toLowerCase()} health.
          </span>
        ) : (
          <span>Select a row to pin its summary here.</span>
        )}
      </div>
    </div>
  )
}
