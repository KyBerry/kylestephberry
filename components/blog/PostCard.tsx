import Link from 'next/link'
import type { Post } from 'content-collections'
import { cn } from '@/lib/utils/cn'

interface PostCardProps {
  post: Post
  className?: string
}

function formatDate(iso: string): string {
  const date = new Date(iso)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function PostCard({ post, className }: PostCardProps) {
  return (
    <Link
      href={post.url}
      className={cn(
        'group block rounded-(--radius-card) border border-(--color-border) bg-(--color-surface) px-5 py-5 transition-colors hover:border-(--color-border-strong)',
        className,
      )}
    >
      <p className="mb-2 font-mono text-xs text-(--color-fg-subtle)">{formatDate(post.publishedAt)}</p>
      <h3 className="text-lg font-medium tracking-[-0.01em] text-(--color-fg) transition-colors group-hover:text-(--color-accent)">
        {post.title}
      </h3>
      <p className="mt-2 line-clamp-2 text-sm text-(--color-fg-muted)">{post.summary}</p>
    </Link>
  )
}
