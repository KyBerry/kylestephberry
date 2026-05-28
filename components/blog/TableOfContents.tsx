'use client'

import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils/cn'

interface Heading {
  id: string
  text: string
  level: 2 | 3
}

interface TableOfContentsProps {
  /** A query selector for the article body containing the headings. */
  targetSelector: string
  className?: string
}

export function TableOfContents({ targetSelector, className }: TableOfContentsProps) {
  const [headings, setHeadings] = useState<Heading[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const observerRef = useRef<IntersectionObserver | null>(null)

  useEffect(() => {
    const target = document.querySelector(targetSelector)
    if (!target) return

    const nodes = Array.from(target.querySelectorAll<HTMLHeadingElement>('h2, h3'))
    const list: Heading[] = nodes.map((n) => {
      if (!n.id) n.id = n.textContent?.toLowerCase().replace(/[^a-z0-9]+/g, '-') ?? ''
      return {
        id: n.id,
        text: n.textContent?.trim() ?? '',
        level: n.tagName === 'H3' ? 3 : 2,
      }
    })
    // eslint-disable-next-line react-hooks/set-state-in-effect -- derived from DOM after mount
    setHeadings(list)

    observerRef.current = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting)
        if (visible.length === 0) return
        const top = visible.sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0]
        if (top?.target.id) setActiveId(top.target.id)
      },
      { rootMargin: '-96px 0px -60% 0px', threshold: [0, 1] },
    )
    for (const n of nodes) observerRef.current.observe(n)

    return () => observerRef.current?.disconnect()
  }, [targetSelector])

  if (headings.length < 2) return null

  return (
    <nav aria-label="Table of contents" className={cn('text-sm', className)}>
      <p className="mb-3 font-mono text-xs tracking-[0.18em] text-(--color-fg-subtle) uppercase">
        Contents
      </p>
      <ol className="space-y-2">
        {headings.map((h) => (
          <li key={h.id} className={cn(h.level === 3 ? 'pl-3' : '')}>
            <a
              href={`#${h.id}`}
              className={cn(
                'block leading-tight transition-colors',
                activeId === h.id
                  ? 'text-(--color-accent)'
                  : 'text-(--color-fg-subtle) hover:text-(--color-fg-muted)',
              )}
            >
              {h.text}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  )
}
