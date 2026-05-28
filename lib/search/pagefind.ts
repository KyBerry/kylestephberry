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
  // The path is resolved by the browser at runtime — webpack/turbopack should NOT try to bundle it.
  // Using a runtime-computed string defeats build-time analysis.
  const path = '/_pagefind/pagefind.js'
  const mod = (await import(/* webpackIgnore: true */ /* @vite-ignore */ path)) as PagefindRuntime
  runtime = mod
  return mod
}

export async function search(query: string) {
  const pf = await getPagefind()
  const trimmed = query.trim()
  if (trimmed.length < 2) return []
  const res = await pf.search(trimmed)
  const data = await Promise.all(res.results.slice(0, 20).map((r) => r.data()))
  return data
}
