import { cn } from '@/lib/utils/cn'
import { formatDate } from '@/lib/utils/format-date'

interface PostMetaProps {
  publishedAt: string
  readingTime: string
  tags: string[]
  className?: string
}

export function PostMeta({ publishedAt, readingTime, tags, className }: PostMetaProps) {
  return (
    <div
      className={cn(
        'flex flex-wrap items-center gap-x-3 gap-y-2 font-mono text-xs text-(--color-fg-subtle)',
        className,
      )}
    >
      <time dateTime={publishedAt}>{formatDate(publishedAt)}</time>
      <span aria-hidden>·</span>
      <span>{readingTime}</span>
      {tags.length > 0 ? (
        <>
          <span aria-hidden>·</span>
          <ul className="flex flex-wrap gap-1">
            {tags.map((tag) => (
              <li
                key={tag}
                className="rounded border border-(--color-border) px-1.5 py-0.5 text-[10px] tracking-[0.12em] text-(--color-fg-muted) uppercase"
              >
                {tag}
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </div>
  )
}
