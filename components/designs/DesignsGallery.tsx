'use client'

import { useCallback, useEffect, useMemo, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import type { Design } from 'content-collections'
import { TagChips } from '@/components/ui/TagChips'
import { DesignTile } from './DesignTile'
import { DesignLightbox } from './DesignLightbox'

interface DesignsGalleryProps {
  entries: Design[]
}

const PATH = '/designs'

export function DesignsGallery({ entries }: DesignsGalleryProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const activeTag = searchParams.get('tag')
  const activeSlug = searchParams.get('design')

  const tagCounts = useMemo(() => {
    const m = new Map<string, number>()
    for (const e of entries) for (const t of e.tags) m.set(t, (m.get(t) ?? 0) + 1)
    return [...m.entries()]
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag))
  }, [entries])

  const visible = useMemo(
    () => (activeTag ? entries.filter((e) => e.tags.includes(activeTag)) : entries),
    [entries, activeTag],
  )

  const openIndex = activeSlug ? visible.findIndex((e) => e.slug === activeSlug) : -1
  const openEntry = openIndex >= 0 ? (visible[openIndex] ?? null) : null
  const hasPrev = openIndex > 0
  const hasNext = openIndex >= 0 && openIndex < visible.length - 1

  // The lightbox opens from a URL-state <Link>, not a Radix Dialog.Trigger, so
  // Radix restores focus to <body> on close. Remember the slug that was open and
  // move focus back to its tile once the dialog has unmounted. The timeout runs
  // after Radix's own setTimeout restore (registered during the same commit),
  // so this lands last and wins.
  const lastOpenSlug = useRef<string | null>(null)
  useEffect(() => {
    const prevSlug = lastOpenSlug.current
    lastOpenSlug.current = activeSlug
    if (activeSlug || !prevSlug) return
    const id = window.setTimeout(() => {
      document.getElementById(`design-tile-${prevSlug}`)?.focus()
    }, 0)
    return () => window.clearTimeout(id)
  }, [activeSlug])

  const setParams = useCallback(
    (mutate: (p: URLSearchParams) => void) => {
      const next = new URLSearchParams(searchParams.toString())
      mutate(next)
      const q = next.toString()
      router.replace(`${PATH}${q ? `?${q}` : ''}`, { scroll: false })
    },
    [router, searchParams],
  )

  const handleTagChange = useCallback(
    (tag: string | null) => {
      setParams((p) => {
        if (tag) p.set('tag', tag)
        else p.delete('tag')
        // Closing the lightbox when filter changes avoids landing on a slug
        // that's no longer in the visible set.
        p.delete('design')
      })
    },
    [setParams],
  )

  const handleClose = useCallback(() => {
    setParams((p) => p.delete('design'))
  }, [setParams])

  const handlePrev = useCallback(() => {
    if (!hasPrev) return
    const prev = visible[openIndex - 1]
    if (!prev) return
    setParams((p) => p.set('design', prev.slug))
  }, [hasPrev, openIndex, visible, setParams])

  const handleNext = useCallback(() => {
    if (!hasNext) return
    const next = visible[openIndex + 1]
    if (!next) return
    setParams((p) => p.set('design', next.slug))
  }, [hasNext, openIndex, visible, setParams])

  return (
    <div>
      {tagCounts.length > 0 ? (
        <TagChips
          tags={tagCounts}
          active={activeTag}
          onChange={handleTagChange}
          className="mb-10"
        />
      ) : null}

      {visible.length === 0 ? (
        <p className="font-mono text-sm text-(--color-fg-subtle)">No designs match #{activeTag}.</p>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((entry, i) => (
            <DesignTile key={entry.slug} entry={entry} priority={i < 1} index={i} />
          ))}
        </div>
      )}

      <DesignLightbox
        open={openEntry}
        onClose={handleClose}
        onPrev={handlePrev}
        onNext={handleNext}
        hasPrev={hasPrev}
        hasNext={hasNext}
      />
    </div>
  )
}
