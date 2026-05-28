'use client'

import { useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import type { Showcase } from 'content-collections'
import { TagChips } from '@/components/ui/TagChips'
import { ShowcaseCard } from './ShowcaseCard'

// Strip the server-only MDX component reference at the boundary — the filter
// only needs tag + display data.
type FilterEntry = Omit<Showcase, 'NotesMDX'>

interface ComponentsFilterProps {
  entries: FilterEntry[]
}

export function ComponentsFilter({ entries }: ComponentsFilterProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const urlTag = searchParams.get('tag')
  const [active, setActive] = useState<string | null>(urlTag)

  const tagCounts = useMemo(() => {
    const m = new Map<string, number>()
    for (const e of entries) for (const t of e.tags) m.set(t, (m.get(t) ?? 0) + 1)
    return [...m.entries()]
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag))
  }, [entries])

  const visible = useMemo(
    () => (active ? entries.filter((e) => e.tags.includes(active)) : entries),
    [entries, active],
  )

  function handleChange(tag: string | null) {
    setActive(tag)
    const params = new URLSearchParams(searchParams.toString())
    if (tag) params.set('tag', tag)
    else params.delete('tag')
    const query = params.toString()
    router.replace(`/components${query ? `?${query}` : ''}`, { scroll: false })
  }

  return (
    <div>
      {tagCounts.length > 0 ? (
        <TagChips tags={tagCounts} active={active} onChange={handleChange} className="mb-10" />
      ) : null}
      {visible.length === 0 ? (
        <p className="font-mono text-sm text-(--color-fg-subtle)">No components match #{active}.</p>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((entry) => (
            <ShowcaseCard key={entry.slug} entry={entry} />
          ))}
        </div>
      )}
    </div>
  )
}
