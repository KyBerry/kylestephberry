import Image from 'next/image'
import Link from 'next/link'
import type { Design } from 'content-collections'
import { cn } from '@/lib/utils/cn'
import { FadeIn } from '@/components/motion/FadeIn'

// Keep the cascade short so late tiles aren't held invisible (see ShowcaseCard).
const MAX_STAGGER_STEPS = 6
const STAGGER_MS = 50

interface DesignTileProps {
  entry: Design
  priority?: boolean
  /** Position in its grid; drives the fade-in stagger. */
  index?: number
  className?: string
}

export function DesignTile({ entry, priority = false, index = 0, className }: DesignTileProps) {
  const delay = Math.min(index, MAX_STAGGER_STEPS) * STAGGER_MS

  return (
    <FadeIn delay={delay}>
      <Link
        id={`design-tile-${entry.slug}`}
        href={`/designs?design=${encodeURIComponent(entry.slug)}`}
        scroll={false}
        className={cn(
          'group relative block aspect-[16/10] overflow-hidden rounded-(--radius-card) border border-(--color-border) bg-(--color-surface) transition-colors hover:border-(--color-border-strong)',
          className,
        )}
      >
        <Image
          src={entry.image}
          alt={entry.imageAlt}
          fill
          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          placeholder="blur"
          blurDataURL={entry.blurDataURL}
          preload={priority}
          className="object-contain p-2 transition-transform group-hover:scale-[1.02]"
        />

        <span className="pointer-events-none absolute inset-x-0 bottom-0 flex items-baseline justify-between gap-4 bg-gradient-to-t from-(--color-bg)/85 via-(--color-bg)/40 to-transparent px-4 py-3 opacity-0 transition-opacity group-hover:opacity-100">
          <span className="text-sm font-medium text-(--color-fg)">{entry.title}</span>
          {entry.tags[0] ? (
            <span className="font-mono text-[10px] tracking-[0.12em] text-(--color-fg-muted) uppercase">
              {entry.tags[0]}
            </span>
          ) : null}
        </span>
      </Link>
    </FadeIn>
  )
}
