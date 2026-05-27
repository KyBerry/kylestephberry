'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import type { Showcase } from 'content-collections'
import { cn } from '@/lib/utils/cn'

interface ShowcaseCardProps {
  entry: Showcase
  className?: string
}

export function ShowcaseCard({ entry, className }: ShowcaseCardProps) {
  const ref = useRef<HTMLDivElement | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const node = ref.current
    if (!node || mounted) return

    const observer = new IntersectionObserver(
      ([first]) => {
        if (first?.isIntersecting) {
          setMounted(true)
          observer.disconnect()
        }
      },
      { rootMargin: '200px 0px' },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [mounted])

  const Component = entry.Component

  return (
    <Link
      href={entry.url}
      className={cn(
        'group block rounded-(--radius-card) border border-(--color-border) bg-(--color-surface) transition-colors hover:border-(--color-border-strong)',
        className,
      )}
    >
      <div
        ref={ref}
        className="relative grid aspect-[16/10] place-items-center overflow-hidden rounded-t-(--radius-card) border-b border-(--color-border) bg-(--color-bg)"
      >
        {mounted ? <Component /> : null}
      </div>
      <div className="flex items-baseline justify-between gap-4 px-4 py-3">
        <span className="text-sm font-medium text-(--color-fg) transition-colors group-hover:text-(--color-accent)">
          {entry.title}
        </span>
        {entry.tags[0] ? (
          <span className="font-mono text-[10px] tracking-[0.12em] text-(--color-fg-subtle) uppercase">
            {entry.tags[0]}
          </span>
        ) : null}
      </div>
    </Link>
  )
}
