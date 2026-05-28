import Image from 'next/image'
import Link from 'next/link'
import type { Design } from 'content-collections'
import { cn } from '@/lib/utils/cn'

interface DesignTileProps {
  entry: Design
  priority?: boolean
  className?: string
}

export function DesignTile({ entry, priority = false, className }: DesignTileProps) {
  return (
    <Link
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
        priority={priority}
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
  )
}
