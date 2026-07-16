import Link from 'next/link'
import type { Post } from 'content-collections'
import { cn } from '@/lib/utils/cn'
import { formatDate } from '@/lib/utils/format-date'
import { FadeIn } from '@/components/motion/FadeIn'

// Keep the cascade short so late cards aren't held invisible (see ShowcaseCard).
const MAX_STAGGER_STEPS = 6
const STAGGER_MS = 50

interface PostCardProps {
  post: Post
  /** Position in its grid; drives the fade-in stagger. */
  index?: number
  className?: string
}

export function PostCard({ post, index = 0, className }: PostCardProps) {
  const delay = Math.min(index, MAX_STAGGER_STEPS) * STAGGER_MS

  return (
    <FadeIn delay={delay}>
      <Link
        href={post.url}
        className={cn(
          'group block rounded-(--radius-card) border border-(--color-border) bg-(--color-surface) px-5 py-5 transition-colors hover:border-(--color-border-strong)',
          className,
        )}
      >
        <p className="mb-2 font-mono text-xs text-(--color-fg-subtle)">
          {formatDate(post.publishedAt)}
        </p>
        <h3 className="text-lg font-medium tracking-[-0.01em] text-(--color-fg) transition-colors group-hover:text-(--color-accent)">
          {post.title}
        </h3>
        <p className="mt-2 line-clamp-2 text-sm text-(--color-fg-muted)">{post.summary}</p>
      </Link>
    </FadeIn>
  )
}
