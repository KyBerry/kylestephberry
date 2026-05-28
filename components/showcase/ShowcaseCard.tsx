'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import type { Showcase } from 'content-collections'
import { cn } from '@/lib/utils/cn'
import { FadeIn } from '@/components/motion/FadeIn'
import { useCursorGlow } from '@/lib/motion/useCursorGlow'

// Card consumes only a small slice of the entry — narrowing the prop type
// keeps the boundary clean (omits the server-only NotesMDX function ref).
type CardEntry = Pick<Showcase, 'url' | 'title' | 'tags' | 'Component'>

// Stagger is capped so a long grid doesn't keep late cards invisible for
// seconds; ~6 steps (300ms) is enough to read as a cascade.
const MAX_STAGGER_STEPS = 6
const STAGGER_MS = 50

interface ShowcaseCardProps {
  entry: CardEntry
  /** Position in its grid; drives the fade-in stagger. */
  index?: number
  className?: string
}

export function ShowcaseCard({ entry, index = 0, className }: ShowcaseCardProps) {
  const ref = useRef<HTMLDivElement | null>(null)
  const [mounted, setMounted] = useState(false)
  const { glowRef, onPointerMove, onPointerLeave } = useCursorGlow()

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
  const delay = Math.min(index, MAX_STAGGER_STEPS) * STAGGER_MS

  return (
    <FadeIn delay={delay}>
      <Link
        ref={glowRef}
        onPointerMove={onPointerMove}
        onPointerLeave={onPointerLeave}
        href={entry.url}
        className={cn(
          'group relative block overflow-hidden rounded-(--radius-card) border border-(--color-border) bg-(--color-surface) transition-colors hover:border-(--color-border-strong)',
          className,
        )}
      >
        <div
          ref={ref}
          className="relative grid aspect-[16/10] place-items-center overflow-hidden rounded-t-(--radius-card) border-b border-(--color-border) bg-(--color-bg)"
        >
          {mounted ? <Component /> : null}
        </div>
        <div className="relative flex items-baseline justify-between gap-4 px-4 py-3">
          <span className="text-sm font-medium text-(--color-fg) transition-colors group-hover:text-(--color-accent)">
            {entry.title}
          </span>
          {entry.tags[0] ? (
            <span className="font-mono text-[10px] tracking-[0.12em] text-(--color-fg-subtle) uppercase">
              {entry.tags[0]}
            </span>
          ) : null}
        </div>
        {/*
          Cursor-follow glow (spec: "soft radial cursor glow on featured
          component cards using accent at ~8%"). Overlays the card on top so the
          faint tint reads everywhere; position tracks --x/--y written by
          useCursorGlow, accent mixed to 8%. pointer-events-none so it never
          intercepts the card's own hover/click; aria-hidden as it's decorative.
        */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-10 rounded-(--radius-card) opacity-0 transition-opacity duration-300 ease-(--ease-out-quad) group-hover:opacity-100"
          style={{
            background:
              'radial-gradient(circle at var(--x, 50%) var(--y, 50%), color-mix(in oklab, var(--color-accent) 8%, transparent), transparent 200px)',
          }}
        />
      </Link>
    </FadeIn>
  )
}
