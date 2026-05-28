import { ImageResponse } from 'next/og'
import { allPosts } from 'content-collections'
import { site } from '@/lib/site'

export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'
export const alt = 'Blog post cover'

export default async function OpengraphImage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = allPosts.find((p) => p.slug === slug)
  const title = post?.title ?? site.name
  const summary = post?.summary ?? site.shortBio

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '80px',
          background: '#0B0A09',
          color: '#F3F1EE',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: 9999,
              background: '#7AA98C', // sage
            }}
          />
          <p
            style={{
              fontFamily: 'monospace',
              fontSize: 18,
              letterSpacing: 3,
              textTransform: 'uppercase',
              color: '#8E8B86',
              margin: 0,
            }}
          >
            {site.name}
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <h1
            style={{
              fontSize: 64,
              fontWeight: 500,
              letterSpacing: '-0.025em',
              lineHeight: 1.1,
              margin: 0,
              color: '#F3F1EE',
            }}
          >
            {title}
          </h1>
          <p
            style={{
              fontSize: 26,
              lineHeight: 1.4,
              color: '#B8B5B0',
              margin: 0,
              maxWidth: '90%',
            }}
          >
            {summary}
          </p>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <p style={{ fontFamily: 'monospace', fontSize: 16, color: '#8E8B86', margin: 0 }}>
            {site.role}
          </p>
          <p style={{ fontFamily: 'monospace', fontSize: 16, color: '#8E8B86', margin: 0 }}>
            {post?.publishedAt ?? ''}
          </p>
        </div>
      </div>
    ),
    size,
  )
}
