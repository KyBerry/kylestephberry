'use client'

import { useEffect, useId, useMemo, useRef, useState } from 'react'
import type { KeyboardEvent, MouseEvent } from 'react'
import { CaretRight, File as FileIcon } from '@phosphor-icons/react/dist/ssr'

type LoadState = 'idle' | 'loading' | 'loaded' | 'error'
type NodeKind = 'folder' | 'document'

interface TreeNode {
  id: string
  label: string
  detail: string
  kind: NodeKind
  hasChildren?: boolean
  failOnce?: boolean
}

interface VisibleNode {
  node: TreeNode
  parentId: string | null
  level: number
  position: number
  setSize: number
}

const ROOT_NODES: readonly TreeNode[] = [
  {
    id: 'writing',
    label: 'Writing',
    detail: '3 shown',
    kind: 'folder',
    hasChildren: true,
  },
  {
    id: 'components',
    label: 'Components',
    detail: '3 shown',
    kind: 'folder',
    hasChildren: true,
    failOnce: true,
  },
  {
    id: 'about',
    label: 'About',
    detail: 'Page',
    kind: 'document',
  },
]

const CHILDREN: Record<string, readonly TreeNode[]> = {
  writing: [
    {
      id: 'writing-2026',
      label: '2026',
      detail: '3 posts',
      kind: 'folder',
      hasChildren: true,
    },
    { id: 'rss-feed', label: 'RSS feed', detail: 'XML', kind: 'document' },
  ],
  'writing-2026': [
    {
      id: 'happy-path',
      label: "The happy path is not the accountant's job",
      detail: 'Aug 9',
      kind: 'document',
    },
    {
      id: 'qa-states',
      label: 'QA taught me to design the states nobody demos',
      detail: 'Aug 1',
      kind: 'document',
    },
    {
      id: 'figma-interface',
      label: "The Figma file doesn't contain the interface",
      detail: 'Jul 24',
      kind: 'document',
    },
  ],
  components: [
    {
      id: 'accessible-time-series',
      label: 'Accessible time series',
      detail: 'Jul 21',
      kind: 'document',
    },
    {
      id: 'date-range',
      label: 'Locale-aware date range',
      detail: 'Aug 2',
      kind: 'document',
    },
    {
      id: 'split-view',
      label: 'Keyboard-resizable split view',
      detail: 'Jul 27',
      kind: 'document',
    },
  ],
}

const LOAD_LATENCY: Record<string, number> = {
  writing: 560,
  'writing-2026': 480,
  components: 720,
}

const NODE_BY_ID = new Map<string, TreeNode>()
const PARENT_BY_ID = new Map<string, string>()

for (const node of ROOT_NODES) NODE_BY_ID.set(node.id, node)
for (const [parentId, nodes] of Object.entries(CHILDREN)) {
  for (const node of nodes) {
    NODE_BY_ID.set(node.id, node)
    PARENT_BY_ID.set(node.id, parentId)
  }
}

function normalize(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase()
}

function pathFor(nodeId: string) {
  const labels: string[] = []
  let currentId: string | undefined = nodeId

  while (currentId) {
    const node = NODE_BY_ID.get(currentId)
    if (node) labels.unshift(node.label)
    currentId = PARENT_BY_ID.get(currentId)
  }

  return labels.join(' › ')
}

