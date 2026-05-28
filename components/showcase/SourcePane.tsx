'use client'

import { useEffect, useMemo, useState } from 'react'
import { Fragment, jsx, jsxs } from 'react/jsx-runtime'
import { toJsxRuntime } from 'hast-util-to-jsx-runtime'
import type { Root } from 'hast'
import { Check, Copy } from '@phosphor-icons/react/dist/ssr'
import { cn } from '@/lib/utils/cn'
import type { SerializableHast } from '@/lib/content/shiki-hast'

interface SourcePaneProps {
  filename: string
  sourceText: string
  sourceHast: SerializableHast
  className?: string
  /** When false, the source body is hidden (collapsed), header stays visible. */
  expanded?: boolean
  onToggle?: () => void
}

export function SourcePane({
  filename,
  sourceText,
  sourceHast,
  className,
  expanded = true,
  onToggle,
}: SourcePaneProps) {
  const [copied, setCopied] = useState(false)

  // Convert the HAST tree (plain JSON object) to a React element tree.
  // hast-util-to-jsx-runtime is typed against the upstream `hast.Root` which
  // includes optional `position`/`data` fields; our stripped tree omits them,
  // so we cast at the boundary.
  const tree = useMemo(
    () => toJsxRuntime(sourceHast as unknown as Root, { Fragment, jsx, jsxs }),
    [sourceHast],
  )

  useEffect(() => {
    if (!copied) return
    const t = setTimeout(() => setCopied(false), 1500)
    return () => clearTimeout(t)
  }, [copied])

  async function copy() {
    try {
      await navigator.clipboard.writeText(sourceText)
      setCopied(true)
    } catch {
      // clipboard unavailable, silently fail
    }
  }

  return (
    <div className={cn('flex h-full flex-col bg-(--color-bg)', className)}>
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-(--color-border) px-4 py-2">
        <span className="font-mono text-xs text-(--color-fg-subtle)">{filename}</span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={copy}
            aria-label="Copy source"
            className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs text-(--color-fg-muted) transition-colors hover:bg-(--color-surface) hover:text-(--color-fg)"
          >
            {copied ? (
              <>
                <Check weight="regular" size={12} /> Copied
              </>
            ) : (
              <>
                <Copy weight="regular" size={12} /> Copy
              </>
            )}
          </button>
          {onToggle ? (
            <button
              type="button"
              onClick={onToggle}
              aria-label={expanded ? 'Collapse source' : 'Expand source'}
              aria-expanded={expanded}
              className="inline-flex h-6 w-6 items-center justify-center rounded text-(--color-fg-muted) transition-colors hover:bg-(--color-surface) hover:text-(--color-fg)"
            >
              <span
                aria-hidden
                className={cn('transition-transform', expanded ? '' : '-rotate-90')}
              >
                ▾
              </span>
            </button>
          ) : null}
        </div>
      </div>
      {expanded ? (
        <div
          data-lenis-prevent
          className="min-h-0 flex-1 overflow-auto px-4 py-3 font-mono text-[13px] leading-relaxed [&_pre]:!bg-transparent"
        >
          {tree}
        </div>
      ) : null}
    </div>
  )
}
