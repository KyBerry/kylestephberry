'use client'

import { cn } from '@/lib/utils/cn'

interface VariantChipsProps {
  variants: string[]
  active: string
  onChange: (variant: string) => void
  label?: string
  className?: string
}

export function VariantChips({
  variants,
  active,
  onChange,
  label = 'Variant',
  className,
}: VariantChipsProps) {
  return (
    <div role="radiogroup" aria-label={label} className={cn('flex flex-wrap gap-1', className)}>
      {variants.map((v) => {
        const isActive = v === active
        return (
          <button
            key={v}
            type="button"
            role="radio"
            aria-checked={isActive}
            onClick={() => onChange(v)}
            className={cn(
              'rounded-md border px-2 py-1 font-mono text-[10px] uppercase tracking-[0.12em] transition-colors',
              isActive
                ? 'border-(--color-border-strong) bg-(--color-surface-hover) text-(--color-fg)'
                : 'border-(--color-border) text-(--color-fg-muted) hover:border-(--color-border-strong) hover:text-(--color-fg)',
            )}
          >
            {v}
          </button>
        )
      })}
    </div>
  )
}
