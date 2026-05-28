import { ImageResponse } from 'next/og'
import { site } from '@/lib/site'

export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'
export const alt = `${site.name} — ${site.role}`

// Site-wide default OG/Twitter card (home, /about, /components, /designs).
// Mirrors the per-post card in app/blog/[slug]/opengraph-image.tsx so the two
// share one visual language. Blog posts override this with their own title.
export default async function OpengraphImage() {
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
          <div style={{ width: 10, height: 10, borderRadius: 9999, background: '#7AA98C' }} />
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
            {site.role}
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <h1
            style={{
              fontSize: 84,
              fontWeight: 500,
              letterSpacing: '-0.025em',
              lineHeight: 1.05,
              margin: 0,
              color: '#F3F1EE',
            }}
          >
            {site.name}
          </h1>
          <p style={{ fontSize: 30, lineHeight: 1.4, color: '#B8B5B0', margin: 0, maxWidth: '85%' }}>
            {site.shortBio}
          </p>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <p style={{ fontFamily: 'monospace', fontSize: 16, color: '#8E8B86', margin: 0 }}>
            {site.location}
          </p>
          <p style={{ fontFamily: 'monospace', fontSize: 16, color: '#8E8B86', margin: 0 }}>
            {site.url.replace('https://', '')}
          </p>
        </div>
      </div>
    ),
    size,
  )
}
