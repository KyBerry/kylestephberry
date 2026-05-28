import { Suspense } from 'react'
import type { Metadata } from 'next'
import { allDesigns } from 'content-collections'
import { Container } from '@/components/ui/Container'
import { DesignsGallery } from '@/components/designs/DesignsGallery'
import { latest } from '@/lib/content/helpers'

export const metadata: Metadata = {
  title: 'Designs',
  description: 'Selected Figma work — explorations, product surfaces, interface studies.',
}

export default function DesignsIndexPage() {
  const all = latest(allDesigns, allDesigns.length)

  return (
    <Container variant="grid" as="section" className="py-24 md:py-32">
      <header className="mb-12 md:mb-16">
        <p className="mb-4 font-mono text-xs tracking-[0.18em] text-(--color-fg-subtle) uppercase">
          Designs
        </p>
        <h1 className="text-4xl font-medium tracking-[-0.025em] text-balance text-(--color-fg) md:text-5xl">
          Figma work
        </h1>
        <p className="mt-4 max-w-prose text-(--color-fg-muted)">
          Selected explorations and product surfaces. Click a tile to open at native size; use the
          arrow keys to step through the set.
        </p>
      </header>

      {all.length === 0 ? (
        <p className="font-mono text-sm text-(--color-fg-subtle)">More coming soon.</p>
      ) : (
        <Suspense fallback={null}>
          <DesignsGallery entries={all} />
        </Suspense>
      )}
    </Container>
  )
}