export default function AsyncTreeView() {
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set())
  const [loadStates, setLoadStates] = useState<Record<string, LoadState>>({})
  const [focusedId, setFocusedId] = useState('writing')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [announcement, setAnnouncement] = useState('')

  const treeId = useId()
  const helpId = useId()
  const rowRefs = useRef(new Map<string, HTMLDivElement>())
  const attempts = useRef<Record<string, number>>({})
  const loadTimers = useRef(new Map<string, number>())
  const inFlight = useRef(new Set<string>())
  const typeahead = useRef('')
  const typeaheadTimer = useRef<number | null>(null)

  const visibleNodes = useMemo(() => {
    const result: VisibleNode[] = []

    const visit = (nodes: readonly TreeNode[], level: number, parentId: string | null) => {
      nodes.forEach((node, index) => {
        result.push({
          node,
          parentId,
          level,
          position: index + 1,
          setSize: nodes.length,
        })

        if (node.hasChildren && expanded.has(node.id) && loadStates[node.id] === 'loaded') {
          visit(CHILDREN[node.id] ?? [], level + 1, node.id)
        }
      })
    }

    visit(ROOT_NODES, 1, null)
    return result
  }, [expanded, loadStates])

  useEffect(() => {
    const timers = loadTimers.current
    return () => {
      timers.forEach((timer) => window.clearTimeout(timer))
      if (typeaheadTimer.current !== null) window.clearTimeout(typeaheadTimer.current)
    }
  }, [])

  const focusNode = (nodeId: string) => {
    setFocusedId(nodeId)
    rowRefs.current.get(nodeId)?.focus()
  }

  const loadNode = (node: TreeNode) => {
    if (!node.hasChildren || inFlight.current.has(node.id)) return
    if (loadStates[node.id] === 'loaded') return

    inFlight.current.add(node.id)
    attempts.current[node.id] = (attempts.current[node.id] ?? 0) + 1
    const attempt = attempts.current[node.id]

    setExpanded((current) => {
      const next = new Set(current)
      next.add(node.id)
      return next
    })
    setLoadStates((current) => ({ ...current, [node.id]: 'loading' }))
    setAnnouncement(`${node.label} is loading.`)

    const timer = window.setTimeout(() => {
      inFlight.current.delete(node.id)
      loadTimers.current.delete(node.id)

      if (node.failOnce && attempt === 1) {
        setLoadStates((current) => ({ ...current, [node.id]: 'error' }))
        setAnnouncement(`Could not load ${node.label}. Choose Retry to try again.`)
        return
      }

      const childCount = CHILDREN[node.id]?.length ?? 0
      setLoadStates((current) => ({ ...current, [node.id]: 'loaded' }))
      setAnnouncement(`${node.label} loaded, ${childCount} ${childCount === 1 ? 'item' : 'items'}.`)
    }, LOAD_LATENCY[node.id] ?? 600)

    loadTimers.current.set(node.id, timer)
  }

  const expandNode = (node: TreeNode) => {
    const status = loadStates[node.id] ?? 'idle'
    setExpanded((current) => {
      const next = new Set(current)
      next.add(node.id)
      return next
    })

    if (status === 'idle' || status === 'error') loadNode(node)
    else setAnnouncement(`${node.label} expanded.`)
  }

  const collapseNode = (node: TreeNode) => {
    setExpanded((current) => {
      const next = new Set(current)
      next.delete(node.id)
      return next
    })
    setAnnouncement(`${node.label} collapsed.`)
  }

  const toggleNode = (node: TreeNode) => {
    if (!node.hasChildren) return
    if (expanded.has(node.id)) collapseNode(node)
    else expandNode(node)
  }

  const selectNode = (node: TreeNode) => {
    const next = selectedId === node.id ? null : node.id
    setSelectedId(next)
    setAnnouncement(next ? `${node.label} selected.` : 'Selection cleared.')
  }

  const moveByIndex = (currentIndex: number, amount: number) => {
    const nextIndex = Math.max(0, Math.min(visibleNodes.length - 1, currentIndex + amount))
    const next = visibleNodes[nextIndex]
    if (next) focusNode(next.node.id)
  }

  const runTypeahead = (key: string, currentIndex: number) => {
    if (typeaheadTimer.current !== null) window.clearTimeout(typeaheadTimer.current)
    typeahead.current += normalize(key)
    typeaheadTimer.current = window.setTimeout(() => {
      typeahead.current = ''
      typeaheadTimer.current = null
    }, 650)

    const query = typeahead.current
    const ordered = [
      ...visibleNodes.slice(currentIndex + 1),
      ...visibleNodes.slice(0, currentIndex + 1),
    ]
    const match = ordered.find(({ node }) => normalize(node.label).startsWith(query))
    if (match) focusNode(match.node.id)
  }

  const onNodeKeyDown = (event: KeyboardEvent<HTMLDivElement>, item: VisibleNode) => {
    if (event.target !== event.currentTarget) return

    const index = visibleNodes.findIndex(({ node }) => node.id === item.node.id)

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault()
        moveByIndex(index, 1)
        return
      case 'ArrowUp':
        event.preventDefault()
        moveByIndex(index, -1)
        return
      case 'Home':
        event.preventDefault()
        if (visibleNodes[0]) focusNode(visibleNodes[0].node.id)
        return
      case 'End':
        event.preventDefault()
        if (visibleNodes.at(-1)) focusNode(visibleNodes.at(-1)!.node.id)
        return
      case 'ArrowRight': {
        if (!item.node.hasChildren) return
        event.preventDefault()
        const status = loadStates[item.node.id] ?? 'idle'
        if (!expanded.has(item.node.id) || status === 'error') {
          expandNode(item.node)
          return
        }
        if (status === 'loaded') {
          const firstChild = visibleNodes.find(({ parentId }) => parentId === item.node.id)
          if (firstChild) focusNode(firstChild.node.id)
        }
        return
      }
      case 'ArrowLeft':
        event.preventDefault()
        if (item.node.hasChildren && expanded.has(item.node.id)) {
          collapseNode(item.node)
        } else if (item.parentId) {
          focusNode(item.parentId)
        }
        return
      case 'Enter':
      case ' ':
        event.preventDefault()
        selectNode(item.node)
        return
      default:
        if (
          event.key.length === 1 &&
          !event.altKey &&
          !event.ctrlKey &&
          !event.metaKey &&
          event.key !== ' '
        ) {
          event.preventDefault()
          runTypeahead(event.key, index)
        }
    }
  }

  const resetDemo = () => {
    loadTimers.current.forEach((timer) => window.clearTimeout(timer))
    loadTimers.current.clear()
    inFlight.current.clear()
    attempts.current = {}
    setExpanded(new Set())
    setLoadStates({})
    setSelectedId(null)
    setFocusedId('writing')
    setAnnouncement('Tree reset.')
  }

  return (
    <section className="mx-auto w-[520px] max-w-full overflow-hidden rounded-(--radius-card) border border-(--color-border) bg-(--color-surface) text-sm">
      <header className="flex items-start justify-between gap-4 border-b border-(--color-border) px-5 py-4">
        <div>
          <h2 className="font-medium text-(--color-fg)">Site content</h2>
          <p className="mt-1 text-xs text-(--color-fg-subtle)">Open a section to load its items.</p>
        </div>
        <button
          type="button"
          onClick={resetDemo}
          className="rounded-md border border-(--color-border) px-2.5 py-1.5 font-mono text-[10px] text-(--color-fg-muted) transition-colors hover:border-(--color-border-strong) hover:text-(--color-fg)"
        >
          Reset
        </button>
      </header>

      <div className="p-3">
        <div
          id={treeId}
          role="tree"
          aria-label="Site content"
          aria-describedby={helpId}
          className="space-y-0.5"
        >
          {visibleNodes.map((item) => {
            const { node } = item
            const status = loadStates[node.id] ?? 'idle'
            const isExpanded = expanded.has(node.id)
            const isSelected = selectedId === node.id
            const isFocused = focusedId === node.id

            return (
              /* scan-ui-slop-ignore accessibility-smell -- WAI-ARIA treeitem uses roving tabindex and handles Enter and Space in onNodeKeyDown */
              <div
                key={node.id}
                ref={(element) => {
                  if (element) rowRefs.current.set(node.id, element)
                  else rowRefs.current.delete(node.id)
                }}
                role="treeitem"
                aria-level={item.level}
                aria-posinset={item.position}
                aria-setsize={item.setSize}
                aria-label={`${node.label}, ${node.detail}`}
                aria-expanded={node.hasChildren ? isExpanded : undefined}
                aria-selected={isSelected}
                aria-busy={status === 'loading' ? true : undefined}
                tabIndex={isFocused ? 0 : -1}
                onFocus={() => setFocusedId(node.id)}
                onKeyDown={(event) => onNodeKeyDown(event, item)}
                onClick={() => {
                  focusNode(node.id)
                  selectNode(node)
                }}
                className="rounded-md outline-none focus-visible:ring-2 focus-visible:ring-(--color-accent) focus-visible:ring-offset-1 focus-visible:ring-offset-(--color-surface)"
              >
                <div
                  className={`group flex min-h-10 cursor-default items-center gap-2 rounded-md pe-3 transition-colors ${
                    isSelected
                      ? 'bg-(--color-accent-soft) text-(--color-fg)'
                      : 'text-(--color-fg-muted) hover:bg-(--color-surface-hover) hover:text-(--color-fg)'
                  }`}
                  style={{ paddingInlineStart: 10 + (item.level - 1) * 18 }}
                >
                  {node.hasChildren ? (
                    <button
                      type="button"
                      tabIndex={-1}
                      aria-label={`${isExpanded ? 'Collapse' : 'Expand'} ${node.label}`}
                      onClick={(event: MouseEvent<HTMLButtonElement>) => {
                        event.stopPropagation()
                        focusNode(node.id)
                        toggleNode(node)
                      }}
                      className="grid size-6 shrink-0 place-items-center rounded text-(--color-fg-subtle) transition-colors hover:bg-(--color-border) hover:text-(--color-fg)"
                    >
                      <CaretRight
                        aria-hidden="true"
                        size={13}
                        weight="regular"
                        className={`transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                      />
                    </button>
                  ) : (
                    <span aria-hidden="true" className="grid size-6 shrink-0 place-items-center">
                      <FileIcon size={13} weight="regular" />
                    </span>
                  )}

                  <span className="min-w-0 flex-1 truncate">{node.label}</span>
                  {status === 'loading' ? (
                    <span
                      aria-hidden="true"
                      className="size-3 shrink-0 animate-spin rounded-full border border-(--color-fg-subtle) border-t-transparent motion-reduce:animate-none"
                    />
                  ) : null}
                  <span className="shrink-0 font-mono text-[10px] text-(--color-fg-subtle)">
                    {status === 'loading' ? 'Loading' : node.detail}
                  </span>
                </div>

                {isExpanded && status === 'error' ? (
                  <div
                    className="my-1 flex flex-wrap items-center justify-between gap-2 py-1.5 pe-3 text-xs text-(--color-fg-muted)"
                    style={{ paddingInlineStart: 42 + item.level * 18 }}
                  >
                    <span>Could not load {node.label}.</span>
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation()
                        loadNode(node)
                      }}
                      className="rounded px-1 py-0.5 font-mono text-[10px] text-(--color-fg) underline decoration-(--color-border-strong) underline-offset-4 transition-colors hover:decoration-(--color-accent)"
                    >
                      Retry
                    </button>
                  </div>
                ) : null}
              </div>
            )
          })}
        </div>
      </div>

      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-(--color-border) bg-(--color-bg) px-5 py-3">
        <p className="min-w-0 truncate text-xs text-(--color-fg-muted)">
          <span className="me-2 font-mono text-[9px] tracking-[0.12em] text-(--color-fg-subtle) uppercase">
            Selected
          </span>
          {selectedId ? pathFor(selectedId) : 'No selection'}
        </p>
        <p
          id={helpId}
          className="flex flex-wrap gap-x-3 font-mono text-[9px] text-(--color-fg-subtle)"
        >
          <span>Up/Down move</span>
          <span>Left/Right open</span>
          <span>Enter selects</span>
          <span>Type to jump</span>
        </p>
      </footer>

      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {announcement}
      </div>
    </section>
  )
}
