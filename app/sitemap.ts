import type { MetadataRoute } from 'next'
import { allPosts, allShowcases } from 'content-collections'
import { site } from '@/lib/site'

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: site.url, lastModified: now, changeFrequency: 'weekly', priority: 1.0 },
    { url: `${site.url}/components`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${site.url}/designs`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${site.url}/blog`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
  ]

  const postRoutes = allPosts.map((p) => ({
    url: `${site.url}${p.url}`,
    lastModified: new Date(p.updatedAt ?? p.publishedAt),
    changeFrequency: 'yearly' as const,
    priority: 0.7,
  }))

  const showcaseRoutes = allShowcases.map((s) => ({
    url: `${site.url}${s.url}`,
    lastModified: new Date(s.publishedAt),
    changeFrequency: 'yearly' as const,
    priority: 0.6,
  }))

  return [...staticRoutes, ...postRoutes, ...showcaseRoutes]
}
