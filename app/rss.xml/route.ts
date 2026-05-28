import { allPosts } from 'content-collections'
import { site } from '@/lib/site'

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

export function GET(): Response {
  const posts = [...allPosts].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
  const updated = posts[0]?.publishedAt ?? new Date().toISOString()

  const entries = posts
    .map((p) => {
      const url = `${site.url}${p.url}`
      return `  <entry>
    <title>${esc(p.title)}</title>
    <link href="${esc(url)}"/>
    <id>${esc(url)}</id>
    <updated>${esc(p.updatedAt ?? p.publishedAt)}T00:00:00Z</updated>
    <published>${esc(p.publishedAt)}T00:00:00Z</published>
    <summary>${esc(p.summary)}</summary>
  </entry>`
    })
    .join('\n')

  const feed = `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>${esc(site.name)} — ${esc(site.role)}</title>
  <link href="${esc(site.url)}/rss.xml" rel="self"/>
  <link href="${esc(site.url)}"/>
  <id>${esc(site.url)}/</id>
  <updated>${esc(updated)}T00:00:00Z</updated>
  <author>
    <name>${esc(site.name)}</name>
    <email>${esc(site.email)}</email>
  </author>
${entries}
</feed>`

  return new Response(feed, {
    status: 200,
    headers: { 'content-type': 'application/atom+xml; charset=utf-8' },
  })
}
