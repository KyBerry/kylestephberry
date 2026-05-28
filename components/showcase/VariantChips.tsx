'use client'

import { useRef, type KeyboardEvent } from 'react'
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
  const chipRefs = useRef<(HTMLButtonElement | null)[]>([])

  // Roving tabindex: the radiogroup is a single tab stop and arrow keys move
  // between radios, selecting + focusing the destination (ARIA radiogroup
  // pattern). Index falls back to 0 if the active value isn't found.
  const activeIndex = Math.max(0, variants.indexOf(active))

  function focusVariant(index: number) {
    const variant = variants[index]
    if (variant === undefined) return
    onChange(variant)
    chipRefs.current[index]?.focus()
  }

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const last = variants.length - 1
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      event.preventDefault()
      focusVariant(index === last ? 0 : index + 1)
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      event.preventDefault()
      focusVariant(index === 0 ? last : index - 1)
    }
  }

  return (
    <div role="radiogroup" aria-label={label} className={cn('flex flex-wrap gap-1', className)}>
      {variants.map((v, i) => {
        const isActive = v === active
        return (
          <button
            key={v}
            ref={(node) => {
              chipRefs.current[i] = node
            }}
            type="button"
            role="radio"
            aria-checked={isActive}
            tabIndex={i === activeIndex ? 0 : -1}
            onClick={() => onChange(v)}
            onKeyDown={(event) => handleKeyDown(event, i)}
            className={cn(
              'rounded-md border px-2 py-1 font-mono text-[10px] tracking-[0.12em] uppercase transition-colors',
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
