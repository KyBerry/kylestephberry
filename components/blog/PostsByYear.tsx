'use client'

import { useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import type { Post } from 'content-collections'
import Link from 'next/link'
import { TagChips } from '@/components/ui/TagChips'
import { formatDate } from '@/lib/utils/format-date'

// Posts crossing into the client need MDXContent (a bare function ref) stripped.
type PostListItem = Omit<Post, 'MDXContent'>

interface PostsByYearProps {
  posts: PostListItem[]
}

export function PostsByYear({ posts }: PostsByYearProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const activeTag = searchParams.get('tag')

  const tagCounts = useMemo(() => {
    const m = new Map<string, number>()
    for (const p of posts) for (const t of p.tags) m.set(t, (m.get(t) ?? 0) + 1)
    return [...m.entries()]
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag))
  }, [posts])

  const visible = useMemo(
    () => (activeTag ? posts.filter((p) => p.tags.includes(activeTag)) : posts),
    [posts, activeTag],
  )

  const byYear = useMemo(() => {
    const groups = new Map<string, PostListItem[]>()
    for (const p of visible) {
      const year = p.publishedAt.slice(0, 4)
      const arr = groups.get(year) ?? []
      arr.push(p)
      groups.set(year, arr)
    }
    return [...groups.entries()].sort((a, b) => b[0].localeCompare(a[0]))
  }, [visible])

  function handleChange(tag: string | null) {
    const params = new URLSearchParams(searchParams.toString())
    if (tag) params.set('tag', tag)
    else params.delete('tag')
    const q = params.toString()
    router.replace(`/blog${q ? `?${q}` : ''}`, { scroll: false })
  }

  return (
    <div>
      {tagCounts.length > 0 ? (
        <TagChips tags={tagCounts} active={activeTag} onChange={handleChange} className="mb-12" />
      ) : null}

      {visible.length === 0 ? (
        <p className="font-mono text-sm text-(--color-fg-subtle)">No posts match #{activeTag}.</p>
      ) : (
        <div className="space-y-12">
          {byYear.map(([year, group]) => (
            <section key={year}>
              <h2 className="mb-4 font-mono text-xs tracking-[0.18em] text-(--color-fg-subtle) uppercase">
                {year}
              </h2>
              <ul className="divide-y divide-(--color-border)">
                {group.map((post) => (
                  <li key={post.slug}>
                    <Link
                      href={post.url}
                      className="group grid grid-cols-[80px_1fr] items-baseline gap-x-6 gap-y-1 py-4 transition-colors hover:bg-(--color-surface) sm:grid-cols-[100px_1fr]"
                    >
                      <span className="font-mono text-xs text-(--color-fg-subtle)">
                        {formatDate(post.publishedAt, { year: false })}
                      </span>
                      <div className="min-w-0">
                        <p className="text-base font-medium text-(--color-fg) transition-colors group-hover:text-(--color-accent)">
                          {post.title}
                        </p>
                        <p className="mt-1 line-clamp-2 text-sm text-(--color-fg-muted)">
                          {post.summary}
                        </p>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}
