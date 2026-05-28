type WithDate = { publishedAt: string }
type WithFeatured = { featured: boolean }

/**
 * Returns the N newest items sorted by `publishedAt` descending.
 */
export function latest<T extends WithDate>(items: readonly T[], limit: number): T[] {
  return items.toSorted((a, b) => b.publishedAt.localeCompare(a.publishedAt)).slice(0, limit)
}

/**
 * Returns the N newest items where `featured` is true, sorted by `publishedAt` descending.
 */
export function featured<T extends WithDate & WithFeatured>(
  items: readonly T[],
  limit: number,
): T[] {
  return latest(
    items.filter((item) => item.featured),
    limit,
  )
}

/**
 * Drops the server-only `NotesMDX` component reference from a showcase entry.
 *
 * React Server Components can't serialize bare function refs across the RSC
 * boundary (only "client references", i.e. components from `'use client'`
 * modules, survive). Use this before handing showcase entries to any client
 * component (cards, frame, filter).
 */
export function withoutNotes<T extends { NotesMDX: unknown }>(item: T): Omit<T, 'NotesMDX'> {
  const copy: Omit<T, 'NotesMDX'> & { NotesMDX?: T['NotesMDX'] } = { ...item }
  delete copy.NotesMDX
  return copy
}

/**
 * Drops the server-only `MDXContent` component reference from a post entry.
 *
 * Same RSC-serialization issue as `withoutNotes`, bare function refs can't
 * cross into a client component. Use this before handing posts to any
 * `'use client'` component (lists, filters, etc.).
 */
export function withoutMDXContent<T extends { MDXContent: unknown }>(
  item: T,
): Omit<T, 'MDXContent'> {
  const copy: Omit<T, 'MDXContent'> & { MDXContent?: T['MDXContent'] } = { ...item }
  delete copy.MDXContent
  return copy
}

type WithSlugAndTags = { slug: string; tags: string[] }

/**
 * Returns up to N items sharing at least one tag with the current item, sorted
 * by `publishedAt` descending, excluding the current item itself.
 */
export function related<T extends WithDate & WithSlugAndTags>(
  items: readonly T[],
  current: T,
  limit: number,
): T[] {
  const currentTags = new Set(current.tags)
  return latest(
    items.filter((item) => item.slug !== current.slug && item.tags.some((t) => currentTags.has(t))),
    limit,
  )
}
