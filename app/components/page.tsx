import type { Metadata } from 'next'
import { Suspense } from 'react'
import { allShowcases } from 'content-collections'
import { Container } from '@/components/ui/Container'
import { ComponentsFilter } from '@/components/showcase/ComponentsFilter'
import { latest, withoutNotes } from '@/lib/content/helpers'

export const metadata: Metadata = {
  title: 'Components',
  description: 'Interactive UI components — live previews with source.',
}

export default function ComponentsIndexPage() {
  // Strip server-only NotesMDX function refs before handing off to the
  // client filter — React can't serialize them across the RSC boundary.
  const all = latest(allShowcases, allShowcases.length).map(withoutNotes)

  return (
    <Container variant="grid" as="section" className="py-24 md:py-32">
      <header className="mb-12 md:mb-16">
        <p className="mb-4 font-mono text-xs tracking-[0.18em] text-(--color-fg-subtle) uppercase">
          Components
        </p>
        <h1 className="text-4xl font-medium tracking-[-0.025em] text-balance text-(--color-fg) md:text-5xl">
          Interactive components
        </h1>
        <p className="mt-4 max-w-prose text-(--color-fg-muted)">
          Real interface surfaces — data tables, dashboards, AI streams, command palettes, and
          i18n playgrounds. Each card runs the actual component; click through to see the source.
        </p>
      </header>

      {all.length === 0 ? (
        <p className="font-mono text-sm text-(--color-fg-subtle)">More coming soon.</p>
      ) : (
        <Suspense fallback={null}>
          <ComponentsFilter entries={all} />
        </Suspense>
      )}
    </Container>
  )
}
