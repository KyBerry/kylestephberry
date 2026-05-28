'use client'

import { cn } from '@/lib/utils/cn'

interface TagChipsProps {
  tags: { tag: string; count: number }[]
  active: string | null
  onChange: (tag: string | null) => void
  className?: string
}

export function TagChips({ tags, active, onChange, className }: TagChipsProps) {
  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      <button
        type="button"
        onClick={() => onChange(null)}
        className={cn(
          'rounded-md border px-2.5 py-1 font-mono text-xs transition-colors',
          active === null
            ? 'border-(--color-border-strong) bg-(--color-surface-hover) text-(--color-fg)'
            : 'border-(--color-border) text-(--color-fg-muted) hover:border-(--color-border-strong) hover:text-(--color-fg)',
        )}
      >
        All
      </button>
      {tags.map(({ tag, count }) => {
        const isActive = active === tag
        return (
          <button
            key={tag}
            type="button"
            onClick={() => onChange(tag)}
            className={cn(
              'rounded-md border px-2.5 py-1 font-mono text-xs transition-colors',
              isActive
                ? 'border-(--color-border-strong) bg-(--color-surface-hover) text-(--color-fg)'
                : 'border-(--color-border) text-(--color-fg-muted) hover:border-(--color-border-strong) hover:text-(--color-fg)',
            )}
          >
            #{tag} <span className="text-(--color-fg-subtle)">({count})</span>
          </button>
        )
      })}
    </div>
  )
}
