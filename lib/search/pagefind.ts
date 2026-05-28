export interface PagefindSubResult {
  url: string
  title: string
  excerpt: string
}

export interface PagefindResult {
  id: string
  url: string
  meta: { title?: string }
  excerpt: string
  sub_results: PagefindSubResult[]
}

interface PagefindRuntime {
  search: (query: string) => Promise<{
    results: Array<{ id: string; data: () => Promise<PagefindResult> }>
  }>
  destroy?: () => Promise<void>
}

let runtime: PagefindRuntime | null = null

export async function getPagefind(): Promise<PagefindRuntime> {
  if (runtime) return runtime
  // The path is resolved by the browser at runtime, webpack/turbopack should NOT try to bundle it.
  // Using a runtime-computed string defeats build-time analysis.
  const path = '/_pagefind/pagefind.js'
  const mod = (await import(/* webpackIgnore: true */ /* @vite-ignore */ path)) as PagefindRuntime
  runtime = mod
  return mod
}

/**
 * Pagefind indexes the built `.html` files under `.next/server/app`, so result
 * URLs arrive as `/blog/slug.html` (or `/index.html`). Those paths 404 under the
 * App Router, which serves `/blog/slug`. Map them back to the real route.
 */
function cleanUrl(url: string): string {
  const path = url.split(/[?#]/, 1)[0] ?? url
  const suffix = url.slice(path.length)
  const cleaned = path.replace(/\/?index\.html$/, '/').replace(/\.html$/, '')
  return (cleaned.replace(/(.)\/$/, '$1') || '/') + suffix
}

export async function search(query: string) {
  const pf = await getPagefind()
  const trimmed = query.trim()
  if (trimmed.length < 2) return []
  const res = await pf.search(trimmed)
  const data = await Promise.all(res.results.slice(0, 20).map((r) => r.data()))
  return data.map((r) => ({
    ...r,
    url: cleanUrl(r.url),
    sub_results: r.sub_results?.map((s) => ({ ...s, url: cleanUrl(s.url) })) ?? [],
  }))
}

export interface GroupedResults {
  posts: PagefindResult[]
  components: PagefindResult[]
  designs: PagefindResult[]
  other: PagefindResult[]
}

/**
 * Bucket pagefind results into sections by URL prefix. Within each bucket,
 * input order (pagefind relevance order) is preserved. Across buckets,
 * the spec calls for posts first ("posts higher-weighted in ranking").
 *
 * Prefix rules (checked in order):
 *   /blog/        → posts
 *   /components/  → components
 *   /designs      → designs   (matches /designs and /designs?design=…)
 *   anything else → other     (home page, etc.)
 */
export function groupResults(results: PagefindResult[]): GroupedResults {
  const grouped: GroupedResults = {
    posts: [],
    components: [],
    designs: [],
    other: [],
  }
  for (const r of results) {
    // Strip query/hash before prefix-matching so /designs?design=foo still groups as designs.
    const path = r.url.split(/[?#]/, 1)[0] ?? r.url
    if (path.startsWith('/blog/')) {
      grouped.posts.push(r)
    } else if (path.startsWith('/components/')) {
      grouped.components.push(r)
    } else if (path === '/designs' || path.startsWith('/designs/')) {
      grouped.designs.push(r)
    } else {
      grouped.other.push(r)
    }
  }
  return grouped
}
