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
