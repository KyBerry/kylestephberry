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
