import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'

import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { FilmGrain } from '@/components/effects/FilmGrain'
import { ClientMotion } from '@/components/layout/ClientMotion'
import { site } from '@/lib/site'

import './globals.css'

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: `${site.name} — ${site.role}`,
    template: `%s — ${site.name}`,
  },
  description: site.shortBio,
  authors: [{ name: site.name, url: site.url }],
  openGraph: {
    type: 'website',
    siteName: site.name,
    locale: 'en_US',
  },
  twitter: { card: 'summary_large_image', creator: '@kylestephberry' },
  alternates: { types: { 'application/atom+xml': '/rss.xml' } },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body className="relative">
        <FilmGrain />
        <Header />
        <main className="relative z-[2]">
          <ClientMotion>{children}</ClientMotion>
        </main>
        <Footer />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
