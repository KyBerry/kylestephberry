import type { Metadata } from 'next'
import { allShowcases } from 'content-collections'
import { Container } from '@/components/ui/Container'
import { ShowcaseCard } from '@/components/showcase/ShowcaseCard'
import { latest } from '@/lib/content/helpers'

export const metadata: Metadata = {
  title: 'Components',
  description: 'Interactive UI components — live previews with source.',
}

export default function ComponentsIndexPage() {
  const all = latest(allShowcases, allShowcases.length)

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
          Small UI pieces — buttons, inputs, motion experiments. Each card runs the actual
          component; click through to see the source.
        </p>
      </header>

      {all.length === 0 ? (
        <p className="font-mono text-sm text-(--color-fg-subtle)">More coming soon.</p>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {all.map((entry) => (
            <ShowcaseCard key={entry.slug} entry={entry} />
          ))}
        </div>
      )}
    </Container>
  )
}
